import { describe, expect, it } from "vitest";
import {
  assignRecipe,
  createEmptyMenu,
  fillMenu,
  normalizeMenu,
  removeRecipe,
} from "../src/domain/menu.js";

const recipe = { id: "one", mealTypes: ["desayuno", "cena"] };

describe("menú semanal", () => {
  it("crea los siete días con cuatro tiempos", () => {
    const menu = createEmptyMenu();
    expect(Object.keys(menu)).toHaveLength(7);
    expect(Object.keys(menu.Lunes)).toEqual(["desayuno", "comida", "colacion", "cena"]);
  });
  it("asigna y elimina recetas sin mutar el menú original", () => {
    const original = createEmptyMenu();
    const assigned = assignRecipe(original, "Lunes", "desayuno", recipe);
    expect(assigned.Lunes.desayuno).toBe("one");
    expect(original.Lunes.desayuno).toBeNull();
    expect(removeRecipe(assigned, "Lunes", "desayuno").Lunes.desayuno).toBeNull();
  });
  it("rechaza recetas incompatibles y limpia importaciones inválidas", () => {
    expect(() => assignRecipe(createEmptyMenu(), "Lunes", "comida", recipe)).toThrow();
    expect(normalizeMenu({ Lunes: { comida: "one" } }, [recipe]).Lunes.comida).toBeNull();
  });
  it("autocompleta únicamente recetas compatibles", () => {
    const recipes = [
      recipe,
      { id: "lunch", mealTypes: ["comida"] },
      { id: "snack", mealTypes: ["colacion"] },
    ];
    const menu = fillMenu(recipes, () => 0);
    expect(menu.Martes).toEqual({
      desayuno: "one",
      comida: "lunch",
      colacion: "snack",
      cena: "one",
    });
  });
});
