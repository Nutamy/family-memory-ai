// Seeds the question catalogue and a demo account with a filled-in example person.
// Run: npm run db:seed   (idempotent: questions are upserted, the demo person is recreated)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ALL_QUESTIONS, TAG_COLORS } from "../src/lib/questionnaire";
import { scoreTest } from "../src/lib/tests";
import { BIG_FIVE_ITEMS } from "../src/lib/tests/bigfive";
import { MBTI_ITEMS } from "../src/lib/tests/mbti";
import { TEMPERAMENT_ITEMS } from "../src/lib/tests/temperament";

const db = new PrismaClient();

const DEMO_EMAIL = "demo@family.ai";
const DEMO_PASSWORD = "demo1234";

const answers: Record<string, string | { text?: string; value: unknown }> = {
  "basic.nickname": "Аннушка, а внуки зовут бабой Аней",
  "basic.grew_up":
    "Выросла в Казани, на улице Профсоюзной, в старом доме с деревянной лестницей. Летом нас отправляли к бабушке в деревню Каменка — там была река, сеновал и огромный яблоневый сад.",
  "basic.hobbies": "Читаю, вожу внуков в театр, пеку пироги по воскресеньям, выращиваю на даче пионы и помидоры.",
  "basic.proud":
    "Больше всего горжусь тем, что сорок лет учила детей любить литературу. До сих пор бывшие ученики пишут мне письма и приходят в гости с детьми. И, конечно, горжусь своей семьёй — мы сумели остаться близкими людьми через все трудные годы.",
  "basic.three_words": "Упрямая, тёплая, любознательная",

  "communication.directness": { value: 6 },
  "communication.humor": { value: 7 },
  "communication.listener": { value: 4 },
  "communication.conflict": { value: "Ищу компромисс", text: "Спорить я люблю, но обидеть человека для меня хуже, чем проиграть спор." },
  "communication.love_language": { value: ["Делами и помощью", "Временем вместе"] },
  "communication.address": "Солнышко, голубчик, «ну что, мой хороший»",
  "communication.catchphrases": "«Глаза боятся — руки делают». «Утро вечера мудренее». «Не жалей, что было, — радуйся, что было».",

  "habits.morning": "Встаю в шесть, завариваю чай с чабрецом, читаю полчаса у окна, потом зарядка и звонок дочери.",
  "habits.joy": "Когда вся семья за одним столом, когда внук сам прочитал книгу и пришёл её обсудить, первые пионы на даче.",
  "habits.calm": "Иду гулять пешком, долго, без цели. Или пеку что-нибудь — тесто успокаивает руки и голову.",
  "habits.emotion_express": { value: "Сдержанно" },

  "scenarios.loan": { value: "Дам, но оговорю сроки", text: "Деньги портят дружбу, только когда о них молчат." },
  "scenarios.child_decision": { value: "Расскажу похожую историю из своей жизни", text: "Детям легче, когда они видят, что взрослые тоже боялись и справились." },
  "scenarios.bad_news": { value: "Сразу приеду и буду рядом" },

  "family.parents":
    "Мама, Нина Фёдоровна, была медсестрой — строгая, но удивительно нежная с больными. Папа, Пётр Иванович, работал инженером на заводе, мастерил всё своими руками и пел под гитару. Они прожили вместе пятьдесят два года, и я ни разу не слышала, чтобы они повысили друг на друга голос.",
  "family.from_mother": "Аккуратность, привычку не жаловаться и умение выслушать человека до конца.",
  "family.from_father": "Любовь к песням, руки, которые не боятся работы, и уверенность, что любую вещь можно починить.",
  "family.traditions": "Воскресные пироги, новогодние письма самим себе, которые мы вскрываем через год, и летние поездки всей семьёй на дачу.",
  "family.main_rule": "Своих не бросаем.",

  "love.spouse_meet":
    "С Виктором мы познакомились в 1973 году на студенческой картошке. Он нёс два ведра и всё равно умудрился уступить мне дорогу на узкой меже. Потом весь вечер читал Есенина у костра. Через год мы поженились.",
  "love.strong": "Уважение, умение смеяться вместе и привычка мириться до того, как ляжешь спать.",

  "children.pass_on": "Любовь к книгам, честность и умение держаться друг за друга. Деньги приходят и уходят, а семья остаётся.",

  "childhood.general":
    "Детство было небогатым, но очень счастливым. Двор, где все друг друга знали, бесконечные игры до темноты, мамины пирожки и папины песни по вечерам. Мы не знали, что живём скромно, — нам всего хватало.",
  "childhood.happiest":
    "Лето 1961 года в Каменке: дед разбудил меня до рассвета, и мы пошли на реку ловить рыбу. Туман над водой, тишина, и дед шёпотом рассказывает, как он мальчишкой ходил тут же. Тогда я впервые почувствовала, что я — часть длинной истории.",

  "values.happiness":
    "Счастье — это когда тебе есть кого обнять и есть ради чего вставать утром. Оно складывается из мелочей: запах пирога, письмо от ученика, голос дочери в трубке. Я долго думала, что счастье — это что-то большое впереди, а оказалось, оно всегда было рядом, просто нужно было научиться его замечать.",
  "values.family_career": {
    value: "Баланс — зависит от периода жизни",
    text: "Я любила свою работу и не представляю себя без неё. Но когда болела дочь, я без сомнений ушла в отпуск за свой счёт. Работа даёт смысл, семья даёт силы. Нельзя выбрать одно навсегда — нужно каждый раз честно спрашивать себя, кому ты сейчас нужнее.",
  },
  "values.white_lie": { value: "Иногда", text: "Иногда лучше промолчать, чем сказать правду, которая только ранит и ничего не изменит." },
  "values.good_person":
    "Хороший человек — тот, кто не проходит мимо. Не обязательно совершать подвиги: помочь соседке донести сумки, позвонить старому другу, извиниться первым. Доброта — это привычка, а не порыв.",

  "priorities.family": { value: 10 },
  "priorities.health": { value: 8 },
  "priorities.career": { value: 6 },
  "priorities.friends": { value: 7 },
  "priorities.growth": { value: 9 },
  "priorities.faith": { value: 5 },
  "priorities.creativity": { value: 7 },
  "priorities.wealth": { value: 3 },
  "priorities.freedom": { value: 6 },
  "priorities.travel": { value: 6 },

  "lessons.hardest_decision":
    "В 1991 году нам предложили уехать в Германию. Всё было готово, но я поняла, что не смогу оставить родителей. Мы остались. Было трудно, но я ни разу об этом не пожалела.",
  "lessons.differently": "Чаще говорила бы родителям, что люблю их. Казалось, что они и так знают.",

  "career.path": "Учительница литературы в пятом классе читала нам «Капитанскую дочку» так, что мы плакали. Я захотела делать так же.",
  "career.meaning": { value: "Призванием" },

  "letters.grandchildren":
    "Мои дорогие! Читайте книги — в них ответы на вопросы, которые вы ещё не успели задать. Не бойтесь ошибаться: я ошибалась много раз, и почти каждая ошибка чему-то меня научила. Держитесь друг за друга, звоните родителям и помните, что дом — это не стены, а люди, которые вас ждут. Я всегда буду рядом — в ваших воспоминаниях, в пирогах по воскресеньям и в песнях, которые пел ваш прадед.",
};

