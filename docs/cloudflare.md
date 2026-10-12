# Развёртывание на Cloudflare: Workers + D1 + R2

Приложение собирается адаптером [OpenNext](https://opennext.js.org/cloudflare) и работает как **Cloudflare Worker**:

| Что | Где на Cloudflare | Привязка (binding) |
| --- | --- | --- |
| Next.js (страницы и API) | Workers | — |
| База данных (Prisma, SQLite-схема) | D1 | `DB` |
| Аудио и фото | R2, приватный бакет | `BUCKET` |
| Защита форм от ботов (по желанию) | Turnstile | — |

Код сам понимает, где запущен: на Workers берёт D1 и R2, на обычном Node-сервере (`npm run dev` / `npm start`) — SQLite-файл и папку `storage/`.

---

## 0. Почему `family-memory-ai.pages.dev` отвечает 404

`*.pages.dev` — адрес **Cloudflare Pages**. Pages раздаёт статику, а этому приложению нужен сервер (вход, база, загрузка аудио). Проект Pages собрал пустую папку, поэтому 404.

Что сделать:

1. В панели **Workers & Pages** откройте проект `family-memory-ai` типа Pages → **Settings** → внизу **Delete project** (или просто не используйте его).
2. Разверните приложение как **Worker** по шагам ниже. Адрес будет таким: `https://family-memory-ai.<ваш-субдомен>.workers.dev`. Субдомен виден в **Workers & Pages → Overview** справа (`Subdomain`).
3. Для автодеплоя из GitHub подключайте репозиторий через **Create → Workers → Import a repository**, а не через вкладку Pages (шаг 10).

---

## 1. Что понадобится

- Аккаунт Cloudflare.
- **Тариф Workers Paid (5 $/мес) — нужен на практике.** На бесплатном тарифе у запроса всего 10 мс процессорного времени, а проверка пароля (bcrypt) и сборка ZIP для Telegram занимают больше: вход будет падать с ошибкой `Exceeded CPU limit`. Подключается в **Workers & Pages → Plans**.
- Карта в аккаунте, чтобы включить R2 (до 10 ГБ бесплатно).
- Node.js 20+ и клон репозитория с выполненным `npm install`.

## 2. Вход в Cloudflare из терминала

```bash
npx wrangler login      # откроет браузер, нажмите Allow
npx wrangler whoami     # проверка: покажет email и Account ID
```

## 3. Создать базу D1

```bash
npx wrangler d1 create family-memory-db --location weur
```

`--location weur` размещает базу в Западной Европе. Есть и другие регионы: `eeur` (Восточная Европа), `apac` (Азия) и т. д. Команда выведет блок с `database_id`. Вставьте его в `wrangler.jsonc` вместо нулей:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "family-memory-db",
    "database_id": "ВАШ-ID",
    "migrations_dir": "prisma/migrations-d1"
  }
]
```

`database_id` не секрет: без вашего API-токена по нему ничего не сделать. Его можно коммитить.

## 4. Создать таблицы и залить каталог вопросов

```bash
npm run d1:migrate:remote   # применяет prisma/migrations-d1/*.sql
npm run d1:seed:remote      # 86 вопросов анкеты (без демо-аккаунта)
```

Проверка:

```bash
npx wrangler d1 execute DB --remote --command "SELECT count(*) FROM Question"
```

> Демо-аккаунт `demo@family.ai / demo1234` в боевую базу **намеренно не попадает**: у него публично известный пароль.

## 5. Создать бакет R2

1. В панели: **R2 Object Storage → Purchase R2 / Enable** (один раз, нужна карта).
2. В терминале:

```bash
npx wrangler r2 bucket create family-memory-files
```

Бакет должен оставаться **приватным**: в **R2 → family-memory-files → Settings** опции `Public access` и `r2.dev subdomain` не включайте. Файлы отдаются только через API приложения после проверки, что запись принадлежит вошедшему пользователю.

## 6. Проверить сборку локально

```bash
cp .dev.vars.example .dev.vars   # впишите AUTH_SECRET (любая длинная строка)
npm run d1:migrate               # локальная копия D1 в .wrangler/
npm run d1:seed
npm run cf:preview               # сборка OpenNext и запуск в workerd
```

Откройте http://localhost:8787, зарегистрируйтесь, создайте профиль, запишите голос. Локальные D1 и R2 живут в `.wrangler/state` и с боевыми не связаны.

Для разработки с горячей перезагрузкой на тех же локальных D1/R2: `npm run dev:cf`. Обычный `npm run dev` работает на SQLite, как раньше.

## 7. Первый деплой

```bash
npm run cf:deploy
```

В конце будет адрес `https://family-memory-ai.<субдомен>.workers.dev`. Пока секреты не заданы, вход не работает: это следующий шаг.

