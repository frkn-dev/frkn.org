---
name: share
description: >-
  Use when distributing the current site state as a single .zip file.
  Verifies docker build, then builds a git-archive zip named with short SHA.
  Output goes to share/ at project root (gitignored).
---

# Share

Собрать однофайловый дистрибутив сайта для передачи кому-то ещё.
Архив содержит ровно то, что в git HEAD.

## Директория вывода

`share/` в корне (добавить в `.gitignore`, если нет). Создать при необходимости.

## Шаги

### 1. Проверить чистоту git
```powershell
git status --porcelain
```
Незакоммиченное — **стоп**. Сначала коммит, потом share.

### 2. Проверка сборки
```powershell
docker build -t frkn-org .
```
Сломана — **стоп**.

### 3. Собрать архив
```powershell
$sha = git rev-parse --short HEAD
New-Item -ItemType Directory -Path share -Force | Out-Null
git archive --format=zip --output="share/frkn-org-$sha.zip" HEAD
```

`git archive` включает только tracked files: без `.git/`, `share/`, локального мусора.

### 4. Вывод
Сообщить:
- Путь к .zip, размер, SHA
- Получателю: `docker build -t frkn-org . && docker run --rm -p 8080:80 frkn-org` (см. README.md в архиве)

## Чек-лист
- [ ] `git status --porcelain` — пусто
- [ ] `docker build` — ок
- [ ] Имя: `frkn-org-<shortSha>.zip`
- [ ] .zip в `share/`
