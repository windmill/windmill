import simplejson
from time import sleep
from datetime import datetime

event_responses = {}

class EventsResponse(object):
    def __init__(self, uuid):
        self.uuid = uuid
        self.events = [{'text':'asdf'}]
        self.running = True
        
    def fire_event(self, t, obj):
        self.events.append({'eventType':t, 'obj':obj, 'timestamp':datetime.now().isoformat()})
        
    def __iter__(self):
        while self.running:
            sleep(.5)
            if len(self.events) is not 0:
                yield simplejson.dumps(self.events.pop(-1))
            else:
                yield ''
                
def create_chat(u, text):
    print text
    ntext = raw_input('>>')
    
    event_responses[u].fire_event('newText', ntext)

def application(environ, start_response):
    
    if environ['PATH_INFO'].endswith('chat_push.html'):
        html = open('chat_push.html', 'r').read()
        start_response('200 OK', [('Cache-Control','no-cache'), ('Pragma','no-cache'),
                                  ('Content-Length', str(len(html)),),
                                  ('Content-Type', 'text/html')])
        return [html]
    elif 'push_json' in environ['PATH_INFO']:
        start_response('200 OK', [('Cache-Control','no-cache'), ('Pragma','no-cache'),
                                  ('Content-Type', 'application/json')])
        u = environ['PATH_INFO'].split('/')[-1]
        e = EventsResponse(u)
        event_responses[u] = e
        return e
    elif environ['PATH_INFO'].endswith('create_chat'):
        length = int(environ['CONTENT_LENGTH'])
        body = environ['wsgi.input'].read(length)
        obj = simplejson.loads(body)
        create_chat(obj['uuid'], obj['text'])    
        start_response('200 OK', [('Cache-Control','no-cache'), ('Pragma','no-cache'),
                                  ('Content-Type', 'application/json')])
        return ['']
    else:
        start_response('404 Not Found', [('Cache-Control','no-cache'), ('Pragma','no-cache'), ('Content-Type', 'text/plain')])
        return ['']

def main():
    print 'Send text to terminal at http://localhost:8888/chat_push.html'
    from cherrypy import wsgiserver
    httpd = wsgiserver.CherryPyWSGIServer(('127.0.0.1', 8888), 
                       application, server_name='push-test', numthreads=10)
    try:
        httpd.start()
    except KeyboardInterrupt:
        for x in event_responses.values():
            x.running = False
        httpd.stop()
    

if __name__ == "__main__":
    main()