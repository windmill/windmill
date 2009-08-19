import os
import threading
import functest
import httplib2
from time import sleep

from cherrypy import wsgiserver
from windmill2.castile.events import CastileNode, CastileApplication

def setup_module(module):
    enode1 = CastileNode('enode1', 'http://localhost:8888/')
    enode2 = CastileNode('enode2', 'http://localhost:8889/')
    module.enode1 = enode1; 
    module.enode2 = enode2;
    
    enode1.start_cherrypy_server()
    enode2.start_cherrypy_server()
    sleep(.5)
    
def test_onRegister():
    enode1.add_listener('enode1.castile.register', enode1.two_way_register_listener)
    enode2.register_with_node('http://localhost:8888/')
    assert enode2.client_map.has_key('enode1')
    assert enode1.client_map.has_key('enode2')
    
def test_remoteEvents():
    e2_events = []
    listener = lambda obj: e2_events.append(obj)
    enode1.add_listener('enode2.testEvent', listener)
    enode2.fire_event('testEvent', {"asdfsdf":6})
    assert e2_events[0] == {"asdfsdf":6, 'event-type':'enode2.testEvent'}
    
def test_ror_describe():
    class Test(object):
        asdf = 'adsf'
    enode1.ror.add_object('test', Test())
    enode1.ror.describe('test')
    http = httplib2.Http()
    response, content = http.request(enode1.events_uri+'enode1/ror/describe/test', 'GET')
    assert response.status == 200
    assert content == '{"type": "instanceobject", "name": "test", "value": null}'
    
    response, content = http.request(enode1.events_uri+'enode1/ror/describe/test.asdf', 'GET')
    assert response.status == 200
    assert content == '{"type": "string", "name": "test.asdf", "value": "adsf"}'
    
    response, content = http.request(enode1.events_uri+'enode1/ror/describe', 'GET')
    assert response.status == 200
    assert content == '{"objects": [{"type": "instanceobject", "name": "test", "value": null}]}'
    
def test_ror_object():
    class Test(object):
        asdf = 'asdf'
        tlist = ['ttt']
        tdict = {'testing':123}
        def another(self, arg):
            return arg
    enode1.ror.add_object('test', Test())
    test = enode2.get_remote_object('enode1', 'test')
    assert test.asdf == 'asdf'
    assert test.tlist[0] == 'ttt'
    assert test.tdict['testing'] == 123

def test_ror_function_call():
    class Test(object):
        asdf = 'asdf'
        def another(self, arg):
            return arg
    enode1.ror.add_object('test', Test())
    test = enode2.get_remote_object('enode1', 'test')
    
    for x in ['asdf', 3, 4.5, None, {'sd':4}, [4, 5]]:
        r = test.another(x)
        assert r == x
        
def test_ror_setattribute():
    class Test(object): pass
    x = Test()
    enode1.ror.add_object('test', x)
    test = enode2.get_remote_object('enode1', 'test')
    
    for y in ['asdf', 3, 4.5, None, {'sd':4}, [4, 5]]:
        test.a = y
        assert x.a == test.a == y
    
    x = {}
    enode1.ror.add_object('test', x)
    test = enode2.get_remote_object('enode1', 'test')
    test['ddd'] = 1
    assert x['ddd'] == test['ddd']

def teardown_module(module):
    while module.enode1.thread.isAlive():
        module.enode1.httpd.stop()
    while module.enode2.thread.isAlive():
        module.enode2.httpd.stop()

