/**
 * Seeds the catalogue, journal and staff accounts.
 * Idempotent — every row is keyed on a natural unique column, so running it
 * again refreshes content instead of duplicating it.
 *
 *   pnpm db:push && pnpm db:seed
 */
import "./env"; // must come before ./index: it reads process.env as it loads
import { eq } from "drizzle-orm";
import { db } from "./index";
import { hashPassword } from "../auth/password";
import { journalPosts, products, reviews, users } from "./schema";

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/photo-${id}?fm=jpg&q=78&w=1400&auto=format&fit=crop`;

/* ------------------------------------------------------------- catalogue */

const PRODUCTS = [
  {
    slug: "my-muslim-hero-daily-planner",
    name: "My Muslim Hero",
    subtitle: "Daily Planner",
    tagline: "Small steps today, a better Muslim tomorrow.",
    description: `A guided daily companion that helps children track their salah, build healthy habits, learn duʿās and wudu, and earn stars for good deeds — page by page, day by day.

Every spread is designed to be finished in five minutes, so the habit sticks even on busy school nights. Printed on heavyweight uncoated stock with a wire-o spine that lies flat, because a planner a child can't open is a planner a child won't use.`,
    kind: "physical" as const,
    priceCents: 2400,
    compareAtCents: 3200,
    image: "/my-muslim-hero-cover.png",
    video: "/my-muslim-hero.mp4",
    videoPoster: "/my-muslim-hero-poster.jpg",
    stock: 240,
    featured: true,
    position: 1,
    collections: ["planners", "for-children"],
    pillars: ["Salah", "Healthy Body", "Knowledge & Learning", "Family Time", "Good Deeds"],
    specs: [
      { k: "Pages", v: "120, full colour" },
      { k: "Format", v: "A4 · wire-o spiral" },
      { k: "Ages", v: "5 – 12 years" },
      { k: "Language", v: "English + Arabic duʿās" },
    ],
    halalStatus: "not-applicable" as const,
  },
  {
    slug: "my-muslim-hero-printable",
    name: "My Muslim Hero",
    subtitle: "Printable Edition",
    tagline: "The full planner as a print-at-home PDF.",
    description: `The complete My Muslim Hero planner as a high-resolution PDF, sized for A4 and US Letter. Print a fresh week whenever you need one — ideal for classrooms, madrasah groups, and families with more than one child.

Delivered to your account the moment your order is confirmed.`,
    kind: "digital" as const,
    priceCents: 1200,
    compareAtCents: 1800,
    image: "/my-muslim-hero-cover.png",
    stock: null,
    downloadPath: "/downloads/my-muslim-hero-printable.pdf",
    featured: false,
    position: 2,
    collections: ["planners", "digital", "for-children"],
    pillars: ["Salah", "Good Deeds"],
    specs: [
      { k: "Format", v: "PDF · A4 + US Letter" },
      { k: "Pages", v: "120" },
      { k: "Licence", v: "Single family / classroom" },
      { k: "Delivery", v: "Instant to your account" },
    ],
    halalStatus: "not-applicable" as const,
  },
  {
    slug: "halal-whey-isolate-vanilla-date",
    name: "Whey Isolate",
    subtitle: "Vanilla & Date",
    tagline: "27g of protein. Nothing you can't pronounce.",
    description: `A cold-filtered whey isolate sweetened with real date powder instead of sucralose. Certified halal end to end — the herd, the rennet, the flavour house, and the facility.

Mixes clean in water, sits light before Fajr, and works as a suhoor staple when solid food is a struggle at 4am.`,
    kind: "physical" as const,
    priceCents: 4495,
    compareAtCents: 5400,
    image: UNSPLASH("1593095948071-474c5cc2989d"),
    stock: 86,
    featured: true,
    position: 3,
    collections: ["nutrition", "ramadan"],
    pillars: ["Healthy Body"],
    specs: [
      { k: "Servings", v: "30 × 30g" },
      { k: "Protein", v: "27g per serving" },
      { k: "Sweetener", v: "Date powder" },
      { k: "Flavour", v: "Vanilla & date" },
    ],
    halalStatus: "certified" as const,
    halalAuthority: "HMC (Halal Monitoring Committee)",
    halalCertRef: "HMC-2026-04417",
    ingredients: [
      "Cold-filtered whey protein isolate (milk)",
      "Date powder",
      "Natural vanilla extract",
      "Sunflower lecithin",
      "Himalayan salt",
    ],
    allergens: ["Milk", "Made in a facility that also handles soy"],
  },
  {
    slug: "dates-almond-fuel-bars",
    name: "Fuel Bars",
    subtitle: "Date & Almond · Box of 12",
    tagline: "The sunnah snack, engineered for training.",
    description: `Three ingredients, cold-pressed: Ajwa-style dates, roasted almonds, and a pinch of sea salt. 14g of carbohydrate from whole fruit with the fibre intact, so it releases steadily instead of spiking.

