#   Copyright (c) 2006-2007 Open Source Applications Foundation
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
from urlparse import urlparse
import copy
import logging
import re

logger = logging.getLogger(__name__)

# Note that hoppish conntains proxy-connection, which is pre-HTTP-1.1 and is somewhat nebulous
_hoppish = {
    'connection':1, 'keep-alive':1, 'proxy-authenticate':1,
    'proxy-authorization':1, 'te':1, 'trailers':1, 'transfer-encoding':1,
    'upgrade':1, 'proxy-connection':1, 
    'p3p':1 #Not actually a hop-by-hop header, just really annoying 
    }
    
def is_hop_by_hop(header):
    """check if the given header is hop_by_hop"""
    return _hoppish.has_key(header.lower())

initial_forwarding_registry = {}
forwarding_registry = {}
# 
# class IterativeResponse(object):
#     def __init__(self, response_instance):
#         self.response_instance = response_instance
#         
#     def __iter__(self):
#         if self.response_instance.chunked:
#             yield self.response_instance.read(1024)
#             while self.response_instance.chunk_left is not None:
#                 if self.response_instance.chunk_left < 1024:
#                     yield self.response_instance.read()
#                     self.response_instance.chunk_left = None
#                 else:
#                     yield self.response_instance.read(1024)
#         else:
#             yield self.response_instance.read()

src_expression = re.compile('src=["\'](.*)["\']')
import pyparsing
imgStartTag, dummy = pyparsing.makeHTMLTags("iframe")


def replace_src(body):
    if windmill.settings['FORWARDING_TEST_URL'] is not None:
        # if body.find('src=') is not -1:
        #     print src_expression.findall(body), body.find('src='), body.rfind('src=')
        # if body.find('slide.com') is not -1:
        #     print 'found slide.com'
        #     print body.find('src='), body.rfind('src='), body.find('community.slide.com')
        test_netloc = urlparse(windmill.settings['FORWARDING_TEST_URL']).netloc
        # for url in src_expression.findall(body):
        print body.find('iframe')
        for tokens,start,end in imgStartTag.scanString(body):
            url = urlparse(tokens.src)
            # url = urlparse(url)
            print url.geturl()
            if url.netloc != test_netloc:
                body = body.replace(url.geturl(), url.geturl.replace(url.netloc, test_netloc))
                initial_forwarding_registry[url.geturl().replace(url.netloc, test_netloc)] = url.netloc
    return body
    

