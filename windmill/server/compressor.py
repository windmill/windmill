import os
import threading
from time import sleep

from webenv import Application, Response, Response404

import jsmin

class JavascriptResponse(Response):
    content_type = 'application/x-javascript'

class CompressorApplication(Application):
    """Full JavaScript Compression Library"""
    js_file_list = [
        ('lib', 'firebug', 'pi.js',),
        ('lib', 'firebug', 'firebug-lite.js',),
        ('lib', 'json2.js',),
        ('lib', 'browserdetect.js',),
        ('wm', 'windmill.js',),
        ('lib', 'getXPath.js',),
        ('lib', 'elementslib.js',),
        ('lib', 'js-xpath.js',),
        ('controller', 'controller.js',),
        ('controller', 'commands.js',),
        ('controller', 'asserts.js',),
        ('controller', 'waits.js',),
        ('wm', 'registry.js',),
        ('extensions', 'extensions.js',),
        ('wm', 'utils.js',),
        ('wm', 'ide', 'ui.js',),
        ('wm', 'ide', 'recorder.js',),
        ('wm', 'ide', 'remote.js',),
        ('wm', 'ide', 'dx.js',),
        ('wm', 'ide', 'ax.js',),
        ('wm', 'ide', 'results.js',),
        ('wm', 'xhr.js',),
        ('wm', 'metrics.js',),
        ('wm', 'events.js',),
        ('wm', 'global.js',),
        ('wm', 'jstest.js',),
        ('wm', 'load.js',),
    ]
    
    def __init__(self, js_path, enabled=True):
        self.enabled = enabled
        self.js_path = js_path
        self.compressed_windmill = None
        if enabled:
            self._thread = threading.Thread(target=self.compress_file)
            self._thread.start()
            
    def compress_file(self):
        compressed_windmill = ''
        for filename in self.js_file_list:
            compressed_windmill += jsmin.jsmin(open(os.path.join(self.js_path, *filename), 'r').read())
        self.compressed_windmill = compressed_windmill
        
    def handler(self, request, *path):
        if not self.enabled:
            return Response404()
        # if self.compressed_windmill is None:            
        #     self.compressed_windmill = ''
        #     for filename in self.js_file_list:
        #         self.compressed_windmill += jsmin.jsmin(open(os.path.join(self.js_path, *filename), 'r').read())
        
        while not self.compressed_windmill:
            sleep(.15)
            
        return JavascriptResponse(self.compressed_windmill)