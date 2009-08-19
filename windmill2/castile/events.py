import simplejson
from time import sleep
import uuid
from urlparse import urlparse

import httplib2

from webenv import Response, Request, Response303, Response404
from webenv.rest import RestApplication
import threading

import ror

def with_slash(uri):
    if uri.endswith('/'): return uri
    else: return uri+'/'


class JSONStream(Response):
    """Response object that blocks forever streaming event objects."""
    running = False
    content_type = 'application/json'
    def __init__(self, client):
        self.client = client
        self.running = True
    def __iter__(self):
        while self.running:
            sleep(.5)
            if len(self.client.events) is not 0:
                yield simplejson.dumps(self.client.events.pop(0))
            else:
                yield ''

class EventClient(object):
    def __init__(self, ns, obj):
        self.ns = ns
        self.registration_obj = obj
        self.event_node_type = obj['event-node-type']
        if self.event_node_type == 'http-rest-api':
            self.http_client = httplib2.Http()
            self.http_events_uri = with_slash(obj['events-uri'])
        self.events = []
        self.streaming_responses = []
        
    def listener(self, obj):
        """Local listener for remote events node."""
        event_type = obj['event-type']
        if self.event_node_type == 'http-rest-api':
            self.http_push(event_type, obj)
        else:
            self.events.append((event_type, obj,))
            
    def get_remote_object(self, name):
        return ror.create_remote(self, name)
            
    def describe(self, object_id, depth=0):
        if self.event_node_type == 'http-rest-api':
            path = self.http_events_uri+self.ns+'/ror/describe/'+object_id+'?depth='+str(depth)
            response, content = self.http_client.request(path, 'GET', 
                                                         headers={'content-type':'application/json'})
            assert response.status == 200
            return simplejson.loads(content)
        elif self.event_node_type == 'streaming-push':
            pass # TODO: Implement a push on to the response stack then block until a response is pushed
    
    def callFunction(self, object_id, args, kwargs):
        if self.event_node_type == 'http-rest-api':
            path = self.http_events_uri+self.ns+'/ror/callFunction/'+object_id
            if args is None and kwargs is None:
                body = None
            else:
                body = {'args':args, 'kwargs':kwargs}
            response, content = self.http_client.request(path, 'POST', body=simplejson.dumps(body),
                                                         headers={'content-type':'application/json'})
            assert response.status == 200
            return simplejson.loads(content)
        elif self.event_node_type == 'streaming-push':
            pass # TODO: Implement a push on to the response stack then block until a response is pushed
    
    def createInstance(self, object_id, args, kwargs):
        if self.event_node_type == 'http-rest-api':
            path = self.http_events_uri+self.ns+'/ror/createInstance/'+object_id
            if args is None and kwargs is None:
                body = None
            else:
                body = {'args':args, 'kwargs':kwargs}
            response, content = self.http_client.request(path, 'POST', body=simplejson.dumps(body),
                                                         headers={'content-type':'application/json'})
            assert response.status == 200
            return simplejson.loads(content)
        elif self.event_node_type == 'streaming-push':
            pass # TODO: Implement a push on to the response stack then block until a response is pushed
            
    def setAttribute(self, object_id, attr, obj, reference=False):
        if self.event_node_type == 'http-rest-api':
            path = self.http_events_uri+self.ns+'/ror/setAttribute/'+object_id
            body = {'attribute':attr, 'value':obj, 'reference':False}
            response, content = self.http_client.request(path, 'POST', body=simplejson.dumps(body), 
                                                         headers={'content-type':'application/json'})
            assert response.status == 200
            return simplejson.loads(content)
        elif self.event_node_type == 'streaming-push':
            pass # TODO: Implement a push on to the response stack then block until a response is pushed
    
    def setItem(self, object_id, attr, obj, reference=False):
        if self.event_node_type == 'http-rest-api':
            path = self.http_events_uri+self.ns+'/ror/setItem/'+object_id
            body = {'attribute':attr, 'value':obj, 'reference':False}
            response, content = self.http_client.request(path, 'POST', body=simplejson.dumps(body), 
                                                         headers={'content-type':'application/json'})
            assert response.status == 200
            return simplejson.loads(content)
        elif self.event_node_type == 'streaming-push':
            pass # TODO: Implement a push on to the response stack then block until a response is pushed
    
    def http_push(self, event_type, obj):
        """Method which pushes an event to the remote events node."""
        body = simplejson.dumps(obj)
        response, content = self.http_client.request(self.http_events_uri+event_type, 'PUT', 
                                 body=body, headers={'content-type':'application/json'})
        assert response.status == 200
    
    def add_remote_listener(self, event_type, obj):
        obj['namespace'] = event_type
        client_ns = obj['client-namespace']
        body = simplejson.dumps(obj)
        response, content = self.http_client.request(self.http_events_uri+client_ns+'/listeners', 
                                 'POST', body=body, headers={'content-type':'application/json'})
        assert response.status == 200
        
    def get_json_stream(self):
        for s in self.streaming_responses:
            s.running = False
        s = JSONStream(self)
        self.streaming_responses.append(s)
        return s

