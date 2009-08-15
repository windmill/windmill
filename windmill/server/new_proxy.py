from webenv import Application, Response, Request
from copy import copy
from urlparse import urlparse
import urllib

global_exclude = ['http://sb-ssl.google.com',
                  'https://sb-ssl.google.com', 
                  'http://en-us.fxfeeds.mozilla.com',
                  'fxfeeds.mozilla.com',
                  'http://www.google-analytics.com',
                  ]


# Note that hoppish conntains proxy-connection, which is pre-HTTP-1.1 and
# is somewhat nebulous
hoppish_headers = {'connection':1, 'keep-alive':1, 'proxy-authenticate':1,
                   'proxy-authorization':1, 'te':1, 'trailers':1, 'transfer-encoding':1,
                   'upgrade':1, 'proxy-connection':1, 
                   'p3p':1 #Not actually a hop-by-hop header, just really annoying 
                   }

# Cache stopping headers
cache_headers = {'Pragma':'no-cache', 'Cache-Control': 'post-check=0, pre-check=0',
                 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                 'Expires': '-1'}

cache_removal = [k.lower() for k in cache_headers.keys()]
cache_additions = cache_headers.items()


class ProxyClient(object):

    def is_hop_by_hop(self, header):
      """check if the given header is hop_by_hop"""
      return hoppish_headers.has_key(header.lower())
    
    def make_request(self, request, host):
        pass
    def clean_response(self, http_response):
        pass

class ForwardMap(dict):
    def __init__(self, *args, **kwargs):
        dict.__init__(self, *args, **kwargs)
        self.ordered_hosts = []
    def __setitem__(self, key, value):
        dict.__setitem__(self, key, value)
        self.ordered_hosts.append(value)
    def known_hosts(self, first_forward_hosts, exclude_hosts):
        hosts = first_forward_hosts
        for host in self.ordered_hosts:
            if host not in hosts and host not in exclude_hosts:
                hosts.append(host)
        return hosts
        
class ForwardingManager(object):
    mapped_response_pass_codes = [200]
    mapped_response_pass_threshold = 399
    unmapped_response_pass_codes = [200]
    unmapped_response_pass_threshold = 399
    first_forward_hosts = []
    exclude_from_retry = copy(global_exclude)
    
    def __init__(self, forwarding_test_url=None):
        self.environ_conditions = []
        self.request_conditions = []
        self.response_conditions = []
        self.initial_forward_map = {}
        self.forward_map = ForwardMap()
        self.redirect_forms = {}
        
    def set_test_url(self, test_url):
        if test_url is None:
            self.enabled = False
            self.forwarding_test_url = None
            self.test_url = None
            self.test_host = None
        else:
            self.enabled = True
            self.forwarding_test_url = test_url
            self.test_url = urlparse(test_url)
            self.test_host = self.test_url.scheme+"://"+self.test_url.netflow
    
    def is_mapped(self, request):
        if (request.full_uri in self.forward_map):
            return True
        if (request.environ.get('HTTP_REFERER', None) in self.forward_map):
            return True
        return False
    
    def get_forward_host(self, request):
        if request.full_uri in self.forward_map:
            return self.forward_map[request.full_uri]
        if request.environ.get('HTTP_REFERER', None) in self.forward_map:
            return self.forward_map[request.environ['HTTP_REFERER']]
        return None
    
    def create_redirect_form(self, request, uri):
        inputs = ['<input type="hidden" name="%s" value="%s" />' % 
                  (urllib.unquote(k), urllib.unquote(v),) for k, v in request.body.form.items()
                  ]            
        form = """<html><head><title>There is no spoon.</title></head>
    <body onload="document.getElementById('redirect').submit();"
          style="text-align: center;">
      <form id="redirect" action="%s" method="POST">%s</form>
    </body></html>""" % (uri, '\n'.join(inputs))
        self.redirect_forms[uri] = form.encode('utf-8')
    
    def is_form_forward(self, request):
        if self.redirect_forms.has_key(request.uri):
            return True
        return False
        
    def form_forward(self, request):
        form = self.redirect_forms.pop(request.uri)
        return form
    
    def initial_forward(self, request):
        new_uri = request.full_uri.replace(request.host, self.test_host)
        self.forward_map[new_uri] = request.host
        return new_uri
    
    def forwardable(self, request):
        if request.url.netloc.startswith('127.0.0.1') or (
           not self.proxy_conditions_pass(request)):
            return False
        return True
    
    add_environ_condition = lambda self, condition: self.environ_conditions.append(condition)
    add_request_condition = lambda self, condition: self.request_conditions.append(condition)
    add_response_condition = lambda self, condition: self.response_conditions.append(condition)
         
    def proxy_conditions_pass(self, request):
        for condition in self.environ_conditions:
            if not condition(request.environ):
                return False
        for condition in self.request_conditions:
            if not condition(request):
                return False
        return True
        
    def response_conditions_pass(self, request, target_host, client_response, mapped):
        for condition in self.response_conditions:
            result = condition(request, target_host, client_response, mapped):
            if result is not None:
                return result
        if mapped: g = 'mapped_'
        else: g = 'unmapped_' 
        if client_response.status in getattr(self, g+'_response_pass_codes'):
            return True
        if client_response > getattr(self, g+'_response_pass_threshold'):
            return False
        else:
            return True
            
    def get_retry_hosts(self, request):
        

