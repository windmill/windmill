#   Copyright (c) 2006 Open Source Applications Foundation
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

from datetime import datetime
import simplejson
import sys

class JSONRPCError(Exception):
    """JSONRPC Error"""
    def __init__(self, string):
        self.message = 'JSONRPC Error in: %s' % string
        
    def __str__(self):
        return str(self.error_string)
    
    
class JSONRPCDispatcher(object):
    
    def __init__(self, instance=None):
        """Initialization. Can take an instance to register upon initialization"""
        self.instances = []
        
        # Store all attributes of class before any methods are added for negative lookup later
        self.base_attributes = dir(self)
        
        # If instance was given during initialization then register it
        if instance is not None:
            self.register_instance(instance)
        
    def register_instance(self, instance):
        """Registers all attributes of class instance to dispatcher"""
        for attribute in dir(instance):
            if attribute.startswith('_') is False:
                # All public attributes
                self.register_function(getattr(instance, attribute), name=attribute)
        
        # Store it in the list for convienience 
        self.instances.append(instance)
        
    
    def register_method(self, function, name=None):
        """Registers a method with the dispatcher"""
        # If the name isn't passed try to find it. If we can't fail gracefully.
        if name is None:
            try:
                name = function.__name__
            except:
                if hasattr(function, __call__):
                    raise """Callable class instances must be passed with name parameter"""
                else:
                    raise """Not a function"""
        
        if self.__dict__.has_key(name) is False:
            self.__dict__[unicode(name)] = function
        else:
            print 'Attribute name conflict -- %s must be removed before attribute of the same name can be added'
            
    def system_describe(self, rpc_request):
        pass
    
    def system_dispatcher(self, rpc_request):
        pass
    
    def dispatch(self, json):
        """Public dispatcher, verifies that a method exists in it's method dictionary and calls it"""
        rpc_request = self._decode(json)
        
        if rpc_request['method'].startswith('system.'):
            system_dispatcher(rpc_request)
        
        if self.__dict__.has_key(rpc_request['method']):
            return self._dispatch(rpc_request)
        else:
            return self_encode(result=None, error=JSONRPCError('no such method'), id=rpc_request['id'])
                
    def _dispatch(self, rpc_request):
        """Internal dispatcher, handles all the error checking and calling of methods"""
        result = None
        error = None
        
        # If someone sends an empty json array or object we need to treat it as Null.
        # This way we don't expand None during the method call.
        if rpc_request['params'] is not None and len(rpc_request['params']) is 0:
            rpc_request['params'] = None
        
        try:
            # Account for each type
            if type(rpc_request['params']) is list:
                result = self.__dict__[rpc_request['method']](*rpc_request['params'])
            elif type(rpc_request['params']) is dict:
                result = self.__dict__[rpc_request['method']](**rpc_request['params'])
            elif type(rpc_request['params']) is None:
                result = self.__dict__[rpc_request['method']]()
            else:
                # If type was something weird just return a JSONRPC Error
                raise JSONRPCError, 'params not array or object type'
        # Turn python errors into JSONRPC errors
        except JSONRPCError, e:
            error = e
        except Exception, e:
            error = JSONRPCError('Server Exception')
            error.type = e.__class__
        
        return self._encode(result=result, error=error, jsonrpc_id=rpc_request['id'])
    
    
    def _encode(self, result=None, error=None, jsonrpc_id=None):
        """Internal encoder method, handles error formatting, id persistence, and encoding via simplejson"""
        response = {}
        response['result'] = result
        response['id'] = jsonrpc_id
        
        
        if error is not None:
            if hasattr(error, 'type'):
                error_type = error.type
                error_message = str(error)
            else:
                error_type = 'JSONRPCError'
                error_message = str(error).strip('JSONRPC Error in: ')
                
            response['error'] = {'type':error_type,
                                 'message':error_message}
        
        return simplejson.dumps(response)
        
    def _decode(self, json):
        """Internal method for decoding json objects, uses simplejson"""
        
        return simplejson.loads(json)
    
class WSGIJSONRPCDispatcher(JSONRPCDispatcher):
    """A WSGI Application for generic JSONRPC requests."""
    
    def handler(self, environ, start_response):
        """A WSGI handler for generic JSONRPC requests."""
        
        if environ['REQUEST_METHOD'] == 'POST':
            body = None
            if environ.get('CONTENT_LENGTH'):
                length = int(environ['CONTENT_LENGTH'])
                body = environ['wsgi.input'].read(length)
            
            try:
                start_response('200 OK', [('Cache-Control','no-cache'), ('Pragma','no-cache'),
                                          ('Content-Type', 'application/json')])
                response = self.dispatch(body)
                return [response]
            except:
                start_response('500 Internal Server Error', [('Cache-Control','no-cache'), ('Content-Type', 'text/plain')])
                return ['500 Internal Server Error']
        
        else:
            start_response('405 Method Not Allowed', [('Cache-Control','no-cache'), ('Content-Type', 'text/plain')])
            return ['405 Method Not Allowed. This JSONRPC interface only supports POST.']
            
    def __call__(self, environ, start_response):
        return self.handler(environ, start_response)
        
class WindmillJSONRPCHandler(object):
    
    def get_next_task(self):
        pass
        
def get_dispatcher():
    pass
    
    
    