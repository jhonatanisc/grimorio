import { MEAL_KEYS, PROTEINS } from "./constants.js";

const SPEEDS = ["super-rapida", "normal", "elaborada"];
const WEIGHTS = ["ligera", "intermedia", "pesada"];

export function validateRecipe(value, equivalences) {
  const errors = [];
  if (!value || typeof value !== "object")
    return { valid: false, errors: ["La receta no es un objeto."] };
  if (!String(value.id || "").trim()) errors.push("Falta el identificador.");
  if (!String(value.name || "").trim()) errors.push("Falta el nombre.");
  if (
    !Array.isArray(value.mealTypes) ||
    !value.mealTypes.length ||
    value.mealTypes.some((x) => !MEAL_KEYS.includes(x))
  )
    errors.push("Los tiempos de comida no son válidos.");
  if (!Array.isArray(value.proteinTypes) || value.proteinTypes.some((x) => !PROTEINS.includes(x)))
    errors.push("Las proteínas no son válidas.");
  if (!Number.isFinite(value.prepTime) || value.prepTime < 0)
    errors.push("El tiempo de preparación no es válido.");
  if (!SPEEDS.includes(value.speed)) errors.push("La velocidad no es válida.");
  if (!WEIGHTS.includes(value.heaviness)) errors.push("El peso no es válido.");
  if (!Array.isArray(value.instructions)) errors.push("Las instrucciones no son válidas.");
  if (!Array.isArray(value.ingredients) || !value.ingredients.length)
    errors.push("Añade al menos un ingrediente.");
  else
    for (const item of value.ingredients) {
      if (!equivalences[item.ingredientId])
        errors.push(`No existe el ingrediente ${item.ingredientId}.`);
      if (!Number.isFinite(item.portions) || item.portions <= 0)
        errors.push("Las porciones deben ser mayores que cero.");
    }
  return { valid: errors.length === 0, errors };
}

export function filterRecipes(
  recipes,
  { query = "", meal = "all", protein = "all", favorites = [] } = {},
) {
  const text = query.trim().toLocaleLowerCase("es");
  return recipes.filter((recipe) => {
    const blob = [recipe.name, ...recipe.mealTypes, ...recipe.proteinTypes]
      .join(" ")
      .toLocaleLowerCase("es");
    return (
      (meal === "all" || recipe.mealTypes.includes(meal)) &&
      (protein === "all" || recipe.proteinTypes.includes(protein)) &&
      (protein !== "favoritas" || favorites.includes(recipe.id)) &&
      (!text || blob.includes(text))
    );
  });
}

export function makeRecipeId(name, existingIds = []) {
  const base =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "receta";
  let id = `custom-${base}`,
    index = 2;
  while (existingIds.includes(id)) id = `custom-${base}-${index++}`;
  return id;
}
