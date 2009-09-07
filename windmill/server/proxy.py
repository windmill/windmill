import socket
import httplib
import logging
import urllib
from time import sleep
from copy import copy
from urlparse import urlparse

from webenv import Application, Response, Response302, HtmlResponse
import httplib2

logger = logging.getLogger()

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

class ProxyResponse(Response):
    def __init__(self, resp):
        self.http2lib_response = resp
        self.status = resp['status']
        if 'reason' in resp:
            self.status += ' '+resp['reason']
        self.httplib_response = resp._response
        # Anything under .5 meg just return
        # Anything over .5 meg return in 100 chunked reads
        if 'content-length' in resp:
            self.httplib_response.length = int(resp['content-length'])
        
        if self.httplib_response.length > 512000:
            self.read_size = self.httplib_response.length / 100
        else:
            self.read_size = None
    
    def __iter__(self):
        if self.read_size is not None:
            yield self.httplib_response.read(self.read_size)
            while self.httplib_response.chunk_left is not None:
                if self.httplib_response.chunk_left < self.read_size:
                    yield self.httplib_response.read()
                    self.httplib_response.chunk_left = None
                else:
                    yield self.httplib_response.read(self.read_size)
        else:
            if self.httplib_response.length:
                body = self.httplib_response.read(self.httplib_response.length)
                yield body
            else:
                body = self.httplib_response.read()
                print self.request.full_uri, self.http2lib_response
                yield body
        self.httplib_response.conn.busy = False
        
