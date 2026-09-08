import type { PlanIntake, PlanMeal, PlanTrainingDay } from "@/lib/db/schema";
import { utcOffsetHours, zonedNow } from "@/lib/prayer/locations";
import {
  formatMinutes,
  prayerTimes,
  resolveHighLatitude,
  type CalculationMethod,
  type Prayer,
} from "@/lib/prayer/times";
import { isRamadan } from "@/lib/prayer/hijri";

/* ============================================================
   The plan engine.

   Deterministic on purpose: the same intake always produces the
   same draft, so a coach reviewing it can trust that nothing
   changed underneath them between reading and approving. The
   coach's edits — not a regeneration — are what reach the
   customer.
   ============================================================ */

const ACTIVITY_FACTOR = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
} as const;

const GOAL_ADJUSTMENT = {
  /* a ~20% deficit is aggressive enough to show progress and mild enough to
     hold through a fasting month */
  lose: -0.2,
  maintain: 0,
  gain: 0.12,
} as const;

const PROTEIN_PER_KG = { lose: 2.0, maintain: 1.7, gain: 1.8 } as const;

/** Mifflin-St Jeor — the most accurate of the common resting-rate equations. */
export function basalRate(input: {
  sex: "male" | "female";
  weightKg: number;
  heightCm: number;
  age: number;
}) {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return Math.round(input.sex === "male" ? base + 5 : base - 161);
}

export type PlanDraft = {
  title: string;
  summary: string;
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  hydrationLitres: number;
  meals: PlanMeal[];
  training: PlanTrainingDay[];
  guidance: string[];
  ramadanMode: boolean;
};

type Times = Partial<Record<Prayer, number>>;

/** Clock labels for the intake's location, when we have coordinates. */
function timesForIntake(intake: PlanIntake, when: Date): Times {
  if (intake.latitude == null || intake.longitude == null) return {};
  const timezone = intake.timezone ?? "UTC";
  const zoned = zonedNow(timezone, when);
  return resolveHighLatitude(
    prayerTimes(zoned.date, {
      latitude: intake.latitude,
      longitude: intake.longitude,
      utcOffset: utcOffsetHours(timezone, when),
      method: (intake.country === "SA" ? "MAKKAH" : "MWL") as CalculationMethod,
    }),
  );
}

const at = (times: Times, prayer: Prayer, offsetMinutes = 0) => {
  const minutes = times[prayer];
  return minutes === undefined ? null : formatMinutes(minutes + offsetMinutes);
};

function macrosFor(intake: PlanIntake) {
  const bmr = basalRate({
    sex: intake.sex,
    weightKg: intake.weightKg,
    heightCm: intake.heightCm,
    age: intake.age,
  });
  const tdee = Math.round(bmr * ACTIVITY_FACTOR[intake.activityLevel]);
  /* Never prescribe below the resting rate, whatever the goal says. */
  const targetCalories = Math.max(
    bmr,
    Math.round(tdee * (1 + GOAL_ADJUSTMENT[intake.goal])),
  );

  const proteinGrams = Math.round(PROTEIN_PER_KG[intake.goal] * intake.weightKg);
  const fatGrams = Math.round((targetCalories * 0.27) / 9);
  const carbGrams = Math.max(
    60,
    Math.round((targetCalories - proteinGrams * 4 - fatGrams * 9) / 4),
  );

  return { bmr, tdee, targetCalories, proteinGrams, carbGrams, fatGrams };
}

/** Splits the day's macros across meals by share of total calories. */
function distribute(
  totals: { targetCalories: number; proteinGrams: number; carbGrams: number; fatGrams: number },
  share: number,
) {
  return {
    calories: Math.round(totals.targetCalories * share),
    protein: Math.round(totals.proteinGrams * share),
    carbs: Math.round(totals.carbGrams * share),
    fat: Math.round(totals.fatGrams * share),
  };
}

