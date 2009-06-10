#   Copyright (c) 2006-2007 Open Source Applications Foundation
#   Copyright (c) 2008-2009 Mikeal Rogers <mikeal.rogers@gmail.com>
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

import time

try:
    import IPython
    import __builtin__
    
    
    class IPyShell(IPython.iplib.InteractiveShell):
                
        def interact(self, banner=None):
            """Closely emulate the interactive Python console.

            The optional banner argument specify the banner to print
            before the first interaction; by default it prints a banner
            similar to the one printed by the real Python interpreter,
            followed by the current class name in parentheses (so as not
            to confuse this with the real interpreter -- since it's so
            close!).

            """
            cprt = 'Type "copyright", "credits" or "license" for more information.'
            if banner is None:
                self.write("Python %s on %s\n%s\n(%s)\n" %
                           (sys.version, sys.platform, cprt,
                            self.__class__.__name__))
            else:
                self.write(banner)

            more = 0

            # Mark activity in the builtins
            __builtin__.__dict__['__IPYTHON__active'] += 1

            # exit_now is set by a call to %Exit or %Quit
            self.exit_now = False
            while not self.exit_now:
                if more:
                    prompt = self.outputcache.prompt2
                    if self.autoindent:
                        self.readline_startup_hook(self.pre_readline)
                else:
                    prompt = self.outputcache.prompt1
                try:
                    line = self.raw_input(prompt,more)
                    if self.autoindent:
                        self.readline_startup_hook(None)
                except KeyboardInterrupt:
                    self.write('\nKeyboardInterrupt\n')
                    self.resetbuffer()
                    # keep cache in sync with the prompt counter:
                    self.outputcache.prompt_count -= 1

                    if self.autoindent:
                        self.indent_current_nsp = 0
                    more = 0
                except EOFError:
                    if self.autoindent:
                        self.readline_startup_hook(None)
                    self.write('\n')
                    while self.httpd_thread.isAlive():
                        self.httpd.stop()
                    self.exit()
                except bdb.BdbQuit:
                    warn('The Python debugger has exited with a BdbQuit exception.\n'
                         'Because of how pdb handles the stack, it is impossible\n'
                         'for IPython to properly format this particular exception.\n'
                         'IPython will resume normal operation.')
                except:
                    # exceptions here are VERY RARE, but they can be triggered
                    # asynchronously by signal handlers, for example.
                    self.showtraceback()
                else:
                    more = self.push(line)
                    if (self.SyntaxTB.last_syntax_error and
                        self.rc.autoedit_syntax):
                        self.edit_syntax_error()

            # We are off again...
            __builtin__.__dict__['__IPYTHON__active'] -= 1

except:
    
    import code


def make_shell():

    import run_server
    
    HTTPD, HTTPD_THREAD, loggers = run_server.main()
    
    import browser_tools
    import server_tools
    
    # Browser tests
    browser = browser_tools.setup_browser()
    print 'browser should be coming up'
    
    try:
        # try to use IPython if possible
        import IPython
        shell = IPython.Shell.IPShell(user_ns=locals(), shell_class=IPyShell)
        shell.mainloop()
    except:
        import code
        code.interact(local=locals())