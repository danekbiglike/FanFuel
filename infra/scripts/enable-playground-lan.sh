#!/bin/sh
# Добавляет локальный HTTP-вход на edge с проверкой nginx и откатом при ошибке.
set -eu

template=${1:?Укажите путь к шаблону nginx}
edge_ip=${2:?Укажите LAN-адрес edge}
app_ip=${3:?Укажите LAN-адрес FanFuel VM}
target=/etc/nginx/nginx.conf
site=/etc/nginx/http.d/fanfuel-playground-lan.conf
include_line='    include /etc/nginx/http.d/fanfuel-playground-lan.conf;'

case "$edge_ip:$app_ip" in
    *[!0-9.:]*) echo 'Ожидаются два IPv4-адреса' >&2; exit 2 ;;
esac
grep -Fq 'http {' "$target"

stamp=$(date +%Y%m%d%H%M%S)
backup="${target}.before-playground-lan-${stamp}"
site_backup="${site}.before-playground-lan-${stamp}"
rendered=$(mktemp)
updated=$(mktemp)
had_site=0
trap 'rm -f "$rendered" "$updated"' EXIT

sed -e "s/__EDGE_LAN_IP__/$edge_ip/g" \
    -e "s/__FANFUEL_VM_IP__/$app_ip/g" "$template" > "$rendered"
if grep -Eq '__[A-Z_]+__' "$rendered"; then
    echo 'Не все адреса в шаблоне заменены' >&2
    exit 1
fi

cp "$target" "$backup"
if [ -e "$site" ]; then
    cp "$site" "$site_backup"
    had_site=1
fi
install -m 644 "$rendered" "$site"

if ! grep -Fq "$include_line" "$target"; then
    awk -v line="$include_line" '
        /^http \{$/ { print; print line; next }
        { print }
    ' "$target" > "$updated"
    install -m 644 "$updated" "$target"
fi

if ! nginx -t || ! nginx -s reload; then
    cp "$backup" "$target"
    if [ "$had_site" -eq 1 ]; then
        cp "$site_backup" "$site"
    else
        rm -f "$site"
    fi
    nginx -t && nginx -s reload || true
    echo 'Конфигурация edge восстановлена после ошибки' >&2
    exit 1
fi

echo "Локальный playground: http://${edge_ip}:8085/"
echo "Резервная копия nginx: ${backup}"
