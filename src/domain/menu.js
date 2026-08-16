import { DAYS, MEAL_KEYS } from "./constants.js";

export function createEmptyMenu() {
  return Object.fromEntries(
    DAYS.map((day) => [day, Object.fromEntries(MEAL_KEYS.map((meal) => [meal, null]))]),
  );
}

export function normalizeMenu(value, recipes) {
  const menu = createEmptyMenu();
  if (!value || typeof value !== "object" || Array.isArray(value)) return menu;
  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  for (const day of DAYS)
    for (const meal of MEAL_KEYS) {
      const recipe = byId.get(value[day]?.[meal]);
      menu[day][meal] = recipe?.mealTypes.includes(meal) ? recipe.id : null;
    }
  return menu;
}

export function assignRecipe(menu, day, meal, recipe) {
  if (!DAYS.includes(day) || !MEAL_KEYS.includes(meal) || !recipe?.mealTypes.includes(meal))
    throw new Error("La receta no es compatible con ese espacio.");
  return { ...menu, [day]: { ...menu[day], [meal]: recipe.id } };
}

export function removeRecipe(menu, day, meal) {
  return { ...menu, [day]: { ...menu[day], [meal]: null } };
}

export function fillMenu(recipes, random = Math.random) {
  const menu = createEmptyMenu();
  for (const day of DAYS)
    for (const meal of MEAL_KEYS) {
      const pool = recipes.filter((recipe) => recipe.mealTypes.includes(meal));
      menu[day][meal] = pool[Math.floor(random() * pool.length)]?.id ?? null;
    }
  return menu;
}

export function findNextEmptySlot(menu, current) {
  const slots = DAYS.flatMap((day) => MEAL_KEYS.map((meal) => ({ day, meal })));
  const start = slots.findIndex(({ day, meal }) => day === current.day && meal === current.meal);
  for (let offset = 1; offset <= slots.length; offset += 1) {
    const slot = slots[(start + offset) % slots.length];
    if (!menu[slot.day][slot.meal]) return slot;
  }
  return null;
}
