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

def make_server(host='localhost', port=4325):
    from wsgiref import simple_server
    from windmill.dep import wsgi_jsonrpc
    
    class Methods(object):
        def test_1(self):
            return u'test_1'
        def test_2(self, value):
            return value
            
    methods = Methods()
    
    def test_3():
        return 'test3'
    
    application = wsgi_jsonrpc.WSGIJSONRPCApplication(instance=methods, methods=[test_3])
    return  simple_server.make_server(host, port, application)

def test_jsonrpc_server(uri='http://localhost:4325/'):
    from windmill.dep import wsgi_jsonrpc 
    json_tools = wsgi_jsonrpc.json_tools
    
    jsonrpc_client = json_tools.ServerProxy(uri=uri)
    assert jsonrpc_client.test_1() == {u'result':u'test_1'}
    assert jsonrpc_client.test_2({'test':4}) == {u'result':{'test':4}}
    assert jsonrpc_client.test_3() == {u'result':u'test3'}
    
    
if __name__ == "__main__":
    import sys
    from threading import Thread
    
    run = True
    
    try:
        server = make_server()            
        def test_wrapper():
            test_jsonrpc_server()
            run = False
            sys.exit()
        thread = Thread(target=test_wrapper)
        thread.start()
        while run:
            server.handle_request()
        sys.exit()
    except KeyboardInterrupt:
        sys.exit()