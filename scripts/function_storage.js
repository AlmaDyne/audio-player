export { randomNumber, getScrollbarWidth, eventManager };

// Counting clicks
function countClick(i, elem) {
    if ((String(i).at(-1) === '2' || String(i).at(-1) === '3' || String(i).at(-1) === '4') && 
        String(i).at(-2) !== '1') {
            elem.innerHTML = `(Нажато ${i} раза)`;
    } else {
        elem.innerHTML = `(Нажато ${i} раз)`;
    }
}

//Shuffle array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

// Random number/integer
function randomNumber(min, max) {
    return min + Math.random() * (max - min);
}
function randomInteger(min, max) {
    let random = min + Math.random() * (max + 1 - min);
    return Math.floor(random);
}

// Scrollbar width
function getScrollbarWidth() {
    let div = document.createElement('div');
    div.style.overflowY = 'scroll';
    div.style.width = '50px';
    div.style.height = '50px';
    document.body.append(div);
    
    let scrollWidth = div.offsetWidth - div.clientWidth;

    div.remove();

    return scrollWidth;
}

// File extension
function getExtension(filename) {
    return filename.split('.').pop();
}

// Generation string ID
function generateRandomId(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Cookie
function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + "=([^;]*)"
    ));

    return matches ? decodeURIComponent(matches[1]) : undefined;
}
function setCookie(name, value, options = {}) {
    // Example: setCookie('user', 'John', {secure: true, 'max-age': 3600});
    options = {
        path: '/',
      ...options
    };

    if (options.expires instanceof Date) {
        options.expires = options.expires.toUTCString();
    }

    let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

    for (let optionKey in options) {
        updatedCookie += "; " + optionKey;
        let optionValue = options[optionKey];
        if (optionValue !== true) {
            updatedCookie += "=" + optionValue;
        }
    }

    document.cookie = updatedCookie;
}
function deleteCookie(name) {
    setCookie(name, "", {
        'max-age': -1
    })
}

// An object for managing the addition and automatic removal of one-time event listeners
const eventManager = {
    eventTypesByElement: new Map(),
    
    addOnceEventListener(element, eventType, handler) {
        let handlerName = handler.name;
        let handlersByEventType = this.eventTypesByElement.get(element);

        if (!handlersByEventType) {
            handlersByEventType = new Map();
            this.eventTypesByElement.set(element, handlersByEventType);
        }
        
        let handlers = handlersByEventType.get(eventType);

        if (!handlers) {
            handlers = new Map();
            handlersByEventType.set(eventType, handlers);
        }
        
        if (!handlers.has(handlerName)) {
            if (!handlerName) { // Auto naming of an anonymous handler
                let anonHandlerNumbers = Array
                    .from(handlers.keys())
                    .filter(key => key.startsWith('anonHandler'))
                    .map(key => Number(key.match(/anonHandler(\d+)/)[1]))
                    .sort((a, b) => a - b)
                ;

                handlerName = anonHandlerNumbers.length ?
                    `anonHandler${++anonHandlerNumbers[anonHandlerNumbers.length - 1]}` :
                    'anonHandler1'
                ;
            }

            let handleAndRemove = (function(event) {
                if (element !== window && element !== document && element !== event.target) return;

                handler.call(element, event);
                this.removeOnceEventListener(element, eventType, handlerName);
            }).bind(this);

            handlers.set(handlerName, handleAndRemove);
            
            element.addEventListener(eventType, handleAndRemove);
        }
    },
    
    removeOnceEventListener(element, eventType, handlerName) {
        let handlersByEventType = this.eventTypesByElement.get(element);

        if (handlersByEventType) {
            let handlers = handlersByEventType.get(eventType);
            
            if (handlers && handlers.has(handlerName)) {
                let handler = handlers.get(handlerName);

                handlers.delete(handlerName);
                if (!handlers.size) handlersByEventType.delete(eventType);
                if (!handlersByEventType.size) this.eventTypesByElement.delete(element);

                element.removeEventListener(eventType, handler);
            }
        }
    },

    clearEventHandlers(element, ...eventTypes) {
        let handlersByEventType = this.eventTypesByElement.get(element);
        if (!handlersByEventType) return;
        
        if (eventTypes.length) {
            eventTypes.forEach(eventType => {
                if (handlersByEventType.has(eventType)) {
                    removeEventTypeHandlers(this, handlersByEventType, eventType);
                }
            });
        } else {
            for (let eventType of handlersByEventType.keys()) {
                removeEventTypeHandlers(this, handlersByEventType, eventType);
            }
        }

        function removeEventTypeHandlers(eventManager, handlersByEventType, eventType) {
            let handlers = handlersByEventType.get(eventType);
                    
            for (let handler of handlers.values()) {
                element.removeEventListener(eventType, handler);
            }
            
            handlersByEventType.delete(eventType);
            if (!handlersByEventType.size) eventManager.eventTypesByElement.delete(element);
        }
    }
};
