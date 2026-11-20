# fiona-tran.com

Portfolio website of Fiona Tran – static pages served by nginx in a Docker image.

## Structure

```
site/                    the website (served as-is)
  index.html             Work – project wheel        → /
  about.html             About – file folder          → /about
  imprint.html           Imprint & privacy            → /imprint
  design-system.html     Design system (static, no runtime) → /design-system
  design-system.js       light/dark toggle for the design system page
  support.js             small runtime for the pages (templates, state, DOM patching)
  projects/              images for the project detail views
  icons/, favicon.svg, apple-touch-icon.png, og-image.png
nginx/                   nginx config (clean URLs, caching, security headers)
Dockerfile               nginx-unprivileged, port 8080, healthcheck at /healthz
.github/workflows/       build → push to ghcr.io → pin tag in deploy/
deploy/portainer-stack.yml   Compose file for Portainer
```

The pages keep the format of the design canvas (`{{holes}}`, `<sc-if>`, `<sc-for>`,
`class Component extends DCLogic`). To bring over a change from the canvas, copy the
template and the component script of `Main.dc.html` / `Ordner.dc.html` / `Imprint.dc.html`
into `index.html` / `about.html` / `imprint.html`. Links to `*.dc.html` are rewritten to
the clean URLs automatically.

Event handlers are written as `data-on-click="{{…}}"` instead of the canvas's
`onClick="{{…}}"`: the browser reports every `on…` attribute as a CSP violation
(`script-src-attr`), even inside `<template>`. `support.js` understands both, so pasted
canvas markup still works – rename the attributes to keep the console clean.

`support.js` is cached for 5 minutes, so the pages load it as `/support.js?v=N`. When
`support.js` changes in a way the pages depend on, bump `v` in all three pages.

## Run locally

Run one of the two from the project root. Both commands work in Windows PowerShell 5.1
and PowerShell 7.

**The real container** (same as on the server) → http://localhost:8080, stop with `Ctrl+C`:

```shell
docker build -t fiona-portfolio .; if ($?) { docker run --rm -p 8080:8080 fiona-portfolio }
```

**Quick preview without Docker** → http://localhost:8000. Clean URLs such as `/about`
only work in the container, because nginx resolves them:

```shell
python -m http.server 8000 --directory site
```

## Pipeline

On every push to `main`, GitHub Actions

1. builds the image for `linux/amd64` and `linux/arm64`,
2. pushes it to `ghcr.io/<owner>/<repo>` with the tags `latest` and `sha-<commit>`,
3. starts the image once and checks `/`, `/about`, `/imprint` (smoke test),
4. writes the new `sha-…` tag into `deploy/portainer-stack.yml` and commits it
   (`[skip ci]`, so it does not trigger another build),
5. optionally calls a Portainer webhook (secret `PORTAINER_WEBHOOK_URL`).

Pull requests are built but not pushed.

## Deploy with Portainer

1. **Registry access** – the image on ghcr.io is private by default. Either make the
   package public (GitHub → Packages → the package → Package settings → Change visibility),
   or add `ghcr.io` in Portainer under *Registries* with a GitHub token that has
   `read:packages`.
2. **Stack** – Stacks → Add stack → *Repository*:
   - Repository URL: `https://github.com/<owner>/<repo>`
     (private repo: turn on *Authentication* and use a token with read access)
   - Repository reference: `refs/heads/main`
   - Compose path: `deploy/portainer-stack.yml`
   - *GitOps updates* on, mechanism **Polling**, e.g. every 5 minutes
   - optional environment variable `HOST_PORT` (default `8080`)
3. Point the reverse proxy / Cloudflare at `HOST_PORT`.

From then on: push to `main` → image is built → the pipeline commits the new tag →
Portainer picks up the commit within the polling interval and redeploys.
To roll back, revert the last `deploy: sha-…` commit.

If your Portainer offers a webhook for the stack (instead of polling), store its URL as
the repository secret `PORTAINER_WEBHOOK_URL`; the pipeline then triggers the redeploy
right after pushing.
