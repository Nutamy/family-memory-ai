// Single source of truth for the questionnaire structure.
// Questions are mirrored into the `Question` table by the seed script so answers
// can reference them by id; ids are stable and must never be renamed.

export type QuestionType =
  | "text"
  | "textarea"
  | "single_choice"
  | "multiple_choice"
  | "slider"
  | "voice_answer";

export interface SliderConfig {
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
}

export interface QuestionDef {
  id: string;
  text: string;
  type: QuestionType;
  hint?: string;
  options?: string[];
  slider?: SliderConfig;
  /** Recommended minimum words for a "развёрнутый" answer. */
  minWords?: number;
}

export type ModuleKind = "questions" | "tests" | "memories" | "voice" | "favorites";

export interface ModuleDef {
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  kind: ModuleKind;
  questions?: QuestionDef[];
  /** Basic module also renders the Person profile form. */
  withProfile?: boolean;
}

export interface ChapterDef {
  slug: string;
  number: number;
  title: string;
  description: string;
  modules: string[];
}

const IMPORTANCE: SliderConfig = { min: 0, max: 10, minLabel: "Не важно", maxLabel: "Очень важно" };

const ta = (id: string, text: string, hint?: string, minWords = 25): QuestionDef => ({
  id,
  text,
  hint,
  type: "textarea",
  minWords,
});

const priority = (id: string, label: string): QuestionDef => ({
  id,
  text: label,
  hint: "Насколько это важно в вашей жизни?",
  type: "slider",
  slider: IMPORTANCE,
});

const voice = (id: string, text: string, hint: string): QuestionDef => ({ id, text, hint, type: "voice_answer" });

