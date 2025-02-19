"use strict";
!(function() {
    function t(i) {
        if (!(this instanceof t)) return new t(i);
        (this._canvas = i = "string" == typeof i ? document.getElementById(i) : i),
        (this._ctx = i.getContext("2d")),
        (this._width = i.width),
        (this._height = i.height),
        (this._max = 1),
        this.clear();
    }
    (t.prototype = {
        defaultRadius: 25,
        defaultGradient: {
            0.4: "blue",
            0.6: "cyan",
            0.7: "lime",
            0.8: "yellow",
            1: "red",
        },
        data: function(t, i) {
            return (this._data = t), this;
        },
        max: function(t) {
            return (this._max = t), this;
        },
        add: function(t) {
            return this._data.push(t), this;
        },
        clear: function() {
            return (this._data = []), this;
        },
        radius: function(t, i) {
            i = i || 15;
            var a = (this._circle = document.createElement("canvas")),
                s = a.getContext("2d"),
                e = (this._r = t + i);
            return (
                (a.width = a.height = 2 * e),
                (s.shadowOffsetX = s.shadowOffsetY = 200),
                (s.shadowBlur = i),
                (s.shadowColor = "black"),
                s.beginPath(),
                s.arc(e - 200, e - 200, t, 0, 2 * Math.PI, !0),
                s.closePath(),
                s.fill(),
                this
            );
        },
        gradient: function(t) {
            var i = document.createElement("canvas"),
                a = i.getContext("2d"),
                s = a.createLinearGradient(0, 0, 0, 256);
            (i.width = 1), (i.height = 256);
            for (var e in t) s.addColorStop(e, t[e]);
            return (
                (a.fillStyle = s),
                a.fillRect(0, 0, 1, 256),
                (this._grad = a.getImageData(0, 0, 1, 256).data),
                this
            );
        },
        draw: function(t) {
            this._circle || this.radius(this.defaultRadius),
                this._grad || this.gradient(this.defaultGradient);
            var i = this._ctx;
            i.clearRect(0, 0, this._width, this._height);
            for (var a, s = 0, e = this._data.length; s < e; s++)
                (a = this._data[s]),
                (i.globalAlpha = Math.max(a[2] / this._max, t || 0.05)),
                i.drawImage(this._circle, a[0] - this._r, a[1] - this._r);
            var n = i.getImageData(0, 0, this._width, this._height);
            return this._colorize(n.data, this._grad), i.putImageData(n, 0, 0), this;
        },
        _colorize: function(t, i) {
            for (var a, s = 3, e = t.length; s < e; s += 4)
                (a = 4 * t[s]) &&
                ((t[s - 3] = i[a]), (t[s - 2] = i[a + 1]), (t[s - 1] = i[a + 2]));
        },
    }),
    (window.simpleheat = t);
})(),
(L.HeatLayer = (L.Layer ? L.Layer : L.Class).extend({
    initialize: function(t, i) {
        (this._latlngs = t), L.setOptions(this, i);
    },
    setLatLngs: function(t) {
        return (this._latlngs = t), this.redraw();
    },
    addLatLng: function(t) {
        return this._latlngs.push(t), this.redraw();
    },
    setOptions: function(t) {
        return (
            L.setOptions(this, t),
            this._heat && this._updateOptions(),
            this.redraw()
        );
    },
    redraw: function() {
        return (
            this._heat &&
            !this._frame &&
            this._map &&
            !this._map._animating &&
            (this._frame = L.Util.requestAnimFrame(this._redraw, this)),
            this
        );
    },
    onAdd: function(t) {
        (this._map = t),
        this._canvas || this._initCanvas(),
            this.options.pane ?
            this.getPane().appendChild(this._canvas) :
            t._panes.overlayPane.appendChild(this._canvas),
            t.on("moveend", this._reset, this),
            t.options.zoomAnimation &&
            L.Browser.any3d &&
            t.on("zoomanim", this._animateZoom, this),
            this._reset();
    },
    onRemove: function(t) {
        this.options.pane ?
            this.getPane().removeChild(this._canvas) :
            t.getPanes().overlayPane.removeChild(this._canvas),
            t.off("moveend", this._reset, this),
            t.options.zoomAnimation && t.off("zoomanim", this._animateZoom, this);
    },
    addTo: function(t) {
        return t.addLayer(this), this;
    },
    _initCanvas: function() {
        var t = (this._canvas = L.DomUtil.create(
                "canvas",
                "leaflet-heatmap-layer leaflet-layer"
            )),
            i = L.DomUtil.testProp([
                "transformOrigin",
                "WebkitTransformOrigin",
                "msTransformOrigin",
            ]);
        t.style[i] = "50% 50%";
        var a = this._map.getSize();
        (t.width = a.x), (t.height = a.y);
        var s = this._map.options.zoomAnimation && L.Browser.any3d;
        L.DomUtil.addClass(t, "leaflet-zoom-" + (s ? "animated" : "hide")),
            (this._heat = simpleheat(t)),
            this._updateOptions();
    },
    _updateOptions: function() {
        this._heat.radius(
                this.options.radius || this._heat.defaultRadius,
                this.options.blur
            ),
            this.options.gradient && this._heat.gradient(this.options.gradient),
            this.options.max && this._heat.max(this.options.max);
    },
    _reset: function() {
        var t = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, t);
        var i = this._map.getSize();
        this._heat._width !== i.x &&
            (this._canvas.width = this._heat._width = i.x),
            this._heat._height !== i.y &&
            (this._canvas.height = this._heat._height = i.y),
            this._redraw();
    },
    _redraw: function() {
        if (this._map) {
            var t,
                i,
                a,
                s,
                e,
                n,
                h,
                o,
                r,
                _ = [],
                d = this._heat._r,
                l = this._map.getSize(),
                m = new L.Bounds(L.point([-d, -d]), l.add([d, d])),
                c = void 0 === this.options.max ? 1 : this.options.max,
                u =
                void 0 === this.options.maxZoom ?
                this._map.getMaxZoom() :
                this.options.maxZoom,
                f =
                1 / Math.pow(2, Math.max(0, Math.min(u - this._map.getZoom(), 12))),
                p = d / 2,
                g = [],
                v = this._map._getMapPanePos(),
                w = v.x % p,
                y = v.y % p;
            for (t = 0, i = this._latlngs.length; t < i; t++)
                if (
                    ((a = this._map.latLngToContainerPoint(this._latlngs[t])),
                        m.contains(a))
                ) {
                    (e = Math.floor((a.x - w) / p) + 2),
                    (n = Math.floor((a.y - y) / p) + 2);
                    var x =
                        void 0 !== this._latlngs[t].alt ?
                        this._latlngs[t].alt :
                        void 0 !== this._latlngs[t][2] ?
                        +this._latlngs[t][2] :
                        1;
                    (r = x * f),
                    (g[n] = g[n] || []),
                    (s = g[n][e]),
                    s
                        ?
                        ((s[0] = (s[0] * s[2] + a.x * r) / (s[2] + r)),
                            (s[1] = (s[1] * s[2] + a.y * r) / (s[2] + r)),
                            (s[2] += r)) :
                        (g[n][e] = [a.x, a.y, r]);
                }
            for (t = 0, i = g.length; t < i; t++)
                if (g[t])
                    for (h = 0, o = g[t].length; h < o; h++)
                        (s = g[t][h]) &&
                        _.push([Math.round(s[0]), Math.round(s[1]), Math.min(s[2], c)]);
            this._heat.data(_).draw(this.options.minOpacity), (this._frame = null);
        }
    },
    _animateZoom: function(t) {
        var i = this._map.getZoomScale(t.zoom),
            a = this._map
            ._getCenterOffset(t.center)
            ._multiplyBy(-i)
            .subtract(this._map._getMapPanePos());
        L.DomUtil.setTransform ?
            L.DomUtil.setTransform(this._canvas, a, i) :
            (this._canvas.style[L.DomUtil.TRANSFORM] =
                L.DomUtil.getTranslateString(a) + " scale(" + i + ")");
    },
})),
(L.heatLayer = function(t, i) {
    return new L.HeatLayer(t, i);
});