Our most-ordered item in the last ten days of Ramadan — two bars and water at iftar, then pray, then eat properly.`,
    kind: "physical" as const,
    priceCents: 1850,
    image: UNSPLASH("1571748982800-fa51082c2224"),
    stock: 310,
    featured: false,
    position: 4,
    collections: ["nutrition", "ramadan"],
    pillars: ["Healthy Body"],
    specs: [
      { k: "Count", v: "12 bars" },
      { k: "Per bar", v: "142 kcal · 4g protein" },
      { k: "Ingredients", v: "3, whole-food" },
      { k: "Shelf life", v: "9 months" },
    ],
    halalStatus: "certified" as const,
    halalAuthority: "HFA (Halal Food Authority)",
    halalCertRef: "HFA-88231",
    ingredients: ["Dates", "Roasted almonds", "Sea salt"],
    allergens: ["Almonds (tree nuts)"],
  },
  {
    slug: "sunnah-strength-mat",
    name: "The Dual Mat",
    subtitle: "Prayer & Training",
    tagline: "One mat for both sujūd and squats.",
    description: `A 6mm closed-cell mat with a woven prayer face on one side and a high-grip training surface on the other. Flip it, don't swap it.

The qibla marker is stitched, not printed, so it survives being rolled twice a day for years. Wipes clean, packs to the size of a rolled towel.`,
    kind: "physical" as const,
    priceCents: 6900,
    compareAtCents: 8500,
    image: UNSPLASH("1592432678016-e910b452f9a2"),
    stock: 42,
    featured: true,
    position: 5,
    collections: ["worship", "training"],
    pillars: ["Salah", "Healthy Body"],
    specs: [
      { k: "Size", v: "183 × 68 cm" },
      { k: "Thickness", v: "6 mm" },
      { k: "Faces", v: "Woven prayer / grip training" },
      { k: "Care", v: "Wipe clean" },
    ],
    halalStatus: "verified-ingredients" as const,
    ingredients: ["TPE foam core", "Recycled woven polyester face"],
  },
  {
    slug: "ramadan-reset-bundle",
    name: "Ramadan Reset",
    subtitle: "The Complete Bundle",
    tagline: "Everything for thirty days, in one box.",
    description: `The planner, a box of Fuel Bars, a tub of Whey Isolate, and a printed suhoor/iftar macro card calibrated to your plan.

Ships in the two weeks before Ramadan so it reaches you before the first fast. Save 18% against buying the pieces separately.`,
    kind: "physical" as const,
    priceCents: 7900,
    compareAtCents: 9645,
    image: UNSPLASH("1541518763669-27fef04b14ea"),
    stock: 60,
    featured: true,
    position: 6,
    collections: ["ramadan", "bundles"],
    pillars: ["Salah", "Healthy Body", "Good Deeds"],
    specs: [
      { k: "Contains", v: "4 items" },
      { k: "Saving", v: "18% vs separate" },
      { k: "Ships", v: "Pre-Ramadan window" },
      { k: "Macro card", v: "Personalised" },
    ],
    halalStatus: "certified" as const,
    halalAuthority: "HMC (Halal Monitoring Committee)",
    halalCertRef: "HMC-2026-04417",
    ingredients: ["See individual products"],
    allergens: ["Milk", "Tree nuts"],
  },
  {
    slug: "personalised-diet-plan",
    name: "The Personalised Plan",
    subtitle: "Coach-Reviewed · Monthly",
    tagline: "A plan built round your body, your schedule, your prayers.",
    description: `Complete a two-minute intake and our engine drafts a nutrition and training plan from your metrics, your training days, and your prayer times. A qualified coach then reviews every plan by hand, adjusts it, and approves it before it reaches you.

