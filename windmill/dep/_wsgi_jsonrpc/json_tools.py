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

import time
import httplib, urllib, copy
from urlparse import urlparse
from windmill.dep import json
import logging

__version__ = str(0.1)

logger = logging.getLogger(__name__)

class _Method(object):
    
    def __init__(self, call, name):
        self.call = call
        self.name = name
    
    def __call__(self, *args, **kwargs):
        
        # Need to handle keyword arguments per 1.1 spec
        
        request = {}
        request['version'] = '1.1'
        request['method'] = self.name
        if len(kwargs) is not 0:
            params = copy.copy(kwargs)
            index = 0
            for arg in args:
                params[str(index)] = arg
                index = index + 1
        elif len(args) is not 0:
            params = copy.copy(args)
        else:
            params = None
        request['params'] = params
        logger.debug('Created python request object %s' % str(request))
        return self.call(json.dumps(request))
        
    def __getattr__(self, name):
        return _Method(self.call, "%s.%s" % (self.name, name))
        
class JSONRPCTransport:

    def __init__(self, uri, proxy_uri=None):
        
        if proxy_uri is not None:
            self.connection_url = urlparse(proxy_uri)
            self.request_path = uri
        else:
            self.connection_url = urlparse(uri)
            self.request_path = self.connection_url.path
            
    headers = {'User-Agent':'jsonrpclib',
               'Content-Type':'application/json',
               'Accept':'application/json'}
            
    def request(self, request_body):
        
        if self.connection_url.scheme == 'http':
            if self.connection_url == '':
                port = 80
            else:
                port = self.connection_url.port 
            connection = httplib.HTTPConnection(self.connection_url.hostname+':'+str(port))
        elif self.connection_url.scheme == 'https':
            if self.connection_url == '':
                port = 443
            else:
                port = self.connection_url.port
            connection = httplib.HTTPSConnection(self.connection_url.hostname+':'+str(port))
        else:
            raise Exception, 'unsupported transport'
            
        connection.request('POST', self.request_path, body=request_body, headers=self.headers)
        self.response = connection.getresponse()
        if self.response.status == 200:
            return self.response.read()
        else:
            return self.response.status
        

class ServerProxy(object):
    def __init__(self, uri=None, transport=None):
        """Initialization"""
        if uri is None and transport is None:
            raise Exception, 'either uri or transport needs to be specified'
        
        if transport is None:
            transport = JSONRPCTransport(uri)
        self.__transport = transport

    def __request(self, request):
        # call a method on the remote server
        
        response = self.__transport.request(request)
        logger.debug('got response from __transport :: %s' % response)
        if type(response) is not int:
            return json.loads(response)
        else:
            logger.error('Recieved status code %s' % response)

    def __repr__(self):
        return (
            "<ServerProxy for %s%s>" %
            (self.__host, self.__handler)
            )

    __str__ = __repr__

    def __getattr__(self, name):
        # magic method dispatcher
        return _Method(self.__request, name)

