/*
 * design-system.js – Sprachwahl für die statische Designsystem-Seite.
 * Gleicher Speicher-Schlüssel wie die übrigen Seiten ("fiona-lang"), damit die Wahl seitenübergreifend gilt:
 * Besucher sehen zuerst Englisch, wer Deutsch wählt, bekommt es beim nächsten Besuch wieder.
 * Texte mit data-de werden getauscht (nur Elemente ohne Kind-Elemente), data-de-label tauscht aria-label.
 * Als eigene Datei, weil die Content-Security-Policy keine Inline-Skripte erlaubt.
 */
(function () {
  'use strict';
  var KEY = 'fiona-lang';
  var root = document.documentElement;

  function stored() {
    try { return window.localStorage.getItem(KEY) === 'de' ? 'de' : 'en'; } catch (e) { return 'en'; }
  }

  function apply(lang) {
    var de = lang === 'de';
    root.lang = lang;
    var texts = document.querySelectorAll('[data-de]');
    for (var i = 0; i < texts.length; i++) {
      var el = texts[i];
      if (el._en == null) el._en = el.textContent;
      el.textContent = de ? el.getAttribute('data-de') : el._en;
    }
    var labels = document.querySelectorAll('[data-de-label]');
    for (var j = 0; j < labels.length; j++) {
      var lb = labels[j];
      if (lb._en == null) lb._en = lb.getAttribute('aria-label');
      lb.setAttribute('aria-label', de ? lb.getAttribute('data-de-label') : lb._en);
    }
    if (root._enTitle == null) root._enTitle = document.title;
    document.title = de ? (root.getAttribute('data-title-de') || root._enTitle) : root._enTitle;
    var code = document.getElementById('lang-code');
    if (code) code.textContent = de ? 'DE' : 'EN';
    var btn = document.getElementById('lang-toggle');
    if (btn) btn.setAttribute('aria-label', de ? 'Sprache: Deutsch. Auf Englisch umstellen' : 'Language: English. Switch to German');
  }

  function ready() {
    var lang = stored();
    if (lang === 'de') apply(lang);
    var btn = document.getElementById('lang-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      lang = lang === 'de' ? 'en' : 'de';
      try { window.localStorage.setItem(KEY, lang); } catch (e) {}
      apply(lang);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