class Response(object):
    """WSGI Response Abstraction. Requires that the request object is set to it before being returned in a wsgi application."""

    content_type = 'text/plain'
    status = '200 OK'

    def __init__(self, body=''):
        self.body = body
        self.headers = []

    def __iter__(self):
        self.headers.append(('content-type', self.content_type,))
        self.request.start_response(self.status, self.headers)
        if not hasattr(self.body, "__iter__"):
            yield self.body
        else:
            for x in self.body:
                yield x

class InitialForwardResponse(Response302):
    def __init__(self, request):
        super(InitialForwardResponse, self).__init__(request.uri)
        self.headers = cache_headers

class ProxyResponse(Response):
    def __init__(self, forwarding_manager, request):
        Response.__init__(self)
        self.fm = forwarding_manager
        self.request = request
    
class ProxyApplication(Application):
    def handler(self, request):
        if self.fm.enabled() and self.fm.forwardable(request):
            hosts = self.fm.get_hosts(request)
            if request.host != self.fm.test_host:
                # request host is not the same as the test host, we need to do an initial forward
                new_uri = self.fm.initial_forward(request)
                if hasattr(request.body, 'form'): # form objects are only created for http forms
                    self.fm.create_redirect_form(request, new_uri)
                logger.debug('Domain change, forwarded to ' + redirect_url)
                return InitialForwardResponse(new_uri)
            elif self.fm.is_form_forward(request):
                form = self.fm.form_forward(request)
                response = HtmlResponse(form)
                response.headers += cache_additions
                return response
            
            # At this point we are 100% sure we will be needing to send a proxy request
            client = ProxyClient(request, self.fm)
            
            target_host = self.fm.get_forward_host(request)
            if target_host is not None:
                client_response = client.make_client_request(target_host)
                if self.fm.response_conditions_pass(request, target_host, client_response, mapped=True):
                    return ProxyResponse(request, self.fm, client_response)
            
            # Now we've hit the retry loop
            for host in self.fm.get_retry_hosts(request):
                    
        


class IterativeResponse(object):
    def __init__(self, response_instance):
        self.response_instance = response_instance
        self.read_size = response_instance.length / 100

    def __iter__(self):
        yield self.response_instance.read(self.read_size)
        while self.response_instance.chunk_left is not None:
            if self.response_instance.chunk_left < self.read_size:
                yield self.response_instance.read()
                self.response_instance.chunk_left = None
            else:
                yield self.response_instance.read(self.read_size)