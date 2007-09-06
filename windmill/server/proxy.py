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

logger = logging.getLogger(__name__)

_hoppish = {
    'connection':1, 'keep-alive':1, 'proxy-authenticate':1,
    'proxy-authorization':1, 'te':1, 'trailers':1, 'transfer-encoding':1,
    'upgrade':1, 'proxy-connection':1 }
    
def is_hop_by_hop(header):
    return _hoppish.has_key(header.lower())

initial_forwarding_registry = {}
forwarding_registry = {}

class WindmillProxyApplication(object):
    """Application to handle requests that need to be proxied"""

    ConnectionClass = HTTPConnection

    def handler(self, environ, start_response):
        """Proxy for requests to the actual http server"""
        url = urlparse(environ['reconstructed_url'])

        if windmill.settings['FORWARDING_TEST_URL'] is not None and (
           not url.netloc.starswith('localhost') ) and (
           not url.netloc.startswith('127.0.0.1') ):
            # Do our domain change magic
            def change_environ_domain(original_netloc, new_netloc, environ):
                for key, value in environ.items():
                    if ( type(value) is str ) and ( value.find(original_netloc) is not -1 ):
                         environ[key] = value.replace(original_netloc, new_netloc)
                return environ
            
            test_netloc = urlparse(windmill.settings['FORWARDING_TEST_URL']).netloc
            referer = environ.get('HTTP_REFERER', None)

            if ( url.netloc != test_netloc ):
                initial_forwarding_registry[url.geturl().replace(url.netloc, test_netloc)] = url.netloc
                start_response("302 Found", [('Content-Type', 'text/plain'), 
                                             ('Location', url.geturl().replace(url.netloc, test_netloc) )])
                logger.debug('New domain request, forwarded to '+url.geturl().replace(url.netloc, test_netloc))
                return ['Windmill is forwarding you to a new url at the proper test domain']
        
            elif ( url.geturl() in initial_forwarding_registry.keys() ):
                host_netloc = initial_forwarding_registry.pop(url.geturl())
                forwarding_registry[url.geturl()] = host_netloc
                environ = change_environ_domain(url.netloc, host_netloc, environ)
                url = urlparse(url.geturl().replace(url.netloc, host_netloc))
            
            elif (referer is not None) and (referer in forwarding_registry.keys()):
                host_netloc = forwarding_registry[referer]
                forwarding_registry[url.geturl()] = host_netloc
                environ = change_environ_domain(url.netloc, host_netloc, environ)
                url = urlparse(url.geturl().replace(url.netloc, host_netloc))
            
        # Create connection object
        try:
            connection = self.ConnectionClass(url.netloc)
            # Build path
            path = url.geturl().replace('%s://%s' % (url.scheme, url.netloc), '')
        except Exception, e:
            start_response("501 Gateway error", [('Content-Type', 'text/html')])
            logger.exception('Could not Connect')
            return ['<H1>Could not connect</H1>']

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
        except:
            # We need extra exception handling in the case the server fails in mid connection, it's an edge case but I've seen it
            start_response("501 Gateway error", [('Content-Type', 'text/html')])
            logger.exception('Could not Connect')
            return ['<H1>Could not connect</H1>']

        response = connection.getresponse()

        hopped_headers = response.getheaders()
        headers = copy.copy(hopped_headers)
        for header in hopped_headers:
            if is_hop_by_hop(header[0]):
                headers.remove(header)
        
        start_response(response.status.__str__()+' '+response.reason, headers)
        return [response.read(response.length)]


    def __call__(self, environ, start_response):
        return self.handler(environ, start_response)