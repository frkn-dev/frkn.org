---
name: install-private-node
description: >-
  Install a private FRKN node on the user's Ubuntu or Arch VPS (AmneziaWG, AmneziaWG
  Mobile, Hysteria2, fnode-agent). Use when the user asks to install, deploy, or set
  up their own FRKN node, self-hosted node, or VPS from frkn.org/selfhosted.
---

# Своя нода FRKN

Ставь только приватную ноду пользователя. Она не попадает в общие сервера FRKN.

## Стоп

- Нет токена `inst_…` от пользователя — спроси. Его берут в личном кабинете, кнопка «Своя нода». Не выдумывай и не бери из репозитория.
- Это не его VPS — не ставь на текущую машину.
- Не Ubuntu 22.04/24.04/26.04 и не Arch — стоп.
- Не root по SSH — стоп.
- Никогда не передавай `--api-token` и `--env` (`dev`, `ru`, `wl`, `prod` и любые другие).

Токен одноразовый и живёт около часа. В репозиторий, коммит и публичный лог его не пиши.

## Установка

Зайди на VPS по SSH как root. Проверь ОС и что есть публичный IPv4:

```bash
. /etc/os-release && echo "$ID $VERSION_ID"
ip -4 route get 1.1.1.1
```

Дальше только эта команда. `inst_…` замени на токен пользователя:

```bash
curl -fsSL https://frkn.org/install | bash -s -- --token inst_…
```

Поколение AmneziaWG по умолчанию `3.1`. Если на LTE Mobile не встаёт —
ставь mobile в `2.0` или `legacy` (и `--force-awg-conf`, если конфиги уже есть):

```bash
curl -fsSL https://frkn.org/install | bash -s -- --token inst_… \
  --awg-mobile-version legacy --force-awg-conf
```

Повторный прогон на уже стоящей ноде идемпотентен: uuid и
`/opt/fnode/api.token` переиспользуются, awg/hysteria confs не трогаются
без `--force-awg-conf`. Свежий `inst_…` после первой регистрации не обязателен,
если `api.token` уже лежит на диске.


## Несколько IPv4

Клиент перебирает `node_ips` и берёт адрес, который не заблокирован. Первый в списке — основной, он же `address` (IPv4 с маршрута по умолчанию).

При установке скрипт сам добавляет все публичные IPv4, которые уже висят на интерфейсах. Не берёт loopback, `10/8`, `172.16/12`, `192.168/16`, link-local и `100.64/10`.

Если пользователь назвал ещё адреса, которых на интерфейсах нет, передай их в ту же команду:

```bash
curl -fsSL https://frkn.org/install | bash -s -- --token inst_… --ips 1.2.3.4,5.6.7.8
```

Основной адрес в `--ips` повторять не надо: скрипт поставит его первым сам.

Нода уже стоит — повторный прогон ок (идемпотентно: uuid + api.token
переиспользуются, confs не трогаются). Свежий `inst_…` нужен только если
нет `/opt/fnode/api.token`. Допиши адреса в `node_ips` в
`/opt/fnode/config.toml` (первый элемент не меняй, он равен `address`) и
выполни `systemctl restart fnode`.

Профиль по умолчанию `full`: AmneziaWG + AmneziaWG Mobile + Hysteria2 + fnode-agent. Другой — только если пользователь попросил:

- `--profile awg` — AmneziaWG (awg0, Wi‑Fi и роутеры) и AmneziaWG Mobile (awg1, LTE), без Hysteria2. В старых клиентах и на роутерах Mobile может не работать.
- `--profile hysteria2` — только Hysteria2, и на hostname машины уже есть DNS A

Дождись конца скрипта без красных `ERROR`. Потом:

```bash
systemctl is-active fnode
```

Нужно `active`. В системе сервис называется `fnode` — это fnode-agent. Если нет — пришли `systemctl status fnode --no-pager` пользователю и остановись. Повтор с тем же `inst_…` после успешной регистрации не нужен: дальше живёт `/opt/fnode/api.token`. Если первой установки не было и токен уже сожгли — проси новый.
