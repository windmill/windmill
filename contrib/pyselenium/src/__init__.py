#   Copyright 2006 ThoughtWorks, Inc.
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

import httplib, urllib, re

class DoWrapper(object):
    """Wrapper around selenium.do_command"""
    def __init__(self, method, name):
        self.method = method
        self.name = name
    
    def __call__(self, *args, **kwargs):
        """Here we do the dynamic method generation for all selenium js methods. 
        This is particularly nice since it means the selenese api is OneToOne with the 
        python api."""
        
        args = list(args)
        for key, arg in kwargs.items():
            args.append('%s=%s' % (key, arg))
        self.method(self.name, args)

class Selenium(object):
    """Defines an object that runs Selenium commands."""

    def __init__(self, host, port, browserStartCommand, browserURL):
        self.host = host
        self.port = port
        self.browserStartCommand = browserStartCommand
        self.browserURL = browserURL
        self.sessionId = None
        
    def __getattr__(self, name):
        """Any method that isn't in the instances dictionary should be assumed to be a
        selenese method"""
        do_wrapper = DoWrapper(self.do_command, name)
        return do_wrapper

    def start(self):
        result = self.get_string("getNewBrowserSession", [self.browserStartCommand, self.browserURL])
        try:
            self.sessionId = long(result)
        except ValueError:
            raise Exception, result
        
    def stop(self):
        self.do_command("testComplete", [])
        self.sessionId = None

    def do_command(self, verb, args):
        conn = httplib.HTTPConnection(self.host, self.port)
        commandString = u'/selenium-server/driver/?cmd=' + urllib.quote_plus(unicode(verb).encode('utf-8'))
        for i in range(len(args)):
            commandString = commandString + '&' + unicode(i+1) + '=' + urllib.quote_plus(unicode(args[i]).encode('utf-8'))
        if (None != self.sessionId):
            commandString = commandString + "&sessionId=" + unicode(self.sessionId)
        conn.request("GET", commandString)
    
        response = conn.getresponse()
        #print response.status, response.reason
        data = unicode(response.read(), "UTF-8")
        result = response.reason
        #print "Selenium Result: " + repr(data) + "\n\n"
        if (not data.startswith('OK')):
            raise Exception, data
        return data
    
    def get_string(self, verb, args):
        result = self.do_command(verb, args)
        return result[3:]
    
    def get_string_array(self, verb, args):
        csv = self.get_string(verb, args)
        token = ""
        tokens = []
        for i in range(len(csv)):
            letter = csv[i]
            if (letter == '\\'):
                i = i + 1
                letter = csv[i]
                token = token + letter
            elif (letter == ','):
                tokens.append(token)
                token = ""
            else:
                token = token + letter
        tokens.append(token)
        return tokens

    def get_number(self, verb, args):
        # Is there something I need to do here?
        return self.get_string(verb, args)
    
    def get_number_array(self, verb, args):
        # Is there something I need to do here?
        return self.get_string_array(verb, args)

    def get_boolean(self, verb, args):
        boolstr = self.get_string(verb, args)
        if ("true" == boolstr):
            return True
        if ("false" == boolstr):
            return False
        raise ValueError, "result is neither 'true' nor 'false': " + boolstr
    
    def get_boolean_array(self, verb, args):
        boolarr = self.get_string_array(verb, args)
        for i in range(len(boolarr)):
            if ("true" == boolstr):
                boolarr[i] = True
                continue
            if ("false" == boolstr):
                boolarr[i] = False
                continue
            raise ValueError, "result is neither 'true' nor 'false': " + boolarr[i]
        return boolarr
