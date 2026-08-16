import { MEALS } from "../domain/constants.js";

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function recipeManagerTemplate() {
  return `<section class="recipe-manager" aria-labelledby="recipeManagerHelp">
    <p id="recipeManagerHelp" class="shopping-lead">Busca, filtra y administra el catálogo. Las recetas incluidas pueden personalizarse y restaurarse.</p>
    <div class="manager-toolbar">
      <label><span>Buscar receta</span><input class="input" id="managerSearch" type="search" placeholder="Nombre o proteína…" autocomplete="off"></label>
      <label><span>Tiempo de comida</span><select class="select" id="managerMeal"><option value="all">Todos</option>${MEALS.map(({ key, label }) => `<option value="${key}">${label}</option>`).join("")}</select></label>
      <label><span>Origen</span><select class="select" id="managerOrigin"><option value="all">Todas</option><option value="custom">Personalizadas</option><option value="base">Incluidas</option></select></label>
    </div>
    <p class="manager-count" id="managerCount" role="status" aria-live="polite"></p>
    <div class="manager-list" id="managerList"></div>
  </section>`;
}

export function renderManagerList(container, recipes, customizedIds, favorites) {
  container.innerHTML =
    recipes
      .map((recipe) => {
        const customized = customizedIds.has(recipe.id);
        const isNew = recipe.id.startsWith("custom-");
        return `<article class="manager-card">
        <div><div class="manager-card-title"><h3>${escapeHtml(recipe.name)}</h3>${favorites.includes(recipe.id) ? '<span aria-label="Favorita" title="Favorita">★</span>' : ""}</div><p>${recipe.mealTypes.map((meal) => MEALS.find(({ key }) => key === meal)?.label ?? meal).join(" · ")} · ${recipe.prepTime} min</p><div class="tag-row">${recipe.proteinTypes.map((protein) => `<span class="tag">${escapeHtml(protein)}</span>`).join("")}</div></div>
        <div class="manager-card-actions">
          <span class="origin-badge ${customized ? "custom" : ""}">${customized ? (isNew ? "Personal" : "Personalizada") : "Incluida"}</span>
          <button class="btn compact" data-manager-preview="${escapeHtml(recipe.id)}">Ver</button>
          <button class="btn compact primary" data-manager-edit="${escapeHtml(recipe.id)}">Editar</button>
          ${customized && !isNew ? `<button class="btn compact" data-manager-restore="${escapeHtml(recipe.id)}">Restaurar</button>` : ""}
          ${isNew ? `<button class="btn compact danger" data-manager-delete="${escapeHtml(recipe.id)}">Eliminar</button>` : ""}
        </div>
      </article>`;
      })
      .join("") || '<p class="manager-empty">No hay recetas que coincidan con los filtros.</p>';
}
