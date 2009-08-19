import uuid
from time import sleep
from datetime import datetime

class WSGIPush(object):
    def __init__(self, uuid):
        self.uuid = uuid
        self.count = 0
        self.ts = datetime.now()
    def __iter__(self):
        while self.count < 5:
            sleep(self.count)
            obj = '{"count":'+str(self.count)+', "dt":"'+ str(datetime.now() - self.ts) +'"}'
            yield obj
            self.count += 1

def application(environ, start_response):
    if environ['PATH_INFO'].endswith('push_test.html'):
        html = open('push_test.html', 'r').read()
        start_response('200 OK', [('Cache-Control','no-cache'), ('Pragma','no-cache'),
                                  ('Content-Length', str(len(html)),),
                                  ('Content-Type', 'text/html')])
        return [html]
    elif environ['PATH_INFO'].endswith('push_test'):    
        start_response('200 OK', [('Cache-Control','no-cache'), ('Pragma','no-cache'),
                                  ('Content-Type', 'application/json')])
        return WSGIPush(str(uuid.uuid1()))
    else:
        start_response('404 Not Found', [('Cache-Control','no-cache'), ('Pragma','no-cache'), ('Content-Type', 'text/plain')])
        return ['']

def main():
    from cherrypy import wsgiserver
    httpd = wsgiserver.CherryPyWSGIServer(('127.0.0.1', 8888), 
                       application, server_name='push-test', numthreads=10)
    try:
        print 'Serving at http://localhost:8888/push_test.html'
        httpd.start()
    except KeyboardInterrupt:
        httpd.stop()
if __name__ == "__main__":
    main()