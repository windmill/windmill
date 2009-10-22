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

from SimpleXMLRPCServer import SimpleXMLRPCDispatcher  
import logging

from webenv import Response, Response500
from webenv.rest import RestApplication

logger = logging.getLogger(__name__)

class XMLResponse(Response):
    content_type = 'text/xml'

class XMLRPCApplication(RestApplication):
    """Application to handle requests to the XMLRPC service"""

    def __init__(self, instance=None, methods=[]):
        """Create windmill xmlrpc dispatcher"""
        try:
            self.dispatcher = SimpleXMLRPCDispatcher(allow_none=True, encoding=None)
        except TypeError:
            # python 2.4
            self.dispatcher = SimpleXMLRPCDispatcher()
        if instance is not None:
            self.dispatcher.register_instance(instance)
        for method in methods:
            self.dispatcher.register_function(method)
        self.dispatcher.register_introspection_functions()
        
    def POST(self, request, *path):
        """Handles the HTTP POST request.

        Attempts to interpret all HTTP POST requests as XML-RPC calls,
        which are forwarded to the server's _dispatch method for handling.
        
        Most code taken from SimpleXMLRPCServer with modifications for wsgi and my custom dispatcher.
        """
        
        try:
            data = str(request.body)
            
            # In previous versions of SimpleXMLRPCServer, _dispatch
            # could be overridden in this class, instead of in
            # SimpleXMLRPCDispatcher. To maintain backwards compatibility,
            # check to see if a subclass implements _dispatch and 
            # using that method if present.
            response = self.dispatcher._marshaled_dispatch(
                    data, getattr(self.dispatcher, '_dispatch', None)
                )
            response += '\n'
        except: # This should only happen if the module is buggy
            # internal error, report as HTTP server error
            return Response500()
        else:
            # got a valid XML RPC response
            return XMLResponse(response)
