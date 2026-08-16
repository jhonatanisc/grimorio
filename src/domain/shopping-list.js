export function collectShoppingItems(menu, recipes, equivalences, servings = 1) {
  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const totals = new Map();
  for (const meals of Object.values(menu))
    for (const recipeId of Object.values(meals)) {
      const recipe = byId.get(recipeId);
      for (const item of recipe?.ingredients ?? []) {
        const ingredient = equivalences[item.ingredientId];
        if (!ingredient?.includeInShoppingList) continue;
        const key = `${item.ingredientId}:${ingredient.portion}`;
        const current = totals.get(key) ?? {
          id: item.ingredientId,
          name: ingredient.name,
          category: ingredient.category,
          unit: ingredient.portion,
          quantity: 0,
        };
        current.quantity += item.portions * servings;
        totals.set(key, current);
      }
    }
  return [...totals.values()].sort(
    (a, b) => a.category.localeCompare(b.category, "es") || a.name.localeCompare(b.name, "es"),
  );
}

export function formatQuantity(value) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function shoppingListText(items) {
  if (!items.length) return "GRIMORIO — LISTA DE COMPRAS\n\nNo hay recetas programadas.";
  let category = "";
  return `GRIMORIO — LISTA DE COMPRAS\n\n${items
    .map((item) => {
      const heading =
        item.category !== category
          ? `${(category = item.category).replaceAll("-", " ").toUpperCase()}\n`
          : "";
      return `${heading}☐ ${item.name} — ${formatQuantity(item.quantity)} × ${item.unit}`;
    })
    .join("\n")}`;
}