Your plan reshapes itself for Ramadan and for voluntary fasts — meal windows anchor to Fajr and Maghrib rather than to a generic clock. Revised monthly as your weight and strength move.`,
    kind: "subscription" as const,
    priceCents: 2900,
    image: UNSPLASH("1490645935967-10de6ba17061"),
    stock: null,
    featured: true,
    position: 0,
    collections: ["programs"],
    pillars: ["Healthy Body", "Knowledge & Learning"],
    specs: [
      { k: "Billing", v: "Monthly, cancel anytime" },
      { k: "Review", v: "Human coach, every plan" },
      { k: "Revisions", v: "Monthly + on request" },
      { k: "Includes", v: "Nutrition + training" },
    ],
    halalStatus: "not-applicable" as const,
  },
];

/* --------------------------------------------------------------- journal */

const POSTS = [
  {
    slug: "building-strength-while-fasting-in-ramadan",
    title: "Building Strength While Fasting in Ramadan",
    category: "Training",
    excerpt:
      "How to preserve muscle, time your training, and fuel smartly around suhoor and iftar.",
    coverImage: UNSPLASH("1517963879433-6ad2b056d712"),
    readMinutes: 6,
    body: `Most people accept losing strength in Ramadan as inevitable. It isn't. What you lose in thirty days of fasting is mostly a function of two decisions: when you train, and how much protein you eat in the window you have.

## Train in the hour before iftar

Training fasted in the late afternoon means you break your fast immediately afterwards — protein and carbohydrate arrive within minutes of the last set. The session itself will feel harder than usual and your top-end strength will be down perhaps 10%. That is fine. You are not chasing personal records this month; you are giving your body a reason to keep the muscle it has.

The alternative — training ninety minutes after iftar — is better for performance and worse for digestion. Both work. Pick the one you will actually do for thirty days.

## Cut volume, keep intensity

Halve your sets, keep your loads. Three heavy sets of five will maintain strength far better than six exhausted sets of twelve. Total weekly volume is what drives soreness and recovery debt, and recovery is exactly what fasting compresses.

## Protein is the whole game

Aim for 1.6g per kilogram of bodyweight, split across suhoor and the hours after iftar. In practice that means protein at three distinct points: a solid portion at iftar, a second at your late meal, and a slow protein at suhoor — dairy, eggs, or a whey isolate if solid food at 4am defeats you.

## Sleep is the tax nobody budgets for

Taraweeh, suhoor, and work do not fit inside eight hours of sleep. Decide in advance which nap you are taking — most people find twenty minutes after Dhuhr and an hour after Fajr is the split that works. Deciding in advance is the difference between a nap and a collapse.`,
  },
  {
    slug: "halal-nutrition-101",
    title: "Halal Nutrition 101: Fuel That Honours the Body",
    category: "Nutrition",
    excerpt:
      "A practical guide to protein, macros, and clean halal eating for real, sustainable results.",
    coverImage: UNSPLASH("1547592180-85f173990554"),
    readMinutes: 8,
    body: `Halal is not a sticker. It is a chain of custody that runs from the animal to the powder in your shaker, and most supplement brands break it somewhere in the middle.

## Where halal claims usually fail

Three places, in order of frequency. First, the rennet in whey — an enzyme from an animal source that is rarely disclosed. Second, the flavour house, where alcohol is a common carrier solvent. Third, the gelatin in capsules, which is porcine far more often than not.

A brand that can name its certifier and its certificate number has done the work. A brand that says "suitable for Muslims" has not.

## Protein, without the mysticism

You need roughly 1.6 to 2.2g of protein per kilogram of bodyweight to build muscle, and there is no credible evidence for going higher. For an 80kg man that is 128–176g a day. Reaching it from food is entirely achievable: eggs, dairy, lentils, chicken, lamb, fish.

Supplements are convenience, not magic. If you are hitting your protein from food, you do not need them.

## Carbohydrates are not the enemy

The Muslim diet is often blamed on rice. Rice is fine. Portion is the variable. A cupped hand of cooked rice per meal, adjusted up on training days, solves most of what people try to solve by cutting the food group entirely.