const memories = [
  {
    title: "Рыбалка с дедом на рассвете",
    period: "1961",
    place: "Деревня Каменка",
    people: "Дедушка Фёдор",
    emotion: "Ностальгия",
    tags: ["Детство", "Семья", "Лето"],
    content:
      "Дед разбудил меня в четыре утра. Мы шли через мокрый луг к реке, туман стоял по колено. Он учил меня насаживать червя и молчать, чтобы не спугнуть рыбу. Поймали трёх окуньков — я несла их домой как трофей.",
  },
  {
    title: "Свадьба",
    period: "1974",
    place: "Казань",
    people: "Виктор, родители, друзья",
    emotion: "Радость",
    tags: ["Любовь", "Семья", "Праздники"],
    content:
      "Свадьбу играли в маленькой столовой. Мама сама сшила мне платье, а папа пел «Подмосковные вечера» так, что все гости встали. Виктор от волнения перепутал мою руку и надел кольцо на левую.",
  },
  {
    title: "Первый урок",
    period: "1 сентября 1976",
    place: "Школа № 18",
    people: "5 «Б» класс",
    emotion: "Тревога",
    tags: ["Работа"],
    content:
      "Я так волновалась, что забыла конспект дома. Пришлось рассказывать про Пушкина своими словами. Дети слушали, открыв рты. Тогда я поняла, что главное — не конспект, а живой интерес.",
  },
  {
    title: "Рождение Оли",
    period: "1977",
    place: "Казань",
    people: "Виктор, мама",
    emotion: "Нежность",
    tags: ["Семья", "Дети"],
    content: "Мартовская оттепель, капель за окном роддома. Виктор стоял под окнами с букетом мимозы и что-то кричал — я ничего не слышала, но всё поняла.",
  },
  {
    title: "Девяностые и огород",
    period: "1992–1995",
    place: "Дача под Казанью",
    people: "Вся семья",
    emotion: "Благодарность",
    tags: ["Трудности", "Семья", "Дом"],
    content:
      "Зарплату не платили месяцами. Нас спасла дача: картошка, соленья, варенье. По вечерам мы сидели на веранде, и, как ни странно, это было одно из самых дружных наших времён.",
  },
];