export const MODULES: ModuleDef[] = [
  {
    slug: "basic",
    title: "Основная информация",
    subtitle: "С чего начинается история: имя, корни, дело жизни",
    icon: "user-round",
    kind: "questions",
    withProfile: true,
    questions: [
      { id: "basic.nickname", text: "Как вас называют близкие?", type: "text", hint: "Ласковое имя, прозвище" },
      ta("basic.grew_up", "Где вы выросли?", "Город, улица, двор, природа вокруг", 20),
      ta("basic.hobbies", "Ваши любимые занятия", "То, чему вы отдаёте свободное время", 15),
      ta("basic.proud", "Чем вы гордитесь больше всего?", undefined, 30),
      { id: "basic.three_words", text: "Опишите себя тремя словами", type: "text" },
    ],
  },
  {
    slug: "tests",
    title: "Психологические тесты",
    subtitle: "Big Five, MBTI и темперамент",
    icon: "brain",
    kind: "tests",
  },
  {
    slug: "communication",
    title: "Стиль общения",
    subtitle: "Как вы говорите, спорите и проявляете заботу",
    icon: "messages-square",
    kind: "questions",
    questions: [
      {
        id: "communication.directness",
        text: "Насколько вы прямолинейны в общении?",
        type: "slider",
        slider: { min: 0, max: 10, minLabel: "Дипломатичен", maxLabel: "Говорю как есть" },
      },
      {
        id: "communication.humor",
        text: "Какую роль в вашей речи играет юмор?",
        type: "slider",
        slider: { min: 0, max: 10, minLabel: "Почти не шучу", maxLabel: "Шучу постоянно" },
      },
      {
        id: "communication.listener",
        text: "Вы больше слушаете или говорите?",
        type: "slider",
        slider: { min: 0, max: 10, minLabel: "Слушаю", maxLabel: "Говорю" },
      },
      {
        id: "communication.conflict",
        text: "Как вы обычно ведёте себя в споре?",
        type: "single_choice",
        options: [
          "Отстаиваю позицию до конца",
          "Ищу компромисс",
          "Уступаю ради мира",
          "Ухожу от конфликта",
          "Шучу, чтобы разрядить обстановку",
        ],
      },
      {
        id: "communication.love_language",
        text: "Как вы выражаете любовь и заботу?",
        type: "multiple_choice",
        options: ["Словами", "Делами и помощью", "Подарками", "Временем вместе", "Объятиями и прикосновениями"],
      },
      { id: "communication.address", text: "Как вы обращаетесь к близким?", type: "text", hint: "Ласковые слова, прозвища" },
      ta("communication.catchphrases", "Ваши любимые выражения и поговорки", "Фразы, которые вы часто повторяете", 10),
    ],
  },
  {
    slug: "habits",
    title: "Привычки и эмоции",
    subtitle: "Повседневность и то, что трогает сердце",
    icon: "coffee",
    kind: "questions",
    questions: [
      ta("habits.morning", "Как начинается ваш обычный день?", undefined, 20),
      ta("habits.rituals", "Привычки и ритуалы, без которых вы не можете", undefined, 15),
      ta("habits.joy", "Что вас по-настоящему радует?", undefined, 20),
      ta("habits.anger", "Что может вас разозлить и как вы это показываете?", undefined, 20),
      ta("habits.calm", "Как вы успокаиваетесь в трудную минуту?", undefined, 20),
      ta("habits.tears", "Что может растрогать вас до слёз?", undefined, 15),
      {
        id: "habits.emotion_express",
        text: "Как вы проявляете эмоции?",
        type: "single_choice",
        options: ["Открыто и ярко", "Сдержанно", "Держу в себе", "Зависит от ситуации"],
      },
    ],
  },
  {
    slug: "scenarios",
    title: "Поведенческие сценарии",
    subtitle: "Как вы поступите в непростой ситуации",
    icon: "signpost",
    kind: "questions",
    questions: [
      {
        id: "scenarios.loan",
        text: "Друг просит занять крупную сумму денег",
        type: "single_choice",
        hint: "Выберите реакцию и объясните, почему",
        options: [
          "Дам, не задумываясь",
          "Дам, но оговорю сроки",
          "Дам столько, сколько не жалко потерять",
          "Предложу помочь иначе",
          "Откажу",
        ],
      },
      {
        id: "scenarios.accused",
        text: "Коллега несправедливо обвиняет вас при всех",
        type: "single_choice",
        hint: "Выберите реакцию и объясните, почему",
        options: [
          "Спокойно отвечу фактами сразу",
          "Поговорю с ним наедине позже",
          "Обращусь к руководству",
          "Промолчу — время покажет",
          "Отвечу резко",
        ],
      },
      {
        id: "scenarios.child_decision",
        text: "Ребёнок боится принимать важное решение",
        type: "single_choice",
        hint: "Выберите реакцию и объясните, почему",
        options: [
          "Помогу взвесить все за и против",
          "Расскажу похожую историю из своей жизни",
          "Дам время и поддержу любой выбор",
          "Подскажу правильный вариант",
          "Скажу, что ошибаться — нормально",
        ],
      },
      {
        id: "scenarios.wallet",
        text: "Вы нашли кошелёк с деньгами и документами",
        type: "single_choice",
        hint: "Выберите реакцию и объясните, почему",
        options: [
          "Сам(а) найду владельца",
          "Отнесу в полицию",
          "Оставлю объявление",
          "Верну документы, деньги оставлю",
        ],
      },
      {
        id: "scenarios.family_quarrel",
        text: "Близкие родственники поссорились и просят вас рассудить",
        type: "single_choice",
        hint: "Выберите реакцию и объясните, почему",
        options: [
          "Выслушаю обоих и скажу, кто прав",
          "Постараюсь помирить, не выбирая сторону",
          "Откажусь вмешиваться",
          "Соберу всех за одним столом",
        ],
      },
      {
        id: "scenarios.bad_news",
        text: "Близкий человек получил тяжёлые новости",
        type: "single_choice",
        hint: "Выберите реакцию и объясните, почему",
        options: [
          "Сразу приеду и буду рядом",
          "Возьму на себя практические дела",
          "Найду нужные слова поддержки",
          "Дам побыть одному, но буду на связи",
        ],
      },
      {
        id: "scenarios.own_mistake",
        text: "Ваша ошибка подвела других людей",
        type: "single_choice",
        hint: "Выберите реакцию и объясните, почему",
        options: [
          "Сразу признаю и извинюсь",
          "Молча исправлю последствия",
          "Объясню причины ошибки",
          "Долго буду переживать",
        ],
      },
    ],
  },
  {
    slug: "family",
    title: "Семья",
    subtitle: "Родители, корни и семейные традиции",
    icon: "house",
    kind: "questions",
    questions: [
      ta("family.parents", "Расскажите о родителях", "Какими они были, чем занимались, как к вам относились", 50),
      ta("family.from_mother", "Что вы переняли от мамы?"),
      ta("family.from_father", "Что вы переняли от папы?"),
      ta("family.roots", "Что вы знаете о бабушках, дедушках и истории рода?", undefined, 30),
      ta("family.traditions", "Какие семейные традиции для вас важны?"),
      ta("family.main_rule", "Какое главное правило вашей семьи?", undefined, 15),
    ],
  },
  {
    slug: "love",
    title: "Любовь и отношения",
    subtitle: "Встречи, которые изменили жизнь",
    icon: "heart",
    kind: "questions",
    questions: [
      ta("love.first", "Первая любовь"),
      ta("love.spouse_meet", "Как вы познакомились с супругом (супругой)?", undefined, 40),
      ta("love.happiest", "Самое счастливое воспоминание", undefined, 30),
      ta("love.support", "Самая важная поддержка в жизни"),
      ta("love.strong", "Что делает отношения крепкими?", undefined, 40),
    ],
  },
  {
    slug: "children",
    title: "Дети",
    subtitle: "То, что хочется передать дальше",
    icon: "baby",
    kind: "questions",
    questions: [
      ta("children.changed", "Что изменилось после рождения детей?", undefined, 30),
      ta("children.pass_on", "Что вы хотите передать детям?", undefined, 40),
      ta("children.proud", "За что вы гордитесь детьми?"),
      ta("children.mistakes", "Какие ошибки не стоит повторять?", undefined, 30),
    ],
  },
  {
    slug: "childhood",
    title: "Детство",
    subtitle: "Дом, двор и самые первые воспоминания",
    icon: "sun",
    kind: "questions",
    questions: [
      ta("childhood.general", "Каким было ваше детство?", undefined, 40),
      ta("childhood.home", "Каким был ваш дом?", "Запахи, звуки, комнаты, двор"),
      ta("childhood.best_friend", "Кто был вашим лучшим другом?", undefined, 20),
      ta("childhood.activities", "Чем вы любили заниматься?", undefined, 20),
      ta("childhood.happiest", "Самый счастливый момент детства", undefined, 40),
      ta("childhood.saddest", "Самый грустный момент детства", undefined, 30),
    ],
  },
  {
    slug: "memories",
    title: "Книга воспоминаний",
    subtitle: "Истории с тегами, местами и людьми",
    icon: "book-heart",
    kind: "memories",
  },
  {
    slug: "voice",
    title: "Голосовой архив",
    subtitle: "Свободные рассказы вашим голосом",
    icon: "mic",
    kind: "voice",
  },
  {
    slug: "values",
    title: "Ценности",
    subtitle: "Развёрнутые ответы о главном",
    icon: "gem",
    kind: "questions",
    questions: [
      ta("values.happiness", "Что такое счастье?", undefined, 50),
      ta("values.love", "Что такое любовь?", undefined, 50),
      ta("values.friendship", "Что такое дружба?", undefined, 50),
      {
        id: "values.family_career",
        text: "Что важнее: семья или карьера?",
        type: "single_choice",
        options: ["Семья", "Карьера", "Баланс — зависит от периода жизни"],
        hint: "Выберите и объясните развёрнуто",
        minWords: 40,
      },
      {
        id: "values.white_lie",
        text: "Можно ли лгать во благо?",
        type: "single_choice",
        options: ["Да", "Нет", "Иногда"],
        hint: "Выберите и объясните развёрнуто",
        minWords: 40,
      },
      ta("values.good_person", "Что делает человека хорошим?", undefined, 50),
      ta("values.faith", "Во что вы верите?", undefined, 40),
    ],
  },
  {
    slug: "priorities",
    title: "Карта приоритетов",
    subtitle: "Что по-настоящему важно в жизни",
    icon: "compass",
    kind: "questions",
    questions: [
      priority("priorities.family", "Семья"),
      priority("priorities.health", "Здоровье"),
      priority("priorities.career", "Работа и карьера"),
      priority("priorities.friends", "Друзья"),
      priority("priorities.growth", "Саморазвитие и знания"),
      priority("priorities.faith", "Вера и духовность"),
      priority("priorities.creativity", "Творчество"),
      priority("priorities.wealth", "Материальный достаток"),
      priority("priorities.freedom", "Свобода и независимость"),
      priority("priorities.travel", "Путешествия и впечатления"),
    ],
  },
  {
    slug: "favorites",
    title: "Любимые вещи",
    subtitle: "Книги, фильмы, музыка, цитаты, рецепты",
    icon: "bookmark",
    kind: "favorites",
  },
  {
    slug: "lessons",
    title: "Жизненные уроки",
    subtitle: "Решения, ошибки и победы",
    icon: "mountain",
    kind: "questions",
    questions: [
      ta("lessons.hardest_decision", "Самое трудное решение", undefined, 40),
      ta("lessons.biggest_mistake", "Самая большая ошибка", undefined, 30),
      ta("lessons.success", "Самый важный успех", undefined, 30),
      ta("lessons.regret", "О чём вы жалеете?"),
      ta("lessons.differently", "Что бы вы сделали иначе?"),
    ],
  },
  {
    slug: "career",
    title: "Работа и призвание",
    subtitle: "Дело, которому отдано много лет",
    icon: "briefcase",
    kind: "questions",
    questions: [
      ta("career.path", "Как вы выбрали профессию?"),
      ta("career.first_job", "Ваша первая работа", undefined, 20),
      ta("career.proud", "Профессиональное достижение, которым вы гордитесь"),
      {
        id: "career.meaning",
        text: "Чем для вас была работа?",
        type: "single_choice",
        options: ["Призванием", "Способом обеспечить семью", "Источником общения", "Путём к развитию", "Необходимостью"],
      },
      ta("career.advice", "Совет человеку, который выбирает профессию"),
    ],
  },
  {
    slug: "letters",
    title: "Письма потомкам",
    subtitle: "Слова, которые останутся навсегда",
    icon: "mail-open",
    kind: "questions",
    questions: [
      ta("letters.children", "Послание детям", undefined, 60),
      ta("letters.grandchildren", "Послание внукам", undefined, 60),
      ta("letters.spouse", "Послание супругу (супруге)", undefined, 60),
      ta("letters.past_self", "Послание самому себе в прошлом", undefined, 40),
      ta("letters.future", "Послание будущим поколениям", undefined, 40),
    ],
  },
  {
    slug: "phrases",
    title: "Фразы человека",
    subtitle: "Голос для будущего цифрового клона",
    icon: "audio-lines",
    kind: "questions",
    questions: [
      voice("phrases.birthday", "Поздравление с днём рождения", "Скажите так, как поздравили бы любимого человека"),
      voice("phrases.support", "Слова поддержки", "Что вы говорите, когда близкому трудно"),
      voice("phrases.comfort", "Слова утешения", "Что вы скажете, если случилось горе"),
      voice("phrases.advice", "Советы детям", "Самые важные советы вашим голосом"),
      voice("phrases.about_me", "Рассказ о себе", "Свободный рассказ на 2–3 минуты"),
      voice("phrases.joke", "Любимая шутка", "Расскажите так, как обычно рассказываете"),
      voice("phrases.greeting", "Как вы здороваетесь и прощаетесь", "Ваши привычные приветствия"),
    ],
  },
];

