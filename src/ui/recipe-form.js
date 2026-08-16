import { MEALS, PROTEINS } from "../domain/constants.js";

export function renderRecipeForm(form, recipe, equivalences) {
  const ingredientOptions = Object.entries(equivalences)
    .sort((a, b) => a[1].name.localeCompare(b[1].name, "es"))
    .map(([id, item]) => ({ id, name: item.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  form.innerHTML = `
    <label class="wide"><span>Nombre</span><input class="input" name="name" required value="${escapeHtml(recipe?.name ?? "")}"></label>
    <fieldset class="wide"><legend>Tiempos</legend><div class="check-grid">${MEALS.map(({ key, label }) => `<label><input type="checkbox" name="mealTypes" value="${key}" ${recipe?.mealTypes.includes(key) ? "checked" : ""}>${label}</label>`).join("")}</div></fieldset>
    <label><span>Proteína</span><select class="select" name="proteinType">${PROTEINS.map((x) => `<option ${recipe?.proteinTypes.includes(x) ? "selected" : ""}>${x}</option>`).join("")}</select></label>
    <label><span>Preparación (min)</span><input class="input" name="prepTime" type="number" min="0" value="${recipe?.prepTime ?? 20}"></label>
    <label><span>Velocidad</span><select class="select" name="speed">${["super-rapida", "normal", "elaborada"].map((x) => `<option ${recipe?.speed === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
    <label><span>Tipo</span><select class="select" name="heaviness">${["ligera", "intermedia", "pesada"].map((x) => `<option ${recipe?.heaviness === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
    <fieldset class="wide ingredient-editor"><legend>Ingredientes</legend><p class="field-help">Selecciona un ingrediente y ajusta sus porciones. No necesitas escribir nombres ni identificadores.</p><div id="ingredientRows"></div><button class="btn compact" type="button" id="addIngredientBtn">+ Añadir ingrediente</button></fieldset>
    <label class="wide"><span>Preparación (un paso por línea)</span><textarea class="input" name="instructions" rows="6" placeholder="Mezclar los ingredientes…">${recipe?.instructions.join("\n") ?? ""}</textarea></label>`;

  const rows = form.querySelector("#ingredientRows");
  const addRow = (ingredient = { ingredientId: ingredientOptions[0]?.id, portions: 1 }) => {
    const row = document.createElement("div");
    row.className = "ingredient-row";
    row.innerHTML = `<label><span>Ingrediente</span><select class="select" data-ingredient required>${ingredientOptions.map(({ id, name }) => `<option value="${id}" ${id === ingredient.ingredientId ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select></label><label><span>Porciones</span><input class="input" data-portions type="number" min="0.25" step="0.25" value="${ingredient.portions}" required></label><button class="btn compact danger" type="button" aria-label="Quitar ingrediente">Quitar</button>`;
    row.querySelector("button").onclick = () => {
      row.remove();
      rows.dispatchEvent(new Event("change", { bubbles: true }));
    };
    rows.append(row);
  };
  if (recipe?.ingredients?.length) recipe.ingredients.forEach(addRow);
  else addRow();
  form.querySelector("#addIngredientBtn").onclick = () => {
    addRow();
    rows.lastElementChild.querySelector("select").focus();
  };
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
    ingredients: [...form.querySelectorAll(".ingredient-row")].map((row) => ({
      ingredientId: row.querySelector("[data-ingredient]").value,
      portions: Number(row.querySelector("[data-portions]").value),
    })),
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