## Build the plate, not the spreadsheet

A palm of protein, a fist of vegetables, a cupped hand of carbohydrate, a thumb of fat. It is accurate to within about 10% of a tracked plan and you will still be doing it in six months, which the tracked plan cannot claim.`,
  },
  {
    slug: "the-sunnah-of-strength-and-discipline",
    title: "The Sunnah of Strength & Discipline",
    category: "Mindset",
    excerpt:
      "What the Prophet ﷺ taught us about caring for the body as an amanah — and staying consistent.",
    coverImage: UNSPLASH("1558611848-73f7eb4001a1"),
    readMinutes: 5,
    body: `"The strong believer is more beloved to Allah than the weak believer." The hadith is usually quoted to justify a gym membership. It says something more demanding than that.

## The body is a trust, not a project

An amanah is something held on behalf of someone else, to be returned in good condition. That framing changes the arithmetic of training. You are not sculpting an asset you own; you are maintaining something entrusted to you. It removes vanity from the equation without removing the obligation.

## Consistency over intensity

The Prophet ﷺ was asked which deeds are most beloved to Allah. The answer was the ones done consistently, even if small. Every credible training principle discovered since agrees. The programme you follow for two years beats the programme you attack for six weeks.

## Discipline is a form of worship

Waking for Fajr trains the same faculty as showing up to a session you do not feel like doing. They are not separate disciplines competing for the same willpower — they reinforce one another. People who fix their Fajr almost always find their training follows, and the reverse is true just as often.

## Strength has a purpose beyond itself

Strength that serves nobody is just vanity with better lighting. Carry your parents' shopping. Be the one who can help at the masjid when something needs lifting. Play with your children until they are tired, not until you are. That is what the strength is for.`,
  },
  {
    slug: "suhoor-that-actually-holds",
    title: "Suhoor That Actually Holds Until Maghrib",
    category: "Nutrition",
    excerpt:
      "Why most suhoor meals fail by mid-morning, and the three-part structure that fixes it.",
    coverImage: UNSPLASH("1504754524776-8f4f37790ca0"),
    readMinutes: 6,
    body: `If you are ravenous by 11am, your suhoor was built wrong. Almost always it is the same mistake: fast carbohydrate, no fat, not enough salt.

## The three parts

**Slow protein.** Eggs, full-fat yoghurt, cottage cheese, or a casein-heavy dairy. These empty from the stomach slowly and blunt the hunger signal for hours.

**Fat, deliberately.** Olive oil, avocado, nuts, the yolk you were about to throw away. Fat slows gastric emptying more than any other macronutrient. A fat-free suhoor is a suhoor that ends early.

**Complex carbohydrate with fibre intact.** Oats, wholegrain bread, dates with their skin. The fibre is doing the work — juice and white bread will spike and drop you before Dhuhr.

## Salt and water, in that order

Most Ramadan headaches are sodium, not dehydration. You lose salt through the day and drinking plain water at suhoor dilutes what you have. Salt your food properly and drink to thirst, not to a target. Two litres forced down at 4am mostly ends up in the bathroom by Fajr.

## A worked example

Three eggs cooked in olive oil, a bowl of oats with full-fat yoghurt and four dates, a glass of milk, salt on the eggs. Around 700 kcal, 40g of protein, and it holds — for most people — until mid-afternoon.`,
  },
  {
    slug: "training-around-the-five-prayers",
    title: "Training Around the Five Prayers",
    category: "Training",
    excerpt:
      "A weekly template that fits real sessions between Fajr and Isha without rushing either.",
    coverImage: UNSPLASH("1519817650390-64a93db51149"),
    readMinutes: 7,
    body: `The five prayers are fixed points, and they move through the year. A training schedule that ignores them produces the same weekly conflict every winter, when Maghrib arrives at half past four.

## Anchor sessions to prayers, not to clock times

"Gym at 6pm" breaks in December. "Gym after Asr, home for Maghrib" works in every season, because it moves with the sun the way your day already does.

## The three usable windows

**After Fajr.** The most protected hour of the day — nothing is competing for it. Best for anyone whose evenings belong to family or work. Eat something small first if you lift heavy.

**Between Dhuhr and Asr.** Long in summer, tight in winter. Good for a 45-minute session if your workday allows it.

**Between Maghrib and Isha.** The most popular and most compressed. Realistically 50 minutes of actual work. Have the session written down before you arrive.

## A four-day template

Monday and Thursday, heavy lower and upper respectively, after Fajr — these are also the sunnah fasting days for many, so keep them early and fuel after. Tuesday and Friday, accessory and conditioning, between Maghrib and Isha. Friday's session goes after Jumu'ah, never before — you will rush the ghusl and arrive late.

Two rest days that float. Do not schedule them; take them when your sleep tells you to.`,
  },
];

