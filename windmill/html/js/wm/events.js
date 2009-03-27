/*
Copyright 2006-2007, Open Source Applications Foundation

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

//All the functionaly relating to launching events in javascript
//windmill.events.*
windmill.events = new function() {

    // Returns the text in this element
    this.getText = function(element) {
      var text = "";

      var isRecentFirefox = (browser.isMozilla);
      if (isRecentFirefox || browser.isKonqueror || browser.isSafari || browser.isOpera) {
        text = windmill.events.getTextContent(element);
      } 
      else if (element.textContent) { text = element.textContent; } 
      else if (element.innerText) { text = element.innerText; }

      text = windmill.helpers.normalizeNewlines(text);
      text = windmill.helpers.normalizeSpaces(text);
      return text.trim();
    };

    this.getTextContent = function(element, preformatted) {
        if (element.nodeType == 3
        /*Node.TEXT_NODE*/
        ) {
            var text = element.data;
            if (!preformatted) {
                text = text.replace(/\n|\r|\t/g, " ");

            }
            return text;

        }
        if (element.nodeType == 1
        /*Node.ELEMENT_NODE*/
        ) {

            var childrenPreformatted = preformatted || (element.tagName == "PRE");
            var text = "";
            for (var i = 0; i < element.childNodes.length; i++) {
                var child = element.childNodes.item(i);
                text += windmill.events.getTextContent(child, childrenPreformatted);

            }
            // Handle block elements that introduce newlines
            // -- From HTML spec:
            //<!ENTITY % block
            //     "P | %heading; | %list; | %preformatted; | DL | DIV | NOSCRIPT |
            //      BLOCKQUOTE | F:wORM | HR | TABLE | FIELDSET | ADDRESS">
            //
            // TODO: should potentially introduce multiple newlines to separate blocks
            if (element.tagName == "P" || element.tagName == "BR" || element.tagName == "HR" || element.tagName == "DIV") {
                text += "\n";

            }
            return text;

        }
        return '';

    };

    this.createEventObject = function(element, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown) {
        var evt = element.ownerDocument.createEventObject();
        evt.shiftKey = shiftKeyDown;
        evt.metaKey = metaKeyDown;
        evt.altKey = altKeyDown;
        evt.ctrlKey = controlKeyDown;
        return evt;

    };


    /* Fire an event in a browser-compatible manner */
    this.triggerEvent = function(element, eventType, canBubble, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown) {

        canBubble = (typeof(canBubble) == undefined) ? true: canBubble;
        if (element.fireEvent && windmill.browser.isIE) {
            var evt = windmill.events.createEventObject(element, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown);
            element.fireEvent('on' + eventType, evt);
        }
        else {
            var evt = document.createEvent('HTMLEvents');

            evt.shiftKey = shiftKeyDown;
            evt.metaKey = metaKeyDown;
            evt.altKey = altKeyDown;
            evt.ctrlKey = controlKeyDown;

            evt.initEvent(eventType, canBubble, true);
            element.dispatchEvent(evt);

        }

    };

    this.getKeyCodeFromKeySequence = function(keySequence) {
        var match = /^\\(\d{1,3})$/.exec(keySequence);
        if (match != null) {
            return match[1];

        }
        match = /^.$/.exec(keySequence);
        if (match != null) {
            return match[0].charCodeAt(0);

        }
        // this is for backward compatibility with existing tests
        // 1 digit ascii codes will break however because they are used for the digit chars
        match = /^\d{2,3}$/.exec(keySequence);
        if (match != null) {
            return match[0];

        }
        windmill.err("invalid keySequence");

    }

    this.triggerKeyEvent = function(element, eventType, keySequence, canBubble, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown) {
        var keycode = windmill.events.getKeyCodeFromKeySequence(keySequence);
        canBubble = (typeof(canBubble) == undefined) ? true: canBubble;
        //Make sure we don't call fireEvent otuside of IE, mootools adds this to the prototype
        if (element.fireEvent && windmill.browser.isIE) {
            var keyEvent = windmill.events.createEventObject(element, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown);
            keyEvent.keyCode = keycode;
            element.fireEvent('on' + eventType, keyEvent);

        }
        else {
            var evt;
            if (window.KeyEvent) {
                evt = document.createEvent('KeyEvents');
                evt.initKeyEvent(eventType, true, true, window, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown, keycode, keycode);
            } 
            else {
                evt = document.createEvent('UIEvent');
                evt.shiftKey = shiftKeyDown;
                evt.metaKey = metaKeyDown;
                evt.altKey = altKeyDown;
                evt.ctrlKey = controlKeyDown;

                evt.initUIEvent(eventType, true, true, window, 1);
                evt.charCode = keycode;
                evt.keyCode = keycode;
                evt.which = keycode;
            }
            element.dispatchEvent(evt);
        }
    }

    /* Fire a mouse event in a browser-compatible manner */
    this.triggerMouseEvent = function(element, eventType, canBubble, clientX, clientY, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown) {
        clientX = clientX ? clientX: 0;
        clientY = clientY ? clientY: 0;

        //LOG.warn("windmill.events.triggerMouseEvent assumes setting screenX and screenY to 0 is ok");
        var screenX = 0;
        var screenY = 0;

        canBubble = (typeof(canBubble) == undefined) ? true: canBubble;

        if (element.fireEvent && windmill.browser.isIE) {
            //LOG.info("element has fireEvent");
            var evt = windmill.events.createEventObject(element, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown);
            evt.detail = 0;
            evt.button = 1;
            evt.relatedTarget = null;
            if (!screenX && !screenY && !clientX && !clientY) {
                //element.click();
                if (eventType == "click") { element.click(); }
                else { element.fireEvent('on' + eventType); }
                //eval("element." + eventType + "();");
            }
            else {
                evt.screenX = screenX;
                evt.screenY = screenY;
                evt.clientX = clientX;
                evt.clientY = clientY;

                // when we go this route, window.event is never set to contain the event we have just created.
                // ideally we could just slide it in as follows in the try-block below, but this normally
                // doesn't work.  This is why I try to avoid this code path, which is only required if we need to
                // set attributes on the event (e.g., clientX).
                try { windmill.testWin().event = evt; }
                catch(e) {
                    // getting an "Object does not support this action or property" error.  Save the event away
                    // for future reference.
                    // TODO: is there a way to update window.event?
                    // work around for http://jira.openqa.org/browse/SEL-280 -- make the event available somewhere:
                }
                element.fireEvent('on' + eventType, evt);

            }

        }
        else {
            //LOG.info("element doesn't have fireEvent");
            var evt = document.createEvent('MouseEvents');
            if (evt.initMouseEvent) {
                //LOG.info("element has initMouseEvent");
                //Safari
                evt.initMouseEvent(eventType, canBubble, true, document.defaultView, 1, screenX, screenY, clientX, clientY, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown, 0, null)

            }
            else {
                //LOG.warn("element doesn't have initMouseEvent; firing an event which should -- but doesn't -- have other mouse-event related attributes here, as well as controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown");
                evt.initEvent(eventType, canBubble, true);
                evt.shiftKey = shiftKeyDown;
                evt.metaKey = metaKeyDown;
                evt.altKey = altKeyDown;
                evt.ctrlKey = controlKeyDown;

            }
            //Used by safari
            element.dispatchEvent(evt);

        }

    }

};