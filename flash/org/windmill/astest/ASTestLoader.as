/*
Copyright 2009, Matthew Eernisse (mde@fleegix.org) and Slide, Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

package org.windmill.astest {
  import org.windmill.WMLogger;
  import flash.display.Loader;
  import flash.display.LoaderInfo;
  import flash.net.URLRequest;
  import flash.events.Event;
  import flash.events.ProgressEvent;
  import flash.events.IOErrorEvent;
  import flash.system.ApplicationDomain;
  import flash.system.SecurityDomain;
  import flash.system.LoaderContext;
  import flash.external.ExternalInterface;
  import flash.utils.getQualifiedClassName;

  public class ASTestLoader {
    private static var urls:Array = [];
    public static function load(u:Array):void {
      urls = u;
      loadNext();
    }
    private static function loadNext():void {
      if (urls.length == 0) {
        ASTest.run();
      }
      else {
        var loader:Loader = new Loader();
        var url:String = urls.shift();
        var req:URLRequest = new URLRequest(url);
        // checkPolicyFile is true so it knows to grab the crossdomain.xml
        // for wherever it's grabbing tests from
        // Need to spoon-feed it the ApplicationDomain and SecurityDomain
        // so it knows to load the test SWFs in the the current app context
        var ctxt:LoaderContext = new LoaderContext(true,
            ApplicationDomain.currentDomain,
            SecurityDomain.currentDomain);
        // Catch any error that occurs during async load
        loader.contentLoaderInfo.addEventListener(
            IOErrorEvent.IO_ERROR, function (e:IOErrorEvent):void {
          WMLogger.log('Could not load ' + url);
        });
        // Handle successful load
        loader.contentLoaderInfo.addEventListener(
            Event.COMPLETE, function (e:Event):void {
          var li:LoaderInfo = e.target as LoaderInfo;
          var className:String = getQualifiedClassName(li.loader.content);
          var c:Class = ApplicationDomain.currentDomain.getDefinition(
              className) as Class;
          ASTest.testClassList.push({
            className: className,
            classDescription: c,
            instance: new c()
          });
          loader.unload();
          loadNext();
        });
        loader.load(req, ctxt);
      }
    }
  }
}


