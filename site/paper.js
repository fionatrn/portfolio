/*
 * paper.js – das Design der Seite ("Outline"): Farben, Schriften und gemeinsame Styles für Work, About und Imprint.
 *
 * Elegant-modern auf ungestrichenem Papier: Greige-Grund mit Körnung, ein Horizont-Verlauf
 * aus Oliv, Beerenrot und Nebelblau nach den Maison-Noyer-Drucken, Weinrot als Schrift- und
 * Akzentfarbe, Büroklammer und mattes Pergament. Navigation als schlichte Wörter ohne Pille.
 * Große Überschriften in Pinyon Script, Titel in Tenor Sans, Text in Inter.
 */
(function () {
  'use strict';

  var c = {
    wine: '#6C143B',      // Überschriften, aktive Elemente
    olive: '#4C6D35',     // Fläche mit weißer Schrift (5.9:1)
    lime: '#BFD485',
    pink: '#FFCCDA',
    ground: '#ECE8E1',    // Greige
    paper: '#FAF8F4',     // Blatt, weiß-beige
    sand: '#E3DED5',      // zweite Papierlage
    ink: '#2A2125',       // Fließtext (14:1 auf Papier)
    muted: '#62575B',     // Nebentext (6.6:1 auf Papier)
    oliveInk: '#2E4520',  // Schrift auf Lime (7.6:1)
    // Maison-Noyer-Töne: Walnuss und Nebelblau
    walnut: '#5B2E1F',
    mist: '#AEBBC1',
    line: 'rgba(42,33,37,0.12)'
  };

  // Drei Ebenen: hero – die großen Überschriften (Hallo, Kontakt, Projekttitel, Imprint) in Pinyon
  // Script; display – kleinere Titel (Reiter, Etikett, Zwischenüberschriften) in Tenor Sans,
  // serifenlos und edel; text – Fließtext in Inter
  var f = {
    display: '"Tenor Sans", Inter, sans-serif',
    hero: '"Pinyon Script", cursive',
    text: 'Inter, sans-serif'
  };

  var ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
  var shadow = '0 1px 2px rgba(60,40,45,0.08), 0 10px 30px rgba(60,40,45,0.10)';
  var lift = '0 2px 4px rgba(60,40,45,0.10), 0 24px 50px rgba(60,40,45,0.16)';
  // Der Verlauf der Identität: Oliv → Lime → Rosa
  var bloom = 'linear-gradient(180deg, ' + c.olive + ' 0%, #8FA85C 30%, ' + c.lime + ' 55%, #F4D3C8 80%, ' + c.pink + ' 100%)';

  // Horizont für Work und About, nach den Maison-Noyer-Drucken: Moos-Oliv, ein breites Feld in dunklem
  // Beerenrot (#5B1132), Nebelblau und unten wieder ins Greige. Zwischen den Ankerfarben liegen weich
  // (smoothstep) gerechnete Zwischenstufen, damit an den Ankern keine Knicke und keine sichtbaren Bänder entstehen.
  function smoothGradient(stops, steps) {
    var out = [];
    for (var i = 0; i < stops.length - 1; i++) {
      var a = stops[i], b = stops[i + 1];
      for (var k = 0; k < steps; k++) {
        var t = k / steps, s = t * t * (3 - 2 * t), col = [];
        for (var j = 0; j < 4; j++) col.push(a[1][j] + (b[1][j] - a[1][j]) * s);
        out.push('rgba(' + Math.round(col[0]) + ',' + Math.round(col[1]) + ',' + Math.round(col[2]) + ',' + col[3].toFixed(3) + ') ' + (a[0] + (b[0] - a[0]) * t).toFixed(2) + '%');
      }
    }
    var z = stops[stops.length - 1];
    out.push('rgba(' + z[1].join(',') + ') ' + z[0] + '%');
    return 'linear-gradient(180deg, ' + out.join(', ') + ')';
  }
  // Beginnt oben schon im Oliv und geht über die ganze Seite
  var OLIVE = [110, 107, 36, 1], BERRY = [91, 17, 50, 1], MIST = [150, 166, 176, 1], GREIGE = [236, 232, 225, 1];
  var horizon = smoothGradient([[0, OLIVE], [8, OLIVE], [40, BERRY], [56, BERRY], [80, MIST], [100, GREIGE]], 8);

  var CSS = '::selection{background:' + c.pink + ';color:' + c.wine + '}' +
    ':focus-visible{outline:2px solid ' + c.wine + '!important;outline-offset:3px!important}' +
    'html{scrollbar-color:' + c.muted + ' ' + c.ground + '}' +
    // Projektansicht: schmale Leiste ohne Pfeile, die Spur hält Abstand zu den runden Ecken.
    // scrollbar-color muss hier auf auto, sonst ignoriert Chrome die ::-webkit-scrollbar-Regeln.
    '[role=dialog]{scrollbar-color:auto}' +
    // Breite wie eine normale Systemleiste (16px), sichtbarer Griff 10px, mindestens 48px hoch; am Handy 12px (Griff 6px).
    // Griff im Braungrau, einen Hauch heller als Nebentext; beim Hover/Ziehen der volle Nebentext-Ton.
    '[role=dialog]::-webkit-scrollbar{width:16px}' +
    '@media (max-width:759px){[role=dialog]::-webkit-scrollbar{width:12px}}' +
    '[role=dialog]::-webkit-scrollbar-button{display:none;width:0;height:0}' +
    '[role=dialog]::-webkit-scrollbar-track{background:transparent;margin:24px 0}' +
    '[role=dialog]::-webkit-scrollbar-thumb{min-height:48px;background:#7A6E72;background-clip:padding-box;border:3px solid transparent;border-radius:999px}' +
    '[role=dialog]::-webkit-scrollbar-thumb:hover,[role=dialog]::-webkit-scrollbar-thumb:active{background:' + c.muted + ';background-clip:padding-box}' +
    '@supports not selector(::-webkit-scrollbar){[role=dialog]{scrollbar-width:auto;scrollbar-color:#7A6E72 transparent}}' +
    '@supports not selector(::-webkit-scrollbar){@media (max-width:759px){[role=dialog]{scrollbar-width:thin}}}';
  var styled = false;

  var P = {
    c: c, f: f, ease: ease, shadow: shadow, lift: lift, bloom: bloom, horizon: horizon,

    // Globale Regeln (Auswahl, Fokus, Scrollleisten) einmal pro Seite einhängen
    mark: function () {
      try {
        if (!styled) { var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); styled = true; }
      } catch (e) {}
    },

    rootBg: c.ground,
    // Papierkörnung über dem Greige
    grain: 'position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.22; mix-blend-mode: multiply; pointer-events: none',

    // ink: Logo und Icons in Weinrot
    t: { bg: c.ground, ink: c.wine, muted: c.muted, photo: 'linear-gradient(180deg, #DDD6CB 0%, #C9C0B3 100%)' },

    // Mattes Pergament
    vellum: 'background: rgba(250,248,244,0.68); border: 1px solid rgba(255,255,255,0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 1px 2px rgba(60,40,45,0.08)',
    // Kleine Versal-Zeile (Feingedrucktes), nur für Metadaten
    fine: 'font: 500 12px/1.4 ' + f.text + '; letter-spacing: 0.12em; text-transform: uppercase',

    button: 'display: inline-flex; align-items: center; justify-content: center; align-self: flex-start; min-height: 48px; padding: 0 26px; border: 0; border-radius: 999px; background: ' + c.wine + '; color: ' + c.pink + '; font: 500 15px/1 ' + f.text,

    // Büroklammer (SVG im Template, viewBox 0 0 28 74)
    clip: function (pos, h, rot) { return 'position: absolute; z-index: 4; ' + pos + '; width: auto; height: ' + (h || 64) + 'px; rotate: ' + (rot || 0) + 'deg; pointer-events: none; filter: drop-shadow(1px 2px 1.5px rgba(60,40,45,0.25))'; },

    // Tech-Tags: Papierfarben nach Kategorie
    tag: function (k) {
      var m = { mint: [c.lime, c.oliveInk], blue: ['#D3DCE0', c.ink], orange: [c.pink, c.wine], pink: [c.pink, c.wine], lilac: [c.sand, c.ink], yellow: [c.lime, c.oliveInk] }[k] || [c.sand, c.ink];
      return 'cursor: default; user-select: none; -webkit-user-select: none; position: relative; overflow: hidden; display: inline-flex; align-items: center; min-height: 28px; padding: 0 12px; border-radius: 999px; background: ' + m[0] + '; color: ' + m[1] + '; font: 500 13px/1 ' + f.text;
    },

    // Schlichte Navigation: zwei Wörter ohne Pille und Rahmen, das aktuelle mit feiner Linie darunter,
    // das andere gedämpft. ink 'light' für Kopfzeilen auf dem dunklen Oliv (Work, About), 'walnut' auf
    // hellem Grund (Imprint). Die Tab-Leiste am Handy liegt unten auf hellem Grund und ist immer in Walnuss.
    outlineUi: function (ink) {
      var col = ink === 'light' ? c.paper : c.walnut;
      // Mindesthöhe 44px bleibt als Trefferfläche, sichtbar ist nur das Wort.
      // Tenor Sans wie die Titel; das gedämpfte Wort bei 0.75 bleibt auf dem Oliv lesbar
      var word = 'display: inline-flex; align-items: center; flex: none; min-height: 44px; padding: 0; border: 0; border-radius: 0; cursor: pointer; background: transparent; color: ' + col + '; font: 400 18px/1 ' + f.display + '; letter-spacing: 0.06em; transition: opacity 160ms ' + ease;
      var tab = 'display: inline-flex; align-items: center; justify-content: center; flex: 1; min-height: 44px; padding: 0 8px; border: 0; border-radius: 999px; font: 400 15px/1 ' + f.text + '; letter-spacing: 0.02em; color: ' + c.walnut;
      return {
        nav: 'display: flex; gap: 36px; padding: 0',
        pill: word + '; opacity: 0.75',
        pillActive: word + '; opacity: 1; background: linear-gradient(currentColor, currentColor) no-repeat left bottom 7px / 100% 1px',
        // Icon-Button (Schließen-X der Projektansicht): flach, ohne Fläche und Schatten
        iconBtn: 'display: inline-flex; align-items: center; justify-content: center; flex: none; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 999px; cursor: pointer; background: transparent',
        iconW: '1.3',
        tabBar: 'position: fixed; z-index: 30; left: 16px; right: 16px; bottom: calc(env(safe-area-inset-bottom, 0px) + 24px); display: flex; justify-content: space-between; gap: 4px; padding: 3px; border: 1px solid ' + c.walnut + '; border-radius: 999px; background: rgba(236,232,225,0.35); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px)',
        tabBtn: tab,
        tabBtnActive: tab + '; background: rgba(91,46,31,0.12)'
      };
    }
  };

  window.PAPER = P;
})();
