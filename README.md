# Family Memory AI

Веб-приложение для создания цифрового архива личности: биография, воспоминания, ценности, психологический профиль и голос человека — для будущих поколений и будущей ИИ-персоны.

**Стек:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui-компоненты (Radix) · Framer Motion · Recharts · Prisma + SQLite / Cloudflare D1 · Cloudflare R2 · Web Audio API · lamejs (MP3) · JSZip.

**Хостинг:** Cloudflare Workers через OpenNext — пошаговая инструкция в [docs/cloudflare.md](docs/cloudflare.md).

## Быстрый старт

Нужен Node.js 20+.

```bash
npm install
cp .env.example .env        # задайте AUTH_SECRET
npm run setup               # создаёт БД SQLite и заливает seed-данные
npm run dev                 # http://localhost:3000
```

Демо-аккаунт с заполненным примером (Анна Петровна Соколова): **demo@family.ai / demo1234**.

Продакшен-сборка: `npm run build && npm start`.

| Скрипт | Что делает |
| --- | --- |
| `npm run setup` | `prisma db push` + seed |
| `npm run db:seed` | пересоздаёт демо-профиль и каталог вопросов |
| `npm run db:reset` | полностью очищает БД и заливает seed |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run cf:preview` / `npm run cf:deploy` | сборка под Cloudflare: локальный запуск / деплой |
| `npm run d1:migrate[:remote]`, `npm run d1:seed[:remote]` | миграции и каталог вопросов в D1 |

> Запись с микрофона работает только на `localhost` или по HTTPS — это требование браузеров.

## Возможности

- **7 глав анкеты** (18 разделов, 86 вопросов): основная информация, личность и темперамент, семья, воспоминания, ценности, жизненный опыт, наследие. Типы вопросов: `text`, `textarea`, `single_choice`, `multiple_choice`, `slider`, `voice_answer`.
- **Текстовый и голосовой ответ на каждый вопрос.** Счётчик слов с рекомендованным минимумом для развёрнутых ответов.
- **Запись голоса в браузере** (Web Audio API, AudioWorklet): пауза, продолжение, переслушивание, удаление, перезапись, живой индикатор уровня, оценка качества (громкость, перегруз, частота). Сохраняются **WAV** (16-bit PCM) и **MP3** (128 кбит/с, кодируется в браузере).
- **Голосовой архив**: «Записать воспоминание» по темам (история семьи, любви, карьеры, путешествие, сложный период), расшифровки, скачивание WAV/MP3.
- **Тесты**: Big Five (Mini-IPIP, 20 утверждений), MBTI-типология (20 вопросов), темперамент (12 вопросов), поведенческие сценарии.
- **Книга воспоминаний с тегами**: теги с цветами, автодополнение, фильтрация по нескольким тегам и эмоциям, поиск, голосовые записи к истории.
- **Любимые вещи**: книги, фильмы, музыка, цитаты, рецепты, традиции.
- **Personality Report**: портрет личности, Big Five (радар), темперамент и MBTI, карта жизненных приоритетов, стиль общения, эмоциональная палитра, облако тегов. Печать в PDF.
- **Прогресс**: общий процент, прогресс по главам и разделам, минуты записи. Автосохранение каждого ответа; «Продолжить заполнение» открывает последний раздел.
- **Экспорт**: ZIP всех записей (WAV + MP3 + расшифровки + metadata.json), JSON профиля, полный архив (+ фото и промпт персоны). Экран подготовки для ElevenLabs: минуты, качество звука, количество слов, готовность к Instant/Professional Voice Clone.
- **Светлая и тёмная тема**, адаптивная вёрстка, вход по email и паролю.

## Структура

```
prisma/
  schema.prisma          модели User, Person, Question, Answer, VoiceRecord, TestResult, Memory, Tag, FavoriteItem
  seed.ts                каталог вопросов + демо-профиль
