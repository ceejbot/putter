(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const html = require(2), choo = require(3);
const app = choo();
app.use(logger);
app.use(countStore);
app.route('/', mainView);
app.mount('#choo');
function mainView(state, emit) {
    return (function () {
      
      var ac = require(18)
      var bel3 = document.createElement("div")
var bel0 = document.createElement("span")
bel0.setAttribute("class", "label label-primary")
ac(bel0, [arguments[0]])
var bel2 = document.createElement("button")
bel2.setAttribute("type", "button")
bel2["onclick"] = arguments[1]
bel2.setAttribute("class", "btn btn-default")
var bel1 = document.createElement("span")
bel1.setAttribute("aria-hidden", "true")
bel1.setAttribute("class", "glyphicon glyphicon-star")
ac(bel2, ["\n\t\t\t",bel1," Star\n\t\t"])
ac(bel3, ["\n\t\tcount is ",bel0,"\n\t\t",bel2,"\n    "])
      return bel3
    }(state.count,onclick));
    function onclick() {
        emit('increment', 1);
    }
}
function logger(state, emitter) {
    emitter.on('*', (messageName, data) => {
        console.log('event', messageName, data);
    });
}
function countStore(state, emitter) {
    state.count = 0;
    emitter.on('increment', count => {
        state.count += count;
        emitter.emit('render');
    });
}
},{"18":18,"2":2,"3":3}],2:[function(require,module,exports){
module.exports = {};
},{}],3:[function(require,module,exports){
var documentReady = require(4);
var nanohistory = require(6);
var nanorouter = require(13);
var nanomount = require(11);
var nanomorph = require(8);
var nanohref = require(7);
var nanoraf = require(12);
var nanobus = require(5);
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
        tree = router(createLocation());
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
        bus.on('render', rerender);
        if (opts.history !== false) {
            nanohistory(function (href) {
                bus.emit('pushState');
            });
            bus.on('pushState', function (href) {
                if (href)
                    window.history.pushState({}, null, href);
                bus.emit('render');
                setTimeout(function () {
                    scrollIntoView();
                }, 0);
            });
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
        documentReady(function () {
            bus.emit('DOMContentLoaded');
        });
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
},{"11":11,"12":12,"13":13,"4":4,"5":5,"6":6,"7":7,"8":8}],4:[function(require,module,exports){
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
module.exports = Nanobus;
function Nanobus() {
    if (!(this instanceof Nanobus))
        return new Nanobus();
    this._starListeners = [];
    this._listeners = {};
}
Nanobus.prototype.emit = function (eventName, data) {
    var listeners = this._listeners[eventName];
    if (listeners && listeners.length)
        this._emit(listeners, data);
    if (this._starListeners.length) {
        this._emit(this._starListeners, eventName, data);
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
Nanobus.prototype.once = function (eventName, listener) {
    this.on(eventName, once);
    var self = this;
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
    var listeners = this._listeners[eventName];
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
},{}],6:[function(require,module,exports){
module.exports = history;
function history(cb) {
    window.onpopstate = function () {
        cb(document.location);
    };
}
},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
var morph = require(10);
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
},{"10":10}],9:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
var events = require(9);
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
},{"9":9}],11:[function(require,module,exports){
var nanomorph = require(8);
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
},{"8":8}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
var wayfarer = require(14);
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
},{"14":14}],14:[function(require,module,exports){
var trie = require(17);
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
},{"17":17}],15:[function(require,module,exports){
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
},{}],16:[function(require,module,exports){
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
},{}],17:[function(require,module,exports){
var mutate = require(16);
var xtend = require(15);
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
},{"15":15,"16":16}],18:[function(require,module,exports){
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