def getRORType(obj):
    if obj is None:
        return 'null', None
    t = type(obj)
    if t in [int, float, unicode, str, list, tuple, set, dict]:
        if t in (int, float,):
            return str(t.__name__), obj
        elif t in (unicode, str,):
            return 'string', obj
        elif t in (list, tuple, set,):
            return 'array', list(obj)
        elif t == dict:
            return 'hash', obj
    elif callable(obj):
        return 'function', None
    elif isinstance(obj, obj.__class__):
        return 'instanceobject', None
    else:
        return 'classobject', None            


def eToDict(e):
    d = dict(
        [ (x, getattr(e, x),) for x in dir(e) 
            if type(getattr(e, x,)) in [int, float, str, unicode, dict, list, tuple]
        ])
    d.pop('__dict__')
    d['execptionType'] = type(e).__name__
    return d
        

class ROR(object):
    def __init__(self):
        self.object_map = {}
        self.registry = {}
    def add_object(self, name, obj):
        self.object_map[name] = obj
    def describe(self, name, depth=0):
        if name is None:
            return {'objects':[self.describe(x) for x in self.object_map.keys()]}
        
        if depth == -1:
            depth = 99
        # try:
        obj = self.get_object(name)
        # except AttributeError:
        #     return {'exception':'No such attribute'}
        t, value = getRORType(obj)
        desc = {'name':name, 'type':t, 'value':value}
        if depth == 0:
            return desc
        else:
            desc['attributes'] = [self.describe(name+'.'+x, depth=(depth - 1)) for x in dir(obj) if not x.startswith('_')]
        return desc 
    
    def get_object(self, name):
        
        def getitem(obj, n):
            index = n.split('[')[1:][0][:-1]
            try:
                index = int(index)
            except:
                index = index.replace('"', '').replace("'", '')
            return obj[index]
        
        name = name.split('.')
        if name[0].startswith('registry'):
            reg = name.pop(0)
            if '"' in reg: s = '"'
            else: s = "'"
            k = reg.split(s)[1]
            obj = self.registry[k]
        else:
            n = name.pop(0)
            if '[' in n:
                obj = getitem(self.object_map[n.split('[')[0]], n)
            else:
                obj = self.object_map[n]
        
        for n in name:
            if '[' in n:
                obj = getitem(getattr(obj, n.split('[')[0]), n)
            else:
                obj = getattr(obj, n)
        return obj
        
    def callFunction(self, name, args, kwargs):
        obj = self.get_object(name)
        u = str(uuid.uuid1())
        try:
            self.registry[u] = obj(*args, **kwargs)
        except Exception, e:
            return eToDict(e)
        t, value = getRORType(self.registry[u])
        desc = {'name':'registry["'+u+'"]', 'type':t, 'value':value}
        return desc
        
    def createInstance(self, name, args, kwargs):
        return self.callFunction(name, args, kwargs)
        
    def setAttribute(self, name, attr, obj, reference=False):
        if reference is True:
            obj = self.get_object(obj)

        setattr(self.get_object(name), attr, obj)
    
    def setItem(self, name, attr, obj, reference=False):
        if reference is True:
            obj = self.get_object(obj)
        
        self.get_object(name)[attr] = obj
        
    
