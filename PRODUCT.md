# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Mainly tech recruiters and engineering teams hiring a full-stack developer. They open the site from a job application, CV or LinkedIn, usually on a laptop between other tasks, sometimes on a phone. Their job: see within a minute who Fiona is, what she has built, and whether her skills fit.

## Product Purpose
Personal portfolio of Fiona Tran, dual computer-science student (Ostfalia) and full-stack developer at Volkswagen AG. It shows projects (Work), a profile with tech stack, CV and contact (About), and the legal pages (Imprint). Success: a recruiter understands her range ("from database to details") and gets in touch.

## Positioning
A developer who also cares about the details of the interface: the site itself is a project, built framework-free with a small custom runtime and deployed through her own CI/CD pipeline.

## Capabilities and Constraints
- Static pages served by nginx in Docker; no framework. Pages keep the design-canvas format (`{{holes}}`, `<sc-if>`, `<sc-for>`, `class Component extends DCLogic`) rendered by `site/support.js`; styles are inline strings computed in each page's `renderVals()`.
- Strict CSP: scripts only from self, styles inline or Google Fonts, fonts from Google Fonts.
- One design (paper look), no theme switch. Shared colours, fonts and styles live in `site/paper.js` (global `PAPER`). The standalone design-system page (`site/design-system.html`) shows colours, type, logo and building blocks and has its own EN/DE toggle (`site/design-system.js`).
- Content is English and German, switched by the globe button (English first, choice kept in localStorage `fiona-lang`). Each page keeps its texts as `L(english, german)` in `renderVals()` (`tx`), shared nav/footer words in `PAPER.words()`. German addresses visitors with "du". Imprint/Privacy text is German in both languages.

## Brand Commitments
- The "fiona" wordmark appears as the script logo in the header.
- Design: elegant-modern with paper elements and textures, after the Maison Noyer identity (braaands.co). Colours #6C143B, #4C6D35, #BFD485, #FFCCDA on a white/beige/greige ground. Body text must be plainly readable; only large headlines may carry character.

## Evidence on Hand
- Real projects: "My portfolio" (this site) and "Bunny figure" with images in `site/projects/`. Projects 02–07 are placeholders.
- Portrait at `site/images/portrait.jpg`; CV facts and contact links in `site/about.html`.
- No testimonials, metrics or client logos exist; do not invent any.

## Product Principles
- Skills first: a recruiter must find projects, stack and contact without hunting.
- The interface is proof of craft, so details (states, motion, focus) must be right.
- Readability beats decoration.
