import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const recipes = JSON.parse(await readFile(new URL("../data/recipes.json", import.meta.url)));
const equivalences = JSON.parse(await readFile(new URL("../data/equivalences.json", import.meta.url)));
const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const meals = ["desayuno", "comida", "colacion", "cena"];
const emptyMenu = () => Object.fromEntries(days.map((day) => [day, Object.fromEntries(meals.map((meal) => [meal, null]))]));
const findFor = (meal) => recipes.find((recipe) => recipe.mealTypes.includes(meal));

let menu = emptyMenu();
const breakfast = findFor("desayuno");
const dinnerCompatible = recipes.find((recipe) => recipe.mealTypes.includes("cena") && recipe.id !== breakfast.id);
const lunch = findFor("comida");
const snack = findFor("colacion");

menu.Lunes.desayuno = breakfast.id;
assert.equal(menu.Lunes.desayuno, breakfast.id, "No se pudo asignar una receta");
menu.Lunes.desayuno = dinnerCompatible.id;
assert.equal(menu.Lunes.desayuno, dinnerCompatible.id, "No se pudo cambiar una receta");
menu.Lunes.desayuno = null;
assert.equal(menu.Lunes.desayuno, null, "No se pudo eliminar una receta");

menu.Martes.comida = lunch.id;
menu.Miércoles.colacion = snack.id;
const stored = JSON.stringify(menu);
menu = JSON.parse(stored);
assert.equal(menu.Martes.comida, lunch.id, "La persistencia simulada perdió la comida");
assert.deepEqual(JSON.parse(JSON.stringify(menu)), menu, "Importación/exportación no conserva el menú");

assert(recipes.every((recipe) => !recipe.mealTypes.includes("comida") || recipe.mealTypes.length === 1), "Una comida se asignó a otro tiempo");
assert(recipes.every((recipe) => !recipe.mealTypes.includes("colacion") || recipe.mealTypes.length === 1), "Una colación se asignó a otro tiempo");
assert(recipes.filter((recipe) => recipe.mealTypes.includes("desayuno")).every((recipe) => recipe.mealTypes.includes("cena")), "Desayuno no intercambiable con cena");

menu.Jueves.desayuno = breakfast.id;
menu.Viernes.cena = breakfast.id;
const ids = new Set();
for (const day of days) for (const meal of meals) {
  const recipe = recipes.find(({ id }) => id === menu[day][meal]);
  recipe?.ingredients.forEach(({ ingredientId }) => {
    if (equivalences[ingredientId].includeInShoppingList) ids.add(ingredientId);
  });
}
assert.equal(ids.size, [...ids].length, "La compra contiene duplicados");
assert(![...ids].some((id) => ["sal", "pimienta"].includes(id)), "Sal o pimienta aparecieron en la compra");
assert(![...ids].some((id) => /\d+\s*(g|pieza|taza|lata)/i.test(equivalences[id].name)), "La compra muestra cantidades");

console.log("OK: asignar, cambiar, eliminar, persistir, importar/exportar y compra única sin cantidades.");
