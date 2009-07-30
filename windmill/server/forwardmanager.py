#   Copyright (c) 2009 Canonical Ltd.
#   Copyright (c) 2009 Mikeal Rogers <mikeal.rogers@gmail.com>
#   Copyright (c) 2009 Domen Kozar <domen@dev.si>
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
#
#   Contributor: Anthony Lenton <anthony.lenton@canonical.com>

import proxy
import time
import sys
if not sys.version.startswith('2.4'):
    from urlparse import urlparse
else:
    # python 2.4
    from windmill.tools.urlparse_25 import urlparse

def normalize(scheme, netloc):
    if scheme == '':
        scheme = 'http'
    if scheme == 'https' and netloc.endswith(':443'):
        netloc = netloc[:-4]
    if scheme == 'http' and netloc.endswith(':80'):
        netloc = netloc[:-3]
    return scheme, netloc

def urlmatch(a, b):
    """ Returns True if urls a and b use the same scheme, netloc and port """
    return normalize(a.scheme, a.netloc) == normalize(b.scheme, b.netloc)

class ForwardManager(object):
    """ Handles and remembers forwarded domains, maps and unmaps urls and
        modifies environment variables and cookies so they work. """

    def __init__(self, base_url):
        self.forwarded = {} # Maps str->tuple(str,str) forwarded URL-> original scheme, netloc
        self.static = {} # Maps str->tuple(str,str)
        parsed_url = urlparse(base_url)
        self.base_url = "%s://%s" % (parsed_url.scheme, parsed_url.netloc)
        self.cookies = {parsed_url.netloc: {}}

    def forward_map(self, url):
        """ Return a ParseResult useful after forwarding """
        path = url.path
        if path.startswith('/'):
            path = path.lstrip('/')
        redirect_url = "%s/%s" % (self.base_url, path)
        if url.query:
            redirect_url += "?" + url.query
        return urlparse(redirect_url)

    def forward_unmap(self, url):
        """ Return a ParseResult for the unforwarded URL """
        if not self.is_forward_mapped(url):
            return None
        scheme, netloc = self.forwarded[url.geturl()]
        path = url.path
        if path.startswith('/'):
            path = path.lstrip('/')
        orig_url = "%s://%s/%s" % (scheme, netloc, path)
        if len(url.query) > 0:
            orig_url += "?" + url.query
        return urlparse(orig_url)

    def is_forward_mapped(self, url):
        return url.geturl() in self.forwarded

    def is_static_forwarded(self, url):
        return url.netloc in self.static

    def change_environ_domain(self, srcUrl, dstUrl, environ):
        """ """
        newEnv = environ.copy()
        dst_host = "%s://%s" % (dstUrl.scheme, dstUrl.netloc)
        src_host = "%s://%s" % (srcUrl.scheme, srcUrl.netloc)
        for key in newEnv:
            if type(newEnv[key]) is str:
                if src_host in newEnv[key]:
                    newEnv[key] = newEnv[key].replace(src_host, dst_host)
                elif srcUrl.netloc in newEnv[key]:
                    newEnv[key] = newEnv[key].replace(srcUrl.netloc, dstUrl.netloc)
                elif srcUrl.scheme in ['http', 'https'] and srcUrl.scheme == newEnv[key]:
                    newEnv[key] = dstUrl.scheme
        self.set_cookies(dstUrl.netloc, environ)
        return newEnv

    def forward(self, url, environ):
        if self.is_static_forwarded(url):
            fwdurl = url.geturl().replace(url.netloc, self.static[url.netloc])
        else:
            fwdurl = self.forward_map(url).geturl()

        origdata = normalize(url.scheme, url.netloc)
        self.forwarded[fwdurl] = origdata
        newEnv = self.change_environ_domain(url, urlparse(fwdurl), environ)
        return newEnv

    def known_hosts(self):
        def split(domain):
            if not domain.startswith('http'):
                return 'http', domain
            else:
                return tuple(domain.split('://'))
                
        def getDomains(domain_list):
            result = []
            for domain in domain_list:
                if not domain.startswith('http'):
                    result.append(('http', domain,))
                    result.append(('https', domain,))
                else:
                    result.append(tuple(domain.split('://')))
            return result
        first = getDomains(proxy.first_forward_domains)
        exclude = getDomains(proxy.exclude_from_retry)
        forwarded = list(set(self.forwarded.values()))
        result = list(urlparse("%s://%s/" % host)
                      for host in first + forwarded
                      if not host in exclude)
        return result

    def forward_to(self, url, host):
        forwarded_url = "%s://%s%s" % (host.scheme, host.netloc, url.path)
        if url.query:
            forwarded_url += "?" + url.query
        return urlparse(forwarded_url)

    def parse_headers(self, headers, domain):
        """ Store cookies for the given domain, or forget them if they're marked
            for expiration.  Then remove the cookie header, as it'll be
            incorrectly stored in the browser as corresponding to the test
            domain. """
        if domain not in self.cookies:
            self.cookies[domain] = {}
        for header in headers:
            key, value = header
            if key == 'set-cookie':
                cookiekey = None
                cookieval = None
                parts = value.split(';')
                expired = False
                dom = domain
                for part in parts:
                    token = [p.strip() for p in part.split('=', 1)]
                    if len(token) == 1:
                        continue
                    k, v = token
                    if cookiekey is None:
                        cookiekey = k
                        cookieval = v
                    elif k.lower() == 'domain':
                        dom = v
                    elif k.lower() == 'expires':
                        now = time.time()
                        formats = ['%a, %d-%b-%Y %H:%M:%S GMT',
                                   '%a, %d %b %Y %H:%M:%S GMT',
                                   '%a, %d-%b-%y %H:%M:%S GMT',
                                   '%a, %d %b %y %H:%M:%S GMT']
                        found = False
                        for f in formats:
                            try:
                                expires = time.strptime(v, f)
                                found = True
                                break
                            except ValueError:
                                pass # Continue with next format
                        if found and time.time() > time.mktime(expires):
                            expired = True
                if not dom in self.cookies:
                    self.cookies[dom] = {}
                if expired:
                    if cookiekey in self.cookies[dom]:
                        del self.cookies[dom][cookiekey]
                else:
                    self.cookies[dom][cookiekey] = cookieval

    def cookies_for(self, domain):
        cookies = []
        for d in self.cookies:
            if domain.endswith(d):
                cookies += ["%s=%s" % c for c in self.cookies[d].items()]
        result = '; '.join(cookies)
        return result

    def set_cookies(self, domain, environ):
        return # Remove this line to enable cookie handling
        environ['HTTP_COOKIE'] = self.cookies_for(domain)
        if len(environ['HTTP_COOKIE']) == 0:
            del environ['HTTP_COOKIE']

    def clear(self):
        self.forwarded = {}
        

