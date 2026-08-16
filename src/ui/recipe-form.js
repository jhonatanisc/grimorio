import { MEALS, PROTEINS } from "../domain/constants.js";

export function renderRecipeForm(form, recipe, equivalences) {
  const ingredientOptions = Object.entries(equivalences)
    .sort((a, b) => a[1].name.localeCompare(b[1].name, "es"))
    .map(([id, item]) => `<option value="${id}">${item.name}</option>`)
    .join("");
  form.innerHTML = `
    <label class="wide"><span>Nombre</span><input class="input" name="name" required value="${escapeHtml(recipe?.name ?? "")}"></label>
    <fieldset class="wide"><legend>Tiempos</legend><div class="check-grid">${MEALS.map(({ key, label }) => `<label><input type="checkbox" name="mealTypes" value="${key}" ${recipe?.mealTypes.includes(key) ? "checked" : ""}>${label}</label>`).join("")}</div></fieldset>
    <label><span>Proteína</span><select class="select" name="proteinType">${PROTEINS.map((x) => `<option ${recipe?.proteinTypes.includes(x) ? "selected" : ""}>${x}</option>`).join("")}</select></label>
    <label><span>Preparación (min)</span><input class="input" name="prepTime" type="number" min="0" value="${recipe?.prepTime ?? 20}"></label>
    <label><span>Velocidad</span><select class="select" name="speed">${["super-rapida", "normal", "elaborada"].map((x) => `<option ${recipe?.speed === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
    <label><span>Tipo</span><select class="select" name="heaviness">${["ligera", "intermedia", "pesada"].map((x) => `<option ${recipe?.heaviness === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
    <label class="wide"><span>Ingredientes (uno por línea: id | porciones)</span><textarea class="input" name="ingredients" rows="6" list="ingredientIds">${recipe?.ingredients.map((x) => `${x.ingredientId} | ${x.portions}`).join("\n") ?? ""}</textarea><datalist id="ingredientIds">${ingredientOptions}</datalist></label>
    <label class="wide"><span>Preparación (un paso por línea)</span><textarea class="input" name="instructions" rows="6">${recipe?.instructions.join("\n") ?? ""}</textarea></label>`;
}

export function readRecipeForm(form, id) {
  const data = new FormData(form);
  return {
    id,
    name: String(data.get("name")).trim(),
    mealTypes: data.getAll("mealTypes"),
    proteinTypes: [String(data.get("proteinType"))],
    prepTime: Number(data.get("prepTime")),
    speed: String(data.get("speed")),
    heaviness: String(data.get("heaviness")),
    ingredients: String(data.get("ingredients"))
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [ingredientId, portions = "1"] = line.split("|");
        return { ingredientId: ingredientId.trim(), portions: Number(portions.trim()) };
      }),
    instructions: String(data.get("instructions"))
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean),
  };
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
