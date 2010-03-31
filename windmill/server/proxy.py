#   Copyright (c) 2006-2007 Open Source Applications Foundation
#   Copyright (c) 2008-2009 Mikeal Rogers <mikeal.rogers@gmail.com>
#   Copyright (c) 2009 Canonical Ltd.
#   Copyright (c) 2009 Domen Kozar <domen@dev.si>
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

import windmill

from httplib import HTTPConnection
import copy
import sys
import logging
import urllib
logger = logging.getLogger(__name__)
from forwardmanager import ForwardManager
if not sys.version.startswith('2.4'):
    from urlparse import urlparse
else:
    # python 2.4
    from windmill.tools.urlparse_25 import urlparse

first_forward_domains = []
exclude_from_retry = ['http://sb-ssl.google.com',
                      'https://sb-ssl.google.com', 
                      'http://en-us.fxfeeds.mozilla.com',
                      'fxfeeds.mozilla.com',
                      'http://www.google-analytics.com',
                      ]

# Note that hoppish conntains proxy-connection, which is pre-HTTP-1.1 and
# is somewhat nebulous
_hoppish = {
    'connection':1, 'keep-alive':1, 'proxy-authenticate':1,
    'proxy-authorization':1, 'te':1, 'trailers':1, 'transfer-encoding':1,
    'upgrade':1, 'proxy-connection':1, 
    'p3p':1 #Not actually a hop-by-hop header, just really annoying 
    }
    
# Cache stopping headers
cache_headers = {'Pragma':'no-cache', 'Cache-Control': 'post-check=0, pre-check=0',
                 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                 'Expires': '-1'}
                 
cache_removal = [k.lower() for k in cache_headers.keys()]
cache_additions = cache_headers.items()
    
def is_hop_by_hop(header):
    """check if the given header is hop_by_hop"""
    return _hoppish.has_key(header.lower())

class IterativeResponse(object):
    def __init__(self, response_instance):
        self.response_instance = response_instance
        self.read_size = response_instance.length / 100
                
    def __iter__(self):
        yield self.response_instance.read(self.read_size)
        while self.response_instance.chunk_left is not None:
            if self.response_instance.chunk_left < self.read_size:
                yield self.response_instance.read()
                self.response_instance.chunk_left = None
            else:
                yield self.response_instance.read(self.read_size)

def get_wsgi_response(response):
        
    if type(response) is str:
        return [response]
    if response.length > 512000:
        return IterativeResponse(response)
    else:
        return [response.read()]

def conditions_pass(e):
    for c in windmill.server.forwarding_conditions:
        if c(e) is False:
            return False
    return True

def proxy_post_redirect_form(environ, action):
    body = environ['wsgi.input'].read(int(environ['CONTENT_LENGTH']))
    parameters = body.split('&')
    inputs = []
    for parameter in parameters:
        parts = parameter.split('=', 1)
        if len(parts) == 1:
            continue
        parts = tuple(unicode(urllib.unquote(part), 'utf-8') for part in parts)
        inputs.append('<input type="hidden" name="%s" value="%s" />' % parts)
    form = """<html><head><title>There is no spoon.</title></head>
<body onload="document.getElementById('redirect').submit();"
      style="text-align: center;">
  <form id="redirect" action="%s" method="POST">%s</form>
</body></html>""" % (action, '\n'.join(inputs))
    return form.encode('utf-8')

forward_forms = {}