if __name__ == '__main__':
    import unittest
    class TestManager(unittest.TestCase):
        def setUp(self):
            self.aUrl = urlparse('http://otherurl/bla')
            self.bUrl = urlparse('https://testurl/yadda')
            self.cUrl = urlparse('https://otherurl/foobar')
            self.dUrl = urlparse('https://otherurl:8000/foobar')
            self.eUrl = urlparse('http://testurl/forwarded')
            proxy.first_forward_domains = []
            proxy.exclude_from_retry = []

        def testStaticMap(self):
            mgr = ForwardManager('http://testurl/')
            self.assertFalse(mgr.is_static_forwarded(self.aUrl))
            mgr.static['otherurl'] = ('http', 'testurl')
            self.assertTrue(mgr.is_static_forwarded(self.aUrl))

        def testForwardMap(self):
            mgr = ForwardManager('http://testurl/')
            expected = urlparse('http://testurl/bla')
            self.assertEquals(expected, mgr.forward_map(self.aUrl))
            expected = urlparse('http://testurl/yadda')
            self.assertEquals(expected, mgr.forward_map(self.bUrl))
            expected = urlparse('http://testurl/foobar')
            self.assertEquals(expected, mgr.forward_map(self.cUrl))
            expected = urlparse('http://testurl/foobar')
            self.assertEquals(expected, mgr.forward_map(self.dUrl))
            

        def testUnmapEnviron(self):
            testEnv = {'HTTP_ACCEPT': 'text/html,application/xhtml+xml',
                       'CONTENT_TYPE': 'text/plain',
                       'SCRIPT_NAME': '',
                       'REQUEST_METHOD': 'GET',
                       'HTTP_HOST': 'testurl',
                       'PATH_INFO': 'http://testurl/bla/',
                       'SERVER_PROTOCOL': 'HTTP/1.1',
                       'QUERY_STRING': '',
                       'CONTENT_LENGTH': '',
                       'HTTP_ACCEPT_CHARSET': 'ISO-8859-1,utf-8;q=0.7,*;q=0.7',
                       'reconstructed_url': 'http://testurl/bla/',
                       'SERVER_NAME': '127.0.0.1',
                       'GATEWAY_INTERFACE': 'CGI/1.1',
                       'HTTP_PROXY_CONNECTION': 'keep-alive',
                       'REMOTE_ADDR': '127.0.0.1',
                       'HTTP_ACCEPT_LANGUAGE': 'en-gb,en;q=0.5',
                       'wsgi.url_scheme': 'http',
                       'SERVER_PORT': 4444,
                       'REMOTE_HOST': '127.0.0.1',
                       'HTTP_ACCEPT_ENCODING': 'gzip,deflate',
                       'HTTP_KEEP_ALIVE': '300'}
            origUrl = urlparse('https://otherurl/bla/')
            mgr = ForwardManager('http://testurl/')
            newEnv = mgr.change_environ_domain(mgr.forward_map(origUrl), origUrl, testEnv)
            self.assertEquals(newEnv['PATH_INFO'], 'https://otherurl/bla/')
            self.assertEquals(newEnv['HTTP_HOST'], 'otherurl')
            self.assertEquals(newEnv['reconstructed_url'], 'https://otherurl/bla/')
            self.assertEquals(newEnv['wsgi.url_scheme'], 'https')

        def testMapEnviron(self):
            testEnv = {'HTTP_ACCEPT': 'text/html,application/xhtml+xml',
                       'CONTENT_TYPE': 'text/plain',
                       'SCRIPT_NAME': '',
                       'REQUEST_METHOD': 'GET',
                       'HTTP_HOST': 'otherurl',
                       'PATH_INFO': 'https://otherurl/bla/',
                       'SERVER_PROTOCOL': 'HTTP/1.1',
                       'QUERY_STRING': '',
                       'CONTENT_LENGTH': '',
                       'HTTP_ACCEPT_CHARSET': 'ISO-8859-1,utf-8;q=0.7,*;q=0.7',
                       'reconstructed_url': 'https://otherurl/bla/',
                       'SERVER_NAME': '127.0.0.1',
                       'GATEWAY_INTERFACE': 'CGI/1.1',
                       'HTTP_PROXY_CONNECTION': 'keep-alive',
                       'REMOTE_ADDR': '127.0.0.1',
                       'HTTP_ACCEPT_LANGUAGE': 'en-gb,en;q=0.5',
                       'wsgi.url_scheme': 'https',
                       'SERVER_PORT': 4444,
                       'REMOTE_HOST': '127.0.0.1',
                       'HTTP_ACCEPT_ENCODING': 'gzip,deflate',
                       'HTTP_KEEP_ALIVE': '300'}
            fwdUrl = urlparse('http://testurl/bla/')
            origUrl = urlparse('https://otherurl/bla/')
            mgr = ForwardManager('http://testurl/')
            newEnv = mgr.change_environ_domain(origUrl, fwdUrl, testEnv)
            self.assertEquals(newEnv['PATH_INFO'], 'http://testurl/bla/')
            self.assertEquals(newEnv['HTTP_HOST'], 'testurl')
            self.assertEquals(newEnv['reconstructed_url'], 'http://testurl/bla/')
            self.assertEquals(newEnv['wsgi.url_scheme'], 'http')

        def testUnmap(self):
            mgr = ForwardManager('http://testurl/')
            orig_url = urlparse('http://otherurl/bla')
            mgr.forward(orig_url, {})
            result = mgr.forward_unmap(urlparse('http://testurl/bla'))
            self.assertEquals(orig_url, result)

        def testForward(self):
            testEnv = {'HTTP_ACCEPT': 'text/html,application/xhtml+xml',
                       'CONTENT_TYPE': 'text/plain',
                       'SCRIPT_NAME': '',
                       'REQUEST_METHOD': 'GET',
                       'HTTP_HOST': 'otherurl',
                       'PATH_INFO': 'https://otherurl/bla/',
                       'SERVER_PROTOCOL': 'HTTP/1.1',
                       'QUERY_STRING': '',
                       'CONTENT_LENGTH': '',
                       'HTTP_ACCEPT_CHARSET': 'ISO-8859-1,utf-8;q=0.7,*;q=0.7',
                       'reconstructed_url': 'https://otherurl/bla/',
                       'SERVER_NAME': '127.0.0.1',
                       'GATEWAY_INTERFACE': 'CGI/1.1',
                       'HTTP_PROXY_CONNECTION': 'keep-alive',
                       'REMOTE_ADDR': '127.0.0.1',
                       'HTTP_ACCEPT_LANGUAGE': 'en-gb,en;q=0.5',
                       'wsgi.url_scheme': 'https',
                       'SERVER_PORT': 4444,
                       'REMOTE_HOST': '127.0.0.1',
                       'HTTP_ACCEPT_ENCODING': 'gzip,deflate',
                       'HTTP_KEEP_ALIVE': '300'}
            fwdUrl = urlparse('http://testurl/bla/')
            origUrl = urlparse('https://otherurl/bla/')
            mgr = ForwardManager('http://testurl/')
            newEnv = mgr.forward(origUrl, testEnv)
            newUrl = mgr.forward_map(origUrl)
            self.assertEquals(newEnv['PATH_INFO'], 'http://testurl/bla/')
            self.assertEquals(newEnv['HTTP_HOST'], 'testurl')
            self.assertEquals(newEnv['reconstructed_url'], 'http://testurl/bla/')
            self.assertEquals(newEnv['wsgi.url_scheme'], 'http')
            self.assertEquals(newUrl, fwdUrl)
            self.assertTrue(mgr.is_forward_mapped(newUrl))

        def testForwardTo(self):
            mgr = ForwardManager('http://testurl/')
            self.assertEquals(urlparse("http://otherurl/forwarded"), mgr.forward_to(self.eUrl, self.aUrl))

        def testForwardToDoesntDropQuery(self):
            mgr = ForwardManager('http://testurl/')
            query_url = urlparse("https://something/forwarded?foo=bar")
            self.assertEquals(urlparse("http://otherurl/forwarded?foo=bar"),
                              mgr.forward_to(query_url, self.aUrl))
        def testForwardMapDoesntDropQuery(self):
            mgr = ForwardManager('http://testurl/')
            query_url = urlparse("https://something/forwarded?foo=bar")
            self.assertEquals(urlparse("http://testurl/forwarded?foo=bar"),
                              mgr.forward_map(query_url))

        def testTestSiteWithPathDoesntBreakRedirects(self):
            mgr = ForwardManager('http://testurl/path/')
            fwdUrl = urlparse('http://testurl/bla/')
            origUrl = urlparse('https://otherurl/bla/')
            mgr.forward(origUrl, {})
            newUrl = mgr.forward_map(origUrl)
            self.assertEquals(newUrl, fwdUrl)

        def testClear(self):
            mgr = ForwardManager('http://testurl/path/')
            origUrl = urlparse('https://otherurl/bla/')
            fwdUrl = mgr.forward_map(origUrl)
            mgr.forward(origUrl, {})
            self.assertTrue(mgr.is_forward_mapped(fwdUrl))
            mgr.clear()
            self.assertFalse(mgr.is_forward_mapped(fwdUrl))

        def testFirstForwardDomains(self):
            proxy.first_forward_domains.append('goodurl.com')
            proxy.first_forward_domains.append('https://greaturl.com')
            mgr = ForwardManager('http://testurl/path/')
            first = urlparse('http://goodurl.com/')
            self.assertTrue(first in mgr.known_hosts())
            second = urlparse('https://greaturl.com/')
            self.assertTrue(second in mgr.known_hosts())
            # Check that they're reported in order
            hosts = mgr.known_hosts()
            self.assertTrue(hosts.index(first) < hosts.index(second))

        def testExcludeFromRetry(self):
            proxy.exclude_from_retry.append('badurl.com')
            mgr = ForwardManager('http://testurl/path/')
            mgr.forward(self.aUrl, {})
            mgr.forward(urlparse('http://badurl.com/sarasa'), {})
            self.assertTrue(len(mgr.known_hosts()) == 1)

        def testExcludeTakesPrecedence(self):
            """ Test that exclude_from_retry takes precedence over
                first_forward_domains -- i.e. if a domain is added to both
                lists, it's *not* reported in known_hosts
            """
            proxy.first_forward_domains.append('goodurl.com')
            proxy.exclude_from_retry.append('goodurl.com')
            mgr = ForwardManager('http://testurl/path/')
            self.assertTrue(len(mgr.known_hosts()) == 0)

        def testParseCookies(self):
            headers = [('server', ' '), ('cache-control', ' no-cache'),
                       ('content-encoding', ' gzip'),
                       ('set-cookie', ' a=42; path=/; secure'),
                       ('set-cookie', ' b=test; path=/; secure'),
                       ('set-cookie', ' c=1; domain=.b.c; path=/'),
                       ('set-cookie', ' e=1; path=/'),
                       ('set-cookie', ' f=0; path=/; secure'),
                       ('set-cookie', ' g=Nj; domain=.c; path=/;'),
                       ('content-type', ' text/html'),
                       ('content-length', ' 510'),
                       ('date', ' sarasa')]
            mgr = ForwardManager('http://testurl/path/')
            mgr.parse_headers(headers, 'a.b.c')
            self.assertEquals('g=Nj; a=42; b=test; e=1; f=0; c=1',
                              mgr.cookies_for('a.b.c'))
            headers = [('set-cookie', 'e=; expires=Thu, 01-Dec-1994 16:00:00 GMT'),
                       ('set-cookie', 'a=; expires=Thu, 01 Dec 1994 16:00:00 GMT'),
                      ]
            mgr.parse_headers(headers, 'a.b.c')
            self.assertEquals('g=Nj; b=test; f=0; c=1',
                              mgr.cookies_for('a.b.c'))
    unittest.main()

