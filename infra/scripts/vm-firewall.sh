#!/bin/sh
# Ограничивает Docker ingress из LAN; обычный UFW не фильтрует опубликованные Docker-порты.
set -eu
interface="${1:?Укажите сетевой интерфейс VM}"
allowed_source="${2:?Укажите разрешённую подсеть или адрес nginx VM}"
ip link show "$interface" >/dev/null
iptables -w -N FANFUEL-INGRESS 2>/dev/null || iptables -w -S FANFUEL-INGRESS >/dev/null
iptables -w -F FANFUEL-INGRESS
iptables -w -A FANFUEL-INGRESS -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
iptables -w -A FANFUEL-INGRESS -s "$allowed_source" -p tcp -m multiport --dports 3000,5173,8080,8081 -j RETURN
iptables -w -A FANFUEL-INGRESS -j DROP
if ! iptables -w -C DOCKER-USER -i "$interface" -j FANFUEL-INGRESS 2>/dev/null; then
    iptables -w -I DOCKER-USER 1 -i "$interface" -j FANFUEL-INGRESS
fi