class WindmillProxyApplication(object):
    """Application to handle requests that need to be proxied"""

    ConnectionClass = HTTPConnection

    def handler(self, environ, start_response):
        """Proxy for requests to the actual http server"""
        url = urlparse(environ['reconstructed_url'])
        #print url.geturl()
        
        def change_environ_domain(original_netloc, new_netloc, environ):
            """Swap out the domain for a given request environ"""
            new_environ = {}
            for key, value in environ.items():
                if ( type(value) is str ) and ( value.find(original_netloc) is not -1 ):
                    new_environ[key] = value.replace(original_netloc, new_netloc)
                else:
                    new_environ[key] = value
            return new_environ

        # Once FORWARDING_TEST_URL is set we should check for cross-domain forward
        # but we must disable for localhost as redirects to localhost will cause the browser 
        # to error.
        if windmill.settings['FORWARDING_TEST_URL'] is not None and (
           not url.netloc.startswith('localhost') ) and (
           not url.netloc.startswith('127.0.0.1') ):
            # Do our domain change magic
            test_netloc = urlparse(windmill.settings['FORWARDING_TEST_URL']).netloc
            referer = environ.get('HTTP_REFERER', None)

            if ( url.netloc != test_netloc ):
                # if the url's network address is not the test URL that has been set we need to return
                # a forward
                initial_forwarding_registry[url.geturl().replace(url.netloc, test_netloc)] = url.netloc
                start_response("302 Found", [('Content-Type', 'text/plain'), 
                                             ('Location', url.geturl().replace(url.netloc, test_netloc) )])
                logger.debug('New domain request, forwarded to '+url.geturl().replace(url.netloc, test_netloc))
                return ['Windmill is forwarding you to a new url at the proper test domain']
        
            elif ( url.geturl() in initial_forwarding_registry.keys() ):
                # This handles the first case where a forward is returned to the browser
                host_netloc = initial_forwarding_registry.get(url.geturl())
                forwarding_registry[url.geturl()] = host_netloc
                environ = change_environ_domain(url.netloc, host_netloc, environ)
                url = urlparse(url.geturl().replace(url.netloc, host_netloc))
            
            elif (referer is not None) and (referer in forwarding_registry.keys()):
                # This handles the case that the referer is a url we've already
                # done a cross-domain request for 
                host_netloc = forwarding_registry[referer]
                forwarding_registry[url.geturl()] = host_netloc
                environ = change_environ_domain(url.netloc, host_netloc, environ)
                url = urlparse(url.geturl().replace(url.netloc, host_netloc))
        
        def make_remote_connection(url, environ):
            # Create connection object
            try:
                connection = self.ConnectionClass(url.netloc)
                # Build path
                path = url.geturl().replace(url.scheme+'://'+url.netloc, '')
            except Exception, e:
                logger.exception('Could not Connect')
                return [("501 Gateway error", [('Content-Type', 'text/html')],), '<H1>Could not connect</H1>']

            # Read in request body if it exists    
            body = None
            if environ.get('CONTENT_LENGTH'):
                length = int(environ['CONTENT_LENGTH'])
                body = environ['wsgi.input'].read(length)

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

            # Handler headers that aren't HTTP_ in environ
            if environ.get('CONTENT_TYPE'):
                headers['content-type'] = environ['CONTENT_TYPE']

            # Add our host if one isn't defined
            if not headers.has_key('host'):
                headers['host'] = environ['SERVER_NAME']   

            # Make the remote request
            try:
                logger.debug('%s %s %s' % (environ['REQUEST_METHOD'], path, str(headers)))
                connection.request(environ['REQUEST_METHOD'], path, body=body, headers=headers)
                return connection
            except:
                # We need extra exception handling in the case the server fails in mid connection, it's an edge case but I've seen it
                logger.info('Could not fullfill proxy request to %s' % url.geturl())
                return [("501 Gateway error", [('Content-Type', 'text/html')],), '<H1>Could not connect</H1>']
                
        def retry_known_hosts(url, environ):
            # retry the given request against all the hosts the current session has run against
            hosts = copy.copy(initial_forwarding_registry.values())
            hosts.reverse()
            current_host = url.netloc
            for host in hosts:
                connection = make_remote_connection(urlparse(url.geturl().replace(current_host, host)), 
                                                    change_environ_domain(current_host, host, environ))
                if isinstance(connection, HTTPConnection):
                    new_response = connection.getresponse()
                    if new_response.status > 199 and new_response.status < 399:
                        logger.debug('retry success, '+url.geturl()+' to '+host)
                        return new_response
            return None
                
        connection = make_remote_connection(url, environ)
        if not isinstance(connection, HTTPConnection):
            # if it's not an HTTPConnection object then the request failed so we should retry
            new_response = retry_known_hosts(url, environ)
            if new_response is not None: 
                response = new_response
            else:
                start_response(*connection.pop(0))
                return [replace_src(connection.pop(0))]
        else:
            response = connection.getresponse()
        
        if response.status == 404:
            # If the response is 404 we should retry against the known hosts
            # this is usually the case when the referrer is ommitted by the browser 
            # for random reasons
            new_response = retry_known_hosts(url, environ)
            if new_response is not None:
                response = new_response

        # Remove hop by hop headers
        hopped_headers = [ (x.lower(), y,) for x, y in [ z.split(':', 1) for z in str(response.msg).splitlines() if ':' in z]]
        headers = copy.copy(hopped_headers)
        for header in hopped_headers:
            if is_hop_by_hop(header[0]):
                headers.remove(header)
        
        start_response(response.status.__str__()+' '+response.reason, headers)
        return [replace_src(response.read())]


    def __call__(self, environ, start_response):
        body = self.handler(environ, start_response)
        if body[0].find('iframe') is not -1:
            print environ['reconstructed_url']
        return body