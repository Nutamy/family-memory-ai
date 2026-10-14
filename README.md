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
- **Светлая и тёмная тема**, адаптивная вёрстка.
- **Два режима хранения**: без регистрации — в браузере, с аккаунтом (email + пароль или Google) — в базе. Архив с устройства переносится в аккаунт одной кнопкой.

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
    local/               архивы без регистрации: IndexedDB, API в service worker, перенос в аккаунт
    security/            лимит попыток, CSRF-проверка Origin, Turnstile/honeypot, сигнатуры файлов
    integrations/        OpenAI, Ollama, ElevenLabs, аватары, промпт персоны
storage/                 аудио и фото (локальное хранилище MVP)
```

### API

| Метод | Путь | Назначение |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | аккаунт и сессия (JWT в httpOnly-cookie) |
| GET | `/api/auth/google`, `/api/auth/google/callback` | вход через Google |
| POST | `/api/persons/import` | перенос архива с устройства: профиль, ответы, тесты, любимое |
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

## Авторизация и где хранятся данные

На главной и на `/start` человек выбирает режим:

- **Без регистрации** (`/local`): архив живёт в IndexedDB браузера. Service worker (`src/lib/local/sw.ts` → `public/sw.js`) отвечает на `/api/persons/loc_…` теми же ответами, что и сервер, поэтому компоненты, плееры и ссылки на скачивание работают без изменений. Экспорт JSON и ZIP собирается в браузере. Недоступна автоматическая расшифровка — ей нужны файлы на сервере. Кнопка «В аккаунт» на `/local` переносит архив целиком (`src/lib/local/upload.ts`, `POST /api/persons/import`).
- **С аккаунтом** (`/app`): регистрация на сайте по email и паролю (PBKDF2 через WebCrypto, `src/lib/password.ts`) или «Войти через Google» (OAuth 2.0 + PKCE, `src/lib/google.ts`, переменные `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`). Оба способа выдают одну и ту же подписанную JWT-cookie (`src/lib/session.ts`). Настройка Google — [docs/cloudflare.md](docs/cloudflare.md), шаг 8.

Сброс пароля по почте пока не реализован: для него нужен почтовый сервис.

## Безопасность

Проверка `Origin` у всех изменяющих запросов (CSRF), лимиты частоты (счётчики в БД), лимит попыток входа, honeypot и Cloudflare Turnstile на формах, PKCE и проверка id_token для Google, проверка типа загружаемых файлов по сигнатуре, CSP и защитные заголовки. Подробности — в [docs/cloudflare.md](docs/cloudflare.md#безопасность).

## Интеграции ИИ

Контракты — в `src/lib/integrations/types.ts`, выбор провайдера по переменным окружения — в `src/lib/integrations/index.ts`.

| Интеграция | Переменные | Состояние |
| --- | --- | --- |
| OpenAI: чат-персона и расшифровка Whisper | `OPENAI_API_KEY`, `OPENAI_MODEL` | реализован клиент; кнопка «Авто» у записи расшифровывает аудио |
| Ollama: локальные LLM | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | реализован клиент `LLMProvider` |
| ElevenLabs Voice Clone и TTS | `ELEVENLABS_API_KEY` | реализован клиент (`createVoice`, `synthesize`); исходные файлы — ZIP записей |
| Анимированный аватар | `AVATAR_PROVIDER` | интерфейс `AvatarProvider`, реализация не выбрана |

`buildPersonaPrompt` (`src/lib/integrations/persona.ts`) собирает системный промпт цифровой копии из ответов, воспоминаний и расшифровок; он показывается на экране «Экспорт и ИИ» и кладётся в полный архив как `persona-prompt.md`.

## Дизайн

Палитра UI-кита: глубокий синий `#1D314F`, терракотовый `#C15C46`, золотисто-жёлтый `#D99543`/`#E2A34A`, лесной `#2D4B39` и травяной `#5E8357` зелёный, кремовый `#F7F4EB`, светлый серо-голубой `#D8E5DB`. Заголовки — Playfair Display, текст — Nunito. Кнопки-капсулы со стрелкой «→», бумажная зернистость фона и рваные мазки-разделители между секциями. Акварельные иллюстрации (лис с книгой, белка, ёжик, зайчик, медвежонок, птичка, бабочка, листья, ягоды, луна, звёзды и др.) вырезаны из фирменных листов и лежат в `public/illustrations/*.webp` с прозрачным фоном; на страницах используются через компонент `<Illustration name="fox" />` из `src/components/decor`. Цвета заданы CSS-переменными в `src/app/globals.css` и переопределяются для тёмной темы.

## Примечания

- MBTI-тест — ориентировочная типология, а не официальный инструмент MBTI®. Big Five использует утверждения Mini-IPIP из открытого International Personality Item Pool.
- Шрифты подгружаются с Google Fonts; без сети используются Georgia и системный sans-serif.