class WindmillHttp(httplib2.Http):
    def _conn_request(self, conn, request_uri, method, body, headers):
        """Customized response code for Windmill."""
        for i in range(2):
            try:
                conn.request(method, request_uri, body, headers)
            except socket.gaierror:
                conn.close()
                raise httplib2.ServerNotFoundError("Unable to find the server at %s" % conn.host)
            except (socket.error, httplib.HTTPException):
                # Just because the server closed the connection doesn't apparently mean
                # that the server didn't send a response.
                pass
            try:
                response = conn.getresponse()
                response.conn = conn
            except (socket.error, httplib.HTTPException):
                if i == 0:
                    conn.close()
                    conn.connect()
                    continue
                else:
                    raise
            else:
                # Decompression was removed from this section as was HEAD request checks.
                resp = httplib2.Response(response)
                resp._response = response
            break
        # Since content is never checked in the rest of the httplib code we can safely return
        # our own windmill response class here.
        proxy_response = ProxyResponse(resp)
        return (resp, proxy_response)
    def request(self, uri, method="GET", body=None, headers=None, redirections=httplib2.DEFAULT_MAX_REDIRECTS, connection_type=None):
        """request handler with thread safety hacked in"""
        try:
            if headers is None:
                headers = {}
            else:
                headers = httplib2._normalize_headers(headers)

            if not headers.has_key('user-agent'):
                headers['user-agent'] = "Python-httplib2/%s" % httplib2.__version__

            uri = httplib2.iri2uri(uri)

            (scheme, authority, request_uri, defrag_uri) = httplib2.urlnorm(uri)
            domain_port = authority.split(":")[0:2]
            if len(domain_port) == 2 and domain_port[1] == '443' and scheme == 'http':
                scheme = 'https'
                authority = domain_port[0]

            conn_key = scheme+":"+authority
            
            def get_conn(conn_key):
                if conn_key in self.connections:
                    conn = self.connections[conn_key]
                    if type(conn) is list:
                        for c in conn:
                            if not getattr(c, 'busy', True):
                                return c
                    else: return c
                    if type(conn) is list:
                        return None
            
            conn = get_conn(conn_key)

            if conn is None:
                if not connection_type:
                    connection_type = (scheme == 'https') and httplib2.HTTPSConnectionWithTimeout or httplib2.HTTPConnectionWithTimeout
                certs = list(self.certificates.iter(authority))
                if scheme == 'https' and certs:
                    conn = connection_type(authority, key_file=certs[0][0],
                        cert_file=certs[0][1], timeout=self.timeout, proxy_info=self.proxy_info)
                    self.connections.setdefault(conn_key, []).append(conn)
                else:
                    conn = connection_type(authority, timeout=self.timeout, proxy_info=self.proxy_info)
                    self.connections.setdefault(conn_key, []).append(conn) 
                conn.set_debuglevel(httplib2.debuglevel)
            conn.busy = True
            if method in ["GET", "HEAD"] and 'range' not in headers and 'accept-encoding' not in headers:
                headers['accept-encoding'] = 'deflate, gzip'

            info = httplib2.email.Message.Message()
            cached_value = None
            if self.cache:
                cachekey = defrag_uri
                cached_value = self.cache.get(cachekey)
                if cached_value:
                    # info = email.message_from_string(cached_value)
                    #
                    # Need to replace the line above with the kludge below
                    # to fix the non-existent bug not fixed in this
                    # bug report: http://mail.python.org/pipermail/python-bugs-list/2005-September/030289.html
                    try:
                        info, content = cached_value.split('\r\n\r\n', 1)
                        feedparser = httplib2.email.FeedParser.FeedParser()
                        feedparser.feed(info)
                        info = feedparser.close()
                        feedparser._parse = None
                    except IndexError:
                        self.cache.delete(cachekey)
                        cachekey = None
                        cached_value = None
            else:
                cachekey = None

            if method in self.optimistic_concurrency_methods and self.cache and info.has_key('etag') and not self.ignore_etag and 'if-match' not in headers:
                # http://www.w3.org/1999/04/Editing/
                headers['if-match'] = info['etag']

            if method not in ["GET", "HEAD"] and self.cache and cachekey:
                # RFC 2616 Section 13.10
                self.cache.delete(cachekey)

            if cached_value and method in ["GET", "HEAD"] and self.cache and 'range' not in headers:
                if info.has_key('-x-permanent-redirect-url'):
                    # Should cached permanent redirects be counted in our redirection count? For now, yes.
                    (response, new_content) = self.request(info['-x-permanent-redirect-url'], "GET", headers = headers, redirections = redirections - 1)
                    response.previous = Response(info)
                    response.previous.fromcache = True
                else:
                    # Determine our course of action:
                    #   Is the cached entry fresh or stale?
                    #   Has the client requested a non-cached response?
                    #   
                    # There seems to be three possible answers: 
                    # 1. [FRESH] Return the cache entry w/o doing a GET
                    # 2. [STALE] Do the GET (but add in cache validators if available)
                    # 3. [TRANSPARENT] Do a GET w/o any cache validators (Cache-Control: no-cache) on the request
                    entry_disposition = httplib2._entry_disposition(info, headers) 

                    if entry_disposition == "FRESH":
                        if not cached_value:
                            info['status'] = '504'
                            content = ""
                        response = Response(info)
                        if cached_value:
                            response.fromcache = True
                        return (response, content)

                    if entry_disposition == "STALE":
                        if info.has_key('etag') and not self.ignore_etag and not 'if-none-match' in headers:
                            headers['if-none-match'] = info['etag']
                        if info.has_key('last-modified') and not 'last-modified' in headers:
                            headers['if-modified-since'] = info['last-modified']
                    elif entry_disposition == "TRANSPARENT":
                        pass

                    (response, new_content) = self._request(conn, authority, uri, request_uri, method, body, headers, redirections, cachekey)

                if response.status == 304 and method == "GET":
                    # Rewrite the cache entry with the new end-to-end headers
                    # Take all headers that are in response 
                    # and overwrite their values in info.
                    # unless they are hop-by-hop, or are listed in the connection header.

                    for key in httplib2._get_end2end_headers(response):
                        info[key] = response[key]
                    merged_response = Response(info)
                    if hasattr(response, "_stale_digest"):
                        merged_response._stale_digest = response._stale_digest
                    httplib2._updateCache(headers, merged_response, content, self.cache, cachekey)
                    response = merged_response
                    response.status = 200
                    response.fromcache = True 

                elif response.status == 200:
                    content = new_content
                else:
                    self.cache.delete(cachekey)
                    content = new_content 
            else: 
                cc = httplib2._parse_cache_control(headers)
                if cc.has_key('only-if-cached'):
                    info['status'] = '504'
                    response = Response(info)
                    content = ""
                else:
                    (response, content) = self._request(conn, authority, uri, request_uri, method, body, headers, redirections, cachekey)
        except Exception, e:
            if self.force_exception_to_status_code:
                if isinstance(e, httplib2.HttpLib2ErrorWithResponse):
                    response = e.response
                    content = e.content
                    response.status = 500
                    response.reason = str(e) 
                elif isinstance(e, socket.timeout):
                    content = "Request Timeout"
                    response = Response( {
                            "content-type": "text/plain",
                            "status": "408",
                            "content-length": len(content)
                            })
                    response.reason = "Request Timeout"
                else:
                    content = str(e) 
                    response = Response( {
                            "content-type": "text/plain",
                            "status": "400",
                            "content-length": len(content)
                            })
                    response.reason = "Bad Request" 
            else:
                raise


        return (response, content)