/* -------------------------------------------------------------- reviews */

const PLANNER_REVIEWS = [
  {
    authorName: "Umm Zayd",
    rating: 5,
    title: "My six-year-old asks for it",
    body: "He fills in his salah stars before I've even reminded him. The wudu pages settled an argument we'd been having for a year.",
  },
  {
    authorName: "Ibrahim K.",
    rating: 5,
    title: "Genuinely well made",
    body: "Thick paper, lies flat, survived a full term in a school bag. The Arabic duʿās are vowelled properly which matters more than I expected.",
  },
  {
    authorName: "Fatima A.",
    rating: 5,
    title: "Bought three for the madrasah",
    body: "The good-deeds section is the one the children compete over. Ordered more for the whole class after two weeks.",
  },
  {
    authorName: "Yusuf R.",
    rating: 4,
    title: "Great, would like a teen version",
    body: "Perfect for my nine-year-old, slightly young for my thirteen-year-old. Please make one for older children.",
  },
  {
    authorName: "Aisha M.",
    rating: 5,
    title: "Five minutes a night",
    body: "That's the whole trick. It's short enough that we actually do it every day, which no other planner we tried managed.",
  },
];

/* ------------------------------------------------------------------ run */

async function seed() {
  console.log("→ seeding catalogue");

  for (const p of PRODUCTS) {
    await db
      .insert(products)
      .values(p)
      .onConflictDoUpdate({ target: products.slug, set: p });
  }

  console.log("→ seeding journal");
  const now = Date.now();
  for (const [i, post] of POSTS.entries()) {
    const row = {
      ...post,
      published: true,
      /* stagger publish dates so ordering is stable and looks natural */
      publishedAt: new Date(now - i * 6 * 86_400_000),
    };
    await db
      .insert(journalPosts)
      .values(row)
      .onConflictDoUpdate({ target: journalPosts.slug, set: row });
  }

  console.log("→ seeding accounts");
  const accounts = [
    {
      email: "admin@thefitmuslim.co",
      name: "Store Admin",
      role: "admin" as const,
      password: process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026",
    },
    {
      email: "coach@thefitmuslim.co",
      name: "Coach Bilal",
      role: "coach" as const,
      password: process.env.SEED_COACH_PASSWORD ?? "ChangeMe!2026",
    },
  ];

  for (const a of accounts) {
    const existing = await db.select().from(users).where(eq(users.email, a.email)).get();
    if (existing) {
      await db.update(users).set({ name: a.name, role: a.role }).where(eq(users.id, existing.id));
      continue;
    }
    await db.insert(users).values({
      email: a.email,
      name: a.name,
      role: a.role,
      passwordHash: await hashPassword(a.password),
      timezone: "Europe/London",
      city: "London",
      country: "GB",
      latitude: 51.5072,
      longitude: -0.1276,
    });
  }

  console.log("→ seeding reviews");
  const planner = await db
    .select()
    .from(products)
    .where(eq(products.slug, "my-muslim-hero-daily-planner"))
    .get();

  if (planner) {
    const already = await db.select().from(reviews).where(eq(reviews.productId, planner.id)).all();
    if (already.length === 0) {
      for (const [i, r] of PLANNER_REVIEWS.entries()) {
        await db.insert(reviews).values({
          ...r,
          productId: planner.id,
          verifiedPurchase: true,
          approved: true,
          createdAt: new Date(now - (i + 2) * 9 * 86_400_000),
        });
      }
    }
  }

  console.log("\n✅ seed complete");
  console.log("   admin@thefitmuslim.co / %s", process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026");
  console.log("   coach@thefitmuslim.co / %s", process.env.SEED_COACH_PASSWORD ?? "ChangeMe!2026");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
