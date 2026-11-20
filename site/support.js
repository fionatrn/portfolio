/*
 * support.js – kleine Laufzeit für die .dc.html-Seiten aus dem Design-Canvas.
 *
 * Die Seiten sind so geschrieben, wie sie im Canvas liegen:
 *   <x-dc> mit <helmet> (Head-Inhalte) und einem Template mit {{holes}},
 *   <sc-if value="{{…}}">, <sc-for list="{{…}}" as="x"> und onX="{{handler}}",
 *   plus <script type="text/x-dc"> mit `class Component extends DCLogic { … }`.
 *
 * Diese Datei rendert das Template mit den Werten aus renderVals(),
 * gleicht das DOM bei jedem setState() minimal ab (damit CSS-Transitions
 * erhalten bleiben) und ruft componentDidMount / componentDidUpdate auf.
 */
(function () {
  'use strict';

  // Template bis zum ersten Render verstecken (kein Aufblitzen von {{…}}).
  document.write('<style id="dc-hide">x-dc{display:none!important}</style>');

  // Canvas-Dateinamen → saubere URLs auf der Live-Seite.
  var ROUTES = { 'Main.dc.html': '/', 'Ordner.dc.html': '/about', 'Imprint.dc.html': '/imprint' };
  function mapHref(v) {
    var m = /^(?:\.\/)?([A-Za-z]+\.dc\.html)(#.*)?$/.exec(v);
    if (!m || !ROUTES[m[1]]) return v;
    return ROUTES[m[1]] + (m[2] || '');
  }

  // ---------- Werte auflösen ----------
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;

  function lookup(expr, scope) {
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (expr === 'undefined') return undefined;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    if (/^'.*'$|^".*"$/.test(expr)) return expr.slice(1, -1);
    var parts = expr.split('.');
    var cur = scope;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  // Ein einzelnes {{x}} liefert den Rohwert, gemischter Text einen String.
  function evalText(str, scope) {
    var single = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/.exec(str);
    if (single) return lookup(single[1], scope);
    return str.replace(HOLE, function (_, e) {
      var v = lookup(e, scope);
      return v == null || v === false ? '' : String(v);
    });
  }

  function child(scope, name, value) {
    var s = Object.create(scope);
    s[name] = value;
    return s;
  }

  // ---------- Template → virtuelle Knoten ----------
  // vnode: { text } | { tpl, attrs: {name: value}, on: {type: fn}, kids: [] }
  function build(node, scope, out) {
    if (node.nodeType === 3) {
      var raw = node.data;
      var v = raw.indexOf('{{') >= 0 ? evalText(raw, scope) : raw;
      out.push({ text: v == null || v === false ? '' : String(v) });
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.localName;

    if (tag === 'sc-if') {
      if (evalText(node.getAttribute('value') || '', scope)) buildKids(node, scope, out);
      return;
    }
    if (tag === 'sc-for') {
      var list = evalText(node.getAttribute('list') || '', scope) || [];
      var as = node.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) buildKids(node, child(scope, as, list[i]), out);
      return;
    }

    var vn = { tpl: node, ns: node.namespaceURI, tag: tag, attrs: {}, on: {}, kids: [] };
    var at = node.attributes;
    for (var j = 0; j < at.length; j++) {
      var name = at[j].name, val = at[j].value;
      if (name.indexOf('hint-') === 0) continue;
      // Ereignisse: "data-on-click" (bevorzugt) oder "onClick" (Canvas-Format).
      // Die Seiten nutzen data-on-*, weil der Browser bei on*-Attributen schon
      // beim Einlesen des Templates eine CSP-Warnung meldet (script-src-attr).
      var evName = name.indexOf('data-on-') === 0 ? name.slice(8)
        : (name.length > 2 && name.slice(0, 2) === 'on' ? name.slice(2) : null);
      if (evName) {
        var fn = evalText(val, scope);
        if (typeof fn === 'function') vn.on[evName.toLowerCase()] = fn;
        continue;
      }
      var res = val.indexOf('{{') >= 0 ? evalText(val, scope) : val;
      if (res == null || res === false) continue;
      res = String(res);
      if (name === 'href') res = mapHref(res);
      vn.attrs[name] = res;
    }
    buildKids(node, scope, vn.kids);
    out.push(vn);
  }

  function buildKids(node, scope, out) {
    var c = node.childNodes;
    for (var i = 0; i < c.length; i++) build(c[i], scope, out);
  }

  // ---------- virtuelle Knoten → echtes DOM ----------
  function create(vn) {
    if ('text' in vn) return document.createTextNode(vn.text);
    var el = vn.ns && vn.ns !== 'http://www.w3.org/1999/xhtml'
      ? document.createElementNS(vn.ns, vn.tpl.tagName)
      : document.createElement(vn.tag);
    el.__tpl = vn.tpl;
    patchAttrs(el, vn);
    patchEvents(el, vn);
    for (var i = 0; i < vn.kids.length; i++) el.appendChild(create(vn.kids[i]));
    return el;
  }

  // Nur Attribute anfassen, die aus dem Template stammen. Was Skripte zur
  // Laufzeit setzen (z. B. die Klasse "in" der Scroll-Animationen,
  // data-obs), bleibt erhalten.
  function patchAttrs(el, vn) {
    var prev = el.__attrs || {};
    var next = vn.attrs;
    for (var k in prev) if (!(k in next)) el.removeAttribute(k);
    for (var n in next) {
      var v = next[n];
      if (n === 'class') {
        var own = (prev['class'] || '').split(/\s+/).filter(Boolean);
        var extra = (el.getAttribute('class') || '').split(/\s+/)
          .filter(function (c) { return c && own.indexOf(c) < 0; });
        var want = v.split(/\s+/).filter(Boolean);
        extra.forEach(function (c) { if (want.indexOf(c) < 0) want.push(c); });
        v = want.join(' ');
      }
      if (el.getAttribute(n) !== v) el.setAttribute(n, v);
    }
    el.__attrs = next;
  }

  function patchEvents(el, vn) {
    var h = el.__on || (el.__on = {});
    var bound = el.__bound || (el.__bound = {});
    for (var t in h) if (!(t in vn.on)) h[t] = null;
    for (var type in vn.on) {
      h[type] = vn.on[type];
      if (!bound[type]) {
        bound[type] = true;
        (function (tp) {
          el.addEventListener(tp, function (e) { var f = el.__on[tp]; if (f) f(e); },
            tp === 'touchstart' || tp === 'touchmove' ? { passive: true } : false);
        })(type);
      }
    }
  }

  function same(el, vn) {
    if ('text' in vn) return el.nodeType === 3;
    return el.nodeType === 1 && el.__tpl === vn.tpl;
  }

  function patchKids(parent, kids) {
    var i = 0;
    for (; i < kids.length; i++) {
      var vn = kids[i];
      var el = parent.childNodes[i];
      if (!el) { parent.appendChild(create(vn)); continue; }
      if (!same(el, vn)) { parent.replaceChild(create(vn), el); continue; }
      if ('text' in vn) { if (el.data !== vn.text) el.data = vn.text; continue; }
      patchAttrs(el, vn);
      patchEvents(el, vn);
      patchKids(el, vn.kids);
    }
    while (parent.childNodes.length > i) parent.removeChild(parent.lastChild);
  }

  // ---------- Komponente ----------
  function DCLogic(props) {
    this.props = props || {};
    this.state = {};
  }
  DCLogic.prototype.renderVals = function () { return {}; };
  DCLogic.prototype.setState = function (patch) {
    var p = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    if (p) for (var k in p) this.state[k] = p[k];
    if (this.__render) this.__render();
  };

  function boot() {
    var host = document.querySelector('x-dc');
    var script = document.querySelector('script[type="text/x-dc"]');
    if (!host || !script) return;

    // Liegt der Inhalt in einem <template>, parst der Browser ihn inert
    // (keine Konsolenfehler für Attribute wie height="{{logoH}}").
    var src = host;
    for (var c = host.firstElementChild; c; c = c.nextElementSibling) {
      if (c.localName === 'template') { src = c.content; break; }
    }

    // Head-Inhalte aus <helmet> übernehmen.
    var helmet = src.querySelector('helmet');
    if (helmet) {
      while (helmet.firstChild) {
        var n = helmet.firstChild;
        helmet.removeChild(n);
        if (n.nodeType === 1) document.head.appendChild(document.importNode(n, true));
      }
      helmet.parentNode.removeChild(helmet);
    }

    // Template einsammeln und aus dem Dokument nehmen.
    // In ein eigenes, unsichtbares Dokument, damit der Browser die
    // Platzhalter-Attribute nicht als echte Werte auswertet.
    var inert = document.implementation.createHTMLDocument('');
    var tpl = inert.createElement('div');
    while (src.firstChild) { tpl.appendChild(inert.importNode(src.firstChild, true)); src.removeChild(src.firstChild); }
    var mount = document.createElement('div');
    mount.id = 'dc-root';
    mount.style.display = 'contents';
    host.parentNode.replaceChild(mount, host);
    var hide = document.getElementById('dc-hide');
    if (hide) hide.parentNode.removeChild(hide);

    // Props: Standardwerte aus data-props.
    var props = {};
    try {
      var spec = JSON.parse(script.getAttribute('data-props') || '{}');
      for (var key in spec) if (key[0] !== '$' && spec[key] && 'default' in spec[key]) props[key] = spec[key]['default'];
    } catch (e) {}

    var Component = new Function('DCLogic', script.textContent + '\n;return Component;')(DCLogic);
    var comp = new Component(props);
    if (!comp.state) comp.state = {};
    if (!comp.props) comp.props = props;

    // Seitenfarbe auf <html>/<body> und theme-color übertragen. Safari (iPhone)
    // färbt damit die Bereiche hinter Statusleiste und Adressleiste sowie das
    // Überscrollen – sonst bleiben sie weiß. Gelesen wird die Grundfarbe des
    // obersten Elements (letzte Ebene von "background"), nur bei Änderung.
    var lastBg = '';
    function syncPageColor() {
      var first = mount.firstElementChild;
      var bg = first && first.style ? first.style.backgroundColor : '';
      if (!bg || bg === lastBg) return;
      lastBg = bg;
      document.documentElement.style.backgroundColor = bg;
      document.body.style.backgroundColor = bg;
      var meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
      meta.content = bg;
    }

    var rendering = false, again = false, mounted = false;
    function render() {
      if (rendering) { again = true; return; }
      rendering = true;
      do {
        again = false;
        var vals = comp.renderVals() || {};
        var kids = [];
        buildKids(tpl, vals, kids);
        patchKids(mount, kids);
      } while (again);
      rendering = false;
      syncPageColor();
      if (mounted && comp.componentDidUpdate) comp.componentDidUpdate();
    }
    comp.__render = render;
    render();
    mounted = true;
    if (comp.componentDidMount) comp.componentDidMount();
  }

  window.DCLogic = DCLogic;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
