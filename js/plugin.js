(function(a) {
    a.fn.extend({
        mouseParallax: function(c) {
            var b = {
                moveFactor: 5,
                zIndexValue: "-1",
                targetContainer: "body"
            };
            var c = a.extend(b, c);
            return this.each(function() {
                var e = c;
                var d = a(this);
                a(e.targetContainer).on("mousemove", function(f) {
                    mouseX = f.pageX;
                    mouseY = f.pageY;
                    windowWidth = a(window).width();
                    windowHeight = a(window).height();
                    percentX = ((mouseX / windowWidth) * e.moveFactor) - (e.moveFactor / 2);
                    percentY = ((mouseY / windowHeight) * e.moveFactor) - (e.moveFactor / 2);
                    leftString = (0 - percentX - e.moveFactor) + "%";
                    rightString = (0 - percentX - e.moveFactor) + "%";
                    topString = (0 - percentY - e.moveFactor) + "%";
                    bottomString = (0 - percentY - e.moveFactor) + "%";
                    d[0].style.left = leftString;
                    d[0].style.right = rightString;
                    d[0].style.top = topString;
                    d[0].style.bottom = bottomString;
                    if (e.zIndexValue) {
                        d[0].style.zIndex = e.zIndexValue
                    }
                })
            })
        }
    })
}(jQuery));
/*
 * Isotope PACKAGED v2.2.0
 *
 * Licensed GPLv3 for open source use
 * or Isotope Commercial License for commercial use
 *
 * http://isotope.metafizzy.co
 * Copyright 2015 Metafizzy
 */
