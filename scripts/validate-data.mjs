import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const recipes = JSON.parse(await readFile(new URL("../data/recipes.json", import.meta.url)));
const equivalences = JSON.parse(await readFile(new URL("../data/equivalences.json", import.meta.url)));
const valid = {
  mealTypes: new Set(["desayuno", "comida", "colacion", "cena"]),
  proteinTypes: new Set(["pollo", "pavo", "res", "cerdo", "pescado", "atun", "huevo", "queso", "vegetal", "sin-proteina"]),
  speed: new Set(["super-rapida", "normal", "elaborada"]),
  heaviness: new Set(["ligera", "intermedia", "pesada"]),
};

assert(Array.isArray(recipes) && recipes.length, "recipes.json debe contener recetas");
assert.equal(new Set(recipes.map(({ id }) => id)).size, recipes.length, "Hay IDs de receta duplicados");
for (const recipe of recipes) {
  assert(recipe.id && recipe.name && Number.isFinite(recipe.prepTime), `Receta incompleta: ${recipe.id}`);
  assert(recipe.mealTypes.length && recipe.mealTypes.every((x) => valid.mealTypes.has(x)), `mealTypes inválido: ${recipe.id}`);
  assert(recipe.proteinTypes.length && recipe.proteinTypes.every((x) => valid.proteinTypes.has(x)), `proteinTypes inválido: ${recipe.id}`);
  assert(valid.speed.has(recipe.speed), `speed inválido: ${recipe.id}`);
  assert(valid.heaviness.has(recipe.heaviness), `heaviness inválido: ${recipe.id}`);
  assert(Array.isArray(recipe.instructions), `instructions inválido: ${recipe.id}`);
  for (const ingredient of recipe.ingredients) {
    assert(equivalences[ingredient.ingredientId], `Falta equivalencia ${ingredient.ingredientId} en ${recipe.id}`);
    assert(Number.isFinite(ingredient.portions) && ingredient.portions > 0, `Porción inválida en ${recipe.id}`);
  }
}
for (const [id, item] of Object.entries(equivalences)) {
  assert(item.name && item.category && item.portion, `Equivalencia incompleta: ${id}`);
  if (["sal", "pimienta"].includes(id)) assert.equal(item.includeInShoppingList, false, `${id} debe excluirse de compras`);
}

console.log(`OK: ${recipes.length} recetas, ${Object.keys(equivalences).length} equivalencias y referencias íntegras.`);