const DIETARY_PROTEIN: Record<string, string[]> = {
  balanced: ["Eggs", "Chicken thigh", "Lamb mince", "Greek yoghurt", "White fish"],
  "high-protein": ["Egg whites + whole eggs", "Chicken breast", "Lean beef", "Cottage cheese", "Whey isolate"],
  vegetarian: ["Eggs", "Paneer", "Greek yoghurt", "Lentils", "Halloumi"],
  vegan: ["Lentils", "Chickpeas", "Tofu", "Tempeh", "Pea protein"],
  mediterranean: ["Oily fish", "Eggs", "Chicken", "Greek yoghurt", "Butter beans"],
};

const CARB_SOURCES = ["Oats", "Basmati rice", "Wholegrain bread", "Sweet potato", "Dates"];

/** Removes anything the customer told us to avoid. */
function filterFoods(foods: string[], intake: PlanIntake) {
  const blocked = [...intake.allergies, ...intake.avoid].map((a) => a.toLowerCase().trim());
  if (blocked.length === 0) return foods;
  return foods.filter((food) => {
    const lower = food.toLowerCase();
    return !blocked.some((b) => b.length > 2 && lower.includes(b));
  });
}

function ordinaryMeals(intake: PlanIntake, totals: ReturnType<typeof macrosFor>, times: Times): PlanMeal[] {
  const proteins = filterFoods(DIETARY_PROTEIN[intake.dietaryStyle] ?? DIETARY_PROTEIN.balanced, intake);
  const carbs = filterFoods(CARB_SOURCES, intake);
  const p = (i: number) => proteins[i % Math.max(1, proteins.length)] ?? "Protein of choice";
  const c = (i: number) => carbs[i % Math.max(1, carbs.length)] ?? "Wholegrain carbohydrate";

  return [
    {
      name: "Breakfast",
      time: at(times, "fajr", 45) ?? "After Fajr",
      anchor: "After Fajr",
      ...distribute(totals, 0.27),
      items: [`${p(0)} — two palms`, `${c(0)} — one cupped hand`, "Fruit + a thumb of nuts"],
    },
    {
      name: "Lunch",
      time: at(times, "dhuhr", 40) ?? "After Dhuhr",
      anchor: "After Dhuhr",
      ...distribute(totals, 0.3),
      items: [`${p(1)} — two palms`, `${c(1)} — one cupped hand`, "Two fists of vegetables"],
    },
    {
      name: "Pre-training snack",
      time: at(times, "asr", 30) ?? "After ʿAsr",
      anchor: "After ʿAsr",
      ...distribute(totals, 0.13),
      items: [`${p(3)} — one palm`, "Dates or fruit", "Water, 500ml"],
    },
    {
      name: "Dinner",
      time: at(times, "maghrib", 30) ?? "After Maghrib",
      anchor: "After Maghrib",
      ...distribute(totals, 0.3),
      items: [`${p(2)} — two palms`, `${c(2)} — one cupped hand`, "Two fists of vegetables", "A thumb of olive oil"],
    },
  ];
}

function ramadanMeals(intake: PlanIntake, totals: ReturnType<typeof macrosFor>, times: Times): PlanMeal[] {
  const proteins = filterFoods(DIETARY_PROTEIN[intake.dietaryStyle] ?? DIETARY_PROTEIN.balanced, intake);
  const carbs = filterFoods(CARB_SOURCES, intake);
  const p = (i: number) => proteins[i % Math.max(1, proteins.length)] ?? "Protein of choice";
  const c = (i: number) => carbs[i % Math.max(1, carbs.length)] ?? "Wholegrain carbohydrate";

  return [
    {
      name: "Suhoor",
      /* 40 minutes before Fajr leaves time to eat without rushing */
      time: at(times, "fajr", -40) ?? "40 min before Fajr",
      anchor: "Before Fajr",
      ...distribute(totals, 0.35),
      items: [
        `${p(0)} — slow protein, two palms`,
        `${c(0)} — one cupped hand, fibre intact`,
        "A thumb of fat: olive oil, avocado or nuts",
        "Salt your food properly. Water to thirst, not to a target.",
      ],
    },
    {
      name: "Iftar — opening",
      time: at(times, "maghrib") ?? "At Maghrib",
      anchor: "At Maghrib",
      ...distribute(totals, 0.12),
      items: ["Three dates", "Water, 300–400ml", "Then pray Maghrib before eating properly"],
    },
    {
      name: "Iftar — the meal",
      time: at(times, "maghrib", 35) ?? "After Maghrib prayer",
      anchor: "After Maghrib",
      ...distribute(totals, 0.33),
      items: [`${p(1)} — two palms`, `${c(1)} — one cupped hand`, "Two fists of vegetables", "Soup if it settles you"],
    },
    {
      name: "After Taraweeh",
      time: at(times, "isha", 90) ?? "After Taraweeh",
      anchor: "After ʿIshā",
      ...distribute(totals, 0.2),
      items: [`${p(3)} — one to two palms`, "Fruit or yoghurt", "Water, 500ml"],
    },
  ];
}