export const CHAPTERS: ChapterDef[] = [
  {
    slug: "basics",
    number: 1,
    title: "Основная информация",
    description: "Имя, дата и место рождения, образование и профессия",
    modules: ["basic"],
  },
  {
    slug: "personality",
    number: 2,
    title: "Личность и темперамент",
    description: "Тесты, стиль общения, привычки и реакции",
    modules: ["tests", "communication", "habits", "scenarios"],
  },
  {
    slug: "family",
    number: 3,
    title: "Семья",
    description: "Родители, любовь и дети",
    modules: ["family", "love", "children"],
  },
  {
    slug: "memories",
    number: 4,
    title: "Воспоминания",
    description: "Детство, книга воспоминаний и голосовой архив",
    modules: ["childhood", "memories", "voice"],
  },
  {
    slug: "values",
    number: 5,
    title: "Ценности",
    description: "Мировоззрение, приоритеты и любимые вещи",
    modules: ["values", "priorities", "favorites"],
  },
  {
    slug: "experience",
    number: 6,
    title: "Жизненный опыт",
    description: "Уроки, решения и призвание",
    modules: ["lessons", "career"],
  },
  {
    slug: "legacy",
    number: 7,
    title: "Наследие",
    description: "Письма потомкам и фразы вашим голосом",
    modules: ["letters", "phrases"],
  },
];

