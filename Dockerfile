# Statische Portfolio-Seite, ausgeliefert von nginx ohne Root-Rechte (Port 8080)
FROM nginxinc/nginx-unprivileged:1.29-alpine

LABEL org.opencontainers.image.title="fiona-tran.com" \
      org.opencontainers.image.description="Portfolio website of Fiona Tran" \
      org.opencontainers.image.licenses="All rights reserved"

COPY --chown=nginx:nginx nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx nginx/snippets/ /etc/nginx/snippets/
COPY --chown=nginx:nginx site/ /usr/share/nginx/html/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