const SPLITS: Record<number, { focus: string; blocks: string[] }[]> = {
  2: [
    { focus: "Full body — strength", blocks: ["Squat 3×5", "Bench or overhead press 3×5", "Row 3×8", "Carry 3×40m"] },
    { focus: "Full body — hinge", blocks: ["Deadlift 3×5", "Pull-up or lat pulldown 3×8", "Split squat 3×8", "Plank 3×45s"] },
  ],
  3: [
    { focus: "Lower — strength", blocks: ["Squat 4×5", "Romanian deadlift 3×8", "Split squat 3×10", "Calf raise 3×12"] },
    { focus: "Upper — push", blocks: ["Overhead press 4×5", "Incline press 3×8", "Dip or close-grip press 3×10", "Lateral raise 3×12"] },
    { focus: "Upper — pull + core", blocks: ["Pull-up 4×6", "Row 3×10", "Face pull 3×15", "Hanging leg raise 3×10"] },
  ],
  4: [
    { focus: "Lower — squat", blocks: ["Back squat 4×5", "Leg press 3×10", "Leg curl 3×12", "Calf raise 3×15"] },
    { focus: "Upper — push", blocks: ["Bench press 4×5", "Overhead press 3×8", "Dip 3×10", "Triceps 3×12"] },
    { focus: "Lower — hinge", blocks: ["Deadlift 4×4", "Hip thrust 3×10", "Split squat 3×10", "Ab wheel 3×10"] },
    { focus: "Upper — pull", blocks: ["Pull-up 4×6", "Barbell row 3×8", "Curl 3×12", "Face pull 3×15"] },
  ],
  5: [
    { focus: "Lower — squat", blocks: ["Back squat 5×5", "Leg press 3×10", "Leg curl 3×12"] },
    { focus: "Upper — push", blocks: ["Bench press 5×5", "Overhead press 3×8", "Lateral raise 3×15"] },
    { focus: "Lower — hinge", blocks: ["Deadlift 4×4", "Hip thrust 3×10", "Back extension 3×12"] },
    { focus: "Upper — pull", blocks: ["Pull-up 4×6", "Row 4×8", "Curl 3×12"] },
    { focus: "Conditioning + core", blocks: ["Intervals 8×1min", "Carry 4×40m", "Ab wheel 3×12", "Stretch 10min"] },
  ],
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function trainingFor(intake: PlanIntake, ramadan: boolean, times: Times): PlanTrainingDay[] {
  const days = Math.min(5, Math.max(2, intake.trainingDaysPerWeek));
  const split = SPLITS[days] ?? SPLITS[3];

  /* Spread sessions across the week rather than stacking them. */
  const slots = [0, 3, 1, 5, 2].slice(0, days).sort((a, b) => a - b);

  const window = ramadan
    ? `Hour before iftar (${at(times, "maghrib", -60) ?? "before Maghrib"})`
    : `After Fajr (${at(times, "fajr", 60) ?? "early"}) or between Maghrib and ʿIshā`;

  return slots.map((dayIndex, i) => {
    const day = DAY_NAMES[dayIndex];
    const template = split[i % split.length];
    /* Monday and Thursday are the sunnah fasting days — keep those sessions
       early and fuel afterwards. */
    const fastingDay =
      intake.fastsMondayThursday && (day === "Monday" || day === "Thursday");

    return {
      day,
      focus: template.focus,
      window: fastingDay
        ? `Before Maghrib, then eat (${at(times, "maghrib", -60) ?? "late afternoon"})`
        : day === "Friday"
          ? "After Jumuʿah — never before"
          : window,
      blocks: ramadan
        ? /* half the volume, same loads: strength is kept, fatigue is not */
          template.blocks.map((b) =>
            b.replace(/(\d)×/, (_, sets: string) => `${Math.max(2, Math.ceil(Number(sets) / 2))}×`),
          )
        : template.blocks,
    };
  });
}

function guidanceFor(intake: PlanIntake, ramadan: boolean, totals: ReturnType<typeof macrosFor>) {
  const notes: string[] = [];

  notes.push(
    `Your target is ${totals.targetCalories} kcal with ${totals.proteinGrams}g of protein — protein is the number to hit first; the rest has room to move.`,
  );

  if (ramadan) {
    notes.push(
      "Volume is halved this month and loads are kept. You are maintaining strength, not chasing records.",
    );
    notes.push(
      "Most Ramadan headaches are sodium, not water. Salt your suhoor properly and drink to thirst.",
    );
    notes.push(
      "Decide your naps in advance — twenty minutes after Dhuhr and an hour after Fajr is what works for most people.",
    );
  } else {
    notes.push(
      "Sessions are anchored to prayers rather than clock times, so the plan still works when Maghrib moves.",
    );
  }

  if (intake.goal === "lose") {
    notes.push(
      "Expect 0.4–0.8kg a week. Faster than that and you are losing muscle alongside the fat.",
    );
  }
  if (intake.goal === "gain") {
    notes.push(
      "Expect 0.2–0.4kg a week. If the scale climbs faster, the surplus is going somewhere you don't want it.",
    );
  }
  if (intake.fastsMondayThursday) {
    notes.push(
      "On Monday and Thursday fasts, train in the hour before Maghrib and break your fast straight after.",
    );
  }
  if (intake.allergies.length > 0) {
    notes.push(`Nothing in this plan contains: ${intake.allergies.join(", ")}.`);
  }
  if (intake.medical.trim()) {
    notes.push(
      "You've told us about a medical consideration — your coach will read it before approving, and this plan is not a substitute for medical advice.",
    );
  }

  return notes;
}

/** Builds a complete draft plan from an intake. */
export function generatePlan(intake: PlanIntake, now = new Date()): PlanDraft {
  const times = timesForIntake(intake, now);
  const ramadan =
    intake.ramadanMode || isRamadan(now, intake.timezone ?? undefined);

  const totals = macrosFor(intake);
  const meals = ramadan
    ? ramadanMeals(intake, totals, times)
    : ordinaryMeals(intake, totals, times);

  const goalWord =
    intake.goal === "lose" ? "Lean" : intake.goal === "gain" ? "Build" : "Maintain";

  return {
    title: `${goalWord} — ${intake.trainingDaysPerWeek} days a week${ramadan ? " · Ramadan" : ""}`,
    summary: ramadan
      ? `A fasting-month plan built around your suhoor and iftar windows, at ${totals.targetCalories} kcal and ${totals.proteinGrams}g of protein a day.`
      : `A ${totals.targetCalories} kcal plan with ${totals.proteinGrams}g of protein a day, with meals and sessions anchored to your prayer times.`,
    ...totals,
    /* 35ml per kg, rounded to a sensible half-litre */
    hydrationLitres: Math.round((intake.weightKg * 0.035) * 2) / 2,
    meals,
    training: trainingFor(intake, ramadan, times),
    guidance: guidanceFor(intake, ramadan, totals),
    ramadanMode: ramadan,
  };
}