class WindmillProxyApplication(object):
    """Application to handle requests that need to be proxied"""

    def __init__(self):
        self.fmgr = None
        proxyInstances.append(self)

    ConnectionClass = HTTPConnection

    def handler(self, environ, start_response):
        """Proxy for requests to the actual http server"""
        url = urlparse(environ['reconstructed_url'])
        referer = environ.get('HTTP_REFERER', None)
        test_url = windmill.settings['FORWARDING_TEST_URL']
        if self.fmgr is None and windmill.settings['FORWARDING_TEST_URL'] is not None:
            # Be lazy at creating the forward manager to give
            # FORWARDING_TEST_URL a chance to be set
            self.fmgr = ForwardManager(test_url)
        # Once FORWARDING_TEST_URL is set we should check for cross-domain
        # forward but we must disable for 127.0.0.1 as redirects to 127.0.0.1
        # will cause the browser to error.
        if windmill.settings['FORWARDING_TEST_URL'] is not None and (
                       not url.netloc.startswith('127.0.0.1') ) and (
                       not url.netloc.startswith('127.0.0.1') ) and (
                       conditions_pass(environ) ):
            # Do our domain change magic
            url = urlparse(environ['reconstructed_url'])
            test_target = urlparse(test_url)
            #test_netloc = urlparse(test_url).netloc

            if (self.fmgr.is_static_forwarded(url)):
                environ = self.fmgr.forward(url, environ)
                url = self.fmgr.forward_map(url)
            
            elif ( url.scheme+"://"+url.netloc != test_target.scheme+"://"+test_target.netloc ):
                # if the url's network address is not the test URL that has
                # been set we need to return a forward
                environ = self.fmgr.forward(url, environ)
                redirect_url = self.fmgr.forward_map(url).geturl()
                if environ['REQUEST_METHOD'] == 'POST':
                    form = proxy_post_redirect_form(environ, redirect_url)
                    forward_forms[redirect_url] = form
                start_response("302 Found", [('Location', redirect_url), 
                                             ]+cache_additions)
                logger.debug('Domain change, forwarded to ' + redirect_url)
                return ['']
            elif url.geturl() in forward_forms:
                response = forward_forms[url.geturl()]
                length = str(len(response))
                start_response("200 Ok", [('Content-Type', 'text/html',), 
                                          ('Content-Length', length,),
                                         ]+cache_additions)
                del forward_forms[url.geturl()]
                return [response]
            elif (self.fmgr.is_forward_mapped(url)):
                orig_url = self.fmgr.forward_unmap(url)
                environ = self.fmgr.change_environ_domain(url, orig_url,
                                                          environ)
                url = orig_url
            elif (not self.fmgr.is_forward_mapped(url) and
               referer is not None and
               self.fmgr.is_forward_mapped(urlparse(referer))):
                # This handles the case that the referer is a url we've already
                # done a cross-domain request for 
                orig_referer = self.fmgr.forward_unmap(urlparse(referer))
                orig_url = self.fmgr.forward_to(url, orig_referer)
                environ = self.fmgr.change_environ_domain(url, orig_url, environ)
                url = orig_url
                self.fmgr.forward(orig_url, {}) # Take note of the forwarding
        def make_remote_connection(url, environ):
            # Create connection object
            try:
                connection = self.get_connection(url)
                # Build path
                path = url.geturl().replace(url.scheme+'://'+url.netloc, '')
            except Exception, e:
                logger.exception('Could not Connect')
                return [("501 Gateway error", [('Content-Type', 'text/html')],),
                        '<H1>Could not connect:</H1><pre>%s</pre>' % (str(e),)]

            # Read in request body if it exists    
            body = None
            if environ.has_key('body'):
                body = environ['body']
            elif environ.get('CONTENT_LENGTH'):
                length = int(environ['CONTENT_LENGTH'])
                body = environ['wsgi.input'].read(length)
                environ['body'] = body

            # Build headers
            headers = {}
            logger.debug('Environ ; %s' % str(environ))
            for key in environ.keys():
                # Keys that start with HTTP_ are all headers
                if key.startswith('HTTP_'):
                    # This is a hacky way of getting the header names right
                    value = environ[key]
                    key = key.replace('HTTP_', '', 1).swapcase().replace('_', '-')
                    if is_hop_by_hop(key) is False:
                        headers[key] = value
                    if key.lower() == 'location':
                        # There should never be a legitimate redirect
                        # to /windmill-serv from a remote site
                        if '/windmill-serv' in value:
                            value = value.split('/windmill-serv')[0]

            # Handler headers that aren't HTTP_ in environ
            if environ.get('CONTENT_TYPE'):
                headers['content-type'] = environ['CONTENT_TYPE']

            # Add our host if one isn't defined
            if not headers.has_key('host'):
                headers['host'] = environ['SERVER_NAME']   

            # Make the remote request
            try:
                
                logger.debug('%s %s %s' % (environ['REQUEST_METHOD'], path,
                                           str(headers)))
                connection.request(environ['REQUEST_METHOD'], path, body=body,
                                   headers=headers)
                connection.url = url
                return connection
            except Exception, e:
                # We need extra exception handling in the case the server
                # fails in mid connection, it's an edge case but I've seen it
                return [("501 Gateway error", [('Content-Type', 'text/html')],),
                    '<H1>Could not make request:</H1><pre>%s</pre>' % (str(e),)]

        def retry_known_hosts(url, environ):
            # retry the given request against all the hosts the current session
            # has run against
            if self.fmgr is None:
                return
            for host in self.fmgr.known_hosts():
                orig_url = self.fmgr.forward_to(url, host)
                new_environ = self.fmgr.change_environ_domain(
                                        self.fmgr.forward_map(orig_url),
                                        orig_url, environ)
                connection = make_remote_connection(orig_url, new_environ)
                if isinstance(connection, HTTPConnection):
                    try:
                        new_response = connection.getresponse()
                    except:
                        return
                    if new_response.status > 199 and new_response.status < 399:
                        logger.info('Retry success, ' + url.geturl() + ' to ' +
                                    host.geturl())
                        new_response.url = connection.url
                        return new_response
        connection = make_remote_connection(url, environ)
        # This following code is ugly.  It should be refactored in to some
        # elegant way to decide when to retry, and which URLs to retry.
        # Maybe hand that responsability to the ForwardManager?
        if isinstance(connection, HTTPConnection):
            response = connection.getresponse()
            response.url = connection.url
            
        if environ['REQUEST_METHOD'] == 'POST':
            threshold = 399
        else:
            threshold = 399 

        if not isinstance(connection, HTTPConnection) or \
            response.status > threshold:
            # if it's not an HTTPConnection object then the request failed
            # so we should retry
            new_response = retry_known_hosts(url, environ)
            if new_response is not None: 
                response = new_response
            elif not isinstance(connection, HTTPConnection):
                status = connection[0][0]
                headers = connection[0][1]
                body = connection[1]
                for header in copy.copy(headers):
                    if header[0].lower() == 'content-length':
                        body.length = int(header[1].strip())
                    if header[0].lower() in cache_removal:
                        headers.remove(header)
                start_response(status, headers+cache_additions)
                return get_wsgi_response(body)

        # Remove hop by hop headers
        headers = self.parse_headers(response)
        if response.status == 404:
            logger.info('Could not fullfill proxy request to ' + url.geturl())

        for header in copy.copy(headers):
            if header[0].lower() == 'content-length':
                response.length = int(header[1].strip())
            if header[0].lower() in cache_removal:
                headers.remove(header)

        start_response(response.status.__str__()+' '+response.reason, 
                       headers+cache_additions)
        return get_wsgi_response(response)

    def parse_headers(self, response):
        headers = [(x.lower(), y) for x, y in [z.split(':', 1) for z in
                             str(response.msg).splitlines() if ':' in z]]
        #all this does is cookie management, which we currently turned off
        #if self.fmgr is not None:
            #self.fmgr.parse_headers(headers, response.url.netloc)
        for header in headers:
            if is_hop_by_hop(header[0]):
                headers.remove(header)
            elif header[0] == 'location':
                # There should never be a legitimate redirect to /windmill-serv
                # from a remote site
                if '/windmill-serv' in header[1]:
                    i = headers.index(header)
                    location = header[1]
                    headers.remove(header)
                    headers.insert(i, ('location',
                                   location.split('/windmill-serv')[0],))
        return headers

    def get_connection(self, url):
        """ Factory method for connections """
        connection = self.ConnectionClass(url.netloc)
        return connection

    def clearForwardingRegistry(self):
        if self.fmgr is not None:
            self.fmgr.clear()

    def __call__(self, environ, start_response):
        return self.handler(environ, start_response)

proxyInstances = []
def clearForwardingRegistry():
    for p in proxyInstances:
        p.clearForwardingRegistry()
