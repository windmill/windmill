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

from urlparse import urlparse
import os, sys
import logging
import urllib

logger = logging.getLogger(__name__)

# Content type sources taken from http://en.wikipedia.org/wiki/MIME_type
content_type_table = {'js': 'application/x-javascript', 'html': 'text/html; charset=utf-8',
                      'fallback':'text/plain; charset=utf-8', 'ogg': 'application/ogg', 
                      'xhtml':'text/html; charset=utf-8', 'rm':'audio/vnd.rn-realaudio', 
                      'swf':'application/x-shockwave-flash', 'mp3': 'audio/mpeg', 'wma':'audio/x-ms-wma', 
                      'ra':'audio/vnd.rn-realaudio', 'wav':'audio/x-wav', 'gif':'image/gif', 'jpeg':'image/jpeg',
                      'jpg':'image/jpeg', 'png':'image/png', 'tiff':'image/tiff', 'css':'text/css; charset=utf-8',
                      'mpeg':'video/mpeg', 'mp4':'video/mp4', 'qt':'video/quicktime', 'mov':'video/quicktime',
                      'wmv':'video/x-ms-wmv', 'atom':'application/atom+xml; charset=utf-8',
                      'xslt':'application/xslt+xml', 'svg':'image/svg+xml', 'mathml':'application/mathml+xml', 
                      'rss':'application/rss+xml; charset=utf-8',
                      'ics':'text/calendar; charset=utf-8 '}

def reconstruct_url(environ):
    # From WSGI spec, PEP 333
    from urllib import quote
    url = environ['wsgi.url_scheme']+'://'
    if environ.get('HTTP_HOST'): url += environ['HTTP_HOST']
    else:
        url += environ['SERVER_NAME']
        if environ['wsgi.url_scheme'] == 'https':
            if environ['SERVER_PORT'] != '443':
               url += ':' + environ['SERVER_PORT']
        else:
            if environ['SERVER_PORT'] != '80':
               url += ':' + environ['SERVER_PORT']
    url += quote(environ.get('SCRIPT_NAME',''))
    url += quote(environ.get('PATH_INFO','')).replace(url.replace(':', '%3A'), '')
    if environ.get('QUERY_STRING'):
        url += '?' + environ['QUERY_STRING']
    environ['reconstructed_url'] = url
    return url
    
class FileResponse(object):
    readsize = 1024
    def __init__(self, f, filename):
        self.size = os.path.getsize(filename)
        self.f = f
    def __iter__(self):
        output = '\n'
        while len(output) is not 0:
            output = self.f.read(self.readsize)
            yield output

class WSGIFileServerApplication(object):
    """Application to serve out windmill provided"""
    
    def __init__(self, root_path, mount_point=None):
        self.path = os.path.abspath(os.path.expanduser(root_path))
        self.mount_point = mount_point
        
    def handler(self, environ, start_response):
        """Application to serve out windmill provided"""
        url = urlparse(reconstruct_url(environ))
        
        if self.mount_point is not None:
            #split_url = url.path.split(self.mount_point, 1)
            split_url = url[2].split(self.mount_point, 1)
            serve_file = split_url[1]
        else:
            #serve_file = url.path
            serve_file = url[2]
        
        serve_file = urllib.unquote(serve_file).replace('/', os.path.sep)
        
        def do_get():
            if serve_file.endswith('/') or os.path.isdir(os.path.join(self.path, serve_file)):
                if os.path.isdir(os.path.join(self.path, serve_file)):
                    start_response('200 OK', [('Cache-Control','no-cache'), ('Pragma','no-cache'),
                                              ('Content-Type', 'text/html; charset=utf-8')])
                    return [ '<html>' + 
                              '<br>'.join( ['<a href="%s/%s">%s</a>' % (serve_file.replace(filename, ''), filename, filename) 
                                          for filename in os.listdir(os.path.join(self.path, serve_file))])
                             + '</html>'   ]
                else:
                    logger.error('failed to list directory %s/%s' % (self.path, serve_file))
                    start_response('404 Not found', [('Content-Type', 'text/plain')])
                    return ['404 Not Found']
            
            try:
                if os.name == 'nt' or sys.platform == 'cygwin':
                    f = open(os.path.join(self.path, serve_file), 'rb')
                else:
                    f = open(os.path.join(self.path, serve_file), 'r')
                logger.debug('opened file %s' % serve_file)
            except IOError:
                logger.error('failed to open file %s/%s' % (self.path, serve_file))
                start_response('404 Not found', [('Content-Type', 'text/plain')])
                return ['404 Not Found']
            
            response = FileResponse(f, os.path.join(self.path, serve_file))
            start_response('200 OK', [('Cache-Control','no-cache'), ('Pragma','no-cache'), 
                                      ('Content-Length', str(response.size),),
                                      ('Content-Type', self.guess_content_type(environ['PATH_INFO']))])
            return response
            
        def do_put():
            #Write file
            try:
                f = open(os.path.join(self.path, serve_file), 'w')
                logger.debug('opened file for writing %s' % serve_file)
            except:
                logger.error('failed to open file for writiing %s/%s' % (self.path, serve_file))
                start_response('403 Forbidden', [('Content-Type', 'text/plain')])
                return ['403 Forbidden']
            
            f.write(environ['wsgi.input'].read())
            
        def do_mkcollection():
            pass
            
        http_method_map = {'GET':do_get, 'PUT':do_put, 'MKCOLLECTION':do_mkcollection}
        return http_method_map[environ['REQUEST_METHOD']]()
            

    def guess_content_type(self, path_info):
        """Make a best guess at the content type"""
        extention_split = path_info.split('.')

        if content_type_table.has_key(extention_split[-1]):
            return content_type_table[extention_split[-1]]
        else:
            return content_type_table['fallback']
            
    def __call__(self, environ, start_response):
        return self.handler(environ, start_response)
