# Развёртывание на Cloudflare (бесплатный тариф): Workers + D1 + R2

Приложение собирается адаптером [OpenNext](https://opennext.js.org/cloudflare) и работает как **Cloudflare Worker**:

| Что | Где на Cloudflare | Бесплатно |
| --- | --- | --- |
| Сайт и API (Next.js) | Workers | 100 000 запросов в день |
| База данных | D1, привязка `DB` | 5 ГБ |
| Аудио и фото | R2, привязка `BUCKET`, приватный бакет | 10 ГБ |
| Вход | свой: email + пароль и Google | без ограничений |

**Как устроен вход.** Регистрация на самом сайте: email и пароль или кнопка «Войти через Google». Сессия — подписанная cookie на 30 дней. У каждого пользователя свои архивы.

**Без регистрации.** Архив можно вести на устройстве: данные лежат в IndexedDB браузера, а запросы к API обслуживает service worker (`public/sw.js`), сервер их не видит. Такой архив позже переносится в аккаунт кнопкой «В аккаунт» на странице `/local`.

Код сам понимает, где запущен: на Workers берёт D1 и R2, на обычном Node-сервере (`npm run dev`) — SQLite-файл и папку `storage/`.

---

## 0. Почему `family-memory-ai.pages.dev` отвечает 404

`*.pages.dev` — адрес **Cloudflare Pages**, а Pages раздаёт только статику. Этому приложению нужен сервер, поэтому проект Pages собрал пустую папку.

1. **Workers & Pages** → проект `family-memory-ai` типа Pages → **Settings** → внизу **Delete project**.
2. Разверните приложение как **Worker** по шагам ниже. Адрес будет `https://family-memory-ai.<ваш-субдомен>.workers.dev`. Субдомен виден в **Workers & Pages → Overview** справа.
3. Автодеплой из GitHub подключается через **Create → Workers → Import a repository**, а не через Pages (шаг 11).

---

## 1. Что понадобится

- Аккаунт Cloudflare на бесплатном тарифе.
- Карта в аккаунте. Её просит R2 даже на бесплатном тарифе, но без превышения бесплатных лимитов ничего не списывают.
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

`--location weur` — Западная Европа (есть `eeur`, `apac` и др.). Команда выведет `database_id`. Вставьте его в `wrangler.jsonc` вместо нулей:

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

`database_id` не секрет: без вашего доступа к аккаунту по нему ничего не сделать. **Его нужно коммитить**: автодеплой из GitHub берёт настройки только из `wrangler.jsonc`, а правки привязок в панели Cloudflare перезаписываются при каждом деплое. Если ID когда-нибудь снова заменят нулями, сборка в Cloudflare остановится сразу с понятной ошибкой (`scripts/check-wrangler.ts`).

## 4. Создать таблицы и залить каталог вопросов

```bash
npm run d1:migrate:remote   # применяет prisma/migrations-d1/*.sql
npm run d1:seed:remote      # 86 вопросов анкеты (без демо-аккаунта)
```

Проверка:

```bash
npx wrangler d1 execute DB --remote --command "SELECT count(*) FROM Question"
```

## 5. Создать бакет R2

1. В панели: **R2 Object Storage → Enable / Purchase R2** (один раз; тариф бесплатный, но нужна карта).
2. В терминале:

```bash
npx wrangler r2 bucket create family-memory-files
```

Бакет должен оставаться **приватным**: в **R2 → family-memory-files → Settings** не включайте `Public access` и `r2.dev subdomain`. Файлы отдаются только через приложение после проверки владельца.

## 6. Проверить сборку локально

```bash
cp .dev.vars.example .dev.vars   # впишите AUTH_SECRET (любая длинная строка)
npm run d1:migrate               # локальная копия D1 в .wrangler/
npm run d1:seed
npm run cf:preview               # сборка OpenNext и запуск в workerd
```

Откройте http://localhost:8787, зарегистрируйтесь, создайте профиль, запишите голос. Локальные D1 и R2 живут в `.wrangler/state` и с боевыми не связаны.

## 7. Первый деплой

```bash
npm run cf:deploy
```

Перед первым деплоем задайте секрет для подписи сессий (без него вход не работает):

```bash
openssl rand -base64 48 | npx wrangler secret put AUTH_SECRET
```

В конце появится адрес `https://family-memory-ai.<субдомен>.workers.dev`.

> **Если раньше был включён Cloudflare Access**, выключите его, иначе Cloudflare по-прежнему будет требовать код из письма: **Workers & Pages → family-memory-ai → Settings → Domains & Routes** → у `workers.dev` выключите Cloudflare Access, затем в **Zero Trust → Access → Applications** удалите приложение `family-memory-ai`.

## 8. Вход через Google

Без этого шага работает вход по email и паролю, кнопки Google просто нет.

1. Откройте [Google Cloud Console](https://console.cloud.google.com/) и создайте проект (например, `family-memory`).
2. **Google Auth Platform → Branding**: название приложения, email поддержки, ссылки на главную, `/privacy` и `/terms`, контактный email разработчика. **Audience**: тип **External**.
   - Пока приложение в режиме **Testing**, войти через Google могут только люди из списка **Audience → Test users** (до 100 адресов). Для семьи этого достаточно.
   - Для всех желающих нажмите **Publish app**. Кнопка активна, когда заполнен Branding. Google может попросить подтвердить владение доменом в Search Console; со своим доменом (шаг 12) это проще, чем с `*.workers.dev`.
3. **Google Auth Platform → Clients → Create client**: тип **Web application**. В **Authorized redirect URIs** добавьте:
   - `https://family-memory-ai.<субдомен>.workers.dev/api/auth/google/callback`;
   - `https://memory.example.com/api/auth/google/callback`, если есть свой домен (шаг 12);
   - `http://localhost:3000/api/auth/google/callback` и `http://localhost:8787/api/auth/google/callback` для локальной проверки.
4. Скопируйте **Client ID** в `wrangler.jsonc` (он не секретный):

   ```jsonc
   "GOOGLE_CLIENT_ID": "1234567890-abc.apps.googleusercontent.com",
   ```

5. **Client secret** — секретом: `npx wrangler secret put GOOGLE_CLIENT_SECRET` или в панели **Settings → Variables and Secrets → Add → Type: Secret**. Тип **Text** не подходит: такое значение видно в панели и стирается при деплое.

6. `npm run cf:deploy`. Проверка: на `/login` появится «Войти через Google».

Если человек сначала зарегистрировался по паролю, а потом вошёл через Google с тем же email, это один аккаунт. Пароль при этом сбрасывается: регистрация по email не подтверждает адрес, а Google подтверждает. Дальше человек входит через Google.

> Адрес возврата строится из адреса запроса. Если сайт стоит за прокси, который подменяет `Host`, задайте публичный адрес переменной `APP_URL`.

## 9. Telegram

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

Как получить токен и chat id — в разделе «Telegram-бот» в README. Секреты применяются сразу, повторный деплой не нужен. Проверка: `npx wrangler secret list`.

## 10. Проверить, что бесплатного тарифа хватает

На бесплатном тарифе у одного запроса 10 мс процессорного времени. Приложение под это подстроено: пароли хэшируются встроенным в Workers PBKDF2 (около 20 мс, только при входе и регистрации), аудио в Telegram уходит без упаковки, по 5 файлов за запрос. Но насколько быстро в бою отрабатывают страницы и запросы к базе, проверить можно только на месте:

1. **Workers & Pages → family-memory-ai → Observability (Logs)**. Пройдите по всем разделам сайта, запишите голос, отправьте результаты в Telegram.
2. Поищите в логах `Exceeded CPU Limit` или ответы `1102`.
   - Ничего нет — всё в порядке.
   - Ошибки бывают изредка — Cloudflare допускает небольшие разовые превышения, так что можно жить.
   - Ошибки регулярные — подключите Workers Paid (5 $/мес) в **Workers & Pages → Plans**. Код менять не нужно.
   - Ошибки только на `/api/auth/login` и `/api/auth/register` — можно уменьшить стоимость хэша переменной `PASSWORD_ITERATIONS` (по умолчанию 100 000, минимум 10 000). Старые пароли продолжат работать: число итераций хранится в хэше.

## 11. Автодеплой из GitHub (по желанию)

1. **Workers & Pages → Create → Workers → Import a repository** → `family-memory-ai`.
2. Build command: `npx opennextjs-cloudflare build`; Deploy command: `npx opennextjs-cloudflare deploy`. Имя Worker'а — `family-memory-ai`, как в `wrangler.jsonc`.
3. Каждый push в основную ветку будет деплоиться сам. Миграции базы так не применяются: после изменения схемы запускайте `npm run d1:migrate:remote` вручную (шаг 13).

## 12. Свой домен (по желанию)

**Workers & Pages → family-memory-ai → Settings → Domains & Routes → Add → Custom domain**, например `memory.example.com`. Домен должен быть подключён к Cloudflare, сертификат выпустится сам. Добавьте его адрес возврата в OAuth-клиент Google (шаг 8).

## 13. Изменение схемы базы

1. Поменяйте `prisma/schema.prisma`.
2. Создайте миграцию:

   ```bash
   npm run d1:migration:new add_something         # создаст пустой prisma/migrations-d1/000N_add_something.sql
   npx prisma migrate diff --from-local-d1 --to-schema-datamodel prisma/schema.prisma --script \
     > prisma/migrations-d1/000N_add_something.sql
   ```

3. Проверьте локально (`npm run d1:migrate`, `npm run cf:preview`), затем: `npm run d1:migrate:remote` и деплой.

---

## Безопасность

### Что сделано в коде

| Угроза | Защита | Где |
| --- | --- | --- |
| Подбор паролей | PBKDF2-SHA256 (100 000 итераций) с солью, лимит попыток по IP и email, honeypot, Cloudflare Turnstile (ключи `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`) | `src/lib/password.ts`, `src/app/api/auth/*` |
| Подделка входа через Google | Authorization Code + PKCE, `state` в подписанной cookie, проверка подписи id_token, issuer, audience и `email_verified` | `src/lib/google.ts` |
| Чужой пароль на вашем email | Вход через Google с тем же email сбрасывает пароль, заданный при регистрации без подтверждения адреса | `src/app/api/auth/google/callback/route.ts` |
| Архивы без регистрации | Хранятся только в IndexedDB браузера; service worker отвечает на их запросы сам, на сервер они не уходят | `src/lib/local/` |
| Доступ к чужим архивам | Каждый API-запрос проверяет, что профиль принадлежит вошедшему пользователю | `assertPersonAccess` |
| CSRF | Изменяющие запросы проверяют `Origin` и `Sec-Fetch-Site` | `src/lib/security/origin.ts` |
| SQL-инъекции | Только Prisma с параметризованными запросами, сырого SQL нет | — |
| Подмена файлов (HTML вместо WAV и т. п.) | Тип определяется по первым байтам файла, есть лимиты размера | `src/lib/security/file-signature.ts` |
| XSS, кликджекинг | CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS, `Permissions-Policy` | `next.config.ts` |
| Расходы и злоупотребления | Лимиты: новая отправка в Telegram 5 раз за 10 мин, расшифровка 30 раз в час, загрузка 200 записей в час (счётчики в D1) | `src/lib/security/rate-limit.ts` |
| Утечка файлов | R2 приватный, файлы отдаются только через API | `src/lib/storage/r2.ts` |

### Что включить в панели

1. **Двухфакторная аутентификация** на аккаунте Cloudflare (**My Profile → Authentication**) и в Google Cloud. Кто управляет аккаунтом, тот управляет базой и OAuth-клиентом.
2. **Turnstile** против ботов на регистрации: **Turnstile → Add widget**, затем `npx wrangler secret put TURNSTILE_SECRET_KEY` и `TURNSTILE_SITE_KEY` в `vars`.
3. **SSL/TLS → Edge Certificates** (если есть свой домен): `Always Use HTTPS: On`, `Minimum TLS Version: 1.2`.
4. **API-токены** для CI: шаблон *Edit Cloudflare Workers*, только ваш аккаунт. Global API Key нигде не используйте.

### Почему D1 нельзя «взломать снаружи»

У D1 нет публичного адреса и пароля, как у PostgreSQL. Обратиться к ней можно только из Worker'а через привязку `DB` или через API Cloudflare с вашим токеном. Поэтому главное — беречь доступ к аккаунту, `wrangler login` и `.dev.vars` (он в `.gitignore`).

### Резервные копии

- **Time Travel** у D1 включён всегда: откат на любую минуту за последние 7 дней (на Paid — 30):

  ```bash
  npx wrangler d1 time-travel info DB
  npx wrangler d1 time-travel restore DB --timestamp "2026-10-12T10:00:00Z"
  ```

- Полный дамп в файл (храните надёжно: там личные данные):

  ```bash
  npx wrangler d1 export DB --remote --output backup-$(date +%F).sql
  ```

- Аудио дублируется в Telegram при отправке. Это тоже резервная копия.

---

## Ограничения бесплатного тарифа

| Ограничение | Значение | Что сделано / что учесть |
| --- | --- | --- |
| Процессорное время | 10 мс на запрос | PBKDF2 ~20 мс только при входе (`PASSWORD_ITERATIONS`); аудио в Telegram — без ZIP. См. шаг 10 |
| Внешние запросы и запросы к D1 | 50 на запрос | Telegram: 5 файлов за запрос, страница сама повторяет запросы, пока всё не уйдёт. Перенос архива с устройства в аккаунт идёт отдельными запросами |
| Размер тела запроса | 100 МБ | `VOICE_MAX_MB=90`: около 15 мин WAV 48 кГц моно в одной записи |
| Память | 128 МБ | Большие файлы в Telegram — кусками по 30 МБ; аудио на сайте отдаётся по диапазонам (Range) |
| Запросов в день | 100 000 | Для семейного архива с запасом |
| Размер сборки | 3 МБ (gzip) | Сейчас ~2,5 МБ |

**Скачивание ZIP-архивов** на экране «Экспорт и ИИ» на бесплатном тарифе, скорее всего, будет падать: сборка ZIP занимает сотни миллисекунд процессора. Используйте отправку в Telegram — каждая запись приходит отдельным файлом. Отдельные записи по-прежнему скачиваются с экрана «Голосовой архив». Если ZIP нужен, подключите Workers Paid. Для архивов без регистрации ZIP собирается в браузере, этого ограничения у них нет.

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
