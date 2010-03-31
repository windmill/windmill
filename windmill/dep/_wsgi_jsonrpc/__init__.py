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

from datetime import datetime
from StringIO import StringIO
import sys, traceback
import logging
import json_tools, test_jsonrpc

from windmill.dep import json

logger = logging.getLogger(__name__)

_descriptions = set(['summary', 'help', 'idempotent', 'params', 'return'])

def describe_method(method):
    """Check is a callable object has description params set"""
    description = {}
    for key in _descriptions:
        if hasattr(method, key):
            description[key] = getattr(method, key)
    return description

class JSONRPCError(Exception):
    """JSONRPC Error"""
    
class JSONRPCDispatcher(object):
    
    def __init__(self, instance=None, methods=None, name='Python JSONRPC Service', summary='Service dispatched by python JSONRPCDispatcher', help=None, address=None):
        """Initialization. Can take an instance to register upon initialization"""
        self.instances = []
        self.name = name
        self.help = help
        self.address = address
        self.summary = summary
        
        # Store all attributes of class before any methods are added for negative lookup later
        self.base_attributes = set(dir(self))
        self.base_attributes.add('base_attributes')
        
        # If instance was given during initialization then register it
        if instance is not None:
            self.register_instance(instance)
        if methods is not None:
            for method in methods:
                self.register_method(method)
            
        self.__dict__['system.list_methods'] = self.system_list_methods
        self.__dict__['system.describe'] = self.system_describe
                    
    def get_valid_methods(self):
        valid_methods = {}
        for key, value in self.__dict__.items():
            if key.startswith('_') is False:
                if key not in self.base_attributes:
                    valid_methods[key] = value
        return valid_methods
        
    def register_instance(self, instance):
        """Registers all attributes of class instance to dispatcher"""
        for attribute in dir(instance):
            if attribute.startswith('_') is False:
                # All public attributes
                self.register_method(getattr(instance, attribute), name=attribute)
        
        # Store it in the list for convienience 
        self.instances.append(instance)
        
    
    def register_method(self, function, name=None):
        """Registers a method with the dispatcher"""
        # If the name isn't passed try to find it. If we can't fail gracefully.
        if name is None:
            try:
                name = function.__name__
            except:
                if hasattr(function, '__call__'):
                    raise """Callable class instances must be passed with name parameter"""
                else:
                    raise """Not a function"""
        
        if self.__dict__.has_key(name) is False:
            self.__dict__[unicode(name)] = function
        else:
            print 'Attribute name conflict -- %s must be removed before attribute of the same name can be added'        
            
            
    def system_list_methods(self):
        """List all the available methods and return a object parsable that conforms to the JSONRPC Service Procedure Description specification"""
        method_list = []
        for key, value in self.get_valid_methods().items():
            method = {}
            method['name'] = key
            method.update(describe_method(value))
            method_list.append(method)
        method_list.sort()
        logger.debug('system.list_methods created list %s' % str(method_list))
        return method_list
            
    def system_describe(self):
        """Service description"""
        description = {}
        description['sdversion'] = '1.0'
        description['name'] = self.name
        description['summary'] = self.summary
        if self.help is not None:
            description['help'] = self.help
        if self.address is not None:
            description['address'] = self.address
        description['procs'] = self.system_list_methods()
        return description
    
    def dispatch(self, s):
        """Public dispatcher, verifies that a method exists in it's method dictionary and calls it"""
        rpc_request = self._decode(s)
        logger.debug('decoded to python object %s' % str(rpc_request))
        
        if self.__dict__.has_key(rpc_request[u'method']):
            logger.debug('dispatcher has key %s' % rpc_request[u'method'])
            return self._dispatch(rpc_request)
        else:
            logger.debug('returning jsonrpc error')
            return self._encode(result=None, error=JSONRPCError('no such method'))
                
    def _dispatch(self, rpc_request):
        """Internal dispatcher, handles all the error checking and calling of methods"""
        result = None
        error = None
        jsonrpc_id = None
        
        # If someone sends an empty json array or object we need to treat it as Null.
        # This way we don't expand None during the method call.
        if rpc_request[u'params'] is not None and len(rpc_request[u'params']) is 0:
            rpc_request[u'params'] = None
        
        logged_failure = False
        
        try:
            # Account for each type
            if type(rpc_request[u'params']) is list or type(rpc_request[u'params']) is tuple:
                try:
                    result = self.__dict__[rpc_request[u'method']](*rpc_request[u'params'])
                except Exception, e:
                    if type(rpc_request[u'params'][-1]) is dict:
                        result = self.__dict__[rpc_request[u'method']](*rpc_request[u'params'], **rpc_request[u'params'][-1])
                    else:
                        logger.exception('JSONRPC Dispatcher encountered exception')
                        logged_failure = True
                        raise Exception, e
            elif type(rpc_request[u'params']) is dict:
                ascii_params = {}
                [ascii_params.__setitem__(str(key), rpc_request[u'params'][key]) for key in rpc_request[u'params'].keys()]
                result = self.__dict__[rpc_request[u'method']](**ascii_params)
            elif rpc_request[u'params'] is None:
                result = self.__dict__[rpc_request[u'method']]()
            else:
                # If type was something weird just return a JSONRPC Error
                logger.warning('received params type %s ' % type(rpc_request[u'params']))
                raise JSONRPCError, 'params not array or object type'
        # Turn python errors into JSONRPC errors
        except JSONRPCError, e:
            logger.exception('JSONRPCError %s' % e)
        except Exception, e:
            error = JSONRPCError('Server Exception :: %s' % e)
            error.type = e.__class__
            if logged_failure is False:
                logger.exception('JSONRPC Dispatcher encountered exception')
            
        if rpc_request.has_key('id'):
            jsonrpc_id = rpc_request[u'id']
            
        if result is None and error is None:
            result = 200
        
        return self._encode(result=result, error=error, jsonrpc_id=jsonrpc_id)
    
    
    def _encode(self, result=None, error=None, jsonrpc_id=None):
        """Internal encoder method, handles error formatting, id persistence, and encoding via simplejson"""
        response = {}
        response['result'] = result
        if jsonrpc_id is not None:
            response['id'] = jsonrpc_id
        
        
        if error is not None:
            if hasattr(error, 'type'):
                error_type = str(error.type)
                error_message = str(error)
            else:
                error_type = 'JSONRPCError'
                error_message = str(error).strip('JSONRPC Error in: ')
                
            response['error'] = {'type':error_type,
                                 'message':error_message}
        logger.debug('serializing %s' % str(response))
        return json.dumps(response)
        
    def _decode(self, s):
        """Internal method for decoding json objects, uses simplejson"""
        return json.loads(s)
    
