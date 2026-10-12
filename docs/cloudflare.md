# Развёртывание на Cloudflare (бесплатный тариф): Workers + D1 + R2 + Telegram

Приложение собирается адаптером [OpenNext](https://opennext.js.org/cloudflare) и работает как **Cloudflare Worker**:

| Что | Где на Cloudflare | Бесплатно |
| --- | --- | --- |
| Сайт и API (Next.js) | Workers | 100 000 запросов в день |
| База данных | D1, привязка `DB` | 5 ГБ |
| Аудио и фото | R2, привязка `BUCKET`, приватный бакет | 10 ГБ |

**Как это работает для человека.**

1. Открывает сайт, нажимает «Начать заполнение» — без регистрации и паролей.
2. Сверху есть кнопка «Подключить Telegram»: открывается бот, человек нажимает «Старт», сайт показывает «Подключено».
3. Бот присылает ссылку «Продолжить» — по ней можно вернуться к анкете с любого устройства.
4. На экране «Экспорт» человек нажимает «Отправить в Telegram» — отчёт, ответы и аудио приходят ему от бота, а **копия — вам** (в чат `TELEGRAM_CHAT_ID`).

Ответы сохраняются в вашей базе D1, аудио — в закрытом хранилище R2. Таблицы и вопросы анкеты создаются сами при первом запуске.

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
- Карта в аккаунте. Её просят R2 и Zero Trust даже на бесплатных тарифах, но без превышения бесплатных лимитов ничего не списывают.
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

`database_id` не секрет: без вашего доступа к аккаунту по нему ничего не сделать. Его можно коммитить.

## 4. Таблицы и каталог вопросов

Делать ничего не нужно: при первом запросе Worker сам применяет миграции из `prisma/migrations-d1` и заливает 86 вопросов (`src/lib/d1-bootstrap.ts`). Вручную то же самое делают команды:

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

Откройте http://localhost:8787, нажмите «Начать заполнение», создайте профиль, запишите голос. Подключение Telegram локально не заработает: Telegram доставляет сообщения боту только на публичный HTTPS-адрес. Локальные D1 и R2 живут в `.wrangler/state` и с боевыми не связаны.

## 7. Первый деплой

```bash
npm run cf:deploy
```

В конце появится адрес `https://family-memory-ai.<субдомен>.workers.dev`.

## 8. Бот и секреты

1. Создайте бота у [@BotFather](https://t.me/BotFather): `/newbot`, имя, username (например `family_memory_bot`). Скопируйте токен.
2. Узнайте свой chat id (для копий результатов): напишите своему боту `/start`, откройте `https://api.telegram.org/bot<ТОКЕН>/getUpdates` и найдите `"chat":{"id":…`. Если там пусто (бот уже подключён к сайту), просто напишите боту `/start` — он ответит «Ваш Telegram ID: …».
3. **Workers & Pages → family-memory-ai → Settings → Variables and Secrets → Add**, тип **Secret**:

   | Имя | Значение |
   | --- | --- |
   | `AUTH_SECRET` | длинная случайная строка (например, 50 любых букв и цифр). Подписывает сессии и ссылки «Продолжить»; если её сменить, старые ссылки перестанут работать |
   | `TELEGRAM_BOT_TOKEN` | токен от BotFather |
   | `TELEGRAM_CHAT_ID` | ваш chat id — сюда приходят копии всех результатов |

   То же из терминала: `npx wrangler secret put AUTH_SECRET` и т. д.
4. Webhook бота настраивать не нужно: сайт сам направит бота на себя, когда кто-то впервые нажмёт «Подключить Telegram».

Если раньше включали **Cloudflare Access** — выключите его, иначе посетители упрутся в страницу входа Cloudflare: **Settings → Domains & Routes** → у `workers.dev` → **Disable Cloudflare Access** (или Zero Trust → Access → Applications → удалить приложение).

## 9. Проверка

1. Откройте сайт в окне инкогнито → «Начать заполнение» → создайте профиль, ответьте на пару вопросов.
2. Нажмите «Подключить Telegram» → в боте «Старт». Бот ответит «Telegram подключён» и пришлёт ссылку «Продолжить».
3. «Экспорт и ИИ» → «Отправить в Telegram». Результаты придут вам как человеку и копией — в чат `TELEGRAM_CHAT_ID`.

## 10. Проверить, что бесплатного тарифа хватает

На бесплатном тарифе у одного запроса 10 мс процессорного времени. Приложение под это подстроено: нет паролей и их хэширования, аудио в Telegram уходит без упаковки, по 5 файлов за запрос. Но насколько быстро в бою отрабатывают страницы и запросы к базе, проверить можно только на месте:

1. **Workers & Pages → family-memory-ai → Observability (Logs)**. Пройдите по всем разделам сайта, запишите голос, отправьте результаты в Telegram.
2. Поищите в логах `Exceeded CPU Limit` или ответы `1102`.
   - Ничего нет — всё в порядке.
   - Ошибки бывают изредка — Cloudflare допускает небольшие разовые превышения, так что можно жить.
   - Ошибки регулярные — подключите Workers Paid (5 $/мес) в **Workers & Pages → Plans**. Код менять не нужно.

## 11. Автодеплой из GitHub (по желанию)

1. **Workers & Pages → Create → Workers → Import a repository** → `family-memory-ai`.
2. Build command: `npx opennextjs-cloudflare build`; Deploy command: `npx opennextjs-cloudflare deploy`. Имя Worker'а — `family-memory-ai`, как в `wrangler.jsonc`.
3. В **Settings → Build → Branch control** снимите **Builds for non-production branches**: сборки веток PR требуют отдельной тестовой базы (блок `previews`) и без неё падают.
4. Каждый merge в `main` будет деплоиться сам, новые миграции база применит при первом запросе.

## 12. Свой домен (по желанию)

**Workers & Pages → family-memory-ai → Settings → Domains & Routes → Add → Custom domain**, например `memory.example.com`. Домен должен быть подключён к Cloudflare, сертификат выпустится сам.

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
| Чужие архивы | Каждый посетитель получает свой анонимный аккаунт (подписанная cookie, 180 дней); каждый API-запрос проверяет, что профиль принадлежит ему | `src/lib/guest.ts`, `assertPersonAccess` |
| Ссылка «Продолжить» | Подписана `AUTH_SECRET`, действует год, приходит только в личный чат человека и **не** попадает в вашу копию | `src/lib/guest.ts`, маршрут `/resume` |
| Подмена бота / чужой чат | Webhook принимает только запросы с секретом, который знает лишь Telegram; код привязки одноразовый; результаты уходят только в личные чаты, не в группы | `src/app/api/telegram/webhook` |
| Боты, создающие аккаунты | Не больше 20 новых аккаунтов в час с одного IP, honeypot-поле, по желанию Cloudflare Turnstile (`TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`) | `src/app/api/auth/guest` |
| CSRF | Изменяющие запросы проверяют `Origin` и `Sec-Fetch-Site` | `src/lib/security/origin.ts` |
| SQL-инъекции | Только Prisma с параметризованными запросами, сырого SQL нет | — |
| Подмена файлов (HTML вместо WAV и т. п.) | Тип определяется по первым байтам файла, есть лимиты размера | `src/lib/security/file-signature.ts` |
| XSS, кликджекинг | CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS, `Permissions-Policy` | `next.config.ts` |
| Расходы и злоупотребления | Лимиты: новая отправка в Telegram 5 раз за 10 мин, расшифровка 30 раз в час, загрузка 200 записей в час (счётчики в D1) | `src/lib/security/rate-limit.ts` |
| Утечка файлов | R2 приватный, файлы отдаются только через API | `src/lib/storage/r2.ts` |

Другие режимы входа (`AUTH_MODE=password` — email и пароль; `CF_ACCESS_TEAM_DOMAIN` — сайт за Cloudflare Access только для списка emails) остались в коде, см. README.

### Что включить в панели

1. **Двухфакторная аутентификация** на аккаунте Cloudflare (**My Profile → Authentication**). Кто управляет аккаунтом, тот управляет и базой, и ботом.
2. **SSL/TLS → Edge Certificates** (если есть свой домен): `Always Use HTTPS: On`, `Minimum TLS Version: 1.2`.
3. **API-токены** для CI: шаблон *Edit Cloudflare Workers*, только ваш аккаунт. Global API Key нигде не используйте.

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
| Процессорное время | 10 мс на запрос | Нет хэширования паролей; аудио в Telegram — без ZIP. См. шаг 10 |
| Внешние запросы | 50 на запрос | Telegram: 5 файлов за запрос, страница сама повторяет запросы, пока всё не уйдёт |
| Размер тела запроса | 100 МБ | `VOICE_MAX_MB=90`: около 15 мин WAV 48 кГц моно в одной записи |
| Память | 128 МБ | Большие файлы в Telegram — кусками по 30 МБ; аудио на сайте отдаётся по диапазонам (Range) |
| Запросов в день | 100 000 | Для семейного архива с запасом |
| Размер сборки | 3 МБ (gzip) | Сейчас ~2,5 МБ |

**Скачивание ZIP-архивов** на экране «Экспорт и ИИ» на бесплатном тарифе, скорее всего, будет падать: сборка ZIP занимает сотни миллисекунд процессора. Используйте отправку в Telegram — каждая запись приходит отдельным файлом. Отдельные записи по-прежнему скачиваются с экрана «Голосовой архив». Если ZIP нужен, подключите Workers Paid.

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
