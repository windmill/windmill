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

package org.windmill {
  import flash.display.Loader;
  import flash.net.URLRequest;
  import flash.events.Event;
  import flash.system.ApplicationDomain;
  import flash.system.SecurityDomain;
  import flash.system.LoaderContext;

  public class WMBootstrap {
    public static var windmillLibPath:String = '/flash/org/windmill/Windmill.swf';
    public static var wm:*;
    public static function init(context:*, domains:* = null):void {
      var loader:Loader = new Loader();
      var url:String = WMBootstrap.windmillLibPath;
      var req:URLRequest = new URLRequest(url);
      var con:LoaderContext = new LoaderContext(false,
          ApplicationDomain.currentDomain,
          SecurityDomain.currentDomain);
      loader.contentLoaderInfo.addEventListener(
          Event.COMPLETE, function ():void {
        wm = ApplicationDomain.currentDomain.getDefinition(
            "org.windmill.Windmill") as Class;
        wm.init({ context: context, domains: domains });
      });
      loader.load(req, con);
    }
  }
}

