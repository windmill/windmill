//All the functionaly relating to launching events in javascript
//Windmill.Events.*

function Events() {
    
    // Returns the text in this element
    this.getText = function(element) {
        var text = "";

        var isRecentFirefox = (Windmill.Browser.isMozilla);
        if (isRecentFirefox || Windmill.Browser.isKonqueror || Windmill.Browser.isSafari || Windmill.Browser.isOpera) {
            text = Windmill.Events.getTextContent(element);
        } else if (element.textContent) {
            text = element.textContent;
        } else if (element.innerText) {
            text = element.innerText;
        }

        text = normalizeNewlines(text);
        text = normalizeSpaces(text);

        return text.trim();
    }

    this.getTextContent = function(element, preformatted) {
        if (element.nodeType == 3 /*Node.TEXT_NODE*/) {
            var text = element.data;
            if (!preformatted) {
                text = text.replace(/\n|\r|\t/g, " ");
            }
            return text;
        }
        if (element.nodeType == 1 /*Node.ELEMENT_NODE*/) {
            var childrenPreformatted = preformatted || (element.tagName == "PRE");
            var text = "";
            for (var i = 0; i < element.childNodes.length; i++) {
                var child = element.childNodes.item(i);
                text += Windmill.Events.getTextContent(child, childrenPreformatted);
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
    }


    this.createEventObject = function(element, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown) {
         var evt = element.ownerDocument.createEventObject();
         evt.shiftKey = shiftKeyDown;
         evt.metaKey = metaKeyDown;
         evt.altKey = altKeyDown;
         evt.ctrlKey = controlKeyDown;
         return evt;
    }
    
    /* Fire an event in a browser-compatible manner */
    this.triggerEvent = function(element, eventType, canBubble, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown) {

        canBubble = (typeof(canBubble) == undefined) ? true : canBubble;
        if (element.fireEvent) {
            //alert(eventType)
            var evt = Windmill.Events.createEventObject(element, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown);        
            element.fireEvent('on' + eventType, evt);
            //Fix for IE6-- this does work but isn't needed the bug was in the type function
            //eval("element." + eventType + "();");
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
    }
    
    /* Fire a mouse event in a browser-compatible manner */
    this.triggerMouseEvent = function(element, eventType, canBubble, clientX, clientY, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown) {
        clientX = clientX ? clientX : 0;
        clientY = clientY ? clientY : 0;

        //LOG.warn("Windmill.Events.triggerMouseEvent assumes setting screenX and screenY to 0 is ok");
        var screenX = 0;
        var screenY = 0;

        canBubble = (typeof(canBubble) == undefined) ? true : canBubble;

        if (element.fireEvent) {
            //LOG.info("element has fireEvent");

            var evt = Windmill.Events.createEventObject(element, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown);
            evt.detail = 0;
            evt.button = 1;
            evt.relatedTarget = null;
            if (!screenX && !screenY && !clientX && !clientY) {
                //element.click();
                if(eventType == "click"){
                    element.click();
                }
                element.fireEvent('on' + eventType);
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
                try {
                    window.event = evt;
                }
                catch(e) {
                    // getting an "Object does not support this action or property" error.  Save the event away
                    // for future reference.
                    // TODO: is there a way to update window.event?

                    // work around for http://jira.openqa.org/browse/SEL-280 -- make the event available somewhere:
                    //selenium.browserbot.getCurrentWindow().selenium_event = evt;
                }

                element.fireEvent('on' + eventType, evt);
            }
        }
        else {

            //LOG.info("element doesn't have fireEvent");
            var evt = document.createEvent('MouseEvents');
            if (evt.initMouseEvent)
            {
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