import { describe, expect, it } from "vitest";
import { parseState } from "../src/services/storage.js";

const recipes = [
  { id: "desayuno", mealTypes: ["desayuno"] },
  { id: "comida", mealTypes: ["comida"] },
];

describe("estado persistido", () => {
  it("conserva los ingredientes de compras seleccionados", () => {
    const state = parseState(
      {
        version: 3,
        menu: { Lunes: { desayuno: "desayuno" } },
        checkedShoppingItems: ["huevo:pieza", 4, "arroz:taza"],
      },
      recipes,
    );

    expect(state.checkedShoppingItems).toEqual(["huevo:pieza", "arroz:taza"]);
  });

  it("agrega una lista vacía al abrir respaldos anteriores", () => {
    const state = parseState({ version: 3, menu: {} }, recipes);

    expect(state.checkedShoppingItems).toEqual([]);
  });
});