class CastileNode(object):
    def __init__(self, ns, events_uri):
        self.ns = ns
        self.events_uri = events_uri
        self.client_map = {}
        self.ror = ROR()
        self.listeners = {}
        # Register self
        obj = {'event-node-type':'http-rest-api', 'events-uri':events_uri}
        self.register(ns, obj)
        
    def describe(self, client_id, object_id, depth=0):
        if client_id == self.ns:
            return self.ror.describe(object_id, depth)
        else:
            return self.client_map[client_id].describe(object_id, depth)
            
    def get_remote_object(self, client_id, name):
        return self.client_map[client_id].get_remote_object(name)
            
    def callFunction(self, client_id, ror_name, args, kwargs):
        if client_id == self.ns:
            return self.ror.callFunction(ror_name, args, kwargs)
        else:
            return self.client_map[client_id].callFunction(ror_name, args, kwargs)
    
    def createInstance(self, client_id, ror_name, args, kwargs):
        if client_id == self.ns:
            return self.ror.createInstance(ror_name, args, kwargs)
        else:
            return self.client_map[client_id].createInstance(ror_name, args, kwargs)
            
    def setAttribute(self, client_id, object_id, attr, value, reference=False):
        if client_id == self.ns:
            return self.ror.setAttribute(object_id, attr, value, reference)
        else:
            return self.client_map[client_id].setAttribute(object_id, attr, value, reference)
    
    def setItem(self, client_id, object_id, attr, value, reference=False):
        if client_id == self.ns:
            return self.ror.setItem(object_id, attr, value, reference)
        else:
            return self.client_map[client_id].setItem(object_id, attr, value, reference)
        
    def register(self, ns, obj):
        obj['client-namespace'] = ns
        self.client_map[ns] = EventClient(ns, obj)
        self.fire_event('castile.register', obj)
        return ns
        
    def two_way_register_listener(self, obj):
        if obj['events-uri'] != self.events_uri and obj['client-namespace'] != self.ns:
            self.register_with_node(obj['events-uri'])
                
    def register_with_node(self, uri):
        h = httplib2.Http()
        response, content = h.request(with_slash(uri), method='POST',
                                      body=simplejson.dumps(self.client_map[self.ns].registration_obj)) 
        assert response.status == 200
        
    def add_listener(self, ns, func):
        if not ns.startswith(self.ns+'.') and ns != self.ns:
            def get_client(split):
                if self.client_map.has_key('.'.join(split)):
                    return self.client_map['.'.join(split)]
                elif len(split) is not 0:
                    return get_client(split[:-1])
            
            client = get_client(ns.split('.'))
            if client is not None:
                client.add_remote_listener(ns, self.client_map[self.ns].registration_obj)
        self.listeners.setdefault(ns, []).append(func)
    
    def _fire_event(self, ns, obj):
        obj['event-type'] = ns
        heirarchy = []
        x = ''
        for n in ns.split('.'):
            x += n 
            heirarchy.append(x)
            x += '.'
        
        for h in heirarchy:
            if self.listeners.has_key(h):
                for listener in self.listeners[h]:
                    listener(obj)
                    
    fire_event = lambda self, ns, obj: self._fire_event(self.ns+'.'+ns, obj)
    
    def get_application(self):
        return CastileApplication(self)
        
    def get_cherrypy_server(self, host='0.0.0.0', port=None, 
                            server_name=None, numthreads=50):
        from cherrypy import wsgiserver
        
        if port is None:
            port = urlparse(self.events_uri).port
            if port is None:
                port = 80
        
        if server_name is None:
            server_name = self.ns+'-server'
        
        self.httpd = wsgiserver.CherryPyWSGIServer((host, port,), self.get_application(), 
                                                   server_name=server_name, 
                                                   numthreads=numthreads)
        return self.httpd
    
    def start_cherrypy_server(self, host='0.0.0.0', port=None, 
                              server_name=None, numthreads=50, threaded=True):
        self.get_cherrypy_server(host, port, server_name, numthreads)
        if threaded is True:
            self.thread = threading.Thread(target=self.httpd.start)
            self.thread.start()
            return self.httpd
        else:
            self.httpd.start()
            return self.httpd