(function(d) {
    function a() {}
    function b(h) {
        function e(i) {
            i.prototype.option || (i.prototype.option = function(j) {
                h.isPlainObject(j) && (this.options = h.extend(!0, this.options, j))
            }
            )
        }
        function f(j, k) {
            h.fn[j] = function(o) {
                if ("string" == typeof o) {
                    for (var r = c.call(arguments, 1), i = 0, t = this.length; t > i; i++) {
                        var q = this[i]
                          , m = h.data(q, j);
                        if (m) {
                            if (h.isFunction(m[o]) && "_" !== o.charAt(0)) {
                                var l = m[o].apply(m, r);
                                if (void 0 !== l) {
                                    return l
                                }
                            } else {
                                g("no such method '" + o + "' for " + j + " instance")
                            }
                        } else {
                            g("cannot call methods on " + j + " prior to initialization; attempted to call '" + o + "'")
                        }
                    }
                    return this
                }
                return this.each(function() {
                    var n = h.data(this, j);
                    n ? (n.option(o),
                    n._init()) : (n = new k(this,o),
                    h.data(this, j, n))
                })
            }
        }
        if (h) {
            var g = "undefined" == typeof console ? a : function(i) {
                console.error(i)
            }
            ;
            return h.bridget = function(j, i) {
                e(i),
                f(j, i)
            }
            ,
            h.bridget
        }
    }
    var c = Array.prototype.slice;
    "function" == typeof define && define.amd ? define("jquery-bridget/jquery.bridget", ["jquery"], b) : "object" == typeof exports ? b(require("jquery")) : b(d.jQuery)
}
)(window),
function(g) {
    function a(h) {
        var j = g.event;
        return j.target = j.target || j.srcElement || h,
        j
    }
    var b = document.documentElement
      , d = function() {};
    b.addEventListener ? d = function(k, h, j) {
        k.addEventListener(h, j, !1)
    }
    : b.attachEvent && (d = function(j, e, h) {
        j[e + h] = h.handleEvent ? function() {
            var k = a(j);
            h.handleEvent.call(h, k)
        }
        : function() {
            var k = a(j);
            h.call(j, k)
        }
        ,
        j.attachEvent("on" + e, j[e + h])
    }
    );
    var c = function() {};
    b.removeEventListener ? c = function(k, h, j) {
        k.removeEventListener(h, j, !1)
    }
    : b.detachEvent && (c = function(l, h, j) {
        l.detachEvent("on" + h, l[h + j]);
        try {
            delete l[h + j]
        } catch (k) {
            l[h + j] = void 0
        }
    }
    );
    var f = {
        bind: d,
        unbind: c
    };
    "function" == typeof define && define.amd ? define("eventie/eventie", f) : "object" == typeof exports ? module.exports = f : g.eventie = f
}(window),
function() {
    function g() {}
    function a(k, h) {
        for (var j = k.length; j--; ) {
            if (k[j].listener === h) {
                return j
            }
        }
        return -1
    }
    function b(e) {
        return function() {
            return this[e].apply(this, arguments)
        }
    }
    var d = g.prototype
      , c = this
      , f = c.EventEmitter;
    d.getListeners = function(l) {
        var h, j, k = this._getEvents();
        if (l instanceof RegExp) {
            h = {};
            for (j in k) {
                k.hasOwnProperty(j) && l.test(j) && (h[j] = k[j])
            }
        } else {
            h = k[l] || (k[l] = [])
        }
        return h
    }
    ,
    d.flattenListeners = function(k) {
        var h, j = [];
        for (h = 0; k.length > h; h += 1) {
            j.push(k[h].listener)
        }
        return j
    }
    ,
    d.getListenersAsObject = function(k) {
        var h, j = this.getListeners(k);
        return j instanceof Array && (h = {},
        h[k] = j),
        h || j
    }
    ,
    d.addListener = function(l, e) {
        var j, h = this.getListenersAsObject(l), k = "object" == typeof e;
        for (j in h) {
            h.hasOwnProperty(j) && -1 === a(h[j], e) && h[j].push(k ? e : {
                listener: e,
                once: !1
            })
        }
        return this
    }
    ,
    d.on = b("addListener"),
    d.addOnceListener = function(i, h) {
        return this.addListener(i, {
            listener: h,
            once: !0
        })
    }
    ,
    d.once = b("addOnceListener"),
    d.defineEvent = function(e) {
        return this.getListeners(e),
        this
    }
    ,
    d.defineEvents = function(i) {
        for (var h = 0; i.length > h; h += 1) {
            this.defineEvent(i[h])
        }
        return this
    }
    ,
    d.removeListener = function(l, e) {
        var j, h, k = this.getListenersAsObject(l);
        for (h in k) {
            k.hasOwnProperty(h) && (j = a(k[h], e),
            -1 !== j && k[h].splice(j, 1))
        }
        return this
    }
    ,
    d.off = b("removeListener"),
    d.addListeners = function(i, h) {
        return this.manipulateListeners(!1, i, h)
    }
    ,
    d.removeListeners = function(i, h) {
        return this.manipulateListeners(!0, i, h)
    }
    ,
    d.manipulateListeners = function(q, h, j) {
        var l, k, m = q ? this.removeListener : this.addListener, p = q ? this.removeListeners : this.addListeners;
        if ("object" != typeof h || h instanceof RegExp) {
            for (l = j.length; l--; ) {
                m.call(this, h, j[l])
            }
        } else {
            for (l in h) {
                h.hasOwnProperty(l) && (k = h[l]) && ("function" == typeof k ? m.call(this, l, k) : p.call(this, l, k))
            }
        }
        return this
    }
    ,
    d.removeEvent = function(l) {
        var h, j = typeof l, k = this._getEvents();
        if ("string" === j) {
            delete k[l]
        } else {
            if (l instanceof RegExp) {
                for (h in k) {
                    k.hasOwnProperty(h) && l.test(h) && delete k[h]
                }
            } else {
                delete this._events
            }
        }
        return this
    }
    ,
    d.removeAllListeners = b("removeEvent"),
    d.emitEvent = function(q, h) {
        var j, l, k, m, p = this.getListenersAsObject(q);
        for (k in p) {
            if (p.hasOwnProperty(k)) {
                for (l = p[k].length; l--; ) {
                    j = p[k][l],
                    j.once === !0 && this.removeListener(q, j.listener),
                    m = j.listener.apply(this, h || []),
                    m === this._getOnceReturnValue() && this.removeListener(q, j.listener)
                }
            }
        }
        return this
    }
    ,
    d.trigger = b("emitEvent"),
    d.emit = function(i) {
        var h = Array.prototype.slice.call(arguments, 1);
        return this.emitEvent(i, h)
    }
    ,
    d.setOnceReturnValue = function(e) {
        return this._onceReturnValue = e,
        this
    }
    ,
    d._getOnceReturnValue = function() {
        return this.hasOwnProperty("_onceReturnValue") ? this._onceReturnValue : !0
    }
    ,
    d._getEvents = function() {
        return this._events || (this._events = {})
    }
    ,
    g.noConflict = function() {
        return c.EventEmitter = f,
        g
    }
    ,
    "function" == typeof define && define.amd ? define("eventEmitter/EventEmitter", [], function() {
        return g
    }) : "object" == typeof module && module.exports ? module.exports = g : c.EventEmitter = g
}
.call(this),
function(d) {
    function a(i) {
        if (i) {
            if ("string" == typeof c[i]) {
                return i
            }
            i = i.charAt(0).toUpperCase() + i.slice(1);
            for (var f, g = 0, h = b.length; h > g; g++) {
                if (f = b[g] + i,
                "string" == typeof c[f]) {
                    return f
                }
            }
        }
    }
    var b = "Webkit Moz ms Ms O".split(" ")
      , c = document.documentElement.style;
    "function" == typeof define && define.amd ? define("get-style-property/get-style-property", [], function() {
        return a
    }) : "object" == typeof exports ? module.exports = a : d.getStyleProperty = a
}(window),
function(h) {
    function a(l) {
        var j = parseFloat(l)
          , k = -1 === l.indexOf("%") && !isNaN(j);
        return k && j
    }
    function b() {}
    function d() {
        for (var m = {
            width: 0,
            height: 0,
            innerWidth: 0,
            innerHeight: 0,
            outerWidth: 0,
            outerHeight: 0
        }, j = 0, k = g.length; k > j; j++) {
            var l = g[j];
            m[l] = 0
        }
        return m
    }
    function c(m) {
        function o() {
            if (!j) {
                j = !0;
                var t = h.getComputedStyle;
                if (q = function() {
                    var n = t ? function(s) {
                        return t(s, null)
                    }
                    : function(s) {
                        return s.currentStyle
                    }
                    ;
                    return function(s) {
                        var v = n(s);
                        return v || f("Style returned " + v + ". Are you running this code in a hidden iframe on Firefox? See http://bit.ly/getsizebug1"),
                        v
                    }
                }(),
                l = m("boxSizing")) {
                    var p = document.createElement("div");
                    p.style.width = "200px",
                    p.style.padding = "1px 2px 3px 4px",
                    p.style.borderStyle = "solid",
                    p.style.borderWidth = "1px 2px 3px 4px",
                    p.style[l] = "border-box";
                    var u = document.body || document.documentElement;
                    u.appendChild(p);
                    var i = q(p);
                    k = 200 === a(i.width),
                    u.removeChild(p)
                }
            }
        }
        function e(K) {
            if (o(),
            "string" == typeof K && (K = document.querySelector(K)),
            K && "object" == typeof K && K.nodeType) {
                var C = q(K);
                if ("none" === C.display) {
                    return d()
                }
                var J = {};
                J.width = K.offsetWidth,
                J.height = K.offsetHeight;
                for (var p = J.isBorderBox = !(!l || !C[l] || "border-box" !== C[l]), w = 0, F = g.length; F > w; w++) {
                    var u = g[w]
                      , H = C[u];
                    H = r(K, H);
                    var O = parseFloat(H);
                    J[u] = isNaN(O) ? 0 : O
                }
                var B = J.paddingLeft + J.paddingRight
                  , M = J.paddingTop + J.paddingBottom
                  , n = J.marginLeft + J.marginRight
                  , D = J.marginTop + J.marginBottom
                  , P = J.borderLeftWidth + J.borderRightWidth
                  , G = J.borderTopWidth + J.borderBottomWidth
                  , N = p && k
                  , A = a(C.width);
                A !== !1 && (J.width = A + (N ? 0 : B + P));
                var s = a(C.height);
                return s !== !1 && (J.height = s + (N ? 0 : M + G)),
                J.innerWidth = J.width - (B + P),
                J.innerHeight = J.height - (M + G),
                J.outerWidth = J.width + n,
                J.outerHeight = J.height + D,
                J
            }
        }
        function r(p, t) {
            if (h.getComputedStyle || -1 === t.indexOf("%")) {
                return t
            }
            var v = p.style
              , u = v.left
              , w = p.runtimeStyle
              , x = w && w.left;
            return x && (w.left = p.currentStyle.left),
            v.left = t,
            t = v.pixelLeft,
            v.left = u,
            x && (w.left = x),
            t
        }
        var q, l, k, j = !1;
        return e
    }
    var f = "undefined" == typeof console ? b : function(e) {
        console.error(e)
    }
      , g = ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "marginLeft", "marginRight", "marginTop", "marginBottom", "borderLeftWidth", "borderRightWidth", "borderTopWidth", "borderBottomWidth"];
    "function" == typeof define && define.amd ? define("get-size/get-size", ["get-style-property/get-style-property"], c) : "object" == typeof exports ? module.exports = c(require("desandro-get-style-property")) : h.getSize = c(h.getStyleProperty)
}(window),
function(h) {
    function a(e) {
        "function" == typeof e && (a.isReady ? e() : g.push(e))
    }
    function b(j) {
        var e = "readystatechange" === j.type && "complete" !== f.readyState;
        a.isReady || e || d()
    }
    function d() {
        a.isReady = !0;
        for (var k = 0, e = g.length; e > k; k++) {
            var j = g[k];
            j()
        }
    }
    function c(e) {
        return "complete" === f.readyState ? d() : (e.bind(f, "DOMContentLoaded", b),
        e.bind(f, "readystatechange", b),
        e.bind(h, "load", b)),
        a
    }
    var f = h.document
      , g = [];
    a.isReady = !1,
    "function" == typeof define && define.amd ? define("doc-ready/doc-ready", ["eventie/eventie"], c) : "object" == typeof exports ? module.exports = c(require("eventie")) : h.docReady = c(h.eventie)
}(window),
function(k) {
    function c(i, a) {
        return i[j](a)
    }
    function d(i) {
        if (!i.parentNode) {
            var a = document.createDocumentFragment();
            a.appendChild(i)
        }
    }
    function g(q, a) {
        d(q);
        for (var m = q.parentNode.querySelectorAll(a), i = 0, p = m.length; p > i; i++) {
            if (m[i] === q) {
                return !0
            }
        }
        return !1
    }
    function f(e, a) {
        return d(e),
        c(e, a)
    }
    var h, j = function() {
        if (k.matches) {
            return "matches"
        }
        if (k.matchesSelector) {
            return "matchesSelector"
        }
        for (var a = ["webkit", "moz", "ms", "o"], m = 0, q = a.length; q > m; m++) {
            var p = a[m]
              , s = p + "MatchesSelector";
            if (k[s]) {
                return s
            }
        }
    }();
    if (j) {
        var b = document.createElement("div")
          , l = c(b, "div");
        h = l ? c : f
    } else {
        h = g
    }
    "function" == typeof define && define.amd ? define("matches-selector/matches-selector", [], function() {
        return h
    }) : "object" == typeof exports ? module.exports = h : window.matchesSelector = h
}(Element.prototype),
function(b, a) {
    "function" == typeof define && define.amd ? define("fizzy-ui-utils/utils", ["doc-ready/doc-ready", "matches-selector/matches-selector"], function(c, d) {
        return a(b, c, d)
    }) : "object" == typeof exports ? module.exports = a(b, require("doc-ready"), require("desandro-matches-selector")) : b.fizzyUIUtils = a(b, b.docReady, b.matchesSelector)
}(window, function(g, a, b) {
    var d = {};
    d.extend = function(k, h) {
        for (var j in h) {
            k[j] = h[j]
        }
        return k
    }
    ,
    d.modulo = function(i, h) {
        return (i % h + h) % h
    }
    ;
    var c = Object.prototype.toString;
    d.isArray = function(e) {
        return "[object Array]" == c.call(e)
    }
    ,
    d.makeArray = function(l) {
        var h = [];
        if (d.isArray(l)) {
            h = l
        } else {
            if (l && "number" == typeof l.length) {
                for (var j = 0, k = l.length; k > j; j++) {
                    h.push(l[j])
                }
            } else {
                h.push(l)
            }
        }
        return h
    }
    ,
    d.indexOf = Array.prototype.indexOf ? function(i, h) {
        return i.indexOf(h)
    }
    : function(l, h) {
        for (var j = 0, k = l.length; k > j; j++) {
            if (l[j] === h) {
                return j
            }
        }
        return -1
    }
    ,
    d.removeFrom = function(k, h) {
        var j = d.indexOf(k, h);
        -1 != j && k.splice(j, 1)
    }
    ,
    d.isElement = "function" == typeof HTMLElement || "object" == typeof HTMLElement ? function(e) {
        return e instanceof HTMLElement
    }
    : function(e) {
        return e && "object" == typeof e && 1 == e.nodeType && "string" == typeof e.nodeName
    }
    ,
    d.setText = function() {
        function i(j, e) {
            h = h || (void 0 !== document.documentElement.textContent ? "textContent" : "innerText"),
            j[h] = e
        }
        var h;
        return i
    }(),
    d.getParent = function(i, h) {
        for (; i != document.body; ) {
            if (i = i.parentNode,
            b(i, h)) {
                return i
            }
        }
    }
    ,
    d.getQueryElement = function(e) {
        return "string" == typeof e ? document.querySelector(e) : e
    }
    ,
    d.handleEvent = function(i) {
        var h = "on" + i.type;
        this[h] && this[h](i)
    }
    ,
    d.filterFindElements = function(v, j) {
        v = d.makeArray(v);
        for (var l = [], o = 0, q = v.length; q > o; o++) {
            var i = v[o];
            if (d.isElement(i)) {
                if (j) {
                    b(i, j) && l.push(i);
                    for (var w = i.querySelectorAll(j), m = 0, k = w.length; k > m; m++) {
                        l.push(w[m])
                    }
                } else {
                    l.push(i)
                }
            }
        }
        return l
    }
    ,
    d.debounceMethod = function(m, h, j) {
        var l = m.prototype[h]
          , k = h + "Timeout";
        m.prototype[h] = function() {
            var o = this[k];
            o && clearTimeout(o);
            var i = arguments
              , n = this;
            this[k] = setTimeout(function() {
                l.apply(n, i),
                delete n[k]
            }, j || 100)
        }
    }
    ,
    d.toDashed = function(e) {
        return e.replace(/(.)([A-Z])/g, function(k, h, j) {
            return h + "-" + j
        }).toLowerCase()
    }
    ;
    var f = g.console;
    return d.htmlInit = function(e, h) {
        a(function() {
            for (var n = d.toDashed(h), w = document.querySelectorAll(".js-" + n), i = "data-" + n + "-options", x = 0, v = w.length; v > x; x++) {
                var q, o = w[x], k = o.getAttribute(i);
                try {
                    q = k && JSON.parse(k)
                } catch (r) {
                    f && f.error("Error parsing " + i + " on " + o.nodeName.toLowerCase() + (o.id ? "#" + o.id : "") + ": " + r);
                    continue
                }
                var j = new e(o,q)
                  , t = g.jQuery;
                t && t.data(o, h, j)
            }
        })
    }
    ,
    d
}),
function(b, a) {
    "function" == typeof define && define.amd ? define("outlayer/item", ["eventEmitter/EventEmitter", "get-size/get-size", "get-style-property/get-style-property", "fizzy-ui-utils/utils"], function(c, e, d, f) {
        return a(b, c, e, d, f)
    }) : "object" == typeof exports ? module.exports = a(b, require("wolfy87-eventemitter"), require("get-size"), require("desandro-get-style-property"), require("fizzy-ui-utils")) : (b.Outlayer = {},
    b.Outlayer.Item = a(b, b.EventEmitter, b.getSize, b.getStyleProperty, b.fizzyUIUtils))
}(window, function(J, w, B, F, E) {
    function H(c) {
        for (var a in c) {
            return !1
        }
        return a = null,
        !0
    }
    function I(c, a) {
        c && (this.element = c,
        this.layout = a,
        this.position = {
            x: 0,
            y: 0
        },
        this._create())
    }
    var j = J.getComputedStyle
      , K = j ? function(a) {
        return j(a, null)
    }
    : function(a) {
        return a.currentStyle
    }
      , G = F("transition")
      , A = F("transform")
      , x = G && A
      , q = !!F("perspective")
      , C = {
        WebkitTransition: "webkitTransitionEnd",
        MozTransition: "transitionend",
        OTransition: "otransitionend",
        transition: "transitionend"
    }[G]
      , k = ["transform", "transition", "transitionDuration", "transitionProperty"]
      , D = function() {
        for (var g = {}, a = 0, c = k.length; c > a; a++) {
            var d = k[a]
              , f = F(d);
            f && f !== d && (g[d] = f)
        }
        return g
    }();
    E.extend(I.prototype, w.prototype),
    I.prototype._create = function() {
        this._transn = {
            ingProperties: {},
            clean: {},
            onEnd: {}
        },
        this.css({
            position: "absolute"
        })
    }
    ,
    I.prototype.handleEvent = function(c) {
        var a = "on" + c.type;
        this[a] && this[a](c)
    }
    ,
    I.prototype.getSize = function() {
        this.size = B(this.element)
    }
    ,
    I.prototype.css = function(f) {
        var a = this.element.style;
        for (var c in f) {
            var d = D[c] || c;
            a[d] = f[c]
        }
    }
    ,
    I.prototype.getPosition = function() {
        var l = K(this.element)
          , a = this.layout.options
          , c = a.isOriginLeft
          , f = a.isOriginTop
          , d = parseInt(l[c ? "left" : "right"], 10)
          , g = parseInt(l[f ? "top" : "bottom"], 10);
        d = isNaN(d) ? 0 : d,
        g = isNaN(g) ? 0 : g;
        var h = this.layout.size;
        d -= c ? h.paddingLeft : h.paddingRight,
        g -= f ? h.paddingTop : h.paddingBottom,
        this.position.x = d,
        this.position.y = g
    }
    ,
    I.prototype.layoutPosition = function() {
        var O = this.layout.size
          , d = this.layout.options
          , g = {}
          , m = d.isOriginLeft ? "paddingLeft" : "paddingRight"
          , l = d.isOriginLeft ? "left" : "right"
          , y = d.isOriginLeft ? "right" : "left"
          , N = this.position.x + O[m];
        N = d.percentPosition && !d.isHorizontal ? 100 * (N / O.width) + "%" : N + "px",
        g[l] = N,
        g[y] = "";
        var c = d.isOriginTop ? "paddingTop" : "paddingBottom"
          , P = d.isOriginTop ? "top" : "bottom"
          , v = d.isOriginTop ? "bottom" : "top"
          , f = this.position.y + O[c];
        f = d.percentPosition && d.isHorizontal ? 100 * (f / O.height) + "%" : f + "px",
        g[P] = f,
        g[v] = "",
        this.css(g),
        this.emitEvent("layout", [this])
    }
    ;
    var M = q ? function(c, a) {
        return "translate3d(" + c + "px, " + a + "px, 0)"
    }
    : function(c, a) {
        return "translate(" + c + "px, " + a + "px)"
    }
    ;
    I.prototype._transitionTo = function(O, d) {
        this.getPosition();
        var g = this.position.x
          , m = this.position.y
          , l = parseInt(O, 10)
          , y = parseInt(d, 10)
          , N = l === this.position.x && y === this.position.y;
        if (this.setPosition(O, d),
        N && !this.isTransitioning) {
            return this.layoutPosition(),
            void 0
        }
        var c = O - g
          , P = d - m
          , v = {}
          , f = this.layout.options;
        c = f.isOriginLeft ? c : -c,
        P = f.isOriginTop ? P : -P,
        v.transform = M(c, P),
        this.transition({
            to: v,
            onTransitionEnd: {
                transform: this.layoutPosition
            },
            isCleaning: !0
        })
    }
    ,
    I.prototype.goTo = function(c, a) {
        this.setPosition(c, a),
        this.layoutPosition()
    }
    ,
    I.prototype.moveTo = x ? I.prototype._transitionTo : I.prototype.goTo,
    I.prototype.setPosition = function(c, a) {
        this.position.x = parseInt(c, 10),
        this.position.y = parseInt(a, 10)
    }
    ,
    I.prototype._nonTransition = function(c) {
        this.css(c.to),
        c.isCleaning && this._removeStyles(c.to);
        for (var a in c.onTransitionEnd) {
            c.onTransitionEnd[a].call(this)
        }
    }
    ,
    I.prototype._transition = function(f) {
        if (!parseFloat(this.layout.options.transitionDuration)) {
            return this._nonTransition(f),
            void 0
        }
        var a = this._transn;
        for (var c in f.onTransitionEnd) {
            a.onEnd[c] = f.onTransitionEnd[c]
        }
        for (c in f.to) {
            a.ingProperties[c] = !0,
            f.isCleaning && (a.clean[c] = !0)
        }
        if (f.from) {
            this.css(f.from);
            var d = this.element.offsetHeight;
            d = null
        }
        this.enableTransition(f.to),
        this.css(f.to),
        this.isTransitioning = !0
    }
    ;
    var z = A && E.toDashed(A) + ",opacity";
    I.prototype.enableTransition = function() {
        this.isTransitioning || (this.css({
            transitionProperty: z,
            transitionDuration: this.layout.options.transitionDuration
        }),
        this.element.addEventListener(C, this, !1))
    }
    ,
    I.prototype.transition = I.prototype[G ? "_transition" : "_nonTransition"],
    I.prototype.onwebkitTransitionEnd = function(a) {
        this.ontransitionend(a)
    }
    ,
    I.prototype.onotransitionend = function(a) {
        this.ontransitionend(a)
    }
    ;
    var L = {
        "-webkit-transform": "transform",
        "-moz-transform": "transform",
        "-o-transform": "transform"
    };
    I.prototype.ontransitionend = function(f) {
        if (f.target === this.element) {
            var a = this._transn
              , c = L[f.propertyName] || f.propertyName;
            if (delete a.ingProperties[c],
            H(a.ingProperties) && this.disableTransition(),
            c in a.clean && (this.element.style[f.propertyName] = "",
            delete a.clean[c]),
            c in a.onEnd) {
                var d = a.onEnd[c];
                d.call(this),
                delete a.onEnd[c]
            }
            this.emitEvent("transitionEnd", [this])
        }
    }
    ,
    I.prototype.disableTransition = function() {
        this.removeTransitionStyles(),
        this.element.removeEventListener(C, this, !1),
        this.isTransitioning = !1
    }
    ,
    I.prototype._removeStyles = function(d) {
        var a = {};
        for (var c in d) {
            a[c] = ""
        }
        this.css(a)
    }
    ;
    var b = {
        transitionProperty: "",
        transitionDuration: ""
    };
    return I.prototype.removeTransitionStyles = function() {
        this.css(b)
    }
    ,
    I.prototype.removeElem = function() {
        this.element.parentNode.removeChild(this.element),
        this.css({
            display: ""
        }),
        this.emitEvent("remove", [this])
    }
    ,
    I.prototype.remove = function() {
        if (!G || !parseFloat(this.layout.options.transitionDuration)) {
            return this.removeElem(),
            void 0
        }
        var a = this;
        this.once("transitionEnd", function() {
            a.removeElem()
        }),
        this.hide()
    }
    ,
    I.prototype.reveal = function() {
        delete this.isHidden,
        this.css({
            display: ""
        });
        var d = this.layout.options
          , a = {}
          , c = this.getHideRevealTransitionEndProperty("visibleStyle");
        a[c] = this.onRevealTransitionEnd,
        this.transition({
            from: d.hiddenStyle,
            to: d.visibleStyle,
            isCleaning: !0,
            onTransitionEnd: a
        })
    }
    ,
    I.prototype.onRevealTransitionEnd = function() {
        this.isHidden || this.emitEvent("reveal")
    }
    ,
    I.prototype.getHideRevealTransitionEndProperty = function(d) {
        var a = this.layout.options[d];
        if (a.opacity) {
            return "opacity"
        }
        for (var c in a) {
            return c
        }
    }
    ,
    I.prototype.hide = function() {
        this.isHidden = !0,
        this.css({
            display: ""
        });
        var d = this.layout.options
          , a = {}
          , c = this.getHideRevealTransitionEndProperty("hiddenStyle");
        a[c] = this.onHideTransitionEnd,
        this.transition({
            from: d.visibleStyle,
            to: d.hiddenStyle,
            isCleaning: !0,
            onTransitionEnd: a
        })
    }
    ,
    I.prototype.onHideTransitionEnd = function() {
        this.isHidden && (this.css({
            display: "none"
        }),
        this.emitEvent("hide"))
    }
    ,
    I.prototype.destroy = function() {
        this.css({
            position: "",
            left: "",
            right: "",
            top: "",
            bottom: "",
            transition: "",
            transform: ""
        })
    }
    ,
    I
}),
function(b, a) {
    "function" == typeof define && define.amd ? define("outlayer/outlayer", ["eventie/eventie", "eventEmitter/EventEmitter", "get-size/get-size", "fizzy-ui-utils/utils", "./item"], function(c, e, d, f, g) {
        return a(b, c, e, d, f, g)
    }) : "object" == typeof exports ? module.exports = a(b, require("eventie"), require("wolfy87-eventemitter"), require("get-size"), require("fizzy-ui-utils"), require("./item")) : b.Outlayer = a(b, b.eventie, b.EventEmitter, b.getSize, b.fizzyUIUtils, b.Outlayer.Item)
}(window, function(w, c, j, l, k, q) {
    function v(n, a) {
        var f = k.getQueryElement(n);
        if (!f) {
            return b && b.error("Bad element for " + this.constructor.namespace + ": " + (f || n)),
            void 0
        }
        this.element = f,
        x && (this.$element = x(this.element)),
        this.options = k.extend({}, this.constructor.defaults),
        this.option(a);
        var h = ++g;
        this.element.outlayerGUID = h,
        d[h] = this,
        this._create(),
        this.options.isInitLayout && this.layout()
    }
    var b = w.console
      , x = w.jQuery
      , m = function() {}
      , g = 0
      , d = {};
    return v.namespace = "outlayer",
    v.Item = q,
    v.defaults = {
        containerStyle: {
            position: "relative"
        },
        isInitLayout: !0,
        isOriginLeft: !0,
        isOriginTop: !0,
        isResizeBound: !0,
        isResizingContainer: !0,
        transitionDuration: "0.4s",
        hiddenStyle: {
            opacity: 0,
            transform: "scale(0.001)"
        },
        visibleStyle: {
            opacity: 1,
            transform: "scale(1)"
        }
    },
    k.extend(v.prototype, j.prototype),
    v.prototype.option = function(a) {
        k.extend(this.options, a)
    }
    ,
    v.prototype._create = function() {
        this.reloadItems(),
        this.stamps = [],
        this.stamp(this.options.stamp),
        k.extend(this.element.style, this.options.containerStyle),
        this.options.isResizeBound && this.bindResize()
    }
    ,
    v.prototype.reloadItems = function() {
        this.items = this._itemize(this.element.children)
    }
    ,
    v.prototype._itemize = function(B) {
        for (var h = this._filterFindItemElements(B), p = this.constructor.Item, y = [], u = 0, z = h.length; z > u; u++) {
            var A = h[u]
              , f = new p(A,this);
            y.push(f)
        }
        return y
    }
    ,
    v.prototype._filterFindItemElements = function(a) {
        return k.filterFindElements(a, this.options.itemSelector)
    }
    ,
    v.prototype.getItemElements = function() {
        for (var h = [], a = 0, f = this.items.length; f > a; a++) {
            h.push(this.items[a].element)
        }
        return h
    }
    ,
    v.prototype.layout = function() {
        this._resetLayout(),
        this._manageStamps();
        var a = void 0 !== this.options.isLayoutInstant ? this.options.isLayoutInstant : !this._isLayoutInited;
        this.layoutItems(this.items, a),
        this._isLayoutInited = !0
    }
    ,
    v.prototype._init = v.prototype.layout,
    v.prototype._resetLayout = function() {
        this.getSize()
    }
    ,
    v.prototype.getSize = function() {
        this.size = l(this.element)
    }
    ,
    v.prototype._getMeasurement = function(n, a) {
        var f, h = this.options[n];
        h ? ("string" == typeof h ? f = this.element.querySelector(h) : k.isElement(h) && (f = h),
        this[n] = f ? l(f)[a] : h) : this[n] = 0
    }
    ,
    v.prototype.layoutItems = function(f, a) {
        f = this._getItemsForLayout(f),
        this._layoutItems(f, a),
        this._postLayout()
    }
    ,
    v.prototype._getItemsForLayout = function(r) {
        for (var a = [], f = 0, p = r.length; p > f; f++) {
            var h = r[f];
            h.isIgnored || a.push(h)
        }
        return a
    }
    ,
    v.prototype._layoutItems = function(z, a) {
        if (this._emitCompleteOnItems("layout", z),
        z && z.length) {
            for (var f = [], p = 0, h = z.length; h > p; p++) {
                var u = z[p]
                  , y = this._getItemLayoutPosition(u);
                y.item = u,
                y.isInstant = a || u.isLayoutInstant,
                f.push(y)
            }
            this._processLayoutQueue(f)
        }
    }
    ,
    v.prototype._getItemLayoutPosition = function() {
        return {
            x: 0,
            y: 0
        }
    }
    ,
    v.prototype._processLayoutQueue = function(n) {
        for (var a = 0, f = n.length; f > a; a++) {
            var h = n[a];
            this._positionItem(h.item, h.x, h.y, h.isInstant)
        }
    }
    ,
    v.prototype._positionItem = function(n, a, f, h) {
        h ? n.goTo(a, f) : n.moveTo(a, f)
    }
    ,
    v.prototype._postLayout = function() {
        this.resizeContainer()
    }
    ,
    v.prototype.resizeContainer = function() {
        if (this.options.isResizingContainer) {
            var a = this._getContainerSize();
            a && (this._setContainerMeasure(a.width, !0),
            this._setContainerMeasure(a.height, !1))
        }
    }
    ,
    v.prototype._getContainerSize = m,
    v.prototype._setContainerMeasure = function(h, a) {
        if (void 0 !== h) {
            var f = this.size;
            f.isBorderBox && (h += a ? f.paddingLeft + f.paddingRight + f.borderLeftWidth + f.borderRightWidth : f.paddingBottom + f.paddingTop + f.borderTopWidth + f.borderBottomWidth),
            h = Math.max(h, 0),
            this.element.style[a ? "width" : "height"] = h + "px"
        }
    }
    ,
    v.prototype._emitCompleteOnItems = function(E, h) {
        function y() {
            z.emitEvent(E + "Complete", [h])
        }
        function A() {
            D++,
            D === C && y()
        }
        var z = this
          , C = h.length;
        if (!h || !C) {
            return y(),
            void 0
        }
        for (var D = 0, f = 0, F = h.length; F > f; f++) {
            var B = h[f];
            B.once(E, A)
        }
    }
    ,
    v.prototype.ignore = function(f) {
        var a = this.getItem(f);
        a && (a.isIgnored = !0)
    }
    ,
    v.prototype.unignore = function(f) {
        var a = this.getItem(f);
        a && delete a.isIgnored
    }
    ,
    v.prototype.stamp = function(n) {
        if (n = this._find(n)) {
            this.stamps = this.stamps.concat(n);
            for (var a = 0, f = n.length; f > a; a++) {
                var h = n[a];
                this.ignore(h)
            }
        }
    }
    ,
    v.prototype.unstamp = function(n) {
        if (n = this._find(n)) {
            for (var a = 0, f = n.length; f > a; a++) {
                var h = n[a];
                k.removeFrom(this.stamps, h),
                this.unignore(h)
            }
        }
    }
    ,
    v.prototype._find = function(a) {
        return a ? ("string" == typeof a && (a = this.element.querySelectorAll(a)),
        a = k.makeArray(a)) : void 0
    }
    ,
    v.prototype._manageStamps = function() {
        if (this.stamps && this.stamps.length) {
            this._getBoundingRect();
            for (var h = 0, a = this.stamps.length; a > h; h++) {
                var f = this.stamps[h];
                this._manageStamp(f)
            }
        }
    }
    ,
    v.prototype._getBoundingRect = function() {
        var f = this.element.getBoundingClientRect()
          , a = this.size;
        this._boundingRect = {
            left: f.left + a.paddingLeft + a.borderLeftWidth,
            top: f.top + a.paddingTop + a.borderTopWidth,
            right: f.right - (a.paddingRight + a.borderRightWidth),
            bottom: f.bottom - (a.paddingBottom + a.borderBottomWidth)
        }
    }
    ,
    v.prototype._manageStamp = m,
    v.prototype._getElementOffset = function(p) {
        var a = p.getBoundingClientRect()
          , f = this._boundingRect
          , h = l(p)
          , o = {
            left: a.left - f.left - h.marginLeft,
            top: a.top - f.top - h.marginTop,
            right: f.right - a.right - h.marginRight,
            bottom: f.bottom - a.bottom - h.marginBottom
        };
        return o
    }
    ,
    v.prototype.handleEvent = function(f) {
        var a = "on" + f.type;
        this[a] && this[a](f)
    }
    ,
    v.prototype.bindResize = function() {
        this.isResizeBound || (c.bind(w, "resize", this),
        this.isResizeBound = !0)
    }
    ,
    v.prototype.unbindResize = function() {
        this.isResizeBound && c.unbind(w, "resize", this),
        this.isResizeBound = !1
    }
    ,
    v.prototype.onresize = function() {
        function f() {
            a.resize(),
            delete a.resizeTimeout
        }
        this.resizeTimeout && clearTimeout(this.resizeTimeout);
        var a = this;
        this.resizeTimeout = setTimeout(f, 100)
    }
    ,
    v.prototype.resize = function() {
        this.isResizeBound && this.needsResizeLayout() && this.layout()
    }
    ,
    v.prototype.needsResizeLayout = function() {
        var f = l(this.element)
          , a = this.size && f;
        return a && f.innerWidth !== this.size.innerWidth
    }
    ,
    v.prototype.addItems = function(f) {
        var a = this._itemize(f);
        return a.length && (this.items = this.items.concat(a)),
        a
    }
    ,
    v.prototype.appended = function(f) {
        var a = this.addItems(f);
        a.length && (this.layoutItems(a, !0),
        this.reveal(a))
    }
    ,
    v.prototype.prepended = function(h) {
        var a = this._itemize(h);
        if (a.length) {
            var f = this.items.slice(0);
            this.items = a.concat(f),
            this._resetLayout(),
            this._manageStamps(),
            this.layoutItems(a, !0),
            this.reveal(a),
            this.layoutItems(f)
        }
    }
    ,
    v.prototype.reveal = function(n) {
        this._emitCompleteOnItems("reveal", n);
        for (var a = n && n.length, f = 0; a && a > f; f++) {
            var h = n[f];
            h.reveal()
        }
    }
    ,
    v.prototype.hide = function(n) {
        this._emitCompleteOnItems("hide", n);
        for (var a = n && n.length, f = 0; a && a > f; f++) {
            var h = n[f];
            h.hide()
        }
    }
    ,
    v.prototype.revealItemElements = function(f) {
        var a = this.getItems(f);
        this.reveal(a)
    }
    ,
    v.prototype.hideItemElements = function(f) {
        var a = this.getItems(f);
        this.hide(a)
    }
    ,
    v.prototype.getItem = function(n) {
        for (var a = 0, f = this.items.length; f > a; a++) {
            var h = this.items[a];
            if (h.element === n) {
                return h
            }
        }
    }
    ,
    v.prototype.getItems = function(u) {
        u = k.makeArray(u);
        for (var a = [], f = 0, h = u.length; h > f; f++) {
            var n = u[f]
              , p = this.getItem(n);
            p && a.push(p)
        }
        return a
    }
    ,
    v.prototype.remove = function(p) {
        var a = this.getItems(p);
        if (this._emitCompleteOnItems("remove", a),
        a && a.length) {
            for (var f = 0, h = a.length; h > f; f++) {
                var n = a[f];
                n.remove(),
                k.removeFrom(this.items, n)
            }
        }
    }
    ,
    v.prototype.destroy = function() {
        var r = this.element.style;
        r.height = "",
        r.position = "",
        r.width = "";
        for (var a = 0, f = this.items.length; f > a; a++) {
            var p = this.items[a];
            p.destroy()
        }
        this.unbindResize();
        var h = this.element.outlayerGUID;
        delete d[h],
        delete this.element.outlayerGUID,
        x && x.removeData(this.element, this.constructor.namespace)
    }
    ,
    v.data = function(f) {
        f = k.getQueryElement(f);
        var a = f && f.outlayerGUID;
        return a && d[a]
    }
    ,
    v.create = function(h, a) {
        function f() {
            v.apply(this, arguments)
        }
        return Object.create ? f.prototype = Object.create(v.prototype) : k.extend(f.prototype, v.prototype),
        f.prototype.constructor = f,
        f.defaults = k.extend({}, v.defaults),
        k.extend(f.defaults, a),
        f.prototype.settings = {},
        f.namespace = h,
        f.data = v.data,
        f.Item = function() {
            q.apply(this, arguments)
        }
        ,
        f.Item.prototype = new q,
        k.htmlInit(f, h),
        x && x.bridget && x.bridget(h, f),
        f
    }
    ,
    v.Item = q,
    v
}),
function(b, a) {
    "function" == typeof define && define.amd ? define("isotope/js/item", ["outlayer/outlayer"], a) : "object" == typeof exports ? module.exports = a(require("outlayer")) : (b.Isotope = b.Isotope || {},
    b.Isotope.Item = a(b.Outlayer))
}(window, function(c) {
    function a() {
        c.Item.apply(this, arguments)
    }
    a.prototype = new c.Item,
    a.prototype._create = function() {
        this.id = this.layout.itemGUID++,
        c.Item.prototype._create.call(this),
        this.sortData = {}
    }
    ,
    a.prototype.updateSortData = function() {
        if (!this.isIgnored) {
            this.sortData.id = this.id,
            this.sortData["original-order"] = this.id,
            this.sortData.random = Math.random();
            var h = this.layout.options.getSortData
              , d = this.layout._sorters;
            for (var f in h) {
                var g = d[f];
                this.sortData[f] = g(this.element, this)
            }
        }
    }
    ;
    var b = a.prototype.destroy;
    return a.prototype.destroy = function() {
        b.apply(this, arguments),
        this.css({
            display: ""
        })
    }
    ,
    a
}),
function(b, a) {
    "function" == typeof define && define.amd ? define("isotope/js/layout-mode", ["get-size/get-size", "outlayer/outlayer"], a) : "object" == typeof exports ? module.exports = a(require("get-size"), require("outlayer")) : (b.Isotope = b.Isotope || {},
    b.Isotope.LayoutMode = a(b.getSize, b.Outlayer))
}(window, function(c, a) {
    function b(d) {
        this.isotope = d,
        d && (this.options = d.options[this.namespace],
        this.element = d.element,
        this.items = d.filteredItems,
        this.size = d.size)
    }
    return function() {
        function h(i) {
            return function() {
                return a.prototype[i].apply(this.isotope, arguments)
            }
        }
        for (var e = ["_resetLayout", "_getItemLayoutPosition", "_manageStamp", "_getContainerSize", "_getElementOffset", "needsResizeLayout"], d = 0, f = e.length; f > d; d++) {
            var g = e[d];
            b.prototype[g] = h(g)
        }
    }(),
    b.prototype.needsVerticalResizeLayout = function() {
        var d = c(this.isotope.element)
          , f = this.isotope.size && d;
        return f && d.innerHeight != this.isotope.size.innerHeight
    }
    ,
    b.prototype._getMeasurement = function() {
        this.isotope._getMeasurement.apply(this, arguments)
    }
    ,
    b.prototype.getColumnWidth = function() {
        this.getSegmentSize("column", "Width")
    }
    ,
    b.prototype.getRowHeight = function() {
        this.getSegmentSize("row", "Height")
    }
    ,
    b.prototype.getSegmentSize = function(j, d) {
        var f = j + d
          , h = "outer" + d;
        if (this._getMeasurement(f, h),
        !this[f]) {
            var g = this.getFirstItemSize();
            this[f] = g && g[h] || this.isotope.size["inner" + d]
        }
    }
    ,
    b.prototype.getFirstItemSize = function() {
        var d = this.isotope.filteredItems[0];
        return d && d.element && c(d.element)
    }
    ,
    b.prototype.layout = function() {
        this.isotope.layout.apply(this.isotope, arguments)
    }
    ,
    b.prototype.getSize = function() {
        this.isotope.getSize(),
        this.size = this.isotope.size
    }
    ,
    b.modes = {},
    b.create = function(g, d) {
        function f() {
            b.apply(this, arguments)
        }
        return f.prototype = new b,
        d && (f.options = d),
        f.prototype.namespace = g,
        b.modes[g] = f,
        f
    }
    ,
    b
}),
function(b, a) {
    "function" == typeof define && define.amd ? define("masonry/masonry", ["outlayer/outlayer", "get-size/get-size", "fizzy-ui-utils/utils"], a) : "object" == typeof exports ? module.exports = a(require("outlayer"), require("get-size"), require("fizzy-ui-utils")) : b.Masonry = a(b.Outlayer, b.getSize, b.fizzyUIUtils)
}(window, function(d, a, b) {
    var c = d.create("masonry");
    return c.prototype._resetLayout = function() {
        this.getSize(),
        this._getMeasurement("columnWidth", "outerWidth"),
        this._getMeasurement("gutter", "outerWidth"),
        this.measureColumns();
        var e = this.cols;
        for (this.colYs = []; e--; ) {
            this.colYs.push(0)
        }
        this.maxY = 0
    }
    ,
    c.prototype.measureColumns = function() {
        if (this.getContainerWidth(),
        !this.columnWidth) {
            var l = this.items[0]
              , f = l && l.element;
            this.columnWidth = f && a(f).outerWidth || this.containerWidth
        }
        var h = this.columnWidth += this.gutter
          , g = this.containerWidth + this.gutter
          , j = g / h
          , k = h - g % h
          , e = k && 1 > k ? "round" : "floor";
        j = Math[e](j),
        this.cols = Math.max(j, 1)
    }
    ,
    c.prototype.getContainerWidth = function() {
        var f = this.options.isFitWidth ? this.element.parentNode : this.element
          , e = a(f);
        this.containerWidth = e && e.innerWidth
    }
    ,
    c.prototype._getItemLayoutPosition = function(x) {
        x.getSize();
        var i = x.size.outerWidth % this.columnWidth
          , m = i && 1 > i ? "round" : "ceil"
          , l = Math[m](x.size.outerWidth / this.columnWidth);
        l = Math.min(l, this.cols);
        for (var v = this._getColGroup(l), w = Math.min.apply(Math, v), g = b.indexOf(v, w), y = {
            x: this.columnWidth * g,
            y: w
        }, q = w + x.size.outerHeight, k = this.cols + 1 - v.length, j = 0; k > j; j++) {
            this.colYs[g + j] = q
        }
        return y
    }
    ,
    c.prototype._getColGroup = function(k) {
        if (2 > k) {
            return this.colYs
        }
        for (var f = [], g = this.cols + 1 - k, j = 0; g > j; j++) {
            var h = this.colYs.slice(j, j + k);
            f[j] = Math.max.apply(Math, h)
        }
        return f
    }
    ,
    c.prototype._manageStamp = function(m) {
        var f = a(m)
          , h = this._getElementOffset(m)
          , g = this.options.isOriginLeft ? h.left : h.right
          , k = g + f.outerWidth
          , l = Math.floor(g / this.columnWidth);
        l = Math.max(0, l);
        var e = Math.floor(k / this.columnWidth);
        e -= k % this.columnWidth ? 0 : 1,
        e = Math.min(this.cols - 1, e);
        for (var q = (this.options.isOriginTop ? h.top : h.bottom) + f.outerHeight, j = l; e >= j; j++) {
            this.colYs[j] = Math.max(q, this.colYs[j])
        }
    }
    ,
    c.prototype._getContainerSize = function() {
        this.maxY = Math.max.apply(Math, this.colYs);
        var e = {
            height: this.maxY
        };
        return this.options.isFitWidth && (e.width = this._getContainerFitWidth()),
        e
    }
    ,
    c.prototype._getContainerFitWidth = function() {
        for (var g = 0, f = this.cols; --f && 0 === this.colYs[f]; ) {
            g++
        }
        return (this.cols - g) * this.columnWidth - this.gutter
    }
    ,
    c.prototype.needsResizeLayout = function() {
        var e = this.containerWidth;
        return this.getContainerWidth(),
        e !== this.containerWidth
    }
    ,
    c
}),
function(b, a) {
    "function" == typeof define && define.amd ? define("isotope/js/layout-modes/masonry", ["../layout-mode", "masonry/masonry"], a) : "object" == typeof exports ? module.exports = a(require("../layout-mode"), require("masonry-layout")) : a(b.Isotope.LayoutMode, b.Masonry)
}(window, function(k, c) {
    function d(n, a) {
        for (var m in a) {
            n[m] = a[m]
        }
        return n
    }
    var g = k.create("masonry")
      , f = g.prototype._getElementOffset
      , h = g.prototype.layout
      , j = g.prototype._getMeasurement;
    d(g.prototype, c.prototype),
    g.prototype._getElementOffset = f,
    g.prototype.layout = h,
    g.prototype._getMeasurement = j;
    var b = g.prototype.measureColumns;
    g.prototype.measureColumns = function() {
        this.items = this.isotope.filteredItems,
        b.call(this)
    }
    ;
    var l = g.prototype._manageStamp;
    return g.prototype._manageStamp = function() {
        this.options.isOriginLeft = this.isotope.options.isOriginLeft,
        this.options.isOriginTop = this.isotope.options.isOriginTop,
        l.apply(this, arguments)
    }
    ,
    g
}),
function(b, a) {
    "function" == typeof define && define.amd ? define("isotope/js/layout-modes/fit-rows", ["../layout-mode"], a) : "object" == typeof exports ? module.exports = a(require("../layout-mode")) : a(b.Isotope.LayoutMode)
}(window, function(b) {
    var a = b.create("fitRows");
    return a.prototype._resetLayout = function() {
        this.x = 0,
        this.y = 0,
        this.maxY = 0,
        this._getMeasurement("gutter", "outerWidth")
    }
    ,
    a.prototype._getItemLayoutPosition = function(g) {
        g.getSize();
        var c = g.size.outerWidth + this.gutter
          , d = this.isotope.size.innerWidth + this.gutter;
        0 !== this.x && c + this.x > d && (this.x = 0,
        this.y = this.maxY);
        var f = {
            x: this.x,
            y: this.y
        };
        return this.maxY = Math.max(this.maxY, this.y + g.size.outerHeight),
        this.x += c,
        f
    }
    ,
    a.prototype._getContainerSize = function() {
        return {
            height: this.maxY
        }
    }
    ,
    a
}),
function(b, a) {
    "function" == typeof define && define.amd ? define("isotope/js/layout-modes/vertical", ["../layout-mode"], a) : "object" == typeof exports ? module.exports = a(require("../layout-mode")) : a(b.Isotope.LayoutMode)
}(window, function(b) {
    var a = b.create("vertical", {
        horizontalAlignment: 0
    });
    return a.prototype._resetLayout = function() {
        this.y = 0
    }
    ,
    a.prototype._getItemLayoutPosition = function(f) {
        f.getSize();
        var c = (this.isotope.size.innerWidth - f.size.outerWidth) * this.options.horizontalAlignment
          , d = this.y;
        return this.y += f.size.outerHeight,
        {
            x: c,
            y: d
        }
    }
    ,
    a.prototype._getContainerSize = function() {
        return {
            height: this.y
        }
    }
    ,
    a
}),
function(b, a) {
    "function" == typeof define && define.amd ? define(["outlayer/outlayer", "get-size/get-size", "matches-selector/matches-selector", "fizzy-ui-utils/utils", "isotope/js/item", "isotope/js/layout-mode", "isotope/js/layout-modes/masonry", "isotope/js/layout-modes/fit-rows", "isotope/js/layout-modes/vertical"], function(d, f, e, g, h, c) {
        return a(b, d, f, e, g, h, c)
    }) : "object" == typeof exports ? module.exports = a(b, require("outlayer"), require("get-size"), require("desandro-matches-selector"), require("fizzy-ui-utils"), require("./item"), require("./layout-mode"), require("./layout-modes/masonry"), require("./layout-modes/fit-rows"), require("./layout-modes/vertical")) : b.Isotope = a(b, b.Outlayer, b.getSize, b.matchesSelector, b.fizzyUIUtils, b.Isotope.Item, b.Isotope.LayoutMode)
}(window, function(C, k, v, y, x, A, B) {
    function b(c, a) {
        return function(f, t) {
            for (var l = 0, F = c.length; F > l; l++) {
                var G = c[l]
                  , d = f.sortData[G]
                  , H = t.sortData[G];
                if (d > H || H > d) {
                    var E = void 0 !== a[G] ? a[G] : a
                      , e = E ? 1 : -1;
                    return (d > H ? 1 : -1) * e
                }
            }
            return 0
        }
    }
    var D = C.jQuery
      , z = String.prototype.trim ? function(a) {
        return a.trim()
    }
    : function(a) {
        return a.replace(/^\s+|\s+$/g, "")
    }
      , q = document.documentElement
      , m = q.textContent ? function(a) {
        return a.textContent
    }
    : function(a) {
        return a.innerText
    }
      , j = k.create("isotope", {
        layoutMode: "masonry",
        isJQueryFiltering: !0,
        sortAscending: !0
    });
    j.Item = A,
    j.LayoutMode = B,
    j.prototype._create = function() {
        this.itemGUID = 0,
        this._sorters = {},
        this._getSorters(),
        k.prototype._create.call(this),
        this.modes = {},
        this.filteredItems = this.items,
        this.sortHistory = ["original-order"];
        for (var a in B.modes) {
            this._initLayoutMode(a)
        }
    }
    ,
    j.prototype.reloadItems = function() {
        this.itemGUID = 0,
        k.prototype.reloadItems.call(this)
    }
    ,
    j.prototype._itemize = function() {
        for (var e = k.prototype._itemize.apply(this, arguments), a = 0, d = e.length; d > a; a++) {
            var c = e[a];
            c.id = this.itemGUID++
        }
        return this._updateItemsSortData(e),
        e
    }
    ,
    j.prototype._initLayoutMode = function(d) {
        var a = B.modes[d]
          , c = this.options[d] || {};
        this.options[d] = a.options ? x.extend(a.options, c) : c,
        this.modes[d] = new a(this)
    }
    ,
    j.prototype.layout = function() {
        return !this._isLayoutInited && this.options.isInitLayout ? (this.arrange(),
        void 0) : (this._layout(),
        void 0)
    }
    ,
    j.prototype._layout = function() {
        var a = this._getIsInstant();
        this._resetLayout(),
        this._manageStamps(),
        this.layoutItems(this.filteredItems, a),
        this._isLayoutInited = !0
    }
    ,
    j.prototype.arrange = function(f) {
        function a() {
            d.reveal(c.needReveal),
            d.hide(c.needHide)
        }
        this.option(f),
        this._getIsInstant();
        var c = this._filter(this.items);
        this.filteredItems = c.matches;
        var d = this;
        this._bindArrangeComplete(),
        this._isInstant ? this._noTransition(a) : a(),
        this._sort(),
        this._layout()
    }
    ,
    j.prototype._init = j.prototype.arrange,
    j.prototype._getIsInstant = function() {
        var a = void 0 !== this.options.isLayoutInstant ? this.options.isLayoutInstant : !this._isLayoutInited;
        return this._isInstant = a,
        a
    }
    ,
    j.prototype._bindArrangeComplete = function() {
        function h() {
            a && c && f && d.emitEvent("arrangeComplete", [d.filteredItems])
        }
        var a, c, f, d = this;
        this.once("layoutComplete", function() {
            a = !0,
            h()
        }),
        this.once("hideComplete", function() {
            c = !0,
            h()
        }),
        this.once("revealComplete", function() {
            f = !0,
            h()
        })
    }
    ,
    j.prototype._filter = function(H) {
        var d = this.options.filter;
        d = d || "*";
        for (var f = [], l = [], h = [], F = this._getFilterTest(d), G = 0, c = H.length; c > G; G++) {
            var I = H[G];
            if (!I.isIgnored) {
                var E = F(I);
                E && f.push(I),
                E && I.isHidden ? l.push(I) : E || I.isHidden || h.push(I)
            }
        }
        return {
            matches: f,
            needReveal: l,
            needHide: h
        }
    }
    ,
    j.prototype._getFilterTest = function(a) {
        return D && this.options.isJQueryFiltering ? function(c) {
            return D(c.element).is(a)
        }
        : "function" == typeof a ? function(c) {
            return a(c.element)
        }
        : function(c) {
            return y(c.element, a)
        }
    }
    ,
    j.prototype.updateSortData = function(c) {
        var a;
        c ? (c = x.makeArray(c),
        a = this.getItems(c)) : a = this.items,
        this._getSorters(),
        this._updateItemsSortData(a)
    }
    ,
    j.prototype._getSorters = function() {
        var d = this.options.getSortData;
        for (var a in d) {
            var c = d[a];
            this._sorters[a] = w(c)
        }
    }
    ,
    j.prototype._updateItemsSortData = function(f) {
        for (var a = f && f.length, c = 0; a && a > c; c++) {
            var d = f[c];
            d.updateSortData()
        }
    }
    ;
    var w = function() {
        function c(u) {
            if ("string" != typeof u) {
                return u
            }
            var e = z(u).split(" ")
              , h = e[0]
              , f = h.match(/^\[(.+)\]$/)
              , l = f && f[1]
              , p = a(l, h)
              , d = j.sortDataParsers[e[1]];
            return u = d ? function(i) {
                return i && d(p(i))
            }
            : function(i) {
                return i && p(i)
            }
        }
        function a(h, d) {
            var f;
            return f = h ? function(i) {
                return i.getAttribute(h)
            }
            : function(l) {
                var e = l.querySelector(d);
                return e && m(e)
            }
        }
        return c
    }();
    j.sortDataParsers = {
        parseInt: function(a) {
            return parseInt(a, 10)
        },
        parseFloat: function(a) {
            return parseFloat(a)
        }
    },
    j.prototype._sort = function() {
        var d = this.options.sortBy;
        if (d) {
            var a = [].concat.apply(d, this.sortHistory)
              , c = b(a, this.options.sortAscending);
            this.filteredItems.sort(c),
            d != this.sortHistory[0] && this.sortHistory.unshift(d)
        }
    }
    ,
    j.prototype._mode = function() {
        var c = this.options.layoutMode
          , a = this.modes[c];
        if (!a) {
            throw Error("No layout mode: " + c)
        }
        return a.options = this.options[c],
        a
    }
    ,
    j.prototype._resetLayout = function() {
        k.prototype._resetLayout.call(this),
        this._mode()._resetLayout()
    }
    ,
    j.prototype._getItemLayoutPosition = function(a) {
        return this._mode()._getItemLayoutPosition(a)
    }
    ,
    j.prototype._manageStamp = function(a) {
        this._mode()._manageStamp(a)
    }
    ,
    j.prototype._getContainerSize = function() {
        return this._mode()._getContainerSize()
    }
    ,
    j.prototype.needsResizeLayout = function() {
        return this._mode().needsResizeLayout()
    }
    ,
    j.prototype.appended = function(d) {
        var a = this.addItems(d);
        if (a.length) {
            var c = this._filterRevealAdded(a);
            this.filteredItems = this.filteredItems.concat(c)
        }
    }
    ,
    j.prototype.prepended = function(d) {
        var a = this._itemize(d);
        if (a.length) {
            this._resetLayout(),
            this._manageStamps();
            var c = this._filterRevealAdded(a);
            this.layoutItems(this.filteredItems),
            this.filteredItems = c.concat(this.filteredItems),
            this.items = a.concat(this.items)
        }
    }
    ,
    j.prototype._filterRevealAdded = function(c) {
        var a = this._filter(c);
        return this.hide(a.needHide),
        this.reveal(a.matches),
        this.layoutItems(a.matches, !0),
        a.matches
    }
    ,
    j.prototype.insert = function(l) {
        var a = this.addItems(l);
        if (a.length) {
            var c, f, d = a.length;
            for (c = 0; d > c; c++) {
                f = a[c],
                this.element.appendChild(f.element)
            }
            var h = this._filter(a).matches;
            for (c = 0; d > c; c++) {
                a[c].isLayoutInstant = !0
            }
            for (this.arrange(),
            c = 0; d > c; c++) {
                delete a[c].isLayoutInstant
            }
            this.reveal(h)
        }
    }
    ;
    var g = j.prototype.remove;
    return j.prototype.remove = function(h) {
        h = x.makeArray(h);
        var a = this.getItems(h);
        g.call(this, h);
        var c = a && a.length;
        if (c) {
            for (var d = 0; c > d; d++) {
                var f = a[d];
                x.removeFrom(this.filteredItems, f)
            }
        }
    }
    ,
    j.prototype.shuffle = function() {
        for (var d = 0, a = this.items.length; a > d; d++) {
            var c = this.items[d];
            c.sortData.random = Math.random()
        }
        this.options.sortBy = "random",
        this._sort(),
        this._layout()
    }
    ,
    j.prototype._noTransition = function(d) {
        var a = this.options.transitionDuration;
        this.options.transitionDuration = 0;
        var c = d.call(this);
        return this.options.transitionDuration = a,
        c
    }
    ,
    j.prototype.getFilteredItemElements = function() {
        for (var d = [], a = 0, c = this.filteredItems.length; c > a; a++) {
            d.push(this.filteredItems[a].element)
        }
        return d
    }
    ,
    j
});
/* Magnific Popup - v1.1.0 - 2016-02-20
* http://dimsemenov.com/plugins/magnific-popup/
* Copyright (c) 2016 Dmitry Semenov; */
!function(b) {
    "function" == typeof define && define.amd ? define(["jquery"], b) : b("object" == typeof exports ? require("jquery") : window.jQuery || window.Zepto)
}(function(V) {
    var X, Z, ab, ad, af, ah, aj = "Close", al = "BeforeClose", an = "AfterClose", ap = "BeforeAppend", ar = "MarkupParse", au = "Open", aw = "Change", ay = "mfp", aA = "." + ay, aC = "mfp-ready", aE = "mfp-removing", aG = "mfp-prevent-close", aI = function() {}, aK = !!window.jQuery, aM = V(window), aN = function(b, d) {
        X.ev.on(ay + b + aA, d)
    }, aO = function(a, g, h, i) {
        var j = document.createElement("div");
        return j.className = "mfp-" + a,
        h && (j.innerHTML = h),
        i ? g && g.appendChild(j) : (j = V(j),
        g && j.appendTo(g)),
        j
    }, aP = function(a, b) {
        X.ev.triggerHandler(ay + a, b),
        X.st.callbacks && (a = a.charAt(0).toLowerCase() + a.slice(1),
        X.st.callbacks[a] && X.st.callbacks[a].apply(X, V.isArray(b) ? b : [b]))
    }, aQ = function(a) {
        return a === ah && X.currTemplate.closeBtn || (X.currTemplate.closeBtn = V(X.st.closeMarkup.replace("%title%", X.st.tClose)),
        ah = a),
        X.currTemplate.closeBtn
    }, W = function() {
        V.magnificPopup.instance || (X = new aI,
        X.init(),
        V.magnificPopup.instance = X)
    }, Y = function() {
        var c = document.createElement("p").style
          , d = ["ms", "O", "Moz", "Webkit"];
        if (void 0 !== c.transition) {
            return !0
        }
        for (; d.length; ) {
            if (d.pop() + "Transition"in c) {
                return !0
            }
        }
        return !1
    };
    aI.prototype = {
        constructor: aI,
        init: function() {
            var a = navigator.appVersion;
            X.isLowIE = X.isIE8 = document.all && !document.addEventListener,
            X.isAndroid = /android/gi.test(a),
            X.isIOS = /iphone|ipad|ipod/gi.test(a),
            X.supportsTransition = Y(),
            X.probablyMobile = X.isAndroid || X.isIOS || /(Opera Mini)|Kindle|webOS|BlackBerry|(Opera Mobi)|(Windows Phone)|IEMobile/i.test(navigator.userAgent),
            ab = V(document),
            X.popupsCache = {}
        },
        open: function(a) {
            var b;
            if (a.isObj === !1) {
                X.items = a.items.toArray(),
                X.index = 0;
                var d, f = a.items;
                for (b = 0; b < f.length; b++) {
                    if (d = f[b],
                    d.parsed && (d = d.el[0]),
                    d === a.el[0]) {
                        X.index = b;
                        break
                    }
                }
            } else {
                X.items = V.isArray(a.items) ? a.items : [a.items],
                X.index = a.index || 0
            }
            if (X.isOpen) {
                return void X.updateItemHTML()
            }
            X.types = [],
            af = "",
            a.mainEl && a.mainEl.length ? X.ev = a.mainEl.eq(0) : X.ev = ab,
            a.key ? (X.popupsCache[a.key] || (X.popupsCache[a.key] = {}),
            X.currTemplate = X.popupsCache[a.key]) : X.currTemplate = {},
            X.st = V.extend(!0, {}, V.magnificPopup.defaults, a),
            X.fixedContentPos = "auto" === X.st.fixedContentPos ? !X.probablyMobile : X.st.fixedContentPos,
            X.st.modal && (X.st.closeOnContentClick = !1,
            X.st.closeOnBgClick = !1,
            X.st.showCloseBtn = !1,
            X.st.enableEscapeKey = !1),
            X.bgOverlay || (X.bgOverlay = aO("bg").on("click" + aA, function() {
                X.close()
            }),
            X.wrap = aO("wrap").attr("tabindex", -1).on("click" + aA, function(c) {
                X._checkIfClose(c.target) && X.close()
            }),
            X.container = aO("container", X.wrap)),
            X.contentContainer = aO("content"),
            X.st.preloader && (X.preloader = aO("preloader", X.container, X.st.tLoading));
            var l = V.magnificPopup.modules;
            for (b = 0; b < l.length; b++) {
                var m = l[b];
                m = m.charAt(0).toUpperCase() + m.slice(1),
                X["init" + m].call(X)
            }
            aP("BeforeOpen"),
            X.st.showCloseBtn && (X.st.closeBtnInside ? (aN(ar, function(e, g, h, i) {
                h.close_replaceWith = aQ(i.type)
            }),
            af += " mfp-close-btn-in") : X.wrap.append(aQ())),
            X.st.alignTop && (af += " mfp-align-top"),
            X.fixedContentPos ? X.wrap.css({
                overflow: X.st.overflowY,
                overflowX: "hidden",
                overflowY: X.st.overflowY
            }) : X.wrap.css({
                top: aM.scrollTop(),
                position: "absolute"
            }),
            (X.st.fixedBgPos === !1 || "auto" === X.st.fixedBgPos && !X.fixedContentPos) && X.bgOverlay.css({
                height: ab.height(),
                position: "absolute"
            }),
            X.st.enableEscapeKey && ab.on("keyup" + aA, function(c) {
                27 === c.keyCode && X.close()
            }),
            aM.on("resize" + aA, function() {
                X.updateSize()
            }),
            X.st.closeOnContentClick || (af += " mfp-auto-cursor"),
            af && X.wrap.addClass(af);
            var p = X.wH = aM.height()
              , q = {};
            if (X.fixedContentPos && X._hasScrollBar(p)) {
                var s = X._getScrollbarSize();
                s && (q.marginRight = s)
            }
            X.fixedContentPos && (X.isIE7 ? V("body, html").css("overflow", "hidden") : q.overflow = "hidden");
            var t = X.st.mainClass;
            return X.isIE7 && (t += " mfp-ie7"),
            t && X._addClassToMFP(t),
            X.updateItemHTML(),
            aP("BuildControls"),
            V("html").css(q),
            X.bgOverlay.add(X.wrap).prependTo(X.st.prependTo || V(document.body)),
            X._lastFocusedEl = document.activeElement,
            setTimeout(function() {
                X.content ? (X._addClassToMFP(aC),
                X._setFocus()) : X.bgOverlay.addClass(aC),
                ab.on("focusin" + aA, X._onFocusIn)
            }, 16),
            X.isOpen = !0,
            X.updateSize(p),
            aP(au),
            a
        },
        close: function() {
            X.isOpen && (aP(al),
            X.isOpen = !1,
            X.st.removalDelay && !X.isLowIE && X.supportsTransition ? (X._addClassToMFP(aE),
            setTimeout(function() {
                X._close()
            }, X.st.removalDelay)) : X._close())
        },
        _close: function() {
            aP(aj);
            var a = aE + " " + aC + " ";
            if (X.bgOverlay.detach(),
            X.wrap.detach(),
            X.container.empty(),
            X.st.mainClass && (a += X.st.mainClass + " "),
            X._removeClassFromMFP(a),
            X.fixedContentPos) {
                var b = {
                    marginRight: ""
                };
                X.isIE7 ? V("body, html").css("overflow", "") : b.overflow = "",
                V("html").css(b)
            }
            ab.off("keyup" + aA + " focusin" + aA),
            X.ev.off(aA),
            X.wrap.attr("class", "mfp-wrap").removeAttr("style"),
            X.bgOverlay.attr("class", "mfp-bg"),
            X.container.attr("class", "mfp-container"),
            !X.st.showCloseBtn || X.st.closeBtnInside && X.currTemplate[X.currItem.type] !== !0 || X.currTemplate.closeBtn && X.currTemplate.closeBtn.detach(),
            X.st.autoFocusLast && X._lastFocusedEl && V(X._lastFocusedEl).focus(),
            X.currItem = null,
            X.content = null,
            X.currTemplate = null,
            X.prevHeight = 0,
            aP(an)
        },
        updateSize: function(b) {
            if (X.isIOS) {
                var e = document.documentElement.clientWidth / window.innerWidth
                  , f = window.innerHeight * e;
                X.wrap.css("height", f),
                X.wH = f
            } else {
                X.wH = b || aM.height()
            }
            X.fixedContentPos || X.wrap.css("height", X.wH),
            aP("Resize")
        },
        updateItemHTML: function() {
            var a = X.items[X.index];
            X.contentContainer.detach(),
            X.content && X.content.detach(),
            a.parsed || (a = X.parseEl(X.index));
            var b = a.type;
            if (aP("BeforeChange", [X.currItem ? X.currItem.type : "", b]),
            X.currItem = a,
            !X.currTemplate[b]) {
                var e = X.st[b] ? X.st[b].markup : !1;
                aP("FirstMarkupParse", e),
                e ? X.currTemplate[b] = V(e) : X.currTemplate[b] = !0
            }
            ad && ad !== a.type && X.container.removeClass("mfp-" + ad + "-holder");
            var h = X["get" + b.charAt(0).toUpperCase() + b.slice(1)](a, X.currTemplate[b]);
            X.appendContent(h, b),
            a.preloaded = !0,
            aP(aw, a),
            ad = a.type,
            X.container.prepend(X.contentContainer),
            aP("AfterChange")
        },
        appendContent: function(b, d) {
            X.content = b,
            b ? X.st.showCloseBtn && X.st.closeBtnInside && X.currTemplate[d] === !0 ? X.content.find(".mfp-close").length || X.content.append(aQ()) : X.content = b : X.content = "",
            aP(ap),
            X.container.addClass("mfp-" + d + "-holder"),
            X.contentContainer.append(X.content)
        },
        parseEl: function(a) {
            var b, h = X.items[a];
            if (h.tagName ? h = {
                el: V(h)
            } : (b = h.type,
            h = {
                data: h,
                src: h.src
            }),
            h.el) {
                for (var i = X.types, j = 0; j < i.length; j++) {
                    if (h.el.hasClass("mfp-" + i[j])) {
                        b = i[j];
                        break
                    }
                }
                h.src = h.el.attr("data-mfp-src"),
                h.src || (h.src = h.el.attr("href"))
            }
            return h.type = b || X.st.type || "inline",
            h.index = a,
            h.parsed = !0,
            X.items[a] = h,
            aP("ElementParse", h),
            X.items[a]
        },
        addGroup: function(b, f) {
            var g = function(a) {
                a.mfpEl = this,
                X._openClick(a, b, f)
            };
            f || (f = {});
            var h = "click.magnificPopup";
            f.mainEl = b,
            f.items ? (f.isObj = !0,
            b.off(h).on(h, g)) : (f.isObj = !1,
            f.delegate ? b.off(h).on(h, f.delegate, g) : (f.items = b,
            b.off(h).on(h, g)))
        },
        _openClick: function(a, b, h) {
            var i = void 0 !== h.midClick ? h.midClick : V.magnificPopup.defaults.midClick;
            if (i || !(2 === a.which || a.ctrlKey || a.metaKey || a.altKey || a.shiftKey)) {
                var j = void 0 !== h.disableOn ? h.disableOn : V.magnificPopup.defaults.disableOn;
                if (j) {
                    if (V.isFunction(j)) {
                        if (!j.call(X)) {
                            return !0
                        }
                    } else {
                        if (aM.width() < j) {
                            return !0
                        }
                    }
                }
                a.type && (a.preventDefault(),
                X.isOpen && a.stopPropagation()),
                h.el = V(a.mfpEl),
                h.delegate && (h.items = b.find(h.delegate)),
                X.open(h)
            }
        },
        updateStatus: function(b, c) {
            if (X.preloader) {
                Z !== b && X.container.removeClass("mfp-s-" + Z),
                c || "loading" !== b || (c = X.st.tLoading);
                var f = {
                    status: b,
                    text: c
                };
                aP("UpdateStatus", f),
                b = f.status,
                c = f.text,
                X.preloader.html(c),
                X.preloader.find("a").on("click", function(d) {
                    d.stopImmediatePropagation()
                }),
                X.container.addClass("mfp-s-" + b),
                Z = b
            }
        },
        _checkIfClose: function(a) {
            if (!V(a).hasClass(aG)) {
                var b = X.st.closeOnContentClick
                  , f = X.st.closeOnBgClick;
                if (b && f) {
                    return !0
                }
                if (!X.content || V(a).hasClass("mfp-close") || X.preloader && a === X.preloader[0]) {
                    return !0
                }
                if (a === X.content[0] || V.contains(X.content[0], a)) {
                    if (b) {
                        return !0
                    }
                } else {
                    if (f && V.contains(document, a)) {
                        return !0
                    }
                }
                return !1
            }
        },
        _addClassToMFP: function(b) {
            X.bgOverlay.addClass(b),
            X.wrap.addClass(b)
        },
        _removeClassFromMFP: function(b) {
            this.bgOverlay.removeClass(b),
            X.wrap.removeClass(b)
        },
        _hasScrollBar: function(b) {
            return (X.isIE7 ? ab.height() : document.body.scrollHeight) > (b || aM.height())
        },
        _setFocus: function() {
            (X.st.focus ? X.content.find(X.st.focus).eq(0) : X.wrap).focus()
        },
        _onFocusIn: function(a) {
            return a.target === X.wrap[0] || V.contains(X.wrap[0], a.target) ? void 0 : (X._setFocus(),
            !1)
        },
        _parseMarkup: function(a, f, g) {
            var h;
            g.data && (f = V.extend(g.data, f)),
            aP(ar, [a, f, g]),
            V.each(f, function(b, e) {
                if (void 0 === e || e === !1) {
                    return !0
                }
                if (h = b.split("_"),
                h.length > 1) {
                    var i = a.find(aA + "-" + h[0]);
                    if (i.length > 0) {
                        var j = h[1];
                        "replaceWith" === j ? i[0] !== e[0] && i.replaceWith(e) : "img" === j ? i.is("img") ? i.attr("src", e) : i.replaceWith(V("<img>").attr("src", e).attr("class", i.attr("class"))) : i.attr(h[1], e)
                    }
                } else {
                    a.find(aA + "-" + b).html(e)
                }
            })
        },
        _getScrollbarSize: function() {
            if (void 0 === X.scrollbarSize) {
                var b = document.createElement("div");
                b.style.cssText = "width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;",
                document.body.appendChild(b),
                X.scrollbarSize = b.offsetWidth - b.clientWidth,
                document.body.removeChild(b)
            }
            return X.scrollbarSize
        }
    },
    V.magnificPopup = {
        instance: null,
        proto: aI.prototype,
        modules: [],
        open: function(a, d) {
            return W(),
            a = a ? V.extend(!0, {}, a) : {},
            a.isObj = !0,
            a.index = d || 0,
            this.instance.open(a)
        },
        close: function() {
            return V.magnificPopup.instance && V.magnificPopup.instance.close()
        },
        registerModule: function(a, d) {
            d.options && (V.magnificPopup.defaults[a] = d.options),
            V.extend(this.proto, d.proto),
            this.modules.push(a)
        },
        defaults: {
            disableOn: 0,
            key: null,
            midClick: !1,
            mainClass: "",
            preloader: !0,
            focus: "",
            closeOnContentClick: !1,
            closeOnBgClick: !0,
            closeBtnInside: !0,
            showCloseBtn: !0,
            enableEscapeKey: !0,
            modal: !1,
            alignTop: !1,
            removalDelay: 0,
            prependTo: null,
            fixedContentPos: "auto",
            fixedBgPos: "auto",
            overflowY: "auto",
            closeMarkup: '<button title="%title%" type="button" class="mfp-close">&#215;</button>',
            tClose: "Close (Esc)",
            tLoading: "Loading...",
            autoFocusLast: !0
        }
    },
    V.fn.magnificPopup = function(a) {
        W();
        var b = V(this);
        if ("string" == typeof a) {
            if ("open" === a) {
                var h, i = aK ? b.data("magnificPopup") : b[0].magnificPopup, j = parseInt(arguments[1], 10) || 0;
                i.items ? h = i.items[j] : (h = b,
                i.delegate && (h = h.find(i.delegate)),
                h = h.eq(j)),
                X._openClick({
                    mfpEl: h
                }, b, i)
            } else {
                X.isOpen && X[a].apply(X, Array.prototype.slice.call(arguments, 1))
            }
        } else {
            a = V.extend(!0, {}, a),
            aK ? b.data("magnificPopup", a) : b[0].magnificPopup = a,
            X.addGroup(b, a)
        }
        return b
    }
    ;
    var aa, ac, ae, ag = "inline", ai = function() {
        ae && (ac.after(ae.addClass(aa)).detach(),
        ae = null)
    };
    V.magnificPopup.registerModule(ag, {
        options: {
            hiddenClass: "hide",
            markup: "",
            tNotFound: "Content not found"
        },
        proto: {
            initInline: function() {
                X.types.push(ag),
                aN(aj + "." + ag, function() {
                    ai()
                })
            },
            getInline: function(a, b) {
                if (ai(),
                a.src) {
                    var h = X.st.inline
                      , i = V(a.src);
                    if (i.length) {
                        var j = i[0].parentNode;
                        j && j.tagName && (ac || (aa = h.hiddenClass,
                        ac = aO(aa),
                        aa = "mfp-" + aa),
                        ae = i.after(ac).detach().removeClass(aa)),
                        X.updateStatus("ready")
                    } else {
                        X.updateStatus("error", h.tNotFound),
                        i = V("<div>")
                    }
                    return a.inlineElement = i,
                    i
                }
                return X.updateStatus("ready"),
                X._parseMarkup(b, {}, a),
                b
            }
        }
    });
    var ak, am = "ajax", ao = function() {
        ak && V(document.body).removeClass(ak)
    }, aq = function() {
        ao(),
        X.req && X.req.abort()
    };
    V.magnificPopup.registerModule(am, {
        options: {
            settings: null,
            cursor: "mfp-ajax-cur",
            tError: '<a href="%url%">The content</a> could not be loaded.'
        },
        proto: {
            initAjax: function() {
                X.types.push(am),
                ak = X.st.ajax.cursor,
                aN(aj + "." + am, aq),
                aN("BeforeChange." + am, aq)
            },
            getAjax: function(a) {
                ak && V(document.body).addClass(ak),
                X.updateStatus("loading");
                var b = V.extend({
                    url: a.src,
                    success: function(c, h, i) {
                        var j = {
                            data: c,
                            xhr: i
                        };
                        aP("ParseAjax", j),
                        X.appendContent(V(j.data), am),
                        a.finished = !0,
                        ao(),
                        X._setFocus(),
                        setTimeout(function() {
                            X.wrap.addClass(aC)
                        }, 16),
                        X.updateStatus("ready"),
                        aP("AjaxContentAdded")
                    },
                    error: function() {
                        ao(),
                        a.finished = a.loadError = !0,
                        X.updateStatus("error", X.st.ajax.tError.replace("%url%", a.src))
                    }
                }, X.st.ajax.settings);
                return X.req = V.ajax(b),
                ""
            }
        }
    });
    var at, av = function(a) {
        if (a.data && void 0 !== a.data.title) {
            return a.data.title
        }
        var b = X.st.image.titleSrc;
        if (b) {
            if (V.isFunction(b)) {
                return b.call(X, a)
            }
            if (a.el) {
                return a.el.attr(b) || ""
            }
        }
        return ""
    };
    V.magnificPopup.registerModule("image", {
        options: {
            markup: '<div class="mfp-figure"><div class="mfp-close"></div><figure><div class="mfp-img"></div><figcaption><div class="mfp-bottom-bar"><div class="mfp-title"></div><div class="mfp-counter"></div></div></figcaption></figure></div>',
            cursor: "mfp-zoom-out-cur",
            titleSrc: "title",
            verticalFit: !0,
            tError: '<a href="%url%">The image</a> could not be loaded.'
        },
        proto: {
            initImage: function() {
                var a = X.st.image
                  , b = ".image";
                X.types.push("image"),
                aN(au + b, function() {
                    "image" === X.currItem.type && a.cursor && V(document.body).addClass(a.cursor)
                }),
                aN(aj + b, function() {
                    a.cursor && V(document.body).removeClass(a.cursor),
                    aM.off("resize" + aA)
                }),
                aN("Resize" + b, X.resizeImage),
                X.isLowIE && aN("AfterChange", X.resizeImage)
            },
            resizeImage: function() {
                var b = X.currItem;
                if (b && b.img && X.st.image.verticalFit) {
                    var d = 0;
                    X.isLowIE && (d = parseInt(b.img.css("padding-top"), 10) + parseInt(b.img.css("padding-bottom"), 10)),
                    b.img.css("max-height", X.wH - d)
                }
            },
            _onImageHasSize: function(b) {
                b.img && (b.hasSize = !0,
                at && clearInterval(at),
                b.isCheckingImgSize = !1,
                aP("ImageHasSize", b),
                b.imgHidden && (X.content && X.content.removeClass("mfp-loading"),
                b.imgHidden = !1))
            },
            findImageSize: function(b) {
                var f = 0
                  , g = b.img[0]
                  , h = function(a) {
                    at && clearInterval(at),
                    at = setInterval(function() {
                        return g.naturalWidth > 0 ? void X._onImageHasSize(b) : (f > 200 && clearInterval(at),
                        f++,
                        void (3 === f ? h(10) : 40 === f ? h(50) : 100 === f && h(500)))
                    }, a)
                };
                h(1)
            },
            getImage: function(a, b) {
                var k = 0
                  , l = function() {
                    a && (a.img[0].complete ? (a.img.off(".mfploader"),
                    a === X.currItem && (X._onImageHasSize(a),
                    X.updateStatus("ready")),
                    a.hasSize = !0,
                    a.loaded = !0,
                    aP("ImageLoadComplete")) : (k++,
                    200 > k ? setTimeout(l, 100) : m()))
                }
                  , m = function() {
                    a && (a.img.off(".mfploader"),
                    a === X.currItem && (X._onImageHasSize(a),
                    X.updateStatus("error", n.tError.replace("%url%", a.src))),
                    a.hasSize = !0,
                    a.loaded = !0,
                    a.loadError = !0)
                }
                  , n = X.st.image
                  , o = b.find(".mfp-img");
                if (o.length) {
                    var p = document.createElement("img");
                    p.className = "mfp-img",
                    a.el && a.el.find("img").length && (p.alt = a.el.find("img").attr("alt")),
                    a.img = V(p).on("load.mfploader", l).on("error.mfploader", m),
                    p.src = a.src,
                    o.is("img") && (a.img = a.img.clone()),
                    p = a.img[0],
                    p.naturalWidth > 0 ? a.hasSize = !0 : p.width || (a.hasSize = !1)
                }
                return X._parseMarkup(b, {
                    title: av(a),
                    img_replaceWith: a.img
                }, a),
                X.resizeImage(),
                a.hasSize ? (at && clearInterval(at),
                a.loadError ? (b.addClass("mfp-loading"),
                X.updateStatus("error", n.tError.replace("%url%", a.src))) : (b.removeClass("mfp-loading"),
                X.updateStatus("ready")),
                b) : (X.updateStatus("loading"),
                a.loading = !0,
                a.hasSize || (a.imgHidden = !0,
                b.addClass("mfp-loading"),
                X.findImageSize(a)),
                b)
            }
        }
    });
    var ax, az = function() {
        return void 0 === ax && (ax = void 0 !== document.createElement("p").style.MozTransform),
        ax
    };
    V.magnificPopup.registerModule("zoom", {
        options: {
            enabled: !1,
            easing: "ease-in-out",
            duration: 300,
            opener: function(b) {
                return b.is("img") ? b : b.find("img")
            }
        },
        proto: {
            initZoom: function() {
                var b, h = X.st.zoom, i = ".zoom";
                if (h.enabled && X.supportsTransition) {
                    var l, m, n = h.duration, o = function(c) {
                        var g = c.clone().removeAttr("style").removeAttr("class").addClass("mfp-animated-image")
                          , j = "all " + h.duration / 1000 + "s " + h.easing
                          , k = {
                            position: "fixed",
                            zIndex: 9999,
                            left: 0,
                            top: 0,
                            "-webkit-backface-visibility": "hidden"
                        }
                          , q = "transition";
                        return k["-webkit-" + q] = k["-moz-" + q] = k["-o-" + q] = k[q] = j,
                        g.css(k),
                        g
                    }, p = function() {
                        X.content.css("visibility", "visible")
                    };
                    aN("BuildControls" + i, function() {
                        if (X._allowZoom()) {
                            if (clearTimeout(l),
                            X.content.css("visibility", "hidden"),
                            b = X._getItemToZoom(),
                            !b) {
                                return void p()
                            }
                            m = o(b),
                            m.css(X._getOffset()),
                            X.wrap.append(m),
                            l = setTimeout(function() {
                                m.css(X._getOffset(!0)),
                                l = setTimeout(function() {
                                    p(),
                                    setTimeout(function() {
                                        m.remove(),
                                        b = m = null,
                                        aP("ZoomAnimationEnded")
                                    }, 16)
                                }, n)
                            }, 16)
                        }
                    }),
                    aN(al + i, function() {
                        if (X._allowZoom()) {
                            if (clearTimeout(l),
                            X.st.removalDelay = n,
                            !b) {
                                if (b = X._getItemToZoom(),
                                !b) {
                                    return
                                }
                                m = o(b)
                            }
                            m.css(X._getOffset(!0)),
                            X.wrap.append(m),
                            X.content.css("visibility", "hidden"),
                            setTimeout(function() {
                                m.css(X._getOffset())
                            }, 16)
                        }
                    }),
                    aN(aj + i, function() {
                        X._allowZoom() && (p(),
                        m && m.remove(),
                        b = null)
                    })
                }
            },
            _allowZoom: function() {
                return "image" === X.currItem.type
            },
            _getItemToZoom: function() {
                return X.currItem.hasSize ? X.currItem.img : !1
            },
            _getOffset: function(a) {
                var b;
                b = a ? X.currItem.img : X.st.zoom.opener(X.currItem.el || X.currItem);
                var i = b.offset()
                  , j = parseInt(b.css("padding-top"), 10)
                  , k = parseInt(b.css("padding-bottom"), 10);
                i.top -= V(window).scrollTop() - j;
                var l = {
                    width: b.width(),
                    height: (aK ? b.innerHeight() : b[0].offsetHeight) - k - j
                };
                return az() ? l["-moz-transform"] = l.transform = "translate(" + i.left + "px," + i.top + "px)" : (l.left = i.left,
                l.top = i.top),
                l
            }
        }
    });
    var aB = "iframe"
      , aD = "//about:blank"
      , aF = function(b) {
        if (X.currTemplate[aB]) {
            var d = X.currTemplate[aB].find("iframe");
            d.length && (b || (d[0].src = aD),
            X.isIE8 && d.css("display", b ? "block" : "none"))
        }
    };
    V.magnificPopup.registerModule(aB, {
        options: {
            markup: '<div class="mfp-iframe-scaler"><div class="mfp-close"></div><iframe class="mfp-iframe" src="//about:blank" frameborder="0" allowfullscreen></iframe></div>',
            srcAction: "iframe_src",
            patterns: {
                youtube: {
                    index: "youtube.com",
                    id: "v=",
                    src: "//www.youtube.com/embed/%id%?autoplay=1"
                },
                vimeo: {
                    index: "vimeo.com/",
                    id: "/",
                    src: "//player.vimeo.com/video/%id%?autoplay=1"
                },
                gmaps: {
                    index: "//maps.google.",
                    src: "%id%&output=embed"
                }
            }
        },
        proto: {
            initIframe: function() {
                X.types.push(aB),
                aN("BeforeChange", function(d, e, f) {
                    e !== f && (e === aB ? aF() : f === aB && aF(!0))
                }),
                aN(aj + "." + aB, function() {
                    aF()
                })
            },
            getIframe: function(a, b) {
                var h = a.src
                  , i = X.st.iframe;
                V.each(i.patterns, function() {
                    return h.indexOf(this.index) > -1 ? (this.id && (h = "string" == typeof this.id ? h.substr(h.lastIndexOf(this.id) + this.id.length, h.length) : this.id.call(this, h)),
                    h = this.src.replace("%id%", h),
                    !1) : void 0
                });
                var j = {};
                return i.srcAction && (j[i.srcAction] = h),
                X._parseMarkup(b, j, a),
                X.updateStatus("ready"),
                b
            }
        }
    });
    var aH = function(b) {
        var d = X.items.length;
        return b > d - 1 ? b - d : 0 > b ? d + b : b
    }
      , aJ = function(d, e, f) {
        return d.replace(/%curr%/gi, e + 1).replace(/%total%/gi, f)
    };
    V.magnificPopup.registerModule("gallery", {
        options: {
            enabled: !1,
            arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>',
            preload: [0, 2],
            navigateByImgClick: !0,
            arrows: !0,
            tPrev: "Previous (Left arrow key)",
            tNext: "Next (Right arrow key)",
            tCounter: "%curr% of %total%"
        },
        proto: {
            initGallery: function() {
                var a = X.st.gallery
                  , b = ".mfp-gallery";
                return X.direction = !0,
                a && a.enabled ? (af += " mfp-gallery",
                aN(au + b, function() {
                    a.navigateByImgClick && X.wrap.on("click" + b, ".mfp-img", function() {
                        return X.items.length > 1 ? (X.next(),
                        !1) : void 0
                    }),
                    ab.on("keydown" + b, function(c) {
                        37 === c.keyCode ? X.prev() : 39 === c.keyCode && X.next()
                    })
                }),
                aN("UpdateStatus" + b, function(d, e) {
                    e.text && (e.text = aJ(e.text, X.currItem.index, X.items.length))
                }),
                aN(ar + b, function(c, h, i, j) {
                    var k = X.items.length;
                    i.counter = k > 1 ? aJ(a.tCounter, j.index, k) : ""
                }),
                aN("BuildControls" + b, function() {
                    if (X.items.length > 1 && a.arrows && !X.arrowLeft) {
                        var c = a.arrowMarkup
                          , g = X.arrowLeft = V(c.replace(/%title%/gi, a.tPrev).replace(/%dir%/gi, "left")).addClass(aG)
                          , h = X.arrowRight = V(c.replace(/%title%/gi, a.tNext).replace(/%dir%/gi, "right")).addClass(aG);
                        g.click(function() {
                            X.prev()
                        }),
                        h.click(function() {
                            X.next()
                        }),
                        X.container.append(g.add(h))
                    }
                }),
                aN(aw + b, function() {
                    X._preloadTimeout && clearTimeout(X._preloadTimeout),
                    X._preloadTimeout = setTimeout(function() {
                        X.preloadNearbyImages(),
                        X._preloadTimeout = null
                    }, 16)
                }),
                void aN(aj + b, function() {
                    ab.off(b),
                    X.wrap.off("click" + b),
                    X.arrowRight = X.arrowLeft = null
                })) : !1
            },
            next: function() {
                X.direction = !0,
                X.index = aH(X.index + 1),
                X.updateItemHTML()
            },
            prev: function() {
                X.direction = !1,
                X.index = aH(X.index - 1),
                X.updateItemHTML()
            },
            goTo: function(b) {
                X.direction = b >= X.index,
                X.index = b,
                X.updateItemHTML()
            },
            preloadNearbyImages: function() {
                var b, f = X.st.gallery.preload, g = Math.min(f[0], X.items.length), h = Math.min(f[1], X.items.length);
                for (b = 1; b <= (X.direction ? h : g); b++) {
                    X._preloadItem(X.index + b)
                }
                for (b = 1; b <= (X.direction ? g : h); b++) {
                    X._preloadItem(X.index - b)
                }
            },
            _preloadItem: function(a) {
                if (a = aH(a),
                !X.items[a].preloaded) {
                    var b = X.items[a];
                    b.parsed || (b = X.parseEl(a)),
                    aP("LazyLoad", b),
                    "image" === b.type && (b.img = V('<img class="mfp-img" />').on("load.mfploader", function() {
                        b.hasSize = !0
                    }).on("error.mfploader", function() {
                        b.hasSize = !0,
                        b.loadError = !0,
                        aP("LazyLoadError", b)
                    }).attr("src", b.src)),
                    b.preloaded = !0
                }
            }
        }
    });
    var aL = "retina";
    V.magnificPopup.registerModule(aL, {
        options: {
            replaceSrc: function(b) {
                return b.src.replace(/\.\w+$/, function(c) {
                    return "@2x" + c
                })
            },
            ratio: 1
        },
        proto: {
            initRetina: function() {
                if (window.devicePixelRatio > 1) {
                    var b = X.st.retina
                      , d = b.ratio;
                    d = isNaN(d) ? d() : d,
                    d > 1 && (aN("ImageHasSize." + aL, function(c, e) {
                        e.img.css({
                            "max-width": e.img[0].naturalWidth / d,
                            width: "100%"
                        })
                    }),
                    aN("ElementParse." + aL, function(a, c) {
                        c.src = b.replaceSrc(c, d)
                    }))
                }
            }
        }
    }),
    W()
});
!function(p, q, r, s) {
    function t(a, d) {
        this.settings = null,
        this.options = p.extend({}, t.Defaults, d),
        this.$element = p(a),
        this.drag = p.extend({}, B),
        this.state = p.extend({}, C),
        this.e = p.extend({}, D),
        this._plugins = {},
        this._supress = {},
        this._current = null,
        this._speed = null,
        this._coordinates = [],
        this._breakpoint = null,
        this._width = null,
        this._items = [],
        this._clones = [],
        this._mergers = [],
        this._invalidated = {},
        this._pipe = [],
        p.each(t.Plugins, p.proxy(function(c, e) {
            this._plugins[c[0].toLowerCase() + c.slice(1)] = new e(this)
        }, this)),
        p.each(t.Pipe, p.proxy(function(e, f) {
            this._pipe.push({
                filter: f.filter,
                run: p.proxy(f.run, this)
            })
        }, this)),
        this.setup(),
        this.initialize()
    }
    function u(b) {
        if (b.touches !== s) {
            return {
                x: b.touches[0].pageX,
                y: b.touches[0].pageY
            }
        }
        if (b.touches === s) {
            if (b.pageX !== s) {
                return {
                    x: b.pageX,
                    y: b.pageY
                }
            }
            if (b.pageX === s) {
                return {
                    x: b.clientX,
                    y: b.clientY
                }
            }
        }
    }
    function v(c) {
        var g, h, i = r.createElement("div"), j = c;
        for (g in j) {
            if (h = j[g],
            "undefined" != typeof i.style[h]) {
                return i = null,
                [h, g]
            }
        }
        return [!1]
    }
    function w() {
        return v(["transition", "WebkitTransition", "MozTransition", "OTransition"])[1]
    }
    function x() {
        return v(["transform", "WebkitTransform", "MozTransform", "OTransform", "msTransform"])[0]
    }
    function y() {
        return v(["perspective", "webkitPerspective", "MozPerspective", "OPerspective", "MsPerspective"])[0]
    }
    function z() {
        return "ontouchstart"in q || !!navigator.msMaxTouchPoints
    }
    function A() {
        return q.navigator.msPointerEnabled
    }
    var B, C, D;
    B = {
        start: 0,
        startX: 0,
        startY: 0,
        current: 0,
        currentX: 0,
        currentY: 0,
        offsetX: 0,
        offsetY: 0,
        distance: null,
        startTime: 0,
        endTime: 0,
        updatedX: 0,
        targetEl: null
    },
    C = {
        isTouch: !1,
        isScrolling: !1,
        isSwiping: !1,
        direction: !1,
        inMotion: !1
    },
    D = {
        _onDragStart: null,
        _onDragMove: null,
        _onDragEnd: null,
        _transitionEnd: null,
        _resizer: null,
        _responsiveCall: null,
        _goToLoop: null,
        _checkVisibile: null
    },
    t.Defaults = {
        items: 3,
        loop: !1,
        center: !1,
        mouseDrag: !0,
        touchDrag: !0,
        pullDrag: !0,
        freeDrag: !1,
        margin: 0,
        stagePadding: 0,
        merge: !1,
        mergeFit: !0,
        autoWidth: !1,
        startPosition: 0,
        rtl: !1,
        smartSpeed: 250,
        fluidSpeed: !1,
        dragEndSpeed: !1,
        responsive: {},
        responsiveRefreshRate: 200,
        responsiveBaseElement: q,
        responsiveClass: !1,
        fallbackEasing: "swing",
        info: !1,
        nestedItemSelector: !1,
        itemElement: "div",
        stageElement: "div",
        themeClass: "owl-theme",
        baseClass: "owl-carousel",
        itemClass: "owl-item",
        centerClass: "center",
        activeClass: "active"
    },
    t.Width = {
        Default: "default",
        Inner: "inner",
        Outer: "outer"
    },
    t.Plugins = {},
    t.Pipe = [{
        filter: ["width", "items", "settings"],
        run: function(b) {
            b.current = this._items && this._items[this.relative(this._current)]
        }
    }, {
        filter: ["items", "settings"],
        run: function() {
            var c = this._clones
              , d = this.$stage.children(".cloned");
            (d.length !== c.length || !this.settings.loop && c.length > 0) && (this.$stage.children(".cloned").remove(),
            this._clones = [])
        }
    }, {
        filter: ["items", "settings"],
        run: function() {
            var f, g, h = this._clones, i = this._items, j = this.settings.loop ? h.length - Math.max(2 * this.settings.items, 4) : 0;
            for (f = 0,
            g = Math.abs(j / 2); g > f; f++) {
                j > 0 ? (this.$stage.children().eq(i.length + h.length - 1).remove(),
                h.pop(),
                this.$stage.children().eq(0).remove(),
                h.pop()) : (h.push(h.length / 2),
                this.$stage.append(i[h[h.length - 1]].clone().addClass("cloned")),
                h.push(i.length - 1 - (h.length - 1) / 2),
                this.$stage.prepend(i[h[h.length - 1]].clone().addClass("cloned")))
            }
        }
    }, {
        filter: ["width", "items", "settings"],
        run: function() {
            var g, h, i, j = this.settings.rtl ? 1 : -1, k = (this.width() / this.settings.items).toFixed(3), l = 0;
            for (this._coordinates = [],
            h = 0,
            i = this._clones.length + this._items.length; i > h; h++) {
                g = this._mergers[this.relative(h)],
                g = this.settings.mergeFit && Math.min(g, this.settings.items) || g,
                l += (this.settings.autoWidth ? this._items[this.relative(h)].width() + this.settings.margin : k * g) * j,
                this._coordinates.push(l)
            }
        }
    }, {
        filter: ["width", "items", "settings"],
        run: function() {
            var a, f, g = (this.width() / this.settings.items).toFixed(3), h = {
                width: Math.abs(this._coordinates[this._coordinates.length - 1]) + 2 * this.settings.stagePadding,
                "padding-left": this.settings.stagePadding || "",
                "padding-right": this.settings.stagePadding || ""
            };
            if (this.$stage.css(h),
            h = {
                width: this.settings.autoWidth ? "auto" : g - this.settings.margin
            },
            h[this.settings.rtl ? "margin-left" : "margin-right"] = this.settings.margin,
            !this.settings.autoWidth && p.grep(this._mergers, function(b) {
                return b > 1
            }).length > 0) {
                for (a = 0,
                f = this._coordinates.length; f > a; a++) {
                    h.width = Math.abs(this._coordinates[a]) - Math.abs(this._coordinates[a - 1] || 0) - this.settings.margin,
                    this.$stage.children().eq(a).css(h)
                }
            } else {
                this.$stage.children().css(h)
            }
        }
    }, {
        filter: ["width", "items", "settings"],
        run: function(b) {
            b.current && this.reset(this.$stage.children().index(b.current))
        }
    }, {
        filter: ["position"],
        run: function() {
            this.animate(this.coordinates(this._current))
        }
    }, {
        filter: ["width", "position", "items", "settings"],
        run: function() {
            var j, k, l, m, n = this.settings.rtl ? 1 : -1, o = 2 * this.settings.stagePadding, E = this.coordinates(this.current()) + o, F = E + this.width() * n, G = [];
            for (l = 0,
            m = this._coordinates.length; m > l; l++) {
                j = this._coordinates[l - 1] || 0,
                k = Math.abs(this._coordinates[l]) + o * n,
                (this.op(j, "<=", E) && this.op(j, ">", F) || this.op(k, "<", E) && this.op(k, ">", F)) && G.push(l)
            }
            this.$stage.children("." + this.settings.activeClass).removeClass(this.settings.activeClass),
            this.$stage.children(":eq(" + G.join("), :eq(") + ")").addClass(this.settings.activeClass),
            this.settings.center && (this.$stage.children("." + this.settings.centerClass).removeClass(this.settings.centerClass),
            this.$stage.children().eq(this.current()).addClass(this.settings.centerClass))
        }
    }],
    t.prototype.initialize = function() {
        if (this.trigger("initialize"),
        this.$element.addClass(this.settings.baseClass).addClass(this.settings.themeClass).toggleClass("owl-rtl", this.settings.rtl),
        this.browserSupport(),
        this.settings.autoWidth && this.state.imagesLoaded !== !0) {
            var a, d, f;
            if (a = this.$element.find("img"),
            d = this.settings.nestedItemSelector ? "." + this.settings.nestedItemSelector : s,
            f = this.$element.children(d).width(),
            a.length && 0 >= f) {
                return this.preloadAutoWidthImages(a),
                !1
            }
        }
        this.$element.addClass("owl-loading"),
        this.$stage = p("<" + this.settings.stageElement + ' class="owl-stage"/>').wrap('<div class="owl-stage-outer">'),
        this.$element.append(this.$stage.parent()),
        this.replace(this.$element.children().not(this.$stage.parent())),
        this._width = this.$element.width(),
        this.refresh(),
        this.$element.removeClass("owl-loading").addClass("owl-loaded"),
        this.eventsCall(),
        this.internalEvents(),
        this.addTriggerableEvents(),
        this.trigger("initialized")
    }
    ,
    t.prototype.setup = function() {
        var a = this.viewport()
          , f = this.options.responsive
          , g = -1
          , h = null;
        f ? (p.each(f, function(b) {
            a >= b && b > g && (g = Number(b))
        }),
        h = p.extend({}, this.options, f[g]),
        delete h.responsive,
        h.responsiveClass && this.$element.attr("class", function(c, d) {
            return d.replace(/\b owl-responsive-\S+/g, "")
        }).addClass("owl-responsive-" + g)) : h = p.extend({}, this.options),
        (null === this.settings || this._breakpoint !== g) && (this.trigger("change", {
            property: {
                name: "settings",
                value: h
            }
        }),
        this._breakpoint = g,
        this.settings = h,
        this.invalidate("settings"),
        this.trigger("changed", {
            property: {
                name: "settings",
                value: this.settings
            }
        }))
    }
    ,
    t.prototype.optionsLogic = function() {
        this.$element.toggleClass("owl-center", this.settings.center),
        this.settings.loop && this._items.length < this.settings.items && (this.settings.loop = !1),
        this.settings.autoWidth && (this.settings.stagePadding = !1,
        this.settings.merge = !1)
    }
    ,
    t.prototype.prepare = function(a) {
        var d = this.trigger("prepare", {
            content: a
        });
        return d.data || (d.data = p("<" + this.settings.itemElement + "/>").addClass(this.settings.itemClass).append(a)),
        this.trigger("prepared", {
            content: d.data
        }),
        d.data
    }
    ,
    t.prototype.update = function() {
        for (var a = 0, f = this._pipe.length, g = p.proxy(function(b) {
            return this[b]
        }, this._invalidated), h = {}; f > a; ) {
            (this._invalidated.all || p.grep(this._pipe[a].filter, g).length > 0) && this._pipe[a].run(h),
            a++
        }
        this._invalidated = {}
    }
    ,
    t.prototype.width = function(b) {
        switch (b = b || t.Width.Default) {
        case t.Width.Inner:
        case t.Width.Outer:
            return this._width;
        default:
            return this._width - 2 * this.settings.stagePadding + this.settings.margin
        }
    }
    ,
    t.prototype.refresh = function() {
        if (0 === this._items.length) {
            return !1
        }
        (new Date).getTime();
        this.trigger("refresh"),
        this.setup(),
        this.optionsLogic(),
        this.$stage.addClass("owl-refresh"),
        this.update(),
        this.$stage.removeClass("owl-refresh"),
        this.state.orientation = q.orientation,
        this.watchVisibility(),
        this.trigger("refreshed")
    }
    ,
    t.prototype.eventsCall = function() {
        this.e._onDragStart = p.proxy(function(b) {
            this.onDragStart(b)
        }, this),
        this.e._onDragMove = p.proxy(function(b) {
            this.onDragMove(b)
        }, this),
        this.e._onDragEnd = p.proxy(function(b) {
            this.onDragEnd(b)
        }, this),
        this.e._onResize = p.proxy(function(b) {
            this.onResize(b)
        }, this),
        this.e._transitionEnd = p.proxy(function(b) {
            this.transitionEnd(b)
        }, this),
        this.e._preventClick = p.proxy(function(b) {
            this.preventClick(b)
        }, this)
    }
    ,
    t.prototype.onThrottledResize = function() {
        q.clearTimeout(this.resizeTimer),
        this.resizeTimer = q.setTimeout(this.e._onResize, this.settings.responsiveRefreshRate)
    }
    ,
    t.prototype.onResize = function() {
        return this._items.length ? this._width === this.$element.width() ? !1 : this.trigger("resize").isDefaultPrevented() ? !1 : (this._width = this.$element.width(),
        this.invalidate("width"),
        this.refresh(),
        void this.trigger("resized")) : !1
    }
    ,
    t.prototype.eventsRouter = function(c) {
        var d = c.type;
        "mousedown" === d || "touchstart" === d ? this.onDragStart(c) : "mousemove" === d || "touchmove" === d ? this.onDragMove(c) : "mouseup" === d || "touchend" === d ? this.onDragEnd(c) : "touchcancel" === d && this.onDragEnd(c)
    }
    ,
    t.prototype.internalEvents = function() {
        var a = (z(),
        A());
        this.settings.mouseDrag ? (this.$stage.on("mousedown", p.proxy(function(b) {
            this.eventsRouter(b)
        }, this)),
        this.$stage.on("dragstart", function() {
            return !1
        }),
        this.$stage.get(0).onselectstart = function() {
            return !1
        }
        ) : this.$element.addClass("owl-text-select-on"),
        this.settings.touchDrag && !a && this.$stage.on("touchstart touchcancel", p.proxy(function(b) {
            this.eventsRouter(b)
        }, this)),
        this.transitionEndVendor && this.on(this.$stage.get(0), this.transitionEndVendor, this.e._transitionEnd, !1),
        this.settings.responsive !== !1 && this.on(q, "resize", p.proxy(this.onThrottledResize, this))
    }
    ,
    t.prototype.onDragStart = function(a) {
        var b, c, f, j;
        if (b = a.originalEvent || a || q.event,
        3 === b.which || this.state.isTouch) {
            return !1
        }
        if ("mousedown" === b.type && this.$stage.addClass("owl-grab"),
        this.trigger("drag"),
        this.drag.startTime = (new Date).getTime(),
        this.speed(0),
        this.state.isTouch = !0,
        this.state.isScrolling = !1,
        this.state.isSwiping = !1,
        this.drag.distance = 0,
        c = u(b).x,
        f = u(b).y,
        this.drag.offsetX = this.$stage.position().left,
        this.drag.offsetY = this.$stage.position().top,
        this.settings.rtl && (this.drag.offsetX = this.$stage.position().left + this.$stage.width() - this.width() + this.settings.margin),
        this.state.inMotion && this.support3d) {
            j = this.getTransformProperty(),
            this.drag.offsetX = j,
            this.animate(j),
            this.state.inMotion = !0
        } else {
            if (this.state.inMotion && !this.support3d) {
                return this.state.inMotion = !1,
                !1
            }
        }
        this.drag.startX = c - this.drag.offsetX,
        this.drag.startY = f - this.drag.offsetY,
        this.drag.start = c - this.drag.startX,
        this.drag.targetEl = b.target || b.srcElement,
        this.drag.updatedX = this.drag.start,
        ("IMG" === this.drag.targetEl.tagName || "A" === this.drag.targetEl.tagName) && (this.drag.targetEl.draggable = !1),
        p(r).on("mousemove.owl.dragEvents mouseup.owl.dragEvents touchmove.owl.dragEvents touchend.owl.dragEvents", p.proxy(function(d) {
            this.eventsRouter(d)
        }, this))
    }
    ,
    t.prototype.onDragMove = function(b) {
        var d, f, k, l, m, n;
        this.state.isTouch && (this.state.isScrolling || (d = b.originalEvent || b || q.event,
        f = u(d).x,
        k = u(d).y,
        this.drag.currentX = f - this.drag.startX,
        this.drag.currentY = k - this.drag.startY,
        this.drag.distance = this.drag.currentX - this.drag.offsetX,
        this.drag.distance < 0 ? this.state.direction = this.settings.rtl ? "right" : "left" : this.drag.distance > 0 && (this.state.direction = this.settings.rtl ? "left" : "right"),
        this.settings.loop ? this.op(this.drag.currentX, ">", this.coordinates(this.minimum())) && "right" === this.state.direction ? this.drag.currentX -= (this.settings.center && this.coordinates(0)) - this.coordinates(this._items.length) : this.op(this.drag.currentX, "<", this.coordinates(this.maximum())) && "left" === this.state.direction && (this.drag.currentX += (this.settings.center && this.coordinates(0)) - this.coordinates(this._items.length)) : (l = this.coordinates(this.settings.rtl ? this.maximum() : this.minimum()),
        m = this.coordinates(this.settings.rtl ? this.minimum() : this.maximum()),
        n = this.settings.pullDrag ? this.drag.distance / 5 : 0,
        this.drag.currentX = Math.max(Math.min(this.drag.currentX, l + n), m + n)),
        (this.drag.distance > 8 || this.drag.distance < -8) && (d.preventDefault !== s ? d.preventDefault() : d.returnValue = !1,
        this.state.isSwiping = !0),
        this.drag.updatedX = this.drag.currentX,
        (this.drag.currentY > 16 || this.drag.currentY < -16) && this.state.isSwiping === !1 && (this.state.isScrolling = !0,
        this.drag.updatedX = this.drag.start),
        this.animate(this.drag.updatedX)))
    }
    ,
    t.prototype.onDragEnd = function(a) {
        var c, g, h;
        if (this.state.isTouch) {
            if ("mouseup" === a.type && this.$stage.removeClass("owl-grab"),
            this.trigger("dragged"),
            this.drag.targetEl.removeAttribute("draggable"),
            this.state.isTouch = !1,
            this.state.isScrolling = !1,
            this.state.isSwiping = !1,
            0 === this.drag.distance && this.state.inMotion !== !0) {
                return this.state.inMotion = !1,
                !1
            }
            this.drag.endTime = (new Date).getTime(),
            c = this.drag.endTime - this.drag.startTime,
            g = Math.abs(this.drag.distance),
            (g > 3 || c > 300) && this.removeClick(this.drag.targetEl),
            h = this.closest(this.drag.updatedX),
            this.speed(this.settings.dragEndSpeed || this.settings.smartSpeed),
            this.current(h),
            this.invalidate("position"),
            this.update(),
            this.settings.pullDrag || this.drag.updatedX !== this.coordinates(h) || this.transitionEnd(),
            this.drag.distance = 0,
            p(r).off(".owl.dragEvents")
        }
    }
    ,
    t.prototype.removeClick = function(a) {
        this.drag.targetEl = a,
        p(a).on("click.preventClick", this.e._preventClick),
        q.setTimeout(function() {
            p(a).off("click.preventClick")
        }, 300)
    }
    ,
    t.prototype.preventClick = function(a) {
        a.preventDefault ? a.preventDefault() : a.returnValue = !1,
        a.stopPropagation && a.stopPropagation(),
        p(a.target).off("click.preventClick")
    }
    ,
    t.prototype.getTransformProperty = function() {
        var b, d;
        return b = q.getComputedStyle(this.$stage.get(0), null).getPropertyValue(this.vendorName + "transform"),
        b = b.replace(/matrix(3d)?\(|\)/g, "").split(","),
        d = 16 === b.length,
        d !== !0 ? b[4] : b[12]
    }
    ,
    t.prototype.closest = function(a) {
        var g = -1
          , h = 30
          , i = this.width()
          , j = this.coordinates();
        return this.settings.freeDrag || p.each(j, p.proxy(function(b, c) {
            return a > c - h && c + h > a ? g = b : this.op(a, "<", c) && this.op(a, ">", j[b + 1] || c - i) && (g = "left" === this.state.direction ? b + 1 : b),
            -1 === g
        }, this)),
        this.settings.loop || (this.op(a, ">", j[this.minimum()]) ? g = a = this.minimum() : this.op(a, "<", j[this.maximum()]) && (g = a = this.maximum())),
        g
    }
    ,
    t.prototype.animate = function(a) {
        this.trigger("translate"),
        this.state.inMotion = this.speed() > 0,
        this.support3d ? this.$stage.css({
            transform: "translate3d(" + a + "px,0px, 0px)",
            transition: this.speed() / 1000 + "s"
        }) : this.state.isTouch ? this.$stage.css({
            left: a + "px"
        }) : this.$stage.animate({
            left: a
        }, this.speed() / 1000, this.settings.fallbackEasing, p.proxy(function() {
            this.state.inMotion && this.transitionEnd()
        }, this))
    }
    ,
    t.prototype.current = function(c) {
        if (c === s) {
            return this._current
        }
        if (0 === this._items.length) {
            return s
        }
        if (c = this.normalize(c),
        this._current !== c) {
            var d = this.trigger("change", {
                property: {
                    name: "position",
                    value: c
                }
            });
            d.data !== s && (c = this.normalize(d.data)),
            this._current = c,
            this.invalidate("position"),
            this.trigger("changed", {
                property: {
                    name: "position",
                    value: this._current
                }
            })
        }
        return this._current
    }
    ,
    t.prototype.invalidate = function(b) {
        this._invalidated[b] = !0
    }
    ,
    t.prototype.reset = function(b) {
        b = this.normalize(b),
        b !== s && (this._speed = 0,
        this._current = b,
        this.suppress(["translate", "translated"]),
        this.animate(this.coordinates(b)),
        this.release(["translate", "translated"]))
    }
    ,
    t.prototype.normalize = function(a, d) {
        var f = d ? this._items.length : this._items.length + this._clones.length;
        return !p.isNumeric(a) || 1 > f ? s : a = this._clones.length ? (a % f + f) % f : Math.max(this.minimum(d), Math.min(this.maximum(d), a))
    }
    ,
    t.prototype.relative = function(b) {
        return b = this.normalize(b),
        b -= this._clones.length / 2,
        this.normalize(b, !0)
    }
    ,
    t.prototype.maximum = function(g) {
        var h, i, j, k = 0, l = this.settings;
        if (g) {
            return this._items.length - 1
        }
        if (!l.loop && l.center) {
            h = this._items.length - 1
        } else {
            if (l.loop || l.center) {
                if (l.loop || l.center) {
                    h = this._items.length + l.items
                } else {
                    if (!l.autoWidth && !l.merge) {
                        throw "Can not detect maximum absolute position."
                    }
                    for (revert = l.rtl ? 1 : -1,
                    i = this.$stage.width() - this.$element.width(); (j = this.coordinates(k)) && !(j * revert >= i); ) {
                        h = ++k
                    }
                }
            } else {
                h = this._items.length - l.items
            }
        }
        return h
    }
    ,
    t.prototype.minimum = function(b) {
        return b ? 0 : this._clones.length / 2
    }
    ,
    t.prototype.items = function(b) {
        return b === s ? this._items.slice() : (b = this.normalize(b, !0),
        this._items[b])
    }
    ,
    t.prototype.mergers = function(b) {
        return b === s ? this._mergers.slice() : (b = this.normalize(b, !0),
        this._mergers[b])
    }
    ,
    t.prototype.clones = function(a) {
        var d = this._clones.length / 2
          , g = d + this._items.length
          , h = function(b) {
            return b % 2 === 0 ? g + b / 2 : d - (b + 1) / 2
        };
        return a === s ? p.map(this._clones, function(c, e) {
            return h(e)
        }) : p.map(this._clones, function(b, e) {
            return b === a ? h(e) : null
        })
    }
    ,
    t.prototype.speed = function(b) {
        return b !== s && (this._speed = b),
        this._speed
    }
    ,
    t.prototype.coordinates = function(a) {
        var d = null;
        return a === s ? p.map(this._coordinates, p.proxy(function(c, e) {
            return this.coordinates(e)
        }, this)) : (this.settings.center ? (d = this._coordinates[a],
        d += (this.width() - d + (this._coordinates[a - 1] || 0)) / 2 * (this.settings.rtl ? -1 : 1)) : d = this._coordinates[a - 1] || 0,
        d)
    }
    ,
    t.prototype.duration = function(d, e, f) {
        return Math.min(Math.max(Math.abs(e - d), 1), 6) * Math.abs(f || this.settings.smartSpeed)
    }
    ,
    t.prototype.to = function(a, b) {
        if (this.settings.loop) {
            var k = a - this.relative(this.current())
              , l = this.current()
              , m = this.current()
              , n = this.current() + k
              , o = 0 > m - n ? !0 : !1
              , E = this._clones.length + this._items.length;
            n < this.settings.items && o === !1 ? (l = m + this._items.length,
            this.reset(l)) : n >= E - this.settings.items && o === !0 && (l = m - this._items.length,
            this.reset(l)),
            q.clearTimeout(this.e._goToLoop),
            this.e._goToLoop = q.setTimeout(p.proxy(function() {
                this.speed(this.duration(this.current(), l + k, b)),
                this.current(l + k),
                this.update()
            }, this), 30)
        } else {
            this.speed(this.duration(this.current(), a, b)),
            this.current(a),
            this.update()
        }
    }
    ,
    t.prototype.next = function(b) {
        b = b || !1,
        this.to(this.relative(this.current()) + 1, b)
    }
    ,
    t.prototype.prev = function(b) {
        b = b || !1,
        this.to(this.relative(this.current()) - 1, b)
    }
    ,
    t.prototype.transitionEnd = function(b) {
        return b !== s && (b.stopPropagation(),
        (b.target || b.srcElement || b.originalTarget) !== this.$stage.get(0)) ? !1 : (this.state.inMotion = !1,
        void this.trigger("translated"))
    }
    ,
    t.prototype.viewport = function() {
        var a;
        if (this.options.responsiveBaseElement !== q) {
            a = p(this.options.responsiveBaseElement).width()
        } else {
            if (q.innerWidth) {
                a = q.innerWidth
            } else {
                if (!r.documentElement || !r.documentElement.clientWidth) {
                    throw "Can not detect viewport width."
                }
                a = r.documentElement.clientWidth
            }
        }
        return a
    }
    ,
    t.prototype.replace = function(a) {
        this.$stage.empty(),
        this._items = [],
        a && (a = a instanceof jQuery ? a : p(a)),
        this.settings.nestedItemSelector && (a = a.find("." + this.settings.nestedItemSelector)),
        a.filter(function() {
            return 1 === this.nodeType
        }).each(p.proxy(function(c, d) {
            d = this.prepare(d),
            this.$stage.append(d),
            this._items.push(d),
            this._mergers.push(1 * d.find("[data-merge]").andSelf("[data-merge]").attr("data-merge") || 1)
        }, this)),
        this.reset(p.isNumeric(this.settings.startPosition) ? this.settings.startPosition : 0),
        this.invalidate("items")
    }
    ,
    t.prototype.add = function(c, d) {
        d = d === s ? this._items.length : this.normalize(d, !0),
        this.trigger("add", {
            content: c,
            position: d
        }),
        0 === this._items.length || d === this._items.length ? (this.$stage.append(c),
        this._items.push(c),
        this._mergers.push(1 * c.find("[data-merge]").andSelf("[data-merge]").attr("data-merge") || 1)) : (this._items[d].before(c),
        this._items.splice(d, 0, c),
        this._mergers.splice(d, 0, 1 * c.find("[data-merge]").andSelf("[data-merge]").attr("data-merge") || 1)),
        this.invalidate("items"),
        this.trigger("added", {
            content: c,
            position: d
        })
    }
    ,
    t.prototype.remove = function(b) {
        b = this.normalize(b, !0),
        b !== s && (this.trigger("remove", {
            content: this._items[b],
            position: b
        }),
        this._items[b].remove(),
        this._items.splice(b, 1),
        this._mergers.splice(b, 1),
        this.invalidate("items"),
        this.trigger("removed", {
            content: null,
            position: b
        }))
    }
    ,
    t.prototype.addTriggerableEvents = function() {
        var a = p.proxy(function(d, e) {
            return p.proxy(function(b) {
                b.relatedTarget !== this && (this.suppress([e]),
                d.apply(this, [].slice.call(arguments, 1)),
                this.release([e]))
            }, this)
        }, this);
        p.each({
            next: this.next,
            prev: this.prev,
            to: this.to,
            destroy: this.destroy,
            refresh: this.refresh,
            replace: this.replace,
            add: this.add,
            remove: this.remove
        }, p.proxy(function(b, d) {
            this.$element.on(b + ".owl.carousel", a(d, b + ".owl.carousel"))
        }, this))
    }
    ,
    t.prototype.watchVisibility = function() {
        function a(c) {
            return c.offsetWidth > 0 && c.offsetHeight > 0
        }
        function b() {
            a(this.$element.get(0)) && (this.$element.removeClass("owl-hidden"),
            this.refresh(),
            q.clearInterval(this.e._checkVisibile))
        }
        a(this.$element.get(0)) || (this.$element.addClass("owl-hidden"),
        q.clearInterval(this.e._checkVisibile),
        this.e._checkVisibile = q.setInterval(p.proxy(b, this), 500))
    }
    ,
    t.prototype.preloadAutoWidthImages = function(a) {
        var g, h, i, j;
        g = 0,
        h = this,
        a.each(function(b, c) {
            i = p(c),
            j = new Image,
            j.onload = function() {
                g++,
                i.attr("src", j.src),
                i.css("opacity", 1),
                g >= a.length && (h.state.imagesLoaded = !0,
                h.initialize())
            }
            ,
            j.src = i.attr("src") || i.attr("data-src") || i.attr("data-src-retina")
        })
    }
    ,
    t.prototype.destroy = function() {
        this.$element.hasClass(this.settings.themeClass) && this.$element.removeClass(this.settings.themeClass),
        this.settings.responsive !== !1 && p(q).off("resize.owl.carousel"),
        this.transitionEndVendor && this.off(this.$stage.get(0), this.transitionEndVendor, this.e._transitionEnd);
        for (var a in this._plugins) {
            this._plugins[a].destroy()
        }
        (this.settings.mouseDrag || this.settings.touchDrag) && (this.$stage.off("mousedown touchstart touchcancel"),
        p(r).off(".owl.dragEvents"),
        this.$stage.get(0).onselectstart = function() {}
        ,
        this.$stage.off("dragstart", function() {
            return !1
        })),
        this.$element.off(".owl"),
        this.$stage.children(".cloned").remove(),
        this.e = null,
        this.$element.removeData("owlCarousel"),
        this.$stage.children().contents().unwrap(),
        this.$stage.children().unwrap(),
        this.$stage.unwrap()
    }
    ,
    t.prototype.op = function(e, f, g) {
        var h = this.settings.rtl;
        switch (f) {
        case "<":
            return h ? e > g : g > e;
        case ">":
            return h ? g > e : e > g;
        case ">=":
            return h ? g >= e : e >= g;
        case "<=":
            return h ? e >= g : g >= e
        }
    }
    ,
    t.prototype.on = function(e, f, g, h) {
        e.addEventListener ? e.addEventListener(f, g, h) : e.attachEvent && e.attachEvent("on" + f, g)
    }
    ,
    t.prototype.off = function(e, f, g, h) {
        e.removeEventListener ? e.removeEventListener(f, g, h) : e.detachEvent && e.detachEvent("on" + f, g)
    }
    ,
    t.prototype.trigger = function(a, h, i) {
        var j = {
            item: {
                count: this._items.length,
                index: this.current()
            }
        }
          , k = p.camelCase(p.grep(["on", a, i], function(b) {
            return b
        }).join("-").toLowerCase())
          , l = p.Event([a, "owl", i || "carousel"].join(".").toLowerCase(), p.extend({
            relatedTarget: this
        }, j, h));
        return this._supress[a] || (p.each(this._plugins, function(c, d) {
            d.onTrigger && d.onTrigger(l)
        }),
        this.$element.trigger(l),
        this.settings && "function" == typeof this.settings[k] && this.settings[k].apply(this, l)),
        l
    }
    ,
    t.prototype.suppress = function(a) {
        p.each(a, p.proxy(function(c, d) {
            this._supress[d] = !0
        }, this))
    }
    ,
    t.prototype.release = function(a) {
        p.each(a, p.proxy(function(c, d) {
            delete this._supress[d]
        }, this))
    }
    ,
    t.prototype.browserSupport = function() {
        if (this.support3d = y(),
        this.support3d) {
            this.transformVendor = x();
            var b = ["transitionend", "webkitTransitionEnd", "transitionend", "oTransitionEnd"];
            this.transitionEndVendor = b[w()],
            this.vendorName = this.transformVendor.replace(/Transform/i, ""),
            this.vendorName = "" !== this.vendorName ? "-" + this.vendorName.toLowerCase() + "-" : ""
        }
        this.state.orientation = q.orientation
    }
    ,
    p.fn.owlCarousel = function(a) {
        return this.each(function() {
            p(this).data("owlCarousel") || p(this).data("owlCarousel", new t(this,a))
        })
    }
    ,
    p.fn.owlCarousel.Constructor = t
}(window.Zepto || window.jQuery, window, document),
function(d, e) {
    var f = function(a) {
        this._core = a,
        this._loaded = [],
        this._handlers = {
            "initialized.owl.carousel change.owl.carousel": d.proxy(function(i) {
                if (i.namespace && this._core.settings && this._core.settings.lazyLoad && (i.property && "position" == i.property.name || "initialized" == i.type)) {
                    for (var j = this._core.settings, k = j.center && Math.ceil(j.items / 2) || j.items, l = j.center && -1 * k || 0, m = (i.property && i.property.value || this._core.current()) + l, n = this._core.clones().length, o = d.proxy(function(c, g) {
                        this.load(g)
                    }, this); l++ < k; ) {
                        this.load(n / 2 + this._core.relative(m)),
                        n && d.each(this._core.clones(this._core.relative(m++)), o)
                    }
                }
            }, this)
        },
        this._core.options = d.extend({}, f.Defaults, this._core.options),
        this._core.$element.on(this._handlers)
    };
    f.Defaults = {
        lazyLoad: !1
    },
    f.prototype.load = function(a) {
        var b = this._core.$stage.children().eq(a)
          , g = b && b.find(".owl-lazy");
        !g || d.inArray(b.get(0), this._loaded) > -1 || (g.each(d.proxy(function(h, i) {
            var j, k = d(i), l = e.devicePixelRatio > 1 && k.attr("data-src-retina") || k.attr("data-src");
            this._core.trigger("load", {
                element: k,
                url: l
            }, "lazy"),
            k.is("img") ? k.one("load.owl.lazy", d.proxy(function() {
                k.css("opacity", 1),
                this._core.trigger("loaded", {
                    element: k,
                    url: l
                }, "lazy")
            }, this)).attr("src", l) : (j = new Image,
            j.onload = d.proxy(function() {
                k.css({
                    "background-image": "url(" + l + ")",
                    opacity: "1"
                }),
                this._core.trigger("loaded", {
                    element: k,
                    url: l
                }, "lazy")
            }, this),
            j.src = l)
        }, this)),
        this._loaded.push(b.get(0)))
    }
    ,
    f.prototype.destroy = function() {
        var c, g;
        for (c in this.handlers) {
            this._core.$element.off(c, this.handlers[c])
        }
        for (g in Object.getOwnPropertyNames(this)) {
            "function" != typeof this[g] && (this[g] = null)
        }
    }
    ,
    d.fn.owlCarousel.Constructor.Plugins.Lazy = f
}(window.Zepto || window.jQuery, window, document),
function(c) {
    var d = function(a) {
        this._core = a,
        this._handlers = {
            "initialized.owl.carousel": c.proxy(function() {
                this._core.settings.autoHeight && this.update()
            }, this),
            "changed.owl.carousel": c.proxy(function(b) {
                this._core.settings.autoHeight && "position" == b.property.name && this.update()
            }, this),
            "loaded.owl.lazy": c.proxy(function(b) {
                this._core.settings.autoHeight && b.element.closest("." + this._core.settings.itemClass) === this._core.$stage.children().eq(this._core.current()) && this.update()
            }, this)
        },
        this._core.options = c.extend({}, d.Defaults, this._core.options),
        this._core.$element.on(this._handlers)
    };
    d.Defaults = {
        autoHeight: !1,
        autoHeightClass: "owl-height"
    },
    d.prototype.update = function() {
        this._core.$stage.parent().height(this._core.$stage.children().eq(this._core.current()).height()).addClass(this._core.settings.autoHeightClass)
    }
    ,
    d.prototype.destroy = function() {
        var e, f;
        for (e in this._handlers) {
            this._core.$element.off(e, this._handlers[e])
        }
        for (f in Object.getOwnPropertyNames(this)) {
            "function" != typeof this[f] && (this[f] = null)
        }
    }
    ,
    c.fn.owlCarousel.Constructor.Plugins.AutoHeight = d
}(window.Zepto || window.jQuery, window, document),
function(e, f, g) {
    var h = function(a) {
        this._core = a,
        this._videos = {},
        this._playing = null,
        this._fullscreen = !1,
        this._handlers = {
            "resize.owl.carousel": e.proxy(function(b) {
                this._core.settings.video && !this.isInFullScreen() && b.preventDefault()
            }, this),
            "refresh.owl.carousel changed.owl.carousel": e.proxy(function() {
                this._playing && this.stop()
            }, this),
            "prepared.owl.carousel": e.proxy(function(d) {
                var i = e(d.content).find(".owl-video");
                i.length && (i.css("display", "none"),
                this.fetch(i, e(d.content)))
            }, this)
        },
        this._core.options = e.extend({}, h.Defaults, this._core.options),
        this._core.$element.on(this._handlers),
        this._core.$element.on("click.owl.video", ".owl-video-play-icon", e.proxy(function(b) {
            this.play(b)
        }, this))
    };
    h.Defaults = {
        video: !1,
        videoHeight: !1,
        videoWidth: !1
    },
    h.prototype.fetch = function(i, j) {
        var k = i.attr("data-vimeo-id") ? "vimeo" : "youtube"
          , l = i.attr("data-vimeo-id") || i.attr("data-youtube-id")
          , m = i.attr("data-width") || this._core.settings.videoWidth
          , n = i.attr("data-height") || this._core.settings.videoHeight
          , o = i.attr("href");
        if (!o) {
            throw new Error("Missing video URL.")
        }
        if (l = o.match(/(http:|https:|)\/\/(player.|www.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/),
        l[3].indexOf("youtu") > -1) {
            k = "youtube"
        } else {
            if (!(l[3].indexOf("vimeo") > -1)) {
                throw new Error("Video URL not supported.")
            }
            k = "vimeo"
        }
        l = l[6],
        this._videos[o] = {
            type: k,
            id: l,
            width: m,
            height: n
        },
        j.attr("data-video", o),
        this.thumbnail(i, this._videos[o])
    }
    ,
    h.prototype.thumbnail = function(a, m) {
        var n, o, p, q = m.width && m.height ? 'style="width:' + m.width + "px;height:" + m.height + 'px;"' : "", r = a.find("img"), s = "src", t = "", u = this._core.settings, v = function(b) {
            o = '<div class="owl-video-play-icon"></div>',
            n = u.lazyLoad ? '<div class="owl-video-tn ' + t + '" ' + s + '="' + b + '"></div>' : '<div class="owl-video-tn" style="opacity:1;background-image:url(' + b + ')"></div>',
            a.after(n),
            a.after(o)
        };
        return a.wrap('<div class="owl-video-wrapper"' + q + "></div>"),
        this._core.settings.lazyLoad && (s = "data-src",
        t = "owl-lazy"),
        r.length ? (v(r.attr(s)),
        r.remove(),
        !1) : void ("youtube" === m.type ? (p = "http://img.youtube.com/vi/" + m.id + "/hqdefault.jpg",
        v(p)) : "vimeo" === m.type && e.ajax({
            type: "GET",
            url: "http://vimeo.com/api/v2/video/" + m.id + ".json",
            jsonp: "callback",
            dataType: "jsonp",
            success: function(b) {
                p = b[0].thumbnail_large,
                v(p)
            }
        }))
    }
    ,
    h.prototype.stop = function() {
        this._core.trigger("stop", null, "video"),
        this._playing.find(".owl-video-frame").remove(),
        this._playing.removeClass("owl-video-playing"),
        this._playing = null
    }
    ,
    h.prototype.play = function(a) {
        this._core.trigger("play", null, "video"),
        this._playing && this.stop();
        var j, k, l = e(a.target || a.srcElement), m = l.closest("." + this._core.settings.itemClass), n = this._videos[m.attr("data-video")], o = n.width || "100%", p = n.height || this._core.$stage.height();
        "youtube" === n.type ? j = '<iframe width="' + o + '" height="' + p + '" src="http://www.youtube.com/embed/' + n.id + "?autoplay=1&v=" + n.id + '" frameborder="0" allowfullscreen></iframe>' : "vimeo" === n.type && (j = '<iframe src="http://player.vimeo.com/video/' + n.id + '?autoplay=1" width="' + o + '" height="' + p + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>'),
        m.addClass("owl-video-playing"),
        this._playing = m,
        k = e('<div style="height:' + p + "px; width:" + o + 'px" class="owl-video-frame">' + j + "</div>"),
        l.after(k)
    }
    ,
    h.prototype.isInFullScreen = function() {
        var a = g.fullscreenElement || g.mozFullScreenElement || g.webkitFullscreenElement;
        return a && e(a).parent().hasClass("owl-video-frame") && (this._core.speed(0),
        this._fullscreen = !0),
        a && this._fullscreen && this._playing ? !1 : this._fullscreen ? (this._fullscreen = !1,
        !1) : this._playing && this._core.state.orientation !== f.orientation ? (this._core.state.orientation = f.orientation,
        !1) : !0
    }
    ,
    h.prototype.destroy = function() {
        var c, d;
        this._core.$element.off("click.owl.video");
        for (c in this._handlers) {
            this._core.$element.off(c, this._handlers[c])
        }
        for (d in Object.getOwnPropertyNames(this)) {
            "function" != typeof this[d] && (this[d] = null)
        }
    }
    ,
    e.fn.owlCarousel.Constructor.Plugins.Video = h
}(window.Zepto || window.jQuery, window, document),
function(f, g, h, i) {
    var j = function(a) {
        this.core = a,
        this.core.options = f.extend({}, j.Defaults, this.core.options),
        this.swapping = !0,
        this.previous = i,
        this.next = i,
        this.handlers = {
            "change.owl.carousel": f.proxy(function(b) {
                "position" == b.property.name && (this.previous = this.core.current(),
                this.next = b.property.value)
            }, this),
            "drag.owl.carousel dragged.owl.carousel translated.owl.carousel": f.proxy(function(b) {
                this.swapping = "translated" == b.type
            }, this),
            "translate.owl.carousel": f.proxy(function() {
                this.swapping && (this.core.options.animateOut || this.core.options.animateIn) && this.swap()
            }, this)
        },
        this.core.$element.on(this.handlers)
    };
    j.Defaults = {
        animateOut: !1,
        animateIn: !1
    },
    j.prototype.swap = function() {
        if (1 === this.core.settings.items && this.core.support3d) {
            this.core.speed(0);
            var a, k = f.proxy(this.clear, this), l = this.core.$stage.children().eq(this.previous), m = this.core.$stage.children().eq(this.next), n = this.core.settings.animateIn, o = this.core.settings.animateOut;
            this.core.current() !== this.previous && (o && (a = this.core.coordinates(this.previous) - this.core.coordinates(this.next),
            l.css({
                left: a + "px"
            }).addClass("animated owl-animated-out").addClass(o).one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend", k)),
            n && m.addClass("animated owl-animated-in").addClass(n).one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend", k))
        }
    }
    ,
    j.prototype.clear = function(a) {
        f(a.target).css({
            left: ""
        }).removeClass("animated owl-animated-out owl-animated-in").removeClass(this.core.settings.animateIn).removeClass(this.core.settings.animateOut),
        this.core.transitionEnd()
    }
    ,
    j.prototype.destroy = function() {
        var c, d;
        for (c in this.handlers) {
            this.core.$element.off(c, this.handlers[c])
        }
        for (d in Object.getOwnPropertyNames(this)) {
            "function" != typeof this[d] && (this[d] = null)
        }
    }
    ,
    f.fn.owlCarousel.Constructor.Plugins.Animate = j
}(window.Zepto || window.jQuery, window, document),
function(e, f, g) {
    var h = function(a) {
        this.core = a,
        this.core.options = e.extend({}, h.Defaults, this.core.options),
        this.handlers = {
            "translated.owl.carousel refreshed.owl.carousel": e.proxy(function() {
                this.autoplay()
            }, this),
            "play.owl.autoplay": e.proxy(function(d, i, j) {
                this.play(i, j)
            }, this),
            "stop.owl.autoplay": e.proxy(function() {
                this.stop()
            }, this),
            "mouseover.owl.autoplay": e.proxy(function() {
                this.core.settings.autoplayHoverPause && this.pause()
            }, this),
            "mouseleave.owl.autoplay": e.proxy(function() {
                this.core.settings.autoplayHoverPause && this.autoplay()
            }, this)
        },
        this.core.$element.on(this.handlers)
    };
    h.Defaults = {
        autoplay: !1,
        autoplayTimeout: 5000,
        autoplayHoverPause: !1,
        autoplaySpeed: !1
    },
    h.prototype.autoplay = function() {
        this.core.settings.autoplay && !this.core.state.videoPlay ? (f.clearInterval(this.interval),
        this.interval = f.setInterval(e.proxy(function() {
            this.play()
        }, this), this.core.settings.autoplayTimeout)) : f.clearInterval(this.interval)
    }
    ,
    h.prototype.play = function() {
        return g.hidden === !0 || this.core.state.isTouch || this.core.state.isScrolling || this.core.state.isSwiping || this.core.state.inMotion ? void 0 : this.core.settings.autoplay === !1 ? void f.clearInterval(this.interval) : void this.core.next(this.core.settings.autoplaySpeed)
    }
    ,
    h.prototype.stop = function() {
        f.clearInterval(this.interval)
    }
    ,
    h.prototype.pause = function() {
        f.clearInterval(this.interval)
    }
    ,
    h.prototype.destroy = function() {
        var b, d;
        f.clearInterval(this.interval);
        for (b in this.handlers) {
            this.core.$element.off(b, this.handlers[b])
        }
        for (d in Object.getOwnPropertyNames(this)) {
            "function" != typeof this[d] && (this[d] = null)
        }
    }
    ,
    e.fn.owlCarousel.Constructor.Plugins.autoplay = h
}(window.Zepto || window.jQuery, window, document),
function(c) {
    var d = function(a) {
        this._core = a,
        this._initialized = !1,
        this._pages = [],
        this._controls = {},
        this._templates = [],
        this.$element = this._core.$element,
        this._overrides = {
            next: this._core.next,
            prev: this._core.prev,
            to: this._core.to
        },
        this._handlers = {
            "prepared.owl.carousel": c.proxy(function(e) {
                this._core.settings.dotsData && this._templates.push(c(e.content).find("[data-dot]").andSelf("[data-dot]").attr("data-dot"))
            }, this),
            "add.owl.carousel": c.proxy(function(e) {
                this._core.settings.dotsData && this._templates.splice(e.position, 0, c(e.content).find("[data-dot]").andSelf("[data-dot]").attr("data-dot"))
            }, this),
            "remove.owl.carousel prepared.owl.carousel": c.proxy(function(b) {
                this._core.settings.dotsData && this._templates.splice(b.position, 1)
            }, this),
            "change.owl.carousel": c.proxy(function(e) {
                if ("position" == e.property.name && !this._core.state.revert && !this._core.settings.loop && this._core.settings.navRewind) {
                    var f = this._core.current()
                      , g = this._core.maximum()
                      , h = this._core.minimum();
                    e.data = e.property.value > g ? f >= g ? h : g : e.property.value < h ? g : e.property.value
                }
            }, this),
            "changed.owl.carousel": c.proxy(function(b) {
                "position" == b.property.name && this.draw()
            }, this),
            "refreshed.owl.carousel": c.proxy(function() {
                this._initialized || (this.initialize(),
                this._initialized = !0),
                this._core.trigger("refresh", null, "navigation"),
                this.update(),
                this.draw(),
                this._core.trigger("refreshed", null, "navigation")
            }, this)
        },
        this._core.options = c.extend({}, d.Defaults, this._core.options),
        this.$element.on(this._handlers)
    };
    d.Defaults = {
        nav: !1,
        navRewind: !0,
        navText: ["prev", "next"],
        navSpeed: !1,
        navElement: "div",
        navContainer: !1,
        navContainerClass: "owl-nav",
        navClass: ["owl-prev", "owl-next"],
        slideBy: 1,
        dotClass: "owl-dot",
        dotsClass: "owl-dots",
        dots: !0,
        dotsEach: !1,
        dotData: !1,
        dotsSpeed: !1,
        dotsContainer: !1,
        controlsClass: "owl-controls"
    },
    d.prototype.initialize = function() {
        var a, e, f = this._core.settings;
        f.dotsData || (this._templates = [c("<div>").addClass(f.dotClass).append(c("<span>")).prop("outerHTML")]),
        f.navContainer && f.dotsContainer || (this._controls.$container = c("<div>").addClass(f.controlsClass).appendTo(this.$element)),
        this._controls.$indicators = f.dotsContainer ? c(f.dotsContainer) : c("<div>").hide().addClass(f.dotsClass).appendTo(this._controls.$container),
        this._controls.$indicators.on("click", "div", c.proxy(function(g) {
            var h = c(g.target).parent().is(this._controls.$indicators) ? c(g.target).index() : c(g.target).parent().index();
            g.preventDefault(),
            this.to(h, f.dotsSpeed)
        }, this)),
        a = f.navContainer ? c(f.navContainer) : c("<div>").addClass(f.navContainerClass).prependTo(this._controls.$container),
        this._controls.$next = c("<" + f.navElement + ">"),
        this._controls.$previous = this._controls.$next.clone(),
        this._controls.$previous.addClass(f.navClass[0]).html(f.navText[0]).hide().prependTo(a).on("click", c.proxy(function() {
            this.prev(f.navSpeed)
        }, this)),
        this._controls.$next.addClass(f.navClass[1]).html(f.navText[1]).hide().appendTo(a).on("click", c.proxy(function() {
            this.next(f.navSpeed)
        }, this));
        for (e in this._overrides) {
            this._core[e] = c.proxy(this[e], this)
        }
    }
    ,
    d.prototype.destroy = function() {
        var e, f, g, h;
        for (e in this._handlers) {
            this.$element.off(e, this._handlers[e])
        }
        for (f in this._controls) {
            this._controls[f].remove()
        }
        for (h in this.overides) {
            this._core[h] = this._overrides[h]
        }
        for (g in Object.getOwnPropertyNames(this)) {
            "function" != typeof this[g] && (this[g] = null)
        }
    }
    ,
    d.prototype.update = function() {
        var h, i, j, k = this._core.settings, l = this._core.clones().length / 2, m = l + this._core.items().length, n = k.center || k.autoWidth || k.dotData ? 1 : k.dotsEach || k.items;
        if ("page" !== k.slideBy && (k.slideBy = Math.min(k.slideBy, k.items)),
        k.dots || "page" == k.slideBy) {
            for (this._pages = [],
            h = l,
            i = 0,
            j = 0; m > h; h++) {
                (i >= n || 0 === i) && (this._pages.push({
                    start: h - l,
                    end: h - l + n - 1
                }),
                i = 0,
                ++j),
                i += this._core.mergers(this._core.relative(h))
            }
        }
    }
    ,
    d.prototype.draw = function() {
        var a, g, h = "", i = this._core.settings, j = (this._core.$stage.children(),
        this._core.relative(this._core.current()));
        if (!i.nav || i.loop || i.navRewind || (this._controls.$previous.toggleClass("disabled", 0 >= j),
        this._controls.$next.toggleClass("disabled", j >= this._core.maximum())),
        this._controls.$previous.toggle(i.nav),
        this._controls.$next.toggle(i.nav),
        i.dots) {
            if (a = this._pages.length - this._controls.$indicators.children().length,
            i.dotData && 0 !== a) {
                for (g = 0; g < this._controls.$indicators.children().length; g++) {
                    h += this._templates[this._core.relative(g)]
                }
                this._controls.$indicators.html(h)
            } else {
                a > 0 ? (h = new Array(a + 1).join(this._templates[0]),
                this._controls.$indicators.append(h)) : 0 > a && this._controls.$indicators.children().slice(a).remove()
            }
            this._controls.$indicators.find(".active").removeClass("active"),
            this._controls.$indicators.children().eq(c.inArray(this.current(), this._pages)).addClass("active")
        }
        this._controls.$indicators.toggle(i.dots)
    }
    ,
    d.prototype.onTrigger = function(a) {
        var e = this._core.settings;
        a.page = {
            index: c.inArray(this.current(), this._pages),
            count: this._pages.length,
            size: e && (e.center || e.autoWidth || e.dotData ? 1 : e.dotsEach || e.items)
        }
    }
    ,
    d.prototype.current = function() {
        var a = this._core.relative(this._core.current());
        return c.grep(this._pages, function(b) {
            return b.start <= a && b.end >= a
        }).pop()
    }
    ,
    d.prototype.getPosition = function(a) {
        var f, g, h = this._core.settings;
        return "page" == h.slideBy ? (f = c.inArray(this.current(), this._pages),
        g = this._pages.length,
        a ? ++f : --f,
        f = this._pages[(f % g + g) % g].start) : (f = this._core.relative(this._core.current()),
        g = this._core.items().length,
        a ? f += h.slideBy : f -= h.slideBy),
        f
    }
    ,
    d.prototype.next = function(a) {
        c.proxy(this._overrides.to, this._core)(this.getPosition(!0), a)
    }
    ,
    d.prototype.prev = function(a) {
        c.proxy(this._overrides.to, this._core)(this.getPosition(!1), a)
    }
    ,
    d.prototype.to = function(a, f, g) {
        var h;
        g ? c.proxy(this._overrides.to, this._core)(a, f) : (h = this._pages.length,
        c.proxy(this._overrides.to, this._core)(this._pages[(a % h + h) % h].start, f))
    }
    ,
    c.fn.owlCarousel.Constructor.Plugins.Navigation = d
}(window.Zepto || window.jQuery, window, document),
function(d, e) {
    var f = function(a) {
        this._core = a,
        this._hashes = {},
        this.$element = this._core.$element,
        this._handlers = {
            "initialized.owl.carousel": d.proxy(function() {
                "URLHash" == this._core.settings.startPosition && d(e).trigger("hashchange.owl.navigation")
            }, this),
            "prepared.owl.carousel": d.proxy(function(g) {
                var h = d(g.content).find("[data-hash]").andSelf("[data-hash]").attr("data-hash");
                this._hashes[h] = g.content
            }, this)
        },
        this._core.options = d.extend({}, f.Defaults, this._core.options),
        this.$element.on(this._handlers),
        d(e).on("hashchange.owl.navigation", d.proxy(function() {
            var b = e.location.hash.substring(1)
              , g = this._core.$stage.children()
              , h = this._hashes[b] && g.index(this._hashes[b]) || 0;
            return b ? void this._core.to(h, !1, !0) : !1
        }, this))
    };
    f.Defaults = {
        URLhashListener: !1
    },
    f.prototype.destroy = function() {
        var a, b;
        d(e).off("hashchange.owl.navigation");
        for (a in this._handlers) {
            this._core.$element.off(a, this._handlers[a])
        }
        for (b in Object.getOwnPropertyNames(this)) {
            "function" != typeof this[b] && (this[b] = null)
        }
    }
    ,
    d.fn.owlCarousel.Constructor.Plugins.Hash = f
}(window.Zepto || window.jQuery, window, document);
!function(f, g, h, i) {
    var j = function(a, b) {
        this.elem = a,
        this.$elem = f(a),
        this.options = b,
        this.metadata = this.$elem.data("plugin-options"),
        this.$win = f(g),
        this.sections = {},
        this.didScroll = !1,
        this.$doc = f(h),
        this.docHeight = this.$doc.height()
    };
    j.prototype = {
        defaults: {
            navItems: "a",
            currentClass: "current",
            changeHash: !1,
            easing: "swing",
            filter: "",
            scrollSpeed: 750,
            scrollThreshold: 0.5,
            begin: !1,
            end: !1,
            scrollChange: !1
        },
        init: function() {
            return this.config = f.extend({}, this.defaults, this.options, this.metadata),
            this.$nav = this.$elem.find(this.config.navItems),
            "" !== this.config.filter && (this.$nav = this.$nav.filter(this.config.filter)),
            this.$nav.on("click.onePageNav", f.proxy(this.handleClick, this)),
            this.getPositions(),
            this.bindInterval(),
            this.$win.on("resize.onePageNav", f.proxy(this.getPositions, this)),
            this
        },
        adjustNav: function(c, d) {
            c.$elem.find("." + c.config.currentClass).removeClass(c.config.currentClass),
            d.addClass(c.config.currentClass)
        },
        bindInterval: function() {
            var d, c = this;
            c.$win.on("scroll.onePageNav", function() {
                c.didScroll = !0
            }),
            c.t = setInterval(function() {
                d = c.$doc.height(),
                c.didScroll && (c.didScroll = !1,
                c.scrollChange()),
                d !== c.docHeight && (c.docHeight = d,
                c.getPositions())
            }, 250)
        },
        getHash: function(b) {
            return b.attr("href").split("#")[1]
        },
        getPositions: function() {
            var k, l, m, a = this;
            a.$nav.each(function() {
                k = a.getHash(f(this)),
                m = f("#" + k),
                m.length && (l = m.offset().top,
                a.sections[k] = Math.round(l))
            })
        },
        getSection: function(e) {
            var k = null
              , l = Math.round(this.$win.height() * this.config.scrollThreshold);
            for (var m in this.sections) {
                this.sections[m] - l < e && (k = m)
            }
            return k
        },
        handleClick: function(a) {
            var b = this
              , k = f(a.currentTarget)
              , l = k.parent()
              , m = "#" + b.getHash(k);
            l.hasClass(b.config.currentClass) || (b.config.begin && b.config.begin(),
            b.adjustNav(b, l),
            b.unbindInterval(),
            b.scrollTo(m, function() {
                b.config.changeHash && (g.location.hash = m),
                b.bindInterval(),
                b.config.end && b.config.end()
            })),
            a.preventDefault()
        },
        scrollChange: function() {
            var k, d = this.$win.scrollTop(), e = this.getSection(d);
            null !== e && (k = this.$elem.find('a[href$="#' + e + '"]').parent(),
            k.hasClass(this.config.currentClass) || (this.adjustNav(this, k),
            this.config.scrollChange && this.config.scrollChange(k)))
        },
        scrollTo: function(a, e) {
            var k = f(a).offset().top;
            f("html, body").animate({
                scrollTop: k
            }, this.config.scrollSpeed, this.config.easing, e)
        },
        unbindInterval: function() {
            clearInterval(this.t),
            this.$win.unbind("scroll.onePageNav")
        }
    },
    j.defaults = j.prototype.defaults,
    f.fn.onePageNav = function(b) {
        return this.each(function() {
            new j(this,b).init()
        })
    }
}(jQuery, window, document);
!function(a) {
    var b = function(c, d) {
        this.el = a(c);
        this.options = a.extend({}, a.fn.typed.defaults, d);
        this.isInput = this.el.is("input");
        this.attr = this.options.attr;
        this.showCursor = this.isInput ? false : this.options.showCursor;
        this.elContent = this.attr ? this.el.attr(this.attr) : this.el.text();
        this.contentType = this.options.contentType;
        this.typeSpeed = this.options.typeSpeed;
        this.startDelay = this.options.startDelay;
        this.backSpeed = this.options.backSpeed;
        this.backDelay = this.options.backDelay;
        this.stringsElement = this.options.stringsElement;
        this.strings = this.options.strings;
        this.strPos = 0;
        this.arrayPos = 0;
        this.stopNum = 0;
        this.loop = this.options.loop;
        this.loopCount = this.options.loopCount;
        this.curLoop = 0;
        this.stop = false;
        this.cursorChar = this.options.cursorChar;
        this.shuffle = this.options.shuffle;
        this.sequence = [];
        this.build()
    };
    b.prototype = {
        constructor: b,
        init: function() {
            var c = this;
            c.timeout = setTimeout(function() {
                for (var d = 0; d < c.strings.length; ++d) {
                    c.sequence[d] = d
                }
                if (c.shuffle) {
                    c.sequence = c.shuffleArray(c.sequence)
                }
                c.typewrite(c.strings[c.sequence[c.arrayPos]], c.strPos)
            }, c.startDelay)
        },
        build: function() {
            var c = this;
            if (this.showCursor === true) {
                this.cursor = a('<span class="typed-cursor">' + this.cursorChar + "</span>");
                this.el.after(this.cursor)
            }
            if (this.stringsElement) {
                this.strings = [];
                this.stringsElement.hide();
                console.log(this.stringsElement.children());
                var d = this.stringsElement.children();
                a.each(d, function(e, f) {
                    c.strings.push(a(f).html())
                })
            }
            this.init()
        },
        typewrite: function(c, d) {
            if (this.stop === true) {
                return
            }
            var e = Math.round(Math.random() * (100 - 30)) + this.typeSpeed;
            var f = this;
            f.timeout = setTimeout(function() {
                var g = 0;
                var k = c.substr(d);
                if (k.charAt(0) === "^") {
                    var j = 1;
                    if (/^\^\d+/.test(k)) {
                        k = /\d+/.exec(k)[0];
                        j += k.length;
                        g = parseInt(k)
                    }
                    c = c.substring(0, d) + c.substring(d + j)
                }
                if (f.contentType === "html") {
                    var h = c.substr(d).charAt(0);
                    if (h === "<" || h === "&") {
                        var l = "";
                        var i = "";
                        if (h === "<") {
                            i = ">"
                        } else {
                            i = ";"
                        }
                        while (c.substr(d + 1).charAt(0) !== i) {
                            l += c.substr(d).charAt(0);
                            d++;
                            if (d + 1 > c.length) {
                                break
                            }
                        }
                        d++;
                        l += i
                    }
                }
                f.timeout = setTimeout(function() {
                    if (d === c.length) {
                        f.options.onStringTyped(f.arrayPos);
                        if (f.arrayPos === f.strings.length - 1) {
                            f.options.callback();
                            f.curLoop++;
                            if (f.loop === false || f.curLoop === f.loopCount) {
                                return
                            }
                        }
                        f.timeout = setTimeout(function() {
                            f.backspace(c, d)
                        }, f.backDelay)
                    } else {
                        if (d === 0) {
                            f.options.preStringTyped(f.arrayPos)
                        }
                        var m = c.substr(0, d + 1);
                        if (f.attr) {
                            f.el.attr(f.attr, m)
                        } else {
                            if (f.isInput) {
                                f.el.val(m)
                            } else {
                                if (f.contentType === "html") {
                                    f.el.html(m)
                                } else {
                                    f.el.text(m)
                                }
                            }
                        }
                        d++;
                        f.typewrite(c, d)
                    }
                }, g)
            }, e)
        },
        backspace: function(c, d) {
            if (this.stop === true) {
                return
            }
            var e = Math.round(Math.random() * (100 - 30)) + this.backSpeed;
            var f = this;
            f.timeout = setTimeout(function() {
                if (f.contentType === "html") {
                    if (c.substr(d).charAt(0) === ">") {
                        var h = "";
                        while (c.substr(d - 1).charAt(0) !== "<") {
                            h -= c.substr(d).charAt(0);
                            d--;
                            if (d < 0) {
                                break
                            }
                        }
                        d--;
                        h += "<"
                    }
                }
                var g = c.substr(0, d);
                if (f.attr) {
                    f.el.attr(f.attr, g)
                } else {
                    if (f.isInput) {
                        f.el.val(g)
                    } else {
                        if (f.contentType === "html") {
                            f.el.html(g)
                        } else {
                            f.el.text(g)
                        }
                    }
                }
                if (d > f.stopNum) {
                    d--;
                    f.backspace(c, d)
                } else {
                    if (d <= f.stopNum) {
                        f.arrayPos++;
                        if (f.arrayPos === f.strings.length) {
                            f.arrayPos = 0;
                            if (f.shuffle) {
                                f.sequence = f.shuffleArray(f.sequence)
                            }
                            f.init()
                        } else {
                            f.typewrite(f.strings[f.sequence[f.arrayPos]], d)
                        }
                    }
                }
            }, e)
        },
        shuffleArray: function(c) {
            var e, d, f = c.length;
            if (f) {
                while (--f) {
                    d = Math.floor(Math.random() * (f + 1));
                    e = c[d];
                    c[d] = c[f];
                    c[f] = e
                }
            }
            return c
        },
        reset: function() {
            var d = this;
            clearInterval(d.timeout);
            var c = this.el.attr("id");
            this.el.empty();
            if (typeof this.cursor !== "undefined") {
                this.cursor.remove()
            }
            this.strPos = 0;
            this.arrayPos = 0;
            this.curLoop = 0;
            this.options.resetCallback()
        }
    };
    a.fn.typed = function(c) {
        return this.each(function() {
            var d = a(this)
              , e = d.data("typed")
              , f = typeof c == "object" && c;
            if (e) {
                e.reset()
            }
            d.data("typed", (e = new b(this,f)));
            if (typeof c == "string") {
                e[c]()
            }
        })
    }
    ;
    a.fn.typed.defaults = {
        strings: ["These are the default values...", "You know what you should do?", "Use your own!", "Have a great day!"],
        stringsElement: null,
        typeSpeed: 0,
        startDelay: 0,
        backSpeed: 0,
        shuffle: false,
        backDelay: 500,
        loop: false,
        loopCount: false,
        showCursor: true,
        cursorChar: "|",
        attr: null,
        contentType: "html",
        callback: function() {},
        preStringTyped: function() {},
        onStringTyped: function() {},
        resetCallback: function() {}
    }
}(window.jQuery);
(function(b, a) {
    if (typeof exports === "object") {
        module.exports = a(b, b.document)
    } else {
        if (typeof define === "function" && define.amd) {
            define(function() {
                return a(b, b.document)
            })
        } else {
            b.Sketch = a(b, b.document)
        }
    }
}(typeof window !== "undefined" ? window : this, function(L, o) {
    var C = "E LN10 LN2 LOG2E LOG10E PI SQRT1_2 SQRT2 abs acos asin atan ceil cos exp floor log round sin sqrt tan atan2 pow max min".split(" ");
    var s = "__hasSketch";
    var B = Math;
    var h = "canvas";
    var J = "webgl";
    var p = "dom";
    var n = o;
    var K = L;
    var u = [];
    var m = {
        fullscreen: true,
        autostart: true,
        autoclear: true,
        autopause: true,
        container: n.body,
        interval: 1,
        globals: true,
        retina: false,
        type: h
    };
    var z = {
        8: "BACKSPACE",
        9: "TAB",
        13: "ENTER",
        16: "SHIFT",
        27: "ESCAPE",
        32: "SPACE",
        37: "LEFT",
        38: "UP",
        39: "RIGHT",
        40: "DOWN"
    };
    function v(a) {
        return Object.prototype.toString.call(a) == "[object Array]"
    }
    function w(a) {
        return typeof a == "function"
    }
    function x(a) {
        return typeof a == "number"
    }
    function y(a) {
        return typeof a == "string"
    }
    function A(a) {
        return z[a] || String.fromCharCode(a)
    }
    function r(i, c, b) {
        for (var a in c) {
            if (b || !(a in i)) {
                i[a] = c[a]
            }
        }
        return i
    }
    function D(b, a) {
        return function() {
            b.apply(a, arguments)
        }
    }
    function j(c) {
        var b = {};
        for (var a in c) {
            if (a === "webkitMovementX" || a === "webkitMovementY") {
                continue
            }
            if (w(c[a])) {
                b[a] = D(c[a], c)
            } else {
                b[a] = c[a]
            }
        }
        return b
    }
    function k(P) {
        var ak, V, ar, ag, M, W, aq, O, af, Q, aw, Z, ay, ad, ac, az, U;
        var R = 0;
        var au = [];
        var am = false;
        var an = false;
        var aj = K.devicePixelRatio || 1;
        var Y = P.type == p;
        var X = P.type == h;
        var ae = {
            x: 0,
            y: 0,
            ox: 0,
            oy: 0,
            dx: 0,
            dy: 0
        };
        var T = [P.eventTarget || P.element, ah, "mousedown", "touchstart", ah, "mousemove", "touchmove", ah, "mouseup", "touchend", ah, "click", ah, "mouseout", ah, "mouseover", n, aa, "keydown", "keyup", K, a, "focus", "blur", al, "resize"];
        var ab = {};
        for (Z in z) {
            ab[z[Z]] = false
        }
        function av(aA) {
            if (w(aA)) {
                aA.apply(P, [].splice.call(arguments, 1))
            }
        }
        function i(aA) {
            for (W = 0; W < T.length; W++) {
                af = T[W];
                if (y(af)) {
                    ar[(aA ? "add" : "remove") + "EventListener"].call(ar, af, V, false)
                } else {
                    if (w(af)) {
                        V = af
                    } else {
                        ar = af
                    }
                }
            }
        }
        function ax() {
            g(ak);
            ak = E(ax);
            if (!an) {
                av(P.setup);
                an = w(P.setup)
            }
            if (!am) {
                av(P.resize);
                am = w(P.resize)
            }
            if (P.running && !R) {
                P.dt = (O = +new Date()) - P.now;
                P.millis += P.dt;
                P.now = O;
                av(P.update);
                if (X) {
                    if (P.retina) {
                        P.save();
                        if (P.autoclear) {
                            P.scale(aj, aj)
                        }
                    }
                    if (P.autoclear) {
                        P.clear()
                    }
                }
                av(P.draw);
                if (X && P.retina) {
                    P.restore()
                }
            }
            R = ++R % P.interval
        }
        function al() {
            ar = Y ? P.style : P.canvas;
            aq = Y ? "px" : "";
            az = P.width;
            U = P.height;
            if (P.fullscreen) {
                U = P.height = K.innerHeight;
                az = P.width = K.innerWidth
            }
            if (P.retina && X && aj) {
                ar.style.height = U + "px";
                ar.style.width = az + "px";
                az *= aj;
                U *= aj
            }
            if (ar.height !== U) {
                ar.height = U + aq
            }
            if (ar.width !== az) {
                ar.width = az + aq
            }
            if (X && !P.autoclear && P.retina) {
                P.scale(aj, aj)
            }
            if (an) {
                av(P.resize)
            }
        }
        function b(aB, aA) {
            M = aA.getBoundingClientRect();
            aB.x = aB.pageX - M.left - (K.scrollX || K.pageXOffset);
            aB.y = aB.pageY - M.top - (K.scrollY || K.pageYOffset);
            return aB
        }
        function c(aB, aA) {
            b(aB, P.element);
            aA = aA || {};
            aA.ox = aA.x || aB.x;
            aA.oy = aA.y || aB.y;
            aA.x = aB.x;
            aA.y = aB.y;
            aA.dx = aA.x - aA.ox;
            aA.dy = aA.y - aA.oy;
            return aA
        }
        function ai(aA) {
            aA.preventDefault();
            Q = j(aA);
            Q.originalEvent = aA;
            if (Q.touches) {
                au.length = Q.touches.length;
                for (W = 0; W < Q.touches.length; W++) {
                    au[W] = c(Q.touches[W], au[W])
                }
            } else {
                au.length = 0;
                au[0] = c(Q, ae)
            }
            r(ae, au[0], true);
            return Q
        }
        function ah(aA) {
            aA = ai(aA);
            ad = (ac = T.indexOf(aw = aA.type)) - 1;
            P.dragging = /down|start/.test(aw) ? true : /up|end/.test(aw) ? false : P.dragging;
            while (ad) {
                y(T[ad]) ? av(P[T[ad--]], aA) : y(T[ac]) ? av(P[T[ac++]], aA) : ad = 0
            }
        }
        function aa(aA) {
            Z = aA.keyCode;
            ay = aA.type == "keyup";
            ab[Z] = ab[A(Z)] = !ay;
            av(P[aA.type], aA)
        }
        function a(aA) {
            if (P.autopause) {
                (aA.type == "blur" ? ap : ao)()
            }
            av(P[aA.type], aA)
        }
        function ao() {
            P.now = +new Date();
            P.running = true
        }
        function ap() {
            P.running = false
        }
        function at() {
            (P.running ? ap : ao)()
        }
        function N() {
            if (X) {
                P.clearRect(0, 0, P.width * aj, P.height * aj)
            }
        }
        function S() {
            ag = P.element.parentNode;
            W = u.indexOf(P);
            if (ag) {
                ag.removeChild(P.element)
            }
            if (~W) {
                u.splice(W, 1)
            }
            i(false);
            ap()
        }
        r(P, {
            touches: au,
            mouse: ae,
            keys: ab,
            dragging: false,
            running: false,
            millis: 0,
            now: NaN,
            dt: NaN,
            destroy: S,
            toggle: at,
            clear: N,
            start: ao,
            stop: ap
        });
        u.push(P);
        return (P.autostart && ao(),
        i(true),
        al(),
        ax(),
        P)
    }
    var q, l, G = {
        CANVAS: h,
        WEB_GL: J,
        WEBGL: J,
        DOM: p,
        instances: u,
        install: function(a) {
            if (!a[s]) {
                for (var b = 0; b < C.length; b++) {
                    a[C[b]] = B[C[b]]
                }
                r(a, {
                    TWO_PI: B.PI * 2,
                    HALF_PI: B.PI / 2,
                    QUARTER_PI: B.PI / 4,
                    random: function(i, c) {
                        if (v(i)) {
                            return i[~~(B.random() * i.length)]
                        }
                        if (!x(c)) {
                            c = i || 1,
                            i = 0
                        }
                        return i + B.random() * (c - i)
                    },
                    lerp: function(M, i, c) {
                        return M + c * (i - M)
                    },
                    map: function(O, M, c, N, i) {
                        return (O - M) / (c - M) * (i - N) + N
                    }
                });
                a[s] = true
            }
        },
        create: function(a) {
            a = r(a || {}, m);
            if (a.globals) {
                G.install(self)
            }
            q = a.element = a.element || n.createElement(a.type === p ? "div" : "canvas");
            l = a.context = a.context || (function() {
                switch (a.type) {
                case h:
                    return q.getContext("2d", a);
                case J:
                    return q.getContext("webgl", a) || q.getContext("experimental-webgl", a);
                case p:
                    return q.canvas = q
                }
            }
            )();
            (a.container || n.body).appendChild(q);
            return G.augment(l, a)
        },
        augment: function(a, b) {
            b = r(b || {}, m);
            b.element = a.canvas || a;
            b.element.className += " sketch";
            r(a, b, true);
            return k(a)
        }
    };
    var I = ["ms", "moz", "webkit", "o"];
    var F = self;
    var H = 0;
    var d = "AnimationFrame";
    var e = "request" + d;
    var f = "cancel" + d;
    var E = F[e];
    var g = F[f];
    for (var t = 0; t < I.length && !E; t++) {
        E = F[I[t] + "Request" + d];
        g = F[I[t] + "Cancel" + d]
    }
    F[e] = E = E || function(a) {
        var i = +new Date();
        var b = B.max(0, 16 - (i - H));
        var c = setTimeout(function() {
            a(i + b)
        }, b);
        H = i + b;
        return c
    }
    ;
    F[f] = g = g || function(a) {
        clearTimeout(a)
    }
    ;
    return G
}));
/* WOW - v1.1.3 - 2016-05-06
* Copyright (c) 2016 Matthieu Aussaguel;*/
(function() {
    var h, i, j, k, l, m = function(c, d) {
        return function() {
            return c.apply(d, arguments)
        }
    }, n = [].indexOf || function(d) {
        for (var e = 0, f = this.length; f > e; e++) {
            if (e in this && this[e] === d) {
                return e
            }
        }
        return -1
    }
    ;
    i = function() {
        function b() {}
        return b.prototype.extend = function(e, f) {
            var g, o;
            for (g in f) {
                o = f[g],
                null == e[g] && (e[g] = o)
            }
            return e
        }
        ,
        b.prototype.isMobile = function(c) {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(c)
        }
        ,
        b.prototype.createEvent = function(f, g, o, p) {
            var q;
            return null == g && (g = !1),
            null == o && (o = !1),
            null == p && (p = null),
            null != document.createEvent ? (q = document.createEvent("CustomEvent"),
            q.initCustomEvent(f, g, o, p)) : null != document.createEventObject ? (q = document.createEventObject(),
            q.eventType = f) : q.eventName = f,
            q
        }
        ,
        b.prototype.emitEvent = function(c, d) {
            return null != c.dispatchEvent ? c.dispatchEvent(d) : d in (null != c) ? c[d]() : "on" + d in (null != c) ? c["on" + d]() : void 0
        }
        ,
        b.prototype.addEvent = function(d, e, f) {
            return null != d.addEventListener ? d.addEventListener(e, f, !1) : null != d.attachEvent ? d.attachEvent("on" + e, f) : d[e] = f
        }
        ,
        b.prototype.removeEvent = function(d, e, f) {
            return null != d.removeEventListener ? d.removeEventListener(e, f, !1) : null != d.detachEvent ? d.detachEvent("on" + e, f) : delete d[e]
        }
        ,
        b.prototype.innerHeight = function() {
            return "innerHeight"in window ? window.innerHeight : document.documentElement.clientHeight
        }
        ,
        b
    }(),
    j = this.WeakMap || this.MozWeakMap || (j = function() {
        function b() {
            this.keys = [],
            this.values = []
        }
        return b.prototype.get = function(g) {
            var o, p, q, r, s;
            for (s = this.keys,
            o = q = 0,
            r = s.length; r > q; o = ++q) {
                if (p = s[o],
                p === g) {
                    return this.values[o]
                }
            }
        }
        ,
        b.prototype.set = function(o, p) {
            var q, r, s, t, u;
            for (u = this.keys,
            q = s = 0,
            t = u.length; t > s; q = ++s) {
                if (r = u[q],
                r === o) {
                    return void (this.values[q] = p)
                }
            }
            return this.keys.push(o),
            this.values.push(p)
        }
        ,
        b
    }()),
    h = this.MutationObserver || this.WebkitMutationObserver || this.MozMutationObserver || (h = function() {
        function b() {
            "undefined" != typeof console && null !== console && console.warn("MutationObserver is not supported by your browser."),
            "undefined" != typeof console && null !== console && console.warn("WOW.js cannot detect dom mutations, please call .sync() after loading new content.")
        }
        return b.notSupported = !0,
        b.prototype.observe = function() {}
        ,
        b
    }()),
    k = this.getComputedStyle || function(c, d) {
        return this.getPropertyValue = function(a) {
            var e;
            return "float" === a && (a = "styleFloat"),
            l.test(a) && a.replace(l, function(f, g) {
                return g.toUpperCase()
            }),
            (null != (e = c.currentStyle) ? e[a] : void 0) || null
        }
        ,
        this
    }
    ,
    l = /(\-([a-z]){1})/g,
    this.WOW = function() {
        function a(b) {
            null == b && (b = {}),
            this.scrollCallback = m(this.scrollCallback, this),
            this.scrollHandler = m(this.scrollHandler, this),
            this.resetAnimation = m(this.resetAnimation, this),
            this.start = m(this.start, this),
            this.scrolled = !0,
            this.config = this.util().extend(b, this.defaults),
            null != b.scrollContainer && (this.config.scrollContainer = document.querySelector(b.scrollContainer)),
            this.animationNameCache = new j,
            this.wowEvent = this.util().createEvent(this.config.boxClass)
        }
        return a.prototype.defaults = {
            boxClass: "wow",
            animateClass: "animated",
            offset: 0,
            mobile: !0,
            live: !0,
            callback: null,
            scrollContainer: null
        },
        a.prototype.init = function() {
            var b;
            return this.element = window.document.documentElement,
            "interactive" === (b = document.readyState) || "complete" === b ? this.start() : this.util().addEvent(document, "DOMContentLoaded", this.start),
            this.finished = []
        }
        ,
        a.prototype.start = function() {
            var f, g, o, p;
            if (this.stopped = !1,
            this.boxes = function() {
                var b, q, r, s;
                for (r = this.element.querySelectorAll("." + this.config.boxClass),
                s = [],
                b = 0,
                q = r.length; q > b; b++) {
                    f = r[b],
                    s.push(f)
                }
                return s
            }
            .call(this),
            this.all = function() {
                var b, q, r, s;
                for (r = this.boxes,
                s = [],
                b = 0,
                q = r.length; q > b; b++) {
                    f = r[b],
                    s.push(f)
                }
                return s
            }
            .call(this),
            this.boxes.length) {
                if (this.disabled()) {
                    this.resetStyle()
                } else {
                    for (p = this.boxes,
                    g = 0,
                    o = p.length; o > g; g++) {
                        f = p[g],
                        this.applyStyle(f, !0)
                    }
                }
            }
            return this.disabled() || (this.util().addEvent(this.config.scrollContainer || window, "scroll", this.scrollHandler),
            this.util().addEvent(window, "resize", this.scrollHandler),
            this.interval = setInterval(this.scrollCallback, 50)),
            this.config.live ? new h(function(b) {
                return function(q) {
                    var r, s, t, u, v;
                    for (v = [],
                    r = 0,
                    s = q.length; s > r; r++) {
                        u = q[r],
                        v.push(function() {
                            var e, w, x, y;
                            for (x = u.addedNodes || [],
                            y = [],
                            e = 0,
                            w = x.length; w > e; e++) {
                                t = x[e],
                                y.push(this.doSync(t))
                            }
                            return y
                        }
                        .call(b))
                    }
                    return v
                }
            }(this)).observe(document.body, {
                childList: !0,
                subtree: !0
            }) : void 0
        }
        ,
        a.prototype.stop = function() {
            return this.stopped = !0,
            this.util().removeEvent(this.config.scrollContainer || window, "scroll", this.scrollHandler),
            this.util().removeEvent(window, "resize", this.scrollHandler),
            null != this.interval ? clearInterval(this.interval) : void 0
        }
        ,
        a.prototype.sync = function(c) {
            return h.notSupported ? this.doSync(this.element) : void 0
        }
        ,
        a.prototype.doSync = function(g) {
            var o, p, q, r, s;
            if (null == g && (g = this.element),
            1 === g.nodeType) {
                for (g = g.parentNode || g,
                r = g.querySelectorAll("." + this.config.boxClass),
                s = [],
                p = 0,
                q = r.length; q > p; p++) {
                    o = r[p],
                    n.call(this.all, o) < 0 ? (this.boxes.push(o),
                    this.all.push(o),
                    this.stopped || this.disabled() ? this.resetStyle() : this.applyStyle(o, !0),
                    s.push(this.scrolled = !0)) : s.push(void 0)
                }
                return s
            }
        }
        ,
        a.prototype.show = function(b) {
            return this.applyStyle(b),
            b.className = b.className + " " + this.config.animateClass,
            null != this.config.callback && this.config.callback(b),
            this.util().emitEvent(b, this.wowEvent),
            this.util().addEvent(b, "animationend", this.resetAnimation),
            this.util().addEvent(b, "oanimationend", this.resetAnimation),
            this.util().addEvent(b, "webkitAnimationEnd", this.resetAnimation),
            this.util().addEvent(b, "MSAnimationEnd", this.resetAnimation),
            b
        }
        ,
        a.prototype.applyStyle = function(f, g) {
            var o, p, q;
            return p = f.getAttribute("data-wow-duration"),
            o = f.getAttribute("data-wow-delay"),
            q = f.getAttribute("data-wow-iteration"),
            this.animate(function(b) {
                return function() {
                    return b.customStyle(f, g, p, o, q)
                }
            }(this))
        }
        ,
        a.prototype.animate = function() {
            return "requestAnimationFrame"in window ? function(b) {
                return window.requestAnimationFrame(b)
            }
            : function(b) {
                return b()
            }
        }(),
        a.prototype.resetStyle = function() {
            var f, g, o, p, q;
            for (p = this.boxes,
            q = [],
            g = 0,
            o = p.length; o > g; g++) {
                f = p[g],
                q.push(f.style.visibility = "visible")
            }
            return q
        }
        ,
        a.prototype.resetAnimation = function(c) {
            var d;
            return c.type.toLowerCase().indexOf("animationend") >= 0 ? (d = c.target || c.srcElement,
            d.className = d.className.replace(this.config.animateClass, "").trim()) : void 0
        }
        ,
        a.prototype.customStyle = function(f, g, o, p, q) {
            return g && this.cacheAnimationName(f),
            f.style.visibility = g ? "hidden" : "visible",
            o && this.vendorSet(f.style, {
                animationDuration: o
            }),
            p && this.vendorSet(f.style, {
                animationDelay: p
            }),
            q && this.vendorSet(f.style, {
                animationIterationCount: q
            }),
            this.vendorSet(f.style, {
                animationName: g ? "none" : this.cachedAnimationName(f)
            }),
            f
        }
        ,
        a.prototype.vendors = ["moz", "webkit"],
        a.prototype.vendorSet = function(g, o) {
            var p, q, r, s;
            q = [];
            for (p in o) {
                r = o[p],
                g["" + p] = r,
                q.push(function() {
                    var c, e, f, t;
                    for (f = this.vendors,
                    t = [],
                    c = 0,
                    e = f.length; e > c; c++) {
                        s = f[c],
                        t.push(g["" + s + p.charAt(0).toUpperCase() + p.substr(1)] = r)
                    }
                    return t
                }
                .call(this))
            }
            return q
        }
        ,
        a.prototype.vendorCSS = function(d, o) {
            var p, q, r, s, t, u;
            for (t = k(d),
            s = t.getPropertyCSSValue(o),
            r = this.vendors,
            p = 0,
            q = r.length; q > p; p++) {
                u = r[p],
                s = s || t.getPropertyCSSValue("-" + u + "-" + o)
            }
            return s
        }
        ,
        a.prototype.animationName = function(d) {
            var e;
            try {
                e = this.vendorCSS(d, "animation-name").cssText
            } catch (f) {
                e = k(d).getPropertyValue("animation-name")
            }
            return "none" === e ? "" : e
        }
        ,
        a.prototype.cacheAnimationName = function(b) {
            return this.animationNameCache.set(b, this.animationName(b))
        }
        ,
        a.prototype.cachedAnimationName = function(b) {
            return this.animationNameCache.get(b)
        }
        ,
        a.prototype.scrollHandler = function() {
            return this.scrolled = !0
        }
        ,
        a.prototype.scrollCallback = function() {
            var b;
            return !this.scrolled || (this.scrolled = !1,
            this.boxes = function() {
                var f, g, o, p;
                for (o = this.boxes,
                p = [],
                f = 0,
                g = o.length; g > f; f++) {
                    b = o[f],
                    b && (this.isVisible(b) ? this.show(b) : p.push(b))
                }
                return p
            }
            .call(this),
            this.boxes.length || this.config.live) ? void 0 : this.stop()
        }
        ,
        a.prototype.offsetTop = function(c) {
            for (var d; void 0 === c.offsetTop; ) {
                c = c.parentNode
            }
            for (d = c.offsetTop; c = c.offsetParent; ) {
                d += c.offsetTop
            }
            return d
        }
        ,
        a.prototype.isVisible = function(g) {
            var o, p, q, r, s;
            return p = g.getAttribute("data-wow-offset") || this.config.offset,
            s = this.config.scrollContainer && this.config.scrollContainer.scrollTop || window.pageYOffset,
            r = s + Math.min(this.element.clientHeight, this.util().innerHeight()) - p,
            q = this.offsetTop(g),
            o = q + g.clientHeight,
            r >= q && o >= s
        }
        ,
        a.prototype.util = function() {
            return null != this._util ? this._util : this._util = new i
        }
        ,
        a.prototype.disabled = function() {
            return !this.config.mobile && this.util().isMobile(navigator.userAgent)
        }
        ,
        a
    }()
}
).call(this);
;