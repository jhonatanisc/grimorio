import { describe, expect, it } from "vitest";
import { createEmptyMenu } from "../src/domain/menu.js";
import { createSharedMenuUrl, readSharedMenu } from "../src/services/shared-menu.js";

const baseRecipes = [{ id: "base", mealTypes: ["desayuno"] }];
const customRecipe = { id: "custom", mealTypes: ["cena"], name: "Cena" };

describe("menús compartidos", () => {
  it("incluye únicamente recetas personalizadas usadas y reconstruye el menú", () => {
    const menu = createEmptyMenu();
    menu.Lunes.desayuno = "base";
    menu.Lunes.cena = "custom";
    const url = createSharedMenuUrl(
      { menu, servings: 2, customRecipes: [customRecipe, { id: "sin-usar", mealTypes: ["cena"] }] },
      "https://ejemplo.test/grimorio/",
    );
    const shared = readSharedMenu(new URL(url).hash, baseRecipes);

    expect(shared.servings).toBe(2);
    expect(shared.customRecipes).toEqual([customRecipe]);
    expect(shared.menu.Lunes).toEqual({ desayuno: "base", comida: null, colacion: null, cena: "custom" });
  });

  it("rechaza enlaces con un formato inválido", () => {
    expect(() => readSharedMenu("#menu=no-es-base64", baseRecipes)).toThrow("no es válido");
  });
});
