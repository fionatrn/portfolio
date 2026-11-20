/*
 * design-system.js – Light/Dark für die statische Design-System-Seite.
 * Gleicher Speicher-Schlüssel wie die übrigen Seiten ("fiona-theme"),
 * damit die Wahl seitenübergreifend gilt. Als eigene Datei, weil die
 * Content-Security-Policy keine Inline-Skripte erlaubt.
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var stored = null;
  try { stored = window.localStorage.getItem('fiona-theme'); } catch (e) {}
  var sysDark = false;
  try { sysDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); } catch (e) {}
  root.setAttribute('data-theme', stored === 'dark' || stored === 'light' ? stored : (sysDark ? 'dark' : 'light'));

  function ready() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    function sync() {
      var dark = root.getAttribute('data-theme') === 'dark';
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    sync();
    btn.addEventListener('click', function () {
      var dark = root.getAttribute('data-theme') !== 'dark';
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
      try { window.localStorage.setItem('fiona-theme', dark ? 'dark' : 'light'); } catch (e) {}
      sync();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
