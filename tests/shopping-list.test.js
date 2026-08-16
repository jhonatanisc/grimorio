import { describe, expect, it } from "vitest";
import { collectShoppingItems, shoppingListText } from "../src/domain/shopping-list.js";
import { createEmptyMenu } from "../src/domain/menu.js";

describe("lista de compras", () => {
  it("suma porciones compatibles, multiplica comensales y omite básicos", () => {
    const menu = createEmptyMenu();
    menu.Lunes.desayuno = "r";
    menu.Martes.desayuno = "r";
    const recipes = [
      {
        id: "r",
        ingredients: [
          { ingredientId: "huevo", portions: 2 },
          { ingredientId: "sal", portions: 1 },
        ],
      },
    ];
    const eq = {
      huevo: {
        name: "Huevo",
        category: "proteínas",
        portion: "pieza",
        includeInShoppingList: true,
      },
      sal: { name: "Sal", category: "básicos", portion: "pizca", includeInShoppingList: false },
    };
    const items = collectShoppingItems(menu, recipes, eq, 2);
    expect(items).toEqual([
      { id: "huevo", name: "Huevo", category: "proteínas", unit: "pieza", quantity: 8 },
    ]);
    expect(shoppingListText(items)).toContain("Huevo — 8 × pieza");
  });
});