class ProxyClient(object):
    def __init__(self, fm):
        self.http = WindmillHttp()
        self.http.follow_redirects = False
        self.fm = fm

    def is_hop_by_hop(self, header):
      """check if the given header is hop_by_hop"""
      return hoppish_headers.has_key(header.lower())
    
    def clean_request_headers(self, request, host):
        headers = {}
        for key, value in request.headers.items():
            if '/windmill-serv' in value:
                value = value.split('/windmill-serv')[-1]
            if not self.is_hop_by_hop(key):
                headers[key] = value
        if 'host' not in headers:
            headers['host'] = request.environ['SERVER_NAME']   
    
    def set_response_headers(self, resp, response, request_host, proxy_host):
        # TODO: Cookie handler on headers
        for k in ['status', 'reason']:
            if k in resp: del resp[k]
        response.headers = [(k,v.replace(proxy_host, request_host),) for k,v in resp.items()]
    
    def make_request(self, request, host):
        uri = request.full_uri.replace(request.host, host, 1)
        headers = self.clean_request_headers(request, host)
        resp, response = self.http.request(uri, method=request.method, body=str(request.body),
                                           headers=headers)
        self.set_response_headers(resp, response, request.host, host)
        response.request = request
        return response
    

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
        self.forwarding_test_url = None
        
    @property
    def enabled(self):
        if self.forwarding_test_url is not None:
            return True
        else: return False
        
    def set_test_url(self, test_url):
        if test_url is None:
            self.forwarding_test_url = None
            self.test_url = None
            self.test_host = None
        else:
            self.forwarding_test_url = test_url
            self.test_url = urlparse(test_url)
            self.test_host = self.test_url.scheme+"://"+self.test_url.netloc
            # This is for reverse compat with old debugging
            import windmill
            windmill.settings['FORWARDING_TEST_URL'] = test_url     
    def is_mapped(self, request):
        if (request.full_uri in self.forward_map):
            return True
        if (request.environ.get('HTTP_REFERER', None) in self.forward_map):
            return True
        return False
    
    def get_forward_host(self, request):
        """Check if a request uri is in the forward map by uri and referer"""
        if request.full_uri in self.forward_map:
            return self.forward_map[request.full_uri]
        # Check referer, use tripple false tuple in case someone added a constant to 
        # the forward map
        if request.environ.get('HTTP_REFERER', (False, False, False)) in self.forward_map:
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
        if self.redirect_forms.has_key(request.full_uri):
            return True
        return False
        
    def form_forward(self, request):
        form = self.redirect_forms.pop(request.full_uri)
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
            result = condition(request, target_host, client_response, mapped)
            if result is not None:
                return result
        if mapped: g = 'mapped_'
        else: g = 'unmapped_' 
        if client_response.status in getattr(self, g+'response_pass_codes'):
            return True
        if client_response > getattr(self, g+'response_pass_threshold'):
            return False
        else:
            return True
            
    def get_retry_hosts(self, request):
        return self.forward_map.known_hosts(self.first_forward_hosts, self.exclude_from_retry)

class InitialForwardResponse(Response302):
    def __init__(self, uri):
        self.headers = cache_headers.items()
        super(InitialForwardResponse, self).__init__(uri)
    
class ProxyApplication(Application):
    def __init__(self):
        super(ProxyApplication, self).__init__()
        self.fm = ForwardingManager()
        self.client = ProxyClient(self.fm)
    
    def handler(self, request):
        if self.fm.enabled and self.fm.forwardable(request):
            if request.host != self.fm.test_host:
                # request host is not the same as the test host, we need to do an initial forward
                new_uri = self.fm.initial_forward(request)
                if hasattr(request.body, 'form'): # form objects are only created for http forms
                    self.fm.create_redirect_form(request, new_uri)
                logger.debug('Domain change, forwarded to ' + new_uri)
                return InitialForwardResponse(new_uri)
            elif self.fm.is_form_forward(request):
                form = self.fm.form_forward(request)
                response = HtmlResponse(form)
                response.headers += cache_additions
                return response

            # At this point we are 100% sure we will be needing to send a proxy request
            
            # If the host has been mapped by uri or referrer go with that
            target_host = self.fm.get_forward_host(request)
            if target_host is not None:
                targeted_client_response = self.client.make_request(request, target_host)
                if self.fm.response_conditions_pass(request, target_host, 
                                                    targeted_client_response, mapped=True):
                    return targeted_client_response
            else:
                targeted_client_response = None

            # Now we've hit the retry loop
            for host in self.fm.get_retry_hosts(request):
                client_response = self.client.make_request(request, host)
                if self.fm.response_conditions_pass(request, host, client_response, mapped=False):
                    return response

            # At this point all requests have failed
            if targeted_client_response:
                # If we had a mapped response return it even if it failed
                return targeted_client_response
            else:
                # If we don't even have a mapped response, return it form test host
                return self.client.make_request(request, request.host)

# 
# class IterativeResponse(object):