src/
  app/                   страницы (App Router) и API Routes (app/api/**)
  components/            ui/ (shadcn-стиль), decor/ (акварельные SVG), voice/, questionnaire/, tests/, memories/, report/ …
  lib/
    questionnaire.ts     главы, разделы и вопросы — единый источник правды
    tests/               Big Five, MBTI, темперамент: вопросы и подсчёт
    audio/               рекордер (Web Audio), WAV- и MP3-кодировщики
    progress.ts          расчёт заполненности
    report.ts            Personality Report (правила, без внешних сервисов)
    export.ts            JSON-профиль и статистика экспорта
    storage/             драйверы хранения файлов (local, R2, S3-заготовка)
    security/            лимит попыток, CSRF-проверка Origin, Turnstile/honeypot, сигнатуры файлов
    telegram-delivery.ts отправка аудио в Telegram частями до 50 МБ
    integrations/        OpenAI, Ollama, ElevenLabs, аватары, промпт персоны
storage/                 аудио и фото (локальное хранилище MVP)
```

### API

| Метод | Путь | Назначение |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | аккаунт и сессия (JWT в httpOnly-cookie) |
| GET/POST | `/api/persons` | список / создание профиля |
| GET/PATCH/DELETE | `/api/persons/:id` | профиль |
| POST/GET/DELETE | `/api/persons/:id/photo` | фотография |
| PUT | `/api/persons/:id/answers` | автосохранение ответа |
| PUT/DELETE | `/api/persons/:id/tests/:kind` | ответы и результат теста (`bigfive`, `mbti`, `temperament`) |
| GET/POST, PATCH/DELETE | `/api/persons/:id/memories[/:mid]` | воспоминания с тегами |
| PATCH/DELETE | `/api/persons/:id/tags/:tid` | цвет или удаление тега |
| POST, DELETE | `/api/persons/:id/favorites[/:fid]` | любимые вещи |
| GET/POST | `/api/persons/:id/voice` | список / загрузка записи (multipart: wav, mp3, метаданные) |
| GET/PATCH/DELETE | `/api/persons/:id/voice/:vid` | файл (`?format=wav\|mp3&download=1`, поддержка Range), правка, удаление |
| POST | `/api/persons/:id/voice/:vid/transcribe` | расшифровка через OpenAI Whisper |
| GET | `/api/persons/:id/export/json` | JSON профиля |
| GET | `/api/persons/:id/export/zip?type=audio\|full` | ZIP-архив |

## Переход на PostgreSQL

Схема не использует особенностей SQLite (структурированные поля хранятся как JSON-строки).

1. В `prisma/schema.prisma` замените `provider = "sqlite"` на `provider = "postgresql"`.
2. В `.env`: `DATABASE_URL="postgresql://user:pass@host:5432/family_memory"`.
3. `npx prisma migrate dev --name init` (или `npx prisma db push`), затем `npm run db:seed`.

## Хранение файлов и S3

Весь доступ к файлам идёт через интерфейс `StorageDriver` (`src/lib/storage`). В БД хранятся только ключи (`persons/<id>/audio/<stamp>.wav`).
На Cloudflare используется R2 через привязку `BUCKET` (`STORAGE_DRIVER=r2`, выбирается автоматически при наличии привязки).
Для S3 реализуйте `S3StorageDriver` через `@aws-sdk/client-s3`, задайте `STORAGE_DRIVER=s3` и переменные `S3_*`. Миграция существующих файлов — копирование папки `storage/` в бакет с теми же ключами.

## Авторизация

Два режима:

- **Cloudflare Access** (в бою на Cloudflare): вход по одноразовому коду из письма для emails из вашего списка. Приложение проверяет подписанный токен Access и само создаёт пользователя по email. Паролей нет. Включается переменной `CF_ACCESS_TEAM_DOMAIN` (и желательно `CF_ACCESS_AUD`) (`src/lib/access.ts`, инструкция — [docs/cloudflare.md](docs/cloudflare.md), шаг 8).
- **Email + пароль** (локально и на Node-хостинге): bcrypt, не короче 8 символов, подписанная JWT-cookie (`jose`).

 В модели `User` есть поля `provider` и `providerId` под Google, Microsoft и Apple: достаточно добавить OAuth-callback, который создаёт пользователя и вызывает `createSessionToken` (`src/lib/session.ts`). Для полноценной OAuth-интеграции удобно подключить Auth.js.

## Безопасность

Cloudflare Access с проверкой подписи в каждом запросе, проверка `Origin` у всех изменяющих запросов (CSRF), лимиты частоты (счётчики в БД), проверка типа загружаемых файлов по сигнатуре, CSP и защитные заголовки. В режиме паролей добавляются лимит попыток входа, honeypot и Cloudflare Turnstile. Подробности — в [docs/cloudflare.md](docs/cloudflare.md#безопасность).

## Интеграции ИИ

Контракты — в `src/lib/integrations/types.ts`, выбор провайдера по переменным окружения — в `src/lib/integrations/index.ts`.

| Интеграция | Переменные | Состояние |
| --- | --- | --- |
| OpenAI: чат-персона и расшифровка Whisper | `OPENAI_API_KEY`, `OPENAI_MODEL` | реализован клиент; кнопка «Авто» у записи расшифровывает аудио |
| Ollama: локальные LLM | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | реализован клиент `LLMProvider` |
| ElevenLabs Voice Clone и TTS | `ELEVENLABS_API_KEY` | реализован клиент (`createVoice`, `synthesize`); исходные файлы — ZIP записей |
| Анимированный аватар | `AVATAR_PROVIDER` | интерфейс `AvatarProvider`, реализация не выбрана |

`buildPersonaPrompt` (`src/lib/integrations/persona.ts`) собирает системный промпт цифровой копии из ответов, воспоминаний и расшифровок; он показывается на экране «Экспорт и ИИ» и кладётся в полный архив как `persona-prompt.md`.

## Telegram-бот

На экране «Экспорт и ИИ» есть кнопка «Отправить в Telegram»: бот присылает отчёт о личности текстом, `profile.json` и аудио в MP3 и/или WAV.

Каждая запись приходит **отдельным файлом**, без упаковки: так не тратится процессорное время, что важно на бесплатном тарифе Cloudflare. Первым приходит `…-index.zip` с `metadata.json` (какая запись в каком файле) и расшифровками. У ботов лимит 50 МБ на файл, поэтому запись больше `TELEGRAM_PART_MB` (по умолчанию 45 МБ, на Cloudflare 30 МБ) режется на куски `запись.wav.001`, `.002`, …. Их открывает 7-Zip или склеивает `cat запись.wav.0* > запись.wav` (Windows: `copy /b запись.wav.001 + запись.wav.002 запись.wav`).

Отправка идёт пачками по `TELEGRAM_BATCH` файлов (по умолчанию 5): страница повторяет запрос и показывает прогресс, пока не уйдёт всё. При ответе Telegram 429 (слишком часто) отправка ждёт и повторяет.

1. Создайте бота у [@BotFather](https://t.me/BotFather) и скопируйте токен.
2. Напишите боту `/start`, затем откройте `https://api.telegram.org/bot<TOKEN>/getUpdates` и возьмите `chat.id`. Для группы добавьте бота в группу; её id начинается с `-100`.
3. Задайте переменные `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` (также понимаются `TELEGRAM_TOKEN` / `BOT_TOKEN` и `CHAT_ID`).

Код: `src/lib/integrations/telegram.ts`, `src/lib/telegram-delivery.ts`, маршрут `POST /api/persons/:id/telegram` с телом `{ "items": ["report", "json", "audio", "wav"], "cursor": 0 }` (`audio` — MP3); ответ `{ next, total }`, `next: null` — всё отправлено.

## Дизайн

Палитра UI-кита: глубокий синий `#1D314F`, терракотовый `#C15C46`, золотисто-жёлтый `#D99543`/`#E2A34A`, лесной `#2D4B39` и травяной `#5E8357` зелёный, кремовый `#F7F4EB`, светлый серо-голубой `#D8E5DB`. Заголовки — Playfair Display, текст — Nunito. Кнопки-капсулы со стрелкой «→», бумажная зернистость фона и рваные мазки-разделители между секциями. Акварельные иллюстрации (лис с книгой, белка, ёжик, зайчик, медвежонок, птичка, бабочка, листья, ягоды, луна, звёзды и др.) вырезаны из фирменных листов и лежат в `public/illustrations/*.webp` с прозрачным фоном; на страницах используются через компонент `<Illustration name="fox" />` из `src/components/decor`. Цвета заданы CSS-переменными в `src/app/globals.css` и переопределяются для тёмной темы.

## Примечания

- MBTI-тест — ориентировочная типология, а не официальный инструмент MBTI®. Big Five использует утверждения Mini-IPIP из открытого International Personality Item Pool.
- Шрифты подгружаются с Google Fonts; без сети используются Georgia и системный sans-serif.
