(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
var getFormData = require(5), html = require(2), choo = require(3);
var app = choo();
app.use(logger);
app.route('/you', youView);
app.route('/you/sessions', sessionView);
app.mount('#main');
function youView(state, emit) {
    var which = window.location.hash.replace(/^#/, '');
    if (which.length > 0)
        location.href = '/' + which;
    return (function () {
      
      var ac = require(19)
      var bel0 = document.createElement("div")
bel0.setAttribute("class", "fl w-100")
ac(bel0, ["teaser view goes here."])
      return bel0
    }());
}
function sessionView(state, emit) {
    return (function () {
      
      var ac = require(19)
      var bel15 = document.createElement("div")
bel15.setAttribute("class", "fl w-100")
var bel14 = document.createElement("form")
bel14.setAttribute("action", "/signup")
bel14.setAttribute("method", "POST")
bel14.setAttribute("class", "pa4 ma4 black-80 bg-washed-blue")
var bel13 = document.createElement("div")
bel13.setAttribute("class", "measure-narrow ma4")
var bel0 = document.createElement("h3")
bel0.setAttribute("class", "w-80 mt3")
ac(bel0, ["Sign up"])
var bel1 = document.createElement("label")
bel1.setAttribute("for", "handle")
bel1.setAttribute("class", "f6 b db mb2")
ac(bel1, ["Handle"])
var bel2 = document.createElement("input")
bel2.setAttribute("type", "text")
bel2.setAttribute("id", "handle")
bel2.setAttribute("name", "handle")
bel2.setAttribute("aria-describedby", "handle-desc")
bel2.setAttribute("class", "input-reset ba b--black-20 pa2 mb2 db w-100")
var bel3 = document.createElement("small")
bel3.setAttribute("id", "handle-desc")
bel3.setAttribute("class", "f6 lh-copy black-60 db mb2")
ac(bel3, ["\n\t\t\tYou need at least one public pseud or handle. You can make other handles later.\n\t\t\t"])
var bel4 = document.createElement("label")
bel4.setAttribute("for", "email")
bel4.setAttribute("class", "f6 b db mb2")
ac(bel4, ["Email"])
var bel5 = document.createElement("input")
bel5.setAttribute("type", "email")
bel5.setAttribute("id", "email")
bel5.setAttribute("name", "email")
bel5.setAttribute("aria-describedby", "email-desc")
bel5.setAttribute("class", "input-reset ba b--black-20 pa2 mb2 db w-100")
var bel6 = document.createElement("small")
bel6.setAttribute("id", "email-desc")
bel6.setAttribute("class", "f6 lh-copy black-60 db mb2")
ac(bel6, ["A valid email address is required. Never made public."])
var bel7 = document.createElement("label")
bel7.setAttribute("for", "password")
bel7.setAttribute("class", "f6 b db mb2")
ac(bel7, ["Password"])
var bel8 = document.createElement("input")
bel8.setAttribute("type", "password")
bel8.setAttribute("id", "password")
bel8.setAttribute("name", "password")
bel8.setAttribute("aria-describedby", "password-desc")
bel8.setAttribute("class", "input-reset ba b--black-20 pa2 mb2 db w-100")
var bel9 = document.createElement("small")
bel9.setAttribute("id", "password-desc")
bel9.setAttribute("class", "f6 lh-copy black-60 db mb2")
ac(bel9, ["Make it long."])
var bel10 = document.createElement("button")
bel10.setAttribute("type", "submit")
bel10["onsubmit"] = arguments[0]
bel10.setAttribute("class", "btn btn--blue w-100")
ac(bel10, ["Sign up"])
var bel12 = document.createElement("small")
bel12.setAttribute("class", "f6 lh-copy black-60 db mb2")
var bel11 = document.createElement("a")
bel11.setAttribute("href", "/signin")
ac(bel11, ["Sign in."])
ac(bel12, ["Already have an account? ",bel11])
ac(bel13, ["\n\t\t\t",bel0,"\n\n\t\t\t",bel1,"\n\t\t\t",bel2,"\n\t\t\t",bel3,"\n\n\t\t\t",bel4,"\n\t\t\t",bel5,"\n\t\t\t",bel6,"\n\n\t\t\t",bel7,"\n\t\t\t",bel8,"\n\t\t\t",bel9,"\n\n\t\t\t",bel10,"\n\t\t\t",bel12,"\n\t\t"])
ac(bel14, ["\n\t\t",bel13,"\n\t"])
ac(bel15, ["\n\t",bel14,"\n"])
      return bel15
    }(signup));
    function signup(e) {
        var data = getFormData(e.target);
        e.preventDefault();
    }
}
},{"19":19,"2":2,"3":3,"5":5}],2:[function(require,module,exports){
module.exports = {};
},{}],3:[function(require,module,exports){
var documentReady = require(4);
var nanohistory = require(7);
var nanorouter = require(14);
var nanomount = require(12);
var nanomorph = require(9);
var nanohref = require(8);
var nanoraf = require(13);
var nanobus = require(6);
module.exports = Choo;
function Choo(opts) {
    opts = opts || {};
    var routerOpts = {
        default: opts.defaultRoute || '/404',
        curry: true
    };
    var timingEnabled = opts.timing === undefined ? true : opts.timing;
    var hasWindow = typeof window !== 'undefined';
    var hasPerformance = hasWindow && window.performance && window.performance.mark;
    var router = nanorouter(routerOpts);
    var bus = nanobus();
    var rerender = null;
    var tree = null;
    var state = {};
    return {
        toString: toString,
        use: register,
        mount: mount,
        router: router,
        route: route,
        start: start
    };
    function route(route, handler) {
        router.on(route, function (params) {
            return function () {
                state.params = params;
                return handler(state, emit);
            };
        });
    }
    function register(cb) {
        cb(state, bus);
    }
    function start() {
        if (opts.history !== false) {
            nanohistory(function (href) {
                bus.emit('pushState');
            });
            bus.prependListener('pushState', updateHistory.bind(null, 'push'));
            bus.prependListener('replaceState', updateHistory.bind(null, 'replace'));
            function updateHistory(mode, href) {
                if (href)
                    window.history[mode + 'State']({}, null, href);
                bus.emit('render');
                setTimeout(function () {
                    scrollIntoView();
                }, 0);
            }
            if (opts.href !== false) {
                nanohref(function (location) {
                    var href = location.href;
                    var currHref = window.location.href;
                    if (href === currHref)
                        return;
                    bus.emit('pushState', href);
                });
            }
        }
        rerender = nanoraf(function () {
            if (hasPerformance && timingEnabled) {
                window.performance.mark('choo:renderStart');
            }
            var newTree = router(createLocation());
            tree = nanomorph(tree, newTree);
            if (hasPerformance && timingEnabled) {
                window.performance.mark('choo:renderEnd');
                window.performance.measure('choo:render', 'choo:renderStart', 'choo:renderEnd');
            }
        });
        bus.prependListener('render', rerender);
        documentReady(function () {
            bus.emit('DOMContentLoaded');
        });
        tree = router(createLocation());
        return tree;
    }
    function emit(eventName, data) {
        bus.emit(eventName, data);
    }
    function mount(selector) {
        var newTree = start();
        documentReady(function () {
            var root = document.querySelector(selector);
            nanomount(root, newTree);
            tree = root;
        });
    }
    function toString(location, _state) {
        state = _state || {};
        var html = router(location);
        assert.equal();
        return html.toString();
    }
}
function scrollIntoView() {
    var hash = window.location.hash;
    if (hash) {
        try {
            var el = document.querySelector(hash);
            if (el)
                el.scrollIntoView(true);
        } catch (e) {
        }
    }
}
function createLocation() {
    var pathname = window.location.pathname.replace(/\/$/, '');
    var hash = window.location.hash.replace(/^#/, '/');
    return pathname + hash;
}
},{"12":12,"13":13,"14":14,"4":4,"6":6,"7":7,"8":8,"9":9}],4:[function(require,module,exports){
'use strict';
module.exports = ready;
function ready(callback) {
    var state = document.readyState;
    if (state === 'complete' || state === 'interactive') {
        return setTimeout(callback, 0);
    }
    document.addEventListener('DOMContentLoaded', function onLoad() {
        callback();
    });
}
},{}],5:[function(require,module,exports){
'use strict';
exports.__esModule = true;
var NODE_LIST_CLASSES = {
    '[object HTMLCollection]': true,
    '[object NodeList]': true,
    '[object RadioNodeList]': true
};
var IGNORED_ELEMENT_TYPES = {
    'button': true,
    'fieldset': true,
    'reset': true,
    'submit': true
};
var CHECKED_INPUT_TYPES = {
    'checkbox': true,
    'radio': true
};
var TRIM_RE = /^\s+|\s+$/g;
var slice = Array.prototype.slice;
var toString = Object.prototype.toString;
function getFormData(form) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? { trim: false } : arguments[1];
    if (!form) {
        throw new Error('A form is required by getFormData, was given form=' + form);
    }
    var data = {};
    var elementName = undefined;
    var elementNames = [];
    var elementNameLookup = {};
    for (var i = 0, l = form.elements.length; i < l; i++) {
        var element = form.elements[i];
        if (IGNORED_ELEMENT_TYPES[element.type] || element.disabled) {
            continue;
        }
        elementName = element.name || element.id;
        if (elementName && !elementNameLookup[elementName]) {
            elementNames.push(elementName);
            elementNameLookup[elementName] = true;
        }
    }
    for (var i = 0, l = elementNames.length; i < l; i++) {
        elementName = elementNames[i];
        var value = getNamedFormElementData(form, elementName, options);
        if (value != null) {
            data[elementName] = value;
        }
    }
    return data;
}
function getNamedFormElementData(form, elementName) {
    var options = arguments.length <= 2 || arguments[2] === undefined ? { trim: false } : arguments[2];
    if (!form) {
        throw new Error('A form is required by getNamedFormElementData, was given form=' + form);
    }
    if (!elementName && toString.call(elementName) !== '[object String]') {
        throw new Error('A form element name is required by getNamedFormElementData, was given elementName=' + elementName);
    }
    var element = form.elements[elementName];
    if (!element || element.disabled) {
        return null;
    }
    if (!NODE_LIST_CLASSES[toString.call(element)]) {
        return getFormElementValue(element, options.trim);
    }
    var data = [];
    var allRadios = true;
    for (var i = 0, l = element.length; i < l; i++) {
        if (element[i].disabled) {
            continue;
        }
        if (allRadios && element[i].type !== 'radio') {
            allRadios = false;
        }
        var value = getFormElementValue(element[i], options.trim);
        if (value != null) {
            data = data.concat(value);
        }
    }
    if (allRadios && data.length === 1) {
        return data[0];
    }
    return data.length > 0 ? data : null;
}
function getFormElementValue(element, trim) {
    var value = null;
    var type = element.type;
    if (type === 'select-one') {
        if (element.options.length) {
            value = element.options[element.selectedIndex].value;
        }
        return value;
    }
    if (type === 'select-multiple') {
        value = [];
        for (var i = 0, l = element.options.length; i < l; i++) {
            if (element.options[i].selected) {
                value.push(element.options[i].value);
            }
        }
        if (value.length === 0) {
            value = null;
        }
        return value;
    }
    if (type === 'file' && 'files' in element) {
        if (element.multiple) {
            value = slice.call(element.files);
            if (value.length === 0) {
                value = null;
            }
        } else {
            value = element.files[0];
        }
        return value;
    }
    if (!CHECKED_INPUT_TYPES[type]) {
        value = trim ? element.value.replace(TRIM_RE, '') : element.value;
    } else if (element.checked) {
        value = element.value;
    }
    return value;
}
getFormData.getNamedFormElementData = getNamedFormElementData;
exports['default'] = getFormData;
module.exports = exports['default'];
},{}],6:[function(require,module,exports){
module.exports = Nanobus;
function Nanobus() {
    if (!(this instanceof Nanobus))
        return new Nanobus();
    this._starListeners = [];
    this._listeners = {};
}
Nanobus.prototype.emit = function (eventName, data) {
    var listeners = this._listeners[eventName];
    if (listeners && listeners.length > 0) {
        this._emit(this.listeners(eventName), data);
    }
    if (this._starListeners.length > 0) {
        this._emit(this.listeners('*'), eventName, data);
    }
    return this;
};
Nanobus.prototype.on = Nanobus.prototype.addListener = function (eventName, listener) {
    if (eventName === '*') {
        this._starListeners.push(listener);
    } else {
        if (!this._listeners[eventName])
            this._listeners[eventName] = [];
        this._listeners[eventName].push(listener);
    }
    return this;
};
Nanobus.prototype.prependListener = function (eventName, listener) {
    if (eventName === '*') {
        this._starListeners.unshift(listener);
    } else {
        if (!this._listeners[eventName])
            this._listeners[eventName] = [];
        this._listeners[eventName].unshift(listener);
    }
    return this;
};
Nanobus.prototype.once = function (eventName, listener) {
    var self = this;
    this.on(eventName, once);
    function once() {
        listener.apply(self, arguments);
        self.removeListener(eventName, once);
    }
    return this;
};
Nanobus.prototype.prependOnceListener = function (eventName, listener) {
    var self = this;
    this.prependListener(eventName, once);
    function once() {
        listener.apply(self, arguments);
        self.removeListener(eventName, once);
    }
    return this;
};
Nanobus.prototype.removeListener = function (eventName, listener) {
    if (eventName === '*') {
        if (remove(this._starListeners, listener))
            return this;
    } else {
        if (remove(this._listeners[eventName], listener))
            return this;
    }
    function remove(arr, listener) {
        if (!arr)
            return;
        var index = arr.indexOf(listener);
        if (index !== -1) {
            arr.splice(index, 1);
            return true;
        }
    }
};
Nanobus.prototype.removeAllListeners = function (eventName) {
    if (eventName) {
        if (eventName === '*') {
            this._starListeners = [];
        } else {
            this._listeners[eventName] = [];
        }
    } else {
        this._starListeners = [];
        this._listeners = {};
    }
    return this;
};
Nanobus.prototype.listeners = function (eventName) {
    var listeners = eventName !== '*' ? this._listeners[eventName] : this._starListeners;
    var ret = [];
    if (listeners) {
        var ilength = listeners.length;
        for (var i = 0; i < ilength; i++)
            ret.push(listeners[i]);
    }
    return ret;
};
Nanobus.prototype._emit = function (arr, eventName, data) {
    if (!data) {
        data = eventName;
        eventName = null;
    }
    var length = arr.length;
    for (var i = 0; i < length; i++) {
        var listener = arr[i];
        if (eventName)
            listener(eventName, data);
        else
            listener(data);
    }
};
},{}],7:[function(require,module,exports){
module.exports = history;
function history(cb) {
    window.onpopstate = function () {
        cb(document.location);
    };
}
},{}],8:[function(require,module,exports){
module.exports = href;
var noRoutingAttrName = 'data-no-routing';
function href(cb, root) {
    root = root || window.document;
    window.onclick = function (e) {
        if (e.button && e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey)
            return;
        var node = function traverse(node) {
            if (!node || node === root)
                return;
            if (node.localName !== 'a')
                return traverse(node.parentNode);
            if (node.href === undefined)
                return traverse(node.parentNode);
            if (window.location.host !== node.host)
                return traverse(node.parentNode);
            return node;
        }(e.target);
        if (!node)
            return;
        var isRoutingDisabled = node.hasAttribute(noRoutingAttrName);
        if (isRoutingDisabled)
            return;
        e.preventDefault();
        cb(node);
    };
}
},{}],9:[function(require,module,exports){
var morph = require(11);
var rootLabelRegex = /^data-onloadid/;
var ELEMENT_NODE = 1;
module.exports = nanomorph;
function nanomorph(oldTree, newTree) {
    persistStatefulRoot(newTree, oldTree);
    var tree = walk(newTree, oldTree);
    return tree;
}
function walk(newNode, oldNode) {
    if (!oldNode) {
        return newNode;
    } else if (!newNode) {
        return null;
    } else if (newNode.isSameNode && newNode.isSameNode(oldNode)) {
        return oldNode;
    } else if (newNode.tagName !== oldNode.tagName) {
        return newNode;
    } else {
        morph(newNode, oldNode);
        updateChildren(newNode, oldNode);
        return oldNode;
    }
}
function updateChildren(newNode, oldNode) {
    if (!newNode.childNodes || !oldNode.childNodes)
        return;
    var newLength = newNode.childNodes.length;
    var oldLength = oldNode.childNodes.length;
    var length = Math.max(oldLength, newLength);
    var iNew = 0;
    var iOld = 0;
    for (var i = 0; i < length; i++, iNew++, iOld++) {
        var newChildNode = newNode.childNodes[iNew];
        var oldChildNode = oldNode.childNodes[iOld];
        var retChildNode = walk(newChildNode, oldChildNode);
        if (!retChildNode) {
            if (oldChildNode) {
                oldNode.removeChild(oldChildNode);
                iOld--;
            }
        } else if (!oldChildNode) {
            if (retChildNode) {
                oldNode.appendChild(retChildNode);
                iNew--;
            }
        } else if (retChildNode !== oldChildNode) {
            oldNode.replaceChild(retChildNode, oldChildNode);
            iNew--;
        }
    }
}
function persistStatefulRoot(newNode, oldNode) {
    if (!newNode || !oldNode || oldNode.nodeType !== ELEMENT_NODE || newNode.nodeType !== ELEMENT_NODE)
        return;
    var oldAttrs = oldNode.attributes;
    var attr, name;
    for (var i = 0, len = oldAttrs.length; i < len; i++) {
        attr = oldAttrs[i];
        name = attr.name;
        if (rootLabelRegex.test(name)) {
            newNode.setAttribute(name, attr.value);
            break;
        }
    }
}
},{"11":11}],10:[function(require,module,exports){
module.exports = [
    'onclick',
    'ondblclick',
    'onmousedown',
    'onmouseup',
    'onmouseover',
    'onmousemove',
    'onmouseout',
    'ondragstart',
    'ondrag',
    'ondragenter',
    'ondragleave',
    'ondragover',
    'ondrop',
    'ondragend',
    'onkeydown',
    'onkeypress',
    'onkeyup',
    'onunload',
    'onabort',
    'onerror',
    'onresize',
    'onscroll',
    'onselect',
    'onchange',
    'onsubmit',
    'onreset',
    'onfocus',
    'onblur',
    'oninput',
    'oncontextmenu',
    'onfocusin',
    'onfocusout'
];
},{}],11:[function(require,module,exports){
var events = require(10);
var eventsLength = events.length;
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var COMMENT_NODE = 8;
module.exports = morph;
function morph(newNode, oldNode) {
    var nodeType = newNode.nodeType;
    var nodeName = newNode.nodeName;
    if (nodeType === ELEMENT_NODE) {
        copyAttrs(newNode, oldNode);
    }
    if (nodeType === TEXT_NODE || nodeType === COMMENT_NODE) {
        oldNode.nodeValue = newNode.nodeValue;
    }
    if (nodeName === 'INPUT')
        updateInput(newNode, oldNode);
    else if (nodeName === 'OPTION')
        updateOption(newNode, oldNode);
    else if (nodeName === 'TEXTAREA')
        updateTextarea(newNode, oldNode);
    else if (nodeName === 'SELECT')
        updateSelect(newNode, oldNode);
    copyEvents(newNode, oldNode);
}
function copyAttrs(newNode, oldNode) {
    var oldAttrs = oldNode.attributes;
    var newAttrs = newNode.attributes;
    var attrNamespaceURI = null;
    var attrValue = null;
    var fromValue = null;
    var attrName = null;
    var attr = null;
    for (var i = newAttrs.length - 1; i >= 0; --i) {
        attr = newAttrs[i];
        attrName = attr.name;
        attrNamespaceURI = attr.namespaceURI;
        attrValue = attr.value;
        if (attrNamespaceURI) {
            attrName = attr.localName || attrName;
            fromValue = oldNode.getAttributeNS(attrNamespaceURI, attrName);
            if (fromValue !== attrValue) {
                oldNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
            }
        } else {
            fromValue = oldNode.getAttribute(attrName);
            if (fromValue !== attrValue) {
                if (attrValue === 'null' || attrValue === 'undefined') {
                    oldNode.removeAttribute(attrName);
                } else {
                    oldNode.setAttribute(attrName, attrValue);
                }
            }
        }
    }
    for (var j = oldAttrs.length - 1; j >= 0; --j) {
        attr = oldAttrs[j];
        if (attr.specified !== false) {
            attrName = attr.name;
            attrNamespaceURI = attr.namespaceURI;
            if (attrNamespaceURI) {
                attrName = attr.localName || attrName;
                if (!newNode.hasAttributeNS(attrNamespaceURI, attrName)) {
                    oldNode.removeAttributeNS(attrNamespaceURI, attrName);
                }
            } else {
                if (!newNode.hasAttributeNS(null, attrName)) {
                    oldNode.removeAttribute(attrName);
                }
            }
        }
    }
}
function copyEvents(newNode, oldNode) {
    for (var i = 0; i < eventsLength; i++) {
        var ev = events[i];
        if (newNode[ev]) {
            oldNode[ev] = newNode[ev];
        } else if (oldNode[ev]) {
            oldNode[ev] = undefined;
        }
    }
}
function updateOption(newNode, oldNode) {
    updateAttribute(newNode, oldNode, 'selected');
}
function updateInput(newNode, oldNode) {
    var newValue = newNode.value;
    var oldValue = oldNode.value;
    updateAttribute(newNode, oldNode, 'checked');
    updateAttribute(newNode, oldNode, 'disabled');
    if (!newNode.hasAttributeNS(null, 'value') || newValue === 'null') {
        oldNode.value = '';
        oldNode.removeAttribute('value');
    } else if (newValue !== oldValue) {
        oldNode.setAttribute('value', newValue);
        oldNode.value = newValue;
    } else if (oldNode.type === 'range') {
        oldNode.value = newValue;
    }
}
function updateTextarea(newNode, oldNode) {
    var newValue = newNode.value;
    if (newValue !== oldNode.value) {
        oldNode.value = newValue;
    }
    if (oldNode.firstChild) {
        if (newValue === '' && oldNode.firstChild.nodeValue === oldNode.placeholder) {
            return;
        }
        oldNode.firstChild.nodeValue = newValue;
    }
}
function updateSelect(newNode, oldNode) {
    if (!oldNode.hasAttributeNS(null, 'multiple')) {
        var i = 0;
        var curChild = oldNode.firstChild;
        while (curChild) {
            var nodeName = curChild.nodeName;
            if (nodeName && nodeName.toUpperCase() === 'OPTION') {
                if (curChild.hasAttributeNS(null, 'selected'))
                    break;
                i++;
            }
            curChild = curChild.nextSibling;
        }
        newNode.selectedIndex = i;
    }
}
function updateAttribute(newNode, oldNode, name) {
    if (newNode[name] !== oldNode[name]) {
        oldNode[name] = newNode[name];
        if (newNode[name]) {
            oldNode.setAttribute(name, '');
        } else {
            oldNode.removeAttribute(name, '');
        }
    }
}
},{"10":10}],12:[function(require,module,exports){
var nanomorph = require(9);
module.exports = nanomount;
function nanomount(target, newTree) {
    if (target.nodeName === 'BODY') {
        var children = target.childNodes;
        for (var i = 0; i < children.length; i++) {
            if (children[i].nodeName === 'SCRIPT') {
                newTree.appendChild(children[i].cloneNode(true));
            }
        }
    }
    var tree = nanomorph(target, newTree);
}
},{"9":9}],13:[function(require,module,exports){
'use strict';
module.exports = nanoraf;
function nanoraf(render, raf) {
    if (!raf)
        raf = window.requestAnimationFrame;
    var redrawScheduled = false;
    var args = null;
    return function frame() {
        if (args === null && !redrawScheduled) {
            redrawScheduled = true;
            raf(function redraw() {
                redrawScheduled = false;
                var length = args.length;
                var _args = new Array(length);
                for (var i = 0; i < length; i++)
                    _args[i] = args[i];
                render.apply(render, _args);
                args = null;
            });
        }
        args = arguments;
    };
}
},{}],14:[function(require,module,exports){
var wayfarer = require(15);
var isLocalFile = /file:\/\//.test(typeof window === 'object' && window.location && window.location.origin);
var electron = '^(file://|/)(.*.html?/?)?';
var protocol = '^(http(s)?(://))?(www.)?';
var domain = '[a-zA-Z0-9-_.]+(:[0-9]{1,5})?(/{1})?';
var qs = '[?].*$';
var stripElectron = new RegExp(electron);
var prefix = new RegExp(protocol + domain);
var normalize = new RegExp('#');
var suffix = new RegExp(qs);
module.exports = Nanorouter;
function Nanorouter(opts) {
    opts = opts || {};
    var router = wayfarer(opts.default || '/404');
    var curry = opts.curry || false;
    var prevCallback = null;
    var prevRoute = null;
    emit.router = router;
    emit.on = on;
    return emit;
    function on(routename, listener) {
        routename = routename.replace(/^[#\/]/, '');
        router.on(routename, listener);
    }
    function emit(route) {
        if (!curry) {
            return router(route);
        } else {
            route = pathname(route, isLocalFile);
            if (route === prevRoute) {
                return prevCallback();
            } else {
                prevRoute = route;
                prevCallback = router(route);
                return prevCallback();
            }
        }
    }
}
function pathname(route, isElectron) {
    if (isElectron)
        route = route.replace(stripElectron, '');
    else
        route = route.replace(prefix, '');
    return route.replace(suffix, '').replace(normalize, '/');
}
},{"15":15}],15:[function(require,module,exports){
var trie = require(18);
module.exports = Wayfarer;
function Wayfarer(dft) {
    if (!(this instanceof Wayfarer))
        return new Wayfarer(dft);
    var _default = (dft || '').replace(/^\//, '');
    var _trie = trie();
    emit._trie = _trie;
    emit.emit = emit;
    emit.on = on;
    emit._wayfarer = true;
    return emit;
    function on(route, cb) {
        route = route || '/';
        if (cb && cb._wayfarer && cb._trie) {
            _trie.mount(route, cb._trie.trie);
        } else {
            var node = _trie.create(route);
            node.cb = cb;
        }
        return emit;
    }
    function emit(route) {
        var args = new Array(arguments.length);
        for (var i = 1; i < args.length; i++) {
            args[i] = arguments[i];
        }
        var node = _trie.match(route);
        if (node && node.cb) {
            args[0] = node.params;
            return node.cb.apply(null, args);
        }
        var dft = _trie.match(_default);
        if (dft && dft.cb) {
            args[0] = dft.params;
            return dft.cb.apply(null, args);
        }
        throw new Error('route \'' + route + '\' did not match');
    }
}
},{"18":18}],16:[function(require,module,exports){
module.exports = extend;
var hasOwnProperty = Object.prototype.hasOwnProperty;
function extend() {
    var target = {};
    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key];
            }
        }
    }
    return target;
}
},{}],17:[function(require,module,exports){
module.exports = extend;
var hasOwnProperty = Object.prototype.hasOwnProperty;
function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key];
            }
        }
    }
    return target;
}
},{}],18:[function(require,module,exports){
var mutate = require(17);
var xtend = require(16);
module.exports = Trie;
function Trie() {
    if (!(this instanceof Trie))
        return new Trie();
    this.trie = { nodes: {} };
}
Trie.prototype.create = function (route) {
    var routes = route.replace(/^\//, '').split('/');
    return function createNode(index, trie) {
        var thisRoute = routes[index];
        if (thisRoute === undefined)
            return trie;
        var node = null;
        if (/^:|^\*/.test(thisRoute)) {
            if (!trie.nodes['$$']) {
                node = { nodes: {} };
                trie.nodes['$$'] = node;
            } else {
                node = trie.nodes['$$'];
            }
            if (thisRoute[0] === '*') {
                trie.wildcard = true;
            }
            trie.name = thisRoute.replace(/^:|^\*/, '');
        } else if (!trie.nodes[thisRoute]) {
            node = { nodes: {} };
            trie.nodes[thisRoute] = node;
        } else {
            node = trie.nodes[thisRoute];
        }
        return createNode(index + 1, node);
    }(0, this.trie);
};
Trie.prototype.match = function (route) {
    var routes = route.replace(/^\//, '').split('/');
    var params = {};
    var node = function search(index, trie) {
        if (trie === undefined)
            return undefined;
        var thisRoute = routes[index];
        if (thisRoute === undefined)
            return trie;
        if (trie.nodes[thisRoute]) {
            return search(index + 1, trie.nodes[thisRoute]);
        } else if (trie.wildcard) {
            params['wildcard'] = decodeURIComponent(routes.slice(index).join('/'));
            return trie.nodes['$$'];
        } else if (trie.name) {
            params[trie.name] = decodeURIComponent(thisRoute);
            return search(index + 1, trie.nodes['$$']);
        } else {
            return search(index + 1);
        }
    }(0, this.trie);
    if (!node)
        return undefined;
    node = xtend(node);
    node.params = params;
    return node;
};
Trie.prototype.mount = function (route, trie) {
    var split = route.replace(/^\//, '').split('/');
    var node = null;
    var key = null;
    if (split.length === 1) {
        key = split[0];
        node = this.create(key);
    } else {
        var headArr = split.splice(0, split.length - 1);
        var head = headArr.join('/');
        key = split[0];
        node = this.create(head);
    }
    mutate(node.nodes, trie.nodes);
    if (trie.name)
        node.name = trie.name;
    if (node.nodes['']) {
        Object.keys(node.nodes['']).forEach(function (key) {
            if (key === 'nodes')
                return;
            node[key] = node.nodes[''][key];
        });
        mutate(node.nodes, node.nodes[''].nodes);
        delete node.nodes[''].nodes;
    }
};
},{"16":16,"17":17}],19:[function(require,module,exports){
module.exports = function yoyoifyAppendChild(el, childs) {
    for (var i = 0; i < childs.length; i++) {
        var node = childs[i];
        if (Array.isArray(node)) {
            yoyoifyAppendChild(el, node);
            continue;
        }
        if (typeof node === 'number' || typeof node === 'boolean' || node instanceof Date || node instanceof RegExp) {
            node = node.toString();
        }
        if (typeof node === 'string') {
            if (/^[\n\r\s]+$/.test(node))
                continue;
            if (el.lastChild && el.lastChild.nodeName === '#text') {
                el.lastChild.nodeValue += node;
                continue;
            }
            node = document.createTextNode(node);
        }
        if (node && node.nodeType) {
            el.appendChild(node);
        }
    }
};
},{}]},{},[1]);