class WSGIJSONRPCApplication(JSONRPCDispatcher):
    """A WSGI Application for generic JSONRPC requests."""
    
    def handler(self, environ, start_response):
        """A WSGI handler for generic JSONRPC requests."""
        
        if environ['REQUEST_METHOD'].endswith('POST'):
            body = None
            if environ.get('CONTENT_LENGTH'):
                length = int(environ['CONTENT_LENGTH'])
                body = environ['wsgi.input'].read(length)
            
            try:
                logger.debug('Sending %s to dispatcher' % body)
                response = self.dispatch(body) + '\n'
                start_response('200 OK', [('Cache-Control','no-cache'), ('Pragma','no-cache'),
                                          ('Content-Length', str(len(response)),),
                                          ('Content-Type', 'application/json')])
                return [response]
            except Exception, e:
                logger.exception('WSGIJSONRPCApplication Dispatcher excountered exception')
                start_response('500 Internal Server Error', [('Cache-Control','no-cache'), ('Content-Type', 'text/plain')])
                return ['500 Internal Server Error']
        
        else:
            start_response('405 Method Not Allowed', [('Cache-Control','no-cache'), ('Content-Type', 'text/plain')])
            return ['405 Method Not Allowed. This JSONRPC interface only supports POST. Method used was "'+str(environ['REQUEST_METHOD'])+'"']
            
    def __call__(self, environ, start_response):
        return self.handler(environ, start_response)