export const VOICE_TOPICS = [
  "История семьи",
  "История любви",
  "История карьеры",
  "Любимое путешествие",
  "Сложный жизненный период",
  "Свободная тема",
];

export const FAVORITE_KINDS = [
  { kind: "books", title: "Книги", placeholder: "Название и автор" },
  { kind: "films", title: "Фильмы", placeholder: "Название фильма" },
  { kind: "music", title: "Музыка", placeholder: "Песня, исполнитель" },
  { kind: "quotes", title: "Цитаты", placeholder: "Цитата" },
  { kind: "recipes", title: "Рецепты", placeholder: "Название блюда" },
  { kind: "traditions", title: "Традиции", placeholder: "Традиция" },
] as const;

export type FavoriteKind = (typeof FAVORITE_KINDS)[number]["kind"];

export const MEMORY_EMOTIONS = ["Радость", "Нежность", "Гордость", "Ностальгия", "Грусть", "Тревога", "Благодарность", "Смех"];

export const DEFAULT_TAGS = ["Детство", "Семья", "Любовь", "Друзья", "Путешествия", "Работа", "Праздники", "Трудности", "Дом", "Учёба"];

export const TAG_COLORS = ["terracotta", "gold", "forest", "grass", "navy", "mist"] as const;

export const ALL_QUESTIONS: (QuestionDef & { category: string; order: number })[] = MODULES.flatMap((m) =>
  (m.questions ?? []).map((q, i) => ({ ...q, category: m.slug, order: i })),
);

