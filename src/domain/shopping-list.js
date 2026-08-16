export function collectShoppingItems(menu, recipes, equivalences, servings = 1) {
  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const totals = new Map();
  for (const [day, meals] of Object.entries(menu))
    for (const [meal, recipeId] of Object.entries(meals)) {
      const recipe = byId.get(recipeId);
      for (const item of recipe?.ingredients ?? []) {
        const ingredient = equivalences[item.ingredientId];
        if (!ingredient?.includeInShoppingList) continue;
        const portion = normalizePortion(ingredient.portion);
        const key = `${item.ingredientId}:${portion.unit}`;
        const current = totals.get(key) ?? {
          id: item.ingredientId,
          name: ingredient.name,
          category: ingredient.category,
          unit: portion.unit,
          quantity: 0,
          usages: [],
        };
        current.quantity += item.portions * portion.amount * servings;
        current.usages.push({
          day,
          meal,
          recipeId: recipe.id,
          recipeName: recipe.name,
          quantity: item.portions * portion.amount * servings,
        });
        totals.set(key, current);
      }
    }
  return [...totals.values()].sort(
    (a, b) => a.category.localeCompare(b.category, "es") || a.name.localeCompare(b.name, "es"),
  );
}

export function normalizePortion(portion) {
  if (portion && typeof portion === "object") {
    return {
      amount: Number.isFinite(portion.amount) ? portion.amount : 1,
      unit: String(portion.unit || "porción"),
    };
  }
  return { amount: 1, unit: String(portion || "porción") };
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
      const usages = item.usages
        .map(
          (usage) =>
            `   ↳ ${usage.day} · ${usage.meal}: ${usage.recipeName} (${formatQuantity(usage.quantity)} × ${item.unit})`,
        )
        .join("\n");
      return `${heading}☐ ${item.name} — ${formatQuantity(item.quantity)} × ${item.unit}\n${usages}`;
    })
    .join("\n")}`;
}
