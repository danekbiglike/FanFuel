#!/bin/sh
# Запускать от root из корня проекта после проверки внешнего HTTP-01 маршрута.
set -eu
certbot certonly --webroot -w /var/www/letsencrypt \
  --non-interactive --agree-tos --register-unsafely-without-email \
  --cert-name fanfuel.ru -d fanfuel.ru -d www.fanfuel.ru

target=/etc/nginx/sites-available/fanfuel
backup="${target}.before-tls"
cp "$target" "$backup"
install -m 644 infra/nginx/fanfuel-tls.conf "$target"
if ! nginx -t; then
    cp "$backup" "$target"
    exit 1
fi
systemctl reload nginx
install -d -m 755 /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/fanfuel-nginx <<'HOOK'
#!/bin/sh
set -eu
nginx -t
systemctl reload nginx
HOOK
chmod 755 /etc/letsencrypt/renewal-hooks/deploy/fanfuel-nginx
systemctl enable --now certbot.timer
