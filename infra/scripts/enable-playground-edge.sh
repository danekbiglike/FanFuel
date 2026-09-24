#!/bin/sh
# Добавляет оба маршрута playground в действующий edge с проверкой и откатом.
set -eu

target=/etc/nginx/nginx.conf
backup="${target}.before-playground-$(date +%Y%m%d%H%M%S)"
grep -Fq 'www.fanfuel.ru 192.168.0.108:443;' "$target"
grep -Fq 'www.fanfuel.ru 192.168.0.108:80;' "$target"
tls_count=$(grep -Fc 'playground.fanfuel.ru 192.168.0.108:443;' "$target" || true)
http_count=$(grep -Fc 'playground.fanfuel.ru 192.168.0.108:80;' "$target" || true)
if [ "$tls_count" -eq 1 ] && [ "$http_count" -eq 1 ]; then
  exit 0
fi
if [ "$tls_count" -ne 0 ] || [ "$http_count" -ne 0 ]; then
  echo 'Неполная или повторная конфигурация playground на edge' >&2
  exit 1
fi
cp "$target" "$backup"
temporary=$(mktemp)
awk '
  { print }
  index($0, "www.fanfuel.ru 192.168.0.108:443;") && !seen_tls++ {
    print "        playground.fanfuel.ru 192.168.0.108:443;"
  }
  index($0, "www.fanfuel.ru 192.168.0.108:80;") && !seen_http++ {
    print "        playground.fanfuel.ru 192.168.0.108:80;"
  }
' "$target" > "$temporary"
install -m 644 "$temporary" "$target"
rm -f "$temporary"
if ! nginx -t; then
  cp "$backup" "$target"
  exit 1
fi
nginx -s reload