class CastileApplication(RestApplication):
    def __init__(self, events_node):
        super(CastileApplication, self).__init__()
        self.events_node = events_node
        self.events_uri = self.events_node.events_uri
    
    def PUT(self, request, ns):
        self.events_node._fire_event(ns, simplejson.loads(str(request.body)))
        return Response('')
    
    def POST(self, request, client_ns=None, action=None, ror_action=None, ror_name=None):
        """Client API POST handler"""
        body = str(request.body)
        if len(body) is 0:
            obj = None
        else:
            obj = simplejson.loads(body)
        if client_ns is None:
            # POST to / is a remote node registration call
            namespace = obj.pop('client-namespace')
            client_ns = self.events_node.register(namespace, obj)
            return Response303(with_slash(request.reconstructed_url)+client_ns)
            
        elif action == 'listeners':
            # POST to /$clientId/listeners adds a remote listener
            namespace = obj.pop('namespace')
            listener = self.events_node.client_map[client_ns].listener
            self.events_node.add_listener(namespace, listener)
            return Response303(with_slash(request.reconstructed_url)+namespace)
        elif action == 'ror':
            if ror_action == 'callFunction' or ror_action == 'createInstance':                
                if obj:
                    if obj.has_key('args'): args = obj['args']
                    else: args = [] 
                    if obj.has_key('kwargs'): kwargs = obj['kwargs']
                    else: kwargs = {}
                else:
                    args = []
                    kwargs = {}
                resp = getattr(self.events_node, ror_action)(client_ns, ror_name, args, kwargs)
                return Response(simplejson.dumps(resp))
            if ror_action == 'setItem' or ror_action == 'setAttribute':
                args = {'attr':obj['attribute'], 'value':obj['value']}
                if obj.has_key('reference'):
                    args['reference'] = obj['reference']
                resp = getattr(self.events_node, ror_action)(client_ns, ror_name, **args)
                return Response(simplejson.dumps(resp))
        
    def GET(self, request, client_ns=None, action=None, rid=None, object_name=None):
        if client_ns is None:
            # GET to / returns a list of clients
            return Response('Not Implemented GET '+request.reconstructed_url) # TODO: Return list of clients
        elif action == None:
            # Get to /$clientId returns the info object for that remote node
            return Response(simplejson.dumps(self.events_node.client_map[client_ns].registration_obj)) 
        elif action == 'jsonstream':
            # Get to /$clientId/jsonstream returns a stream of JSON objects.
            return self.events_node.client_map[client_ns].get_json_stream()
        elif action == 'listeners':
            if rid is None:
                # Get to /$clientId/listeners retuns a list of listeners
                return Response('Not Implemented GET '+request.reconstructed_url) #TODO: Return listeners info
            else:
                # Get to /$clientId/listeners/$namespace returns the info for a listener
                return Response('Not Implemented GET '+request.reconstructed_url) #TODO: Return listener info
        elif action == 'ror':
            return Response(simplejson.dumps(getattr(self.events_node, rid)(client_ns, object_name)))
    
    def DELETE(self, request, client_ns=None, action=None, rid=None):
        pass

# 
# class CastileNodeApplication(RestApplication):
#     """WSGI Application for accessing the event node."""
#     def __init__(self, events_node):
#         super(CastileNodeApplication, self).__init__()
#         self.events_node = events_node
#         self.add_resource('clients', ClientApplication(events_node))
    
# # TODO: Move verbage from events to node and push client/ under / instead of under events
#     
# def get_application():
#     return CastileNodeApplication(event_type)
#         