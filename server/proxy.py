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

from wsgiref.simple_server import make_server
from wsgiref.util import request_uri
from urlparse import urlparse, urljoin
import os.path
import httplib

CORE_PATH = os.path.abspath('.')

def guess_content_type(path_info):
    if path_info.endswith('.js'):
        return 'application/x-javascript'
    elif path_info.endswith('.html'):
        return 'text/html'
    else:
        return 'text/plain'

def windmill_serv_app(environ, start_response):
    """Application to serve out windmill provided"""
    serve_file = environ['PATH_INFO'].replace('/windmill-serv/', '')
    #Open file
    f = open('%s/%s' % (CORE_PATH, serve_file), 'r')
    content_type = guess_content_type(environ['PATH_INFO'])
    start_response('200 OK', [('Cache-Control','no-cache'), ('Pragma','no-cache'),
                              ('Content-Type', content_type)])
    return [f.read()]
    
def windmill_jsonrpc_app(environ, start_response):
    """JSONRPC service for windmill browser core to communicate with"""
    
    start_response("200 OK", [('Content-Type','text/plain')])
    return ['']
    
def windmill_proxy(environ, start_response):
    """Proxy for requests to the actual http server"""
    if environ['QUERY_STRING'] != '':
        request = environ['PATH_INFO']+'?'+environ['QUERY_STRING']
    else:
        request = environ['PATH_INFO']

    url = urlparse(request)
    
    #Create connection object
    if url[0] == 'http':
        try:
            connection = httplib.HTTPConnection(url[1])
            #Build path
            path = request.replace('http://%s' % url[1], '')
        except:
            start_response("501 Gateway error", [('Content-Type', 'text/html')])
            return ['<H1>Could not connect</H1>']
    elif url[0] == 'https':
        try:
            connection = httplib.HTTPSConnection(url[1])
            #Build path
            path = request.replace('http://%s' % url[1], '')
        except:
            start_response("501 Gateway error", [('Content-Type', 'text/html')])
            return ['<H1>Could not connect</H1>']
    
    #Read in request body if it exists    
    body = None
    if environ.get('CONTENT_LENGTH'):
        length = int(environ['CONTENT_LENGTH'])
        body = environ['wsgi.input'].read(length)
        
    #Build headers
    headers = {}
    for key in environ.keys():
        #Keys that start with HTTP_ are all headers
        if key.startswith('HTTP_'):
            #This is a hacky way of getting the header names right
            value = environ[key]
            key = key.replace('HTTP_', '').swapcase()
            keys = key.split('_')
            for key in keys:
                key = key.capitalize()
            key = '-'.join(keys)
            headers[key] = value
    
    #Make the remote request    
    connection.request(environ['REQUEST_METHOD'], path, body=body, headers=headers)
    response = connection.getresponse()
    
    #Return the proper wsgi response
    response_body = response.read()
    start_response(response.status.__str__()+' '+response.reason, response.getheaders())
    return [response_body]
    

def windmill_app_chooser(environ, start_response):
    """Windmill app chooser"""
    if environ['PATH_INFO'].startswith('/windmill-serv/'):
        return windmill_serv_app(environ, start_response)
    elif environ['PATH_INFO'].startswith('/windmill-jsonrpc/'):
        return windmill_jsonrpc_app(environ, start_response)
    else:
        return windmill_proxy(environ, start_response)


httpd = make_server('', 8000, windmill_app_chooser)
print "Serving HTTP on port 8000..."

# Respond to requests until process is killed
httpd.serve_forever()

# Alternative: serve one request, then exit
httpd.handle_request()