## 8. Секреты

Секреты хранятся зашифрованными в Cloudflare и **никогда не пишутся** в `wrangler.jsonc` или в git.

```bash
# Ключ подписи сессий. Если его сменить, все пользователи разлогинятся.
openssl rand -base64 48 | npx wrangler secret put AUTH_SECRET

# Telegram (см. раздел «Telegram-бот» в README)
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID

# По желанию
npx wrangler secret put OPENAI_API_KEY
```

Проверка: `npx wrangler secret list`. Секреты применяются сразу, повторный деплой не нужен.

## 9. Защита форм: Cloudflare Turnstile (рекомендуется)

Turnstile — невидимая капча Cloudflare на входе и регистрации. Без ключей формы защищены honeypot-полем и лимитом попыток, с ключами добавляется проверка «не робот».

1. Панель: **Turnstile → Add widget**. Имя любое; в **Hostnames** укажите `family-memory-ai.<субдомен>.workers.dev` и свой домен, если есть. Режим **Managed**.
2. Скопируйте **Site Key** и **Secret Key**.
3. Site Key публичный, его можно положить в `vars` в `wrangler.jsonc`:

   ```jsonc
   "vars": { "TURNSTILE_SITE_KEY": "0x4AAAA...", ... }
   ```

   Secret Key задайте секретом:

   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

4. `npm run cf:deploy`. Виджет появится на `/login` и `/register`.

Для локальной проверки подойдут тестовые ключи из `.dev.vars.example` (проверка всегда проходит).

## 10. Автодеплой из GitHub (по желанию)

1. **Workers & Pages → Create → Workers → Import a repository** → выберите `family-memory-ai`.
2. Настройки сборки:
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
   - Имя Worker'а должно совпадать с `name` в `wrangler.jsonc` (`family-memory-ai`).
3. После этого каждый push в основную ветку деплоится сам. Миграции базы автоматически не применяются: после изменения схемы запускайте `npm run d1:migrate:remote` вручную (шаг 12).

## 11. Свой домен

**Workers & Pages → family-memory-ai → Settings → Domains & Routes → Add → Custom domain**, например `memory.example.com`. Домен должен быть подключён к Cloudflare. Сертификат выпустится автоматически. Добавьте домен в hostnames виджета Turnstile.

## 12. Изменение схемы базы

1. Поменяйте `prisma/schema.prisma`.
2. Создайте миграцию:

   ```bash
   npm run d1:migration:new add_something         # создаст пустой prisma/migrations-d1/000N_add_something.sql
   npx prisma migrate diff --from-local-d1 --to-schema-datamodel prisma/schema.prisma --script \
     > prisma/migrations-d1/000N_add_something.sql
   ```

3. Проверьте локально (`npm run d1:migrate`, `npm run cf:preview`), затем примените к боевой базе: `npm run d1:migrate:remote`, и задеплойте.

---

## Безопасность базы данных и форм

### Что сделано в коде

| Угроза | Защита | Где |
| --- | --- | --- |
| Подбор пароля, перебор email | Лимит: 20 попыток входа с IP и 8 на email за 15 мин, 5 регистраций с IP в час. Счётчики лежат в D1 (таблица `RateLimit`, ключи — SHA-256), поэтому действуют во всех копиях Worker'а | `src/lib/security/rate-limit.ts`, `api/auth/*` |
| Определение зарегистрированных email по времени ответа | Для несуществующего email всё равно выполняется bcrypt-сравнение | `api/auth/login` |
| Боты на формах | Honeypot-поле `website` и Cloudflare Turnstile (если заданы ключи) | `src/lib/security/form-guard.ts`, `auth-form.tsx` |
| CSRF | Cookie `SameSite=Lax` + `httpOnly` + `Secure`; все изменяющие API-запросы проверяют `Origin` и `Sec-Fetch-Site` | `src/lib/security/origin.ts`, `src/lib/api.ts` |
| Слабые пароли | Минимум 8 символов, максимум 72 байта (дальше bcrypt их игнорирует) | `api/auth/register` |
| SQL-инъекции | Только Prisma с параметризованными запросами, сырого SQL в коде нет | — |
| Доступ к чужим данным | Каждый API-запрос проверяет, что профиль принадлежит пользователю из сессии | `assertPersonAccess` |
| Подмена файлов (HTML вместо WAV и т. п.) | Тип определяется по первым байтам, а не по имени и `Content-Type` от браузера; лимиты размера | `src/lib/security/file-signature.ts` |
| XSS, кликджекинг | CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS, `Permissions-Policy` (микрофон только для самого сайта) | `next.config.ts` |
| Расходы на внешние API | Лимиты: отправка в Telegram 5 раз за 10 мин, расшифровка 30 раз в час, загрузка 200 записей в час | соответствующие маршруты |
| Утечка файлов | R2 приватный, файлы отдаются только через API после проверки владельца | `src/lib/storage/r2.ts` |

### Что включить в панели Cloudflare

1. **Security → WAF → Rate limiting rules → Create rule** (одно правило есть и на бесплатном тарифе): `URI Path` `starts with` `/api/auth/`, `10` запросов за `10 seconds` с одного IP → **Block** на `10 seconds`. Это первый рубеж перед кодовым лимитом.
2. **Security → Bots → Bot Fight Mode: On.**
3. **SSL/TLS → Edge Certificates**: `Always Use HTTPS: On`, `Minimum TLS Version: 1.2`.
4. **API-токены** (**My Profile → API Tokens**): для CI создавайте токен по шаблону *Edit Cloudflare Workers* с доступом только к своему аккаунту. Global API Key нигде не используйте.
5. **Двухфакторная аутентификация** на аккаунте Cloudflare (**My Profile → Authentication**): у кого доступ к аккаунту, у того доступ к базе.

### Почему D1 нельзя «взломать снаружи»

У D1 нет публичного адреса и пароля, как у PostgreSQL: обратиться к ней можно только из Worker'а через привязку `DB` или через API Cloudflare с вашим токеном. Поэтому главное — беречь токены, `wrangler login` и `.dev.vars` (он в `.gitignore`).

### Резервные копии

- **Time Travel** включён у D1 всегда: откат на любую минуту за последние 30 дней (на Free — 7 дней):

  ```bash
  npx wrangler d1 time-travel info DB
  npx wrangler d1 time-travel restore DB --timestamp "2026-10-12T10:00:00Z"
  ```

- Полный дамп в файл (храните в надёжном месте, в нём личные данные):

  ```bash
  npx wrangler d1 export DB --remote --output backup-$(date +%F).sql
  ```

- Для R2 включите **Object lifecycle / Bucket locks** по необходимости или периодически копируйте бакет через `rclone`.

---

## Ограничения Workers и настройки под них

| Ограничение | Значение | Что сделано |
| --- | --- | --- |
| Размер тела запроса | 100 МБ (Free и Pro) | `VOICE_MAX_MB=90` в `wrangler.jsonc`: около 15 мин WAV 48 кГц моно в одной записи |
| Память Worker'а | 128 МБ | Telegram-части по `TELEGRAM_PART_MB=20` МБ; аудио отдаётся по диапазонам (Range) из R2 |
| Процессорное время | Free: 10 мс; Paid: по умолчанию 30 с, максимум 5 мин | При долгой отправке большого архива в Telegram добавьте в `wrangler.jsonc` `"limits": { "cpu_ms": 300000 }` (только на Paid) |
| Внешние запросы (subrequests) | Free: 50 за вызов, на Paid намного больше | Каждая часть для Telegram — один запрос |
| Размер сборки | Free: 3 МБ (gzip), Paid: 10 МБ | Сейчас ~2,5 МБ |

Скачивание полного ZIP-архива (`/api/.../export/zip`) собирается в памяти. На Workers архив больше ~100 МБ упрётся в лимит памяти. Для больших архивов используйте отправку в Telegram частями или локальный запуск.

## Шпаргалка команд

| Команда | Что делает |
| --- | --- |
| `npm run cf:preview` | сборка и локальный запуск в workerd (http://localhost:8787) |
| `npm run cf:deploy` | сборка и деплой |
| `npm run dev:cf` | `next dev` с локальными D1/R2 |
| `npm run d1:migrate` / `:remote` | применить миграции локально / в бою |
| `npm run d1:seed` / `:remote` | залить каталог вопросов |
| `npx wrangler tail` | живые логи боевого Worker'а |
| `npx wrangler d1 execute DB --remote --command "SELECT ..."` | SQL-запрос к боевой базе |
