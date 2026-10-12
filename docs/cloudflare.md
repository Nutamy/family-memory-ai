# Развёртывание на Cloudflare (бесплатный тариф): Workers + D1 + R2 + Access

Приложение собирается адаптером [OpenNext](https://opennext.js.org/cloudflare) и работает как **Cloudflare Worker**:

| Что | Где на Cloudflare | Бесплатно |
| --- | --- | --- |
| Сайт и API (Next.js) | Workers | 100 000 запросов в день |
| База данных | D1, привязка `DB` | 5 ГБ |
| Аудио и фото | R2, привязка `BUCKET`, приватный бакет | 10 ГБ |
| Вход для семьи | Cloudflare Access (Zero Trust) | до 50 человек |

**Как устроен вход.** Паролей в приложении нет. Перед сайтом стоит Cloudflare Access: человек вводит email, получает на почту одноразовый код и попадает на сайт, только если его email есть в вашем списке. Посторонний не увидит даже первую страницу. Приложение проверяет подпись Cloudflare в каждом запросе и по email понимает, кто пришёл. У каждого члена семьи свои архивы.

Код сам понимает, где запущен: на Workers берёт D1 и R2, на обычном Node-сервере (`npm run dev`) — SQLite-файл, папку `storage/` и вход по паролю.

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

Локально Access не нужен: без настроек `CF_ACCESS_*` приложение работает в режиме входа по паролю.

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

В конце появится адрес `https://family-memory-ai.<субдомен>.workers.dev`. **Пока Access не включён, сайт открыт всем — сразу переходите к шагу 8.**

## 8. Включить Cloudflare Access (вход по коду из письма)

1. **Workers & Pages → family-memory-ai → Settings → Domains & Routes**. В строке `workers.dev` нажмите **Enable Cloudflare Access**. Если Zero Trust ещё не подключён, Cloudflare попросит выбрать название команды (*team name*, например `ourfamily`) и тариф — выберите **Free**.
2. Нажмите **Manage Cloudflare Access**. Откроется политика доступа: в правиле **Include → Emails** перечислите адреса членов семьи (свой — обязательно).
3. Скопируйте два значения:
   - **Team domain** — `ourfamily.cloudflareaccess.com` (Zero Trust → **Settings → Team name and domain**);
   - **Application Audience (AUD) Tag** (желательно, но не обязательно) — Zero Trust → **Access → Applications** → нажмите на название приложения → вкладка **Overview** (или **⋯ → Configure → Overview**). Без AUD приложение принимает вход через любое Access-приложение вашей команды; если оно у вас одно, разницы нет.
4. Впишите их в `wrangler.jsonc`. Оба значения не секретные:

   ```jsonc
   "CF_ACCESS_TEAM_DOMAIN": "ourfamily.cloudflareaccess.com",
   "CF_ACCESS_AUD": "4714c1358e65fe4b408ad6d432a5f878f08194bdb4752441fd56faefa9b2b6f2",
   ```

5. `npm run cf:deploy`.
6. Проверка: откройте сайт в окне инкогнито. Появится страница Cloudflare «Get a login code»: введите email из списка, затем код из письма. Email не из списка код не получит.

Пароли в приложении в этом режиме выключены: `/login` и `/register` сразу ведут в архив. Кнопка «Выйти» завершает сессию Access.

**Добавить или убрать человека:** Zero Trust → **Access → Policies** → политика приложения → список Emails. Деплой не нужен.

> Свой домен (шаг 12) защищается отдельно: Zero Trust → **Access → Applications → Add an application → Self-hosted**, домен `memory.example.com`, та же политика. AUD у этого приложения будет другим — используйте его. Даже если домен забудут защитить, приложение без подписи Access ответит 403.

## 9. Telegram

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

Как получить токен и chat id — в разделе «Telegram-бот» в README. Секреты применяются сразу, повторный деплой не нужен. Проверка: `npx wrangler secret list`.

## 10. Проверить, что бесплатного тарифа хватает

На бесплатном тарифе у одного запроса 10 мс процессорного времени. Приложение под это подстроено: нет хэширования паролей, аудио в Telegram уходит без упаковки, по 5 файлов за запрос. Но насколько быстро в бою отрабатывают страницы и запросы к базе, проверить можно только на месте:

1. **Workers & Pages → family-memory-ai → Observability (Logs)**. Пройдите по всем разделам сайта, запишите голос, отправьте результаты в Telegram.
2. Поищите в логах `Exceeded CPU Limit` или ответы `1102`.
   - Ничего нет — всё в порядке.
   - Ошибки бывают изредка — Cloudflare допускает небольшие разовые превышения, так что можно жить.
   - Ошибки регулярные — подключите Workers Paid (5 $/мес) в **Workers & Pages → Plans**. Код менять не нужно.

## 11. Автодеплой из GitHub (по желанию)

1. **Workers & Pages → Create → Workers → Import a repository** → `family-memory-ai`.
2. Build command: `npx opennextjs-cloudflare build`; Deploy command: `npx opennextjs-cloudflare deploy`. Имя Worker'а — `family-memory-ai`, как в `wrangler.jsonc`.
3. Каждый push в основную ветку будет деплоиться сам. Миграции базы так не применяются: после изменения схемы запускайте `npm run d1:migrate:remote` вручную (шаг 13).

## 12. Свой домен (по желанию)

**Workers & Pages → family-memory-ai → Settings → Domains & Routes → Add → Custom domain**, например `memory.example.com`. Домен должен быть подключён к Cloudflare, сертификат выпустится сам. Не забудьте защитить его через Access (примечание к шагу 8).

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
| Посторонние на сайте | Cloudflare Access пускает только emails из списка. Приложение дополнительно проверяет подпись токена Access (ключи Cloudflare, issuer, AUD, срок действия) в каждом запросе, поэтому подделка или обход незащищённого адреса дают 403 | `src/lib/access.ts`, `src/middleware.ts`, `src/lib/auth.ts` |
| Доступ к чужим архивам | Каждый API-запрос проверяет, что профиль принадлежит вошедшему пользователю | `assertPersonAccess` |
| CSRF | Изменяющие запросы проверяют `Origin` и `Sec-Fetch-Site` | `src/lib/security/origin.ts` |
| SQL-инъекции | Только Prisma с параметризованными запросами, сырого SQL нет | — |
| Подмена файлов (HTML вместо WAV и т. п.) | Тип определяется по первым байтам файла, есть лимиты размера | `src/lib/security/file-signature.ts` |
| XSS, кликджекинг | CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS, `Permissions-Policy` | `next.config.ts` |
| Расходы и злоупотребления | Лимиты: новая отправка в Telegram 5 раз за 10 мин, расшифровка 30 раз в час, загрузка 200 записей в час (счётчики в D1) | `src/lib/security/rate-limit.ts` |
| Утечка файлов | R2 приватный, файлы отдаются только через API | `src/lib/storage/r2.ts` |

Режим входа по паролю (локальная разработка или Node-хостинг) дополнительно защищён лимитом попыток, honeypot-полем, Cloudflare Turnstile (ключи `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`) и bcrypt.

### Что включить в панели

1. **Двухфакторная аутентификация** на аккаунте Cloudflare (**My Profile → Authentication**). Кто управляет аккаунтом, тот управляет и базой, и списком допуска.
2. **Zero Trust → Settings → Authentication → Global session timeout**: например, 1 месяц, чтобы родственникам не вводить код каждый день. Слишком долгий срок не ставьте.
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