const favorites = [
  { kind: "books", title: "«Капитанская дочка», А. С. Пушкин", note: "Книга, из-за которой я стала учителем" },
  { kind: "books", title: "«Мастер и Маргарита», М. Булгаков", note: "" },
  { kind: "films", title: "«Москва слезам не верит»", note: "Смотрим каждый Новый год" },
  { kind: "music", title: "«Подмосковные вечера»", note: "Папина песня" },
  { kind: "quotes", title: "Береги честь смолоду", note: "А. С. Пушкин" },
  { kind: "recipes", title: "Воскресный пирог с яблоками", note: "Тесто на кефире, яблоки антоновка, корица. Печь 40 минут при 180°." },
  { kind: "traditions", title: "Письма самим себе на Новый год", note: "Пишем 31 декабря, вскрываем через год" },
];

async function main() {
  // Question catalogue mirrors src/lib/questionnaire.ts.
  for (const q of ALL_QUESTIONS) {
    const data = {
      category: q.category,
      text: q.text,
      hint: q.hint ?? "",
      type: q.type,
      options: JSON.stringify(q.options ?? q.slider ?? null),
      minWords: q.minWords ?? 0,
      order: q.order,
    };
    await db.question.upsert({ where: { id: q.id }, create: { id: q.id, ...data }, update: data });
  }
  console.log(`✓ ${ALL_QUESTIONS.length} questions`);

  const user = await db.user.upsert({
    where: { email: DEMO_EMAIL },
    create: { email: DEMO_EMAIL, name: "Демо", passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10) },
    update: {},
  });
  await db.person.deleteMany({ where: { userId: user.id, firstName: "Анна", lastName: "Соколова" } });

  const person = await db.person.create({
    data: {
      userId: user.id,
      firstName: "Анна",
      middleName: "Петровна",
      lastName: "Соколова",
      birthDate: "1952-04-17",
      birthPlace: "Казань",
      residence: "Москва",
      education: "Казанский государственный университет, филологический факультет",
      profession: "Учитель русского языка и литературы",
      bio: "Сорок лет проработала учителем литературы. Жена, мама двоих детей и бабушка четырёх внуков. Любит книги, театр, дачу и большие семейные застолья.",
      lastSection: "values",
    },
  });

  for (const [questionId, a] of Object.entries(answers)) {
    const { text, value } = typeof a === "string" ? { text: a, value: null } : { text: a.text ?? "", value: a.value };
    await db.answer.create({ data: { personId: person.id, questionId, text, value: JSON.stringify(value) } });
  }

  // Deterministic test answers that produce a plausible profile.
  const big5 = Object.fromEntries(
    BIG_FIVE_ITEMS.map((i) => {
      const lean = { openness: 5, conscientiousness: 4, extraversion: 3, agreeableness: 5, neuroticism: 2 }[i.trait];
      return [i.id, i.reverse ? 6 - lean : lean];
    }),
  );
  const mbti = Object.fromEntries(MBTI_ITEMS.map((i, n) => [i.id, i.axis === "EI" ? (n % 3 ? "b" : "a") : i.axis === "SN" ? "b" : i.axis === "TF" ? "b" : "a"]));
  const temperament = Object.fromEntries(
    TEMPERAMENT_ITEMS.map((i, n) => [i.id, (n % 3 === 0 ? "sanguine" : n % 4 === 1 ? "melancholic" : "phlegmatic") as string]),
  );
  for (const [kind, ans] of [
    ["bigfive", big5],
    ["mbti", mbti],
    ["temperament", temperament],
  ] as const) {
    await db.testResult.create({
      data: {
        personId: person.id,
        kind,
        answers: JSON.stringify(ans),
        result: JSON.stringify(scoreTest(kind, ans as Record<string, unknown>)),
        completed: true,
      },
    });
  }

  let colorIndex = 0;
  for (const m of memories) {
    const tags = [];
    for (const name of m.tags) {
      const tag =
        (await db.tag.findUnique({ where: { personId_name: { personId: person.id, name } } })) ??
        (await db.tag.create({ data: { personId: person.id, name, color: TAG_COLORS[colorIndex++ % TAG_COLORS.length] } }));
      tags.push({ id: tag.id });
    }
    const { tags: _ignored, ...data } = m;
    void _ignored;
    await db.memory.create({ data: { ...data, personId: person.id, tags: { connect: tags } } });
  }

  for (const f of favorites) await db.favoriteItem.create({ data: { ...f, personId: person.id } });

  console.log(`✓ demo person "${person.firstName} ${person.lastName}"`);
  console.log(`  login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
