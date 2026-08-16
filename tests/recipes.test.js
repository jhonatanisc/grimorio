import { describe, expect, it } from "vitest";
import { filterRecipes, makeRecipeId, validateRecipe } from "../src/domain/recipes.js";

const recipes = [
  {
    id: "uno",
    name: "Tacos de pollo",
    mealTypes: ["comida"],
    proteinTypes: ["pollo"],
    prepTime: 20,
    speed: "normal",
    heaviness: "intermedia",
    ingredients: [{ ingredientId: "pollo", portions: 2 }],
    instructions: [],
  },
];
const equivalences = {
  pollo: { name: "Pollo", category: "proteína", portion: "100 g", includeInShoppingList: true },
};

describe("recetas", () => {
  it("filtra por texto, tiempo y proteína", () => {
    expect(
      filterRecipes(recipes, { query: "tacos", meal: "comida", protein: "pollo" }),
    ).toHaveLength(1);
    expect(filterRecipes(recipes, { query: "atún" })).toHaveLength(0);
  });
  it("valida contratos en tiempo de ejecución", () => {
    expect(validateRecipe(recipes[0], equivalences).valid).toBe(true);
    expect(validateRecipe({ ...recipes[0], ingredients: [] }, equivalences).valid).toBe(false);
  });
  it("genera identificadores únicos", () =>
    expect(makeRecipeId("Tacos mágicos", ["custom-tacos-magicos"])).toBe("custom-tacos-magicos-2"));
});