export function getModule(slug: string): ModuleDef | undefined {
  return MODULES.find((m) => m.slug === slug);
}

export function getQuestion(id: string) {
  return ALL_QUESTIONS.find((q) => q.id === id);
}

export function chapterOfModule(slug: string): ChapterDef | undefined {
  return CHAPTERS.find((c) => c.modules.includes(slug));
}

/** Ids of archives kept in the browser (IndexedDB) carry this prefix; the service worker serves their API. */
export const LOCAL_ID_PREFIX = "loc_";

export const isLocalId = (personId: string) => personId.startsWith(LOCAL_ID_PREFIX);

/** Root of a person's pages: /local/p/… for on-device archives, /app/p/… for account archives. */
export function personBase(personId: string): string {
  return `${isLocalId(personId) ? "/local" : "/app"}/p/${personId}`;
}

export function moduleHref(personId: string, slug: string): string {
  const m = getModule(slug);
  const base = personBase(personId);
  switch (m?.kind) {
    case "tests":
      return `${base}/tests`;
    case "memories":
      return `${base}/memories`;
    case "voice":
      return `${base}/voice`;
    case "favorites":
      return `${base}/favorites`;
    default:
      return `${base}/m/${slug}`;
  }
}

/** Flat ordered list of modules following the chapter order — used for "next section" navigation. */
export const MODULE_SEQUENCE: string[] = CHAPTERS.flatMap((c) => c.modules);

export function nextModule(slug: string): string | null {
  const i = MODULE_SEQUENCE.indexOf(slug);
  return i >= 0 && i < MODULE_SEQUENCE.length - 1 ? MODULE_SEQUENCE[i + 1] : null;
}
