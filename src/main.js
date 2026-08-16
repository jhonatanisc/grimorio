import "./styles/base.css";
import "./styles/redesign.css";
import baseRecipes from "../data/recipes.json";
import equivalences from "../data/equivalences.json";
import { DAYS, MEALS, PROTEINS } from "./domain/constants.js";
import { assignRecipe, createEmptyMenu, fillMenu, removeRecipe } from "./domain/menu.js";
import { filterRecipes, makeRecipeId, validateRecipe } from "./domain/recipes.js";
import {
  collectShoppingItems,
  formatQuantity,
  normalizePortion,
  shoppingListText,
} from "./domain/shopping-list.js";
import { exportState, loadState, parseState, saveState } from "./services/storage.js";
import { createDrawer } from "./ui/drawer.js";
import { readRecipeForm, renderRecipeForm } from "./ui/recipe-form.js";
import { recipeManagerTemplate, renderManagerList } from "./ui/recipe-manager.js";

const $ = (selector) => document.querySelector(selector);
const elements = {
  schedule: $("#schedule"),
  recipeList: $("#recipeList"),
  search: $("#searchInput"),
  type: $("#typeFilter"),
  tags: $("#tagFilters"),
  hint: $("#selectedHint"),
  mobileDays: $("#mobileDays"),
  toast: $("#toast"),
  undo: $("#undoBtn"),
  form: $("#recipeForm"),
  textarea: $("#jsonBox"),
  clearSearch: $("#clearSearchBtn"),
};
const drawer = createDrawer({
  drawer: $("#drawer"),
  backdrop: $("#backdrop"),
  title: $("#drawerTitle"),
  text: $("#drawerText"),
  textarea: elements.textarea,
  form: elements.form,
  primary: $("#drawerPrimary"),
  secondary: $("#drawerSecondary"),
  close: $("#drawerClose"),
});

let state = await loadState(baseRecipes);
let selectedSlot = null;
let activeProtein = "all";
let mobileDay = 0;
let undoState = null;
const recipes = () => [
  ...new Map(
    [...baseRecipes, ...state.customRecipes].map((recipe) => [recipe.id, recipe]),
  ).values(),
];
const byId = (id) => recipes().find((recipe) => recipe.id === id);
const ingredientName = ({ ingredientId }) => equivalences[ingredientId]?.name ?? ingredientId;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function notify(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => elements.toast.classList.remove("show"), 2200);
}
function commit(message) {
  saveState(state);
  notify(message);
  render();
}
function snapshot() {
  undoState = structuredClone(state);
  elements.undo.classList.remove("hidden");
}

function render() {
  renderDays();
  renderSchedule();
  renderFilters();
  renderRecipes();
}
function renderDays() {
  elements.mobileDays.innerHTML = DAYS.map(
    (day, index) =>
      `<button class="day-tab" role="tab" aria-selected="${index === mobileDay}" data-day-index="${index}">${day}</button>`,
  ).join("");
  elements.mobileDays.querySelectorAll("button").forEach(
    (button) =>
      (button.onclick = () => {
        mobileDay = Number(button.dataset.dayIndex);
        renderDays();
        renderSchedule();
      }),
  );
}
function renderSchedule() {
  const mobile = matchMedia("(max-width:1100px)").matches;
  elements.schedule.innerHTML =
    '<div class="head-cell">Tiempo</div>' +
    DAYS.map(
      (day, index) =>
        `<div class="head-cell ${mobile && index !== mobileDay ? "hidden-mobile-day" : ""}">${day}</div>`,
    ).join("");
  for (const meal of MEALS) {
    elements.schedule.insertAdjacentHTML(
      "beforeend",
      `<div class="cell meal-cell ${meal.key}">${meal.label}</div>`,
    );
    DAYS.forEach((day, index) => {
      const recipe = byId(state.menu[day][meal.key]);
      const selected = selectedSlot?.day === day && selectedSlot?.meal === meal.key;
      const body = recipe
        ? `<span class="slot-title">${escapeHtml(recipe.name)}</span><span class="tag-row">${recipe.proteinTypes.map((x) => `<span class="tag">${escapeHtml(x)}</span>`).join("")}</span><span class="slot-tools"><button data-action="random" aria-label="Cambiar receta">↻</button><button data-action="remove" aria-label="Quitar receta">✕</button></span>`
        : `<span>+ Agregar</span><small>${meal.label}</small>`;
      elements.schedule.insertAdjacentHTML(
        "beforeend",
        `<div class="cell ${mobile && index !== mobileDay ? "hidden-mobile-day" : ""}"><button class="slot ${selected ? "selected" : ""}" data-day="${day}" data-meal="${meal.key}" aria-label="${recipe ? escapeHtml(recipe.name) : `Agregar ${meal.label} del ${day}`}">${body}</button></div>`,
      );
    });
  }
  elements.schedule.querySelectorAll(".slot").forEach(
    (slot) =>
      (slot.onclick = (event) => {
        const action = event.target.closest("[data-action]")?.dataset.action;
        const { day, meal } = slot.dataset;
        if (action) {
          event.stopPropagation();
          snapshot();
          if (action === "remove") state.menu = removeRecipe(state.menu, day, meal);
          else {
            const pool = recipes().filter((r) => r.mealTypes.includes(meal));
            const recipe = pool[Math.floor(Math.random() * pool.length)];
            if (recipe) state.menu = assignRecipe(state.menu, day, meal, recipe);
          }
          commit(action === "remove" ? "Receta eliminada" : "Receta cambiada");
          return;
        }
        selectedSlot = { day, meal };
        elements.type.value = meal;
        elements.hint.textContent = `Seleccionado: ${day} · ${MEALS.find((x) => x.key === meal).label}`;
        renderSchedule();
        renderRecipes();
        elements.recipeList.querySelector("[data-assign]")?.focus();
      }),
  );
}
function renderFilters() {
  const options = ["all", "favoritas", ...PROTEINS];
  elements.tags.innerHTML = options
    .map(
      (tag) =>
        `<button class="chip ${activeProtein === tag ? "active" : ""}" data-protein="${tag}">${tag === "all" ? "Todas" : tag === "favoritas" ? "★ Favoritas" : tag.replace("sin-proteina", "sin proteína")}</button>`,
    )
    .join("");
  elements.tags.querySelectorAll("button").forEach(
    (button) =>
      (button.onclick = () => {
        activeProtein = button.dataset.protein;
        renderFilters();
        renderRecipes();
      }),
  );
}
function renderRecipes() {
  const filtered = filterRecipes(recipes(), {
    query: elements.search.value,
    meal: elements.type.value,
    protein: activeProtein,
    favorites: state.favorites,
  });
  elements.recipeList.innerHTML =
    filtered
      .map(
        (recipe) =>
          `<article class="recipe-card"><div class="recipe-top"><span class="recipe-title">${escapeHtml(recipe.name)}</span><button class="btn compact favorite" data-favorite="${recipe.id}" aria-label="${state.favorites.includes(recipe.id) ? "Quitar de favoritas" : "Marcar favorita"}">${state.favorites.includes(recipe.id) ? "★" : "☆"}</button></div><div class="recipe-ingredients">${recipe.ingredients.slice(0, 5).map(ingredientName).map(escapeHtml).join(" · ")}</div><div class="tag-row">${recipe.proteinTypes.map((x) => `<span class="tag">${escapeHtml(x)}</span>`).join("")}</div><div class="card-actions"><button class="btn compact" data-preview="${recipe.id}">Ver</button><button class="btn compact primary" data-assign="${recipe.id}">Asignar</button><button class="btn compact" data-edit="${recipe.id}">Editar</button>${recipe.id.startsWith("custom-") ? `<button class="btn compact danger" data-delete="${recipe.id}">Eliminar</button>` : ""}</div></article>`,
      )
      .join("") || "<p>No hay recetas que coincidan.</p>";
  elements.recipeList.querySelectorAll("[data-favorite]").forEach(
    (button) =>
      (button.onclick = () => {
        const id = button.dataset.favorite;
        state.favorites = state.favorites.includes(id)
          ? state.favorites.filter((x) => x !== id)
          : [...state.favorites, id];
        commit("Favoritas actualizadas");
      }),
  );
  elements.recipeList
    .querySelectorAll("[data-preview]")
    .forEach((button) => (button.onclick = () => previewRecipe(button.dataset.preview)));
  elements.recipeList
    .querySelectorAll("[data-assign]")
    .forEach((button) => (button.onclick = () => assign(button.dataset.assign)));
  elements.recipeList
    .querySelectorAll("[data-edit]")
    .forEach((button) => (button.onclick = () => openRecipeForm(byId(button.dataset.edit))));
  elements.recipeList
    .querySelectorAll("[data-delete]")
    .forEach((button) => (button.onclick = () => deleteRecipe(button.dataset.delete)));
}
function assign(id) {
  const recipe = byId(id);
  if (!selectedSlot) {
    selectedSlot = { day: DAYS[mobileDay], meal: recipe.mealTypes[0] };
  }
  try {
    snapshot();
    state.menu = assignRecipe(state.menu, selectedSlot.day, selectedSlot.meal, recipe);
    commit("Receta asignada");
  } catch (error) {
    notify(error.message);
  }
}
function previewRecipe(id) {
  const recipe = byId(id);
  drawer.show({
    heading: recipe.name,
    content: `<p><strong>${recipe.prepTime} min · ${escapeHtml(recipe.speed)} · ${escapeHtml(recipe.heaviness)}</strong></p><h3>Ingredientes</h3><ul>${recipe.ingredients
      .map((x) => {
        const portion = normalizePortion(equivalences[x.ingredientId]?.portion);
        return `<li>${escapeHtml(ingredientName(x))}: ${formatQuantity(x.portions * portion.amount)} × ${escapeHtml(portion.unit)}</li>`;
      })
      .join(
        "",
      )}</ul><h3>Preparación</h3><ol>${recipe.instructions.map((x) => `<li>${escapeHtml(x)}</li>`).join("") || "<li>Sin instrucciones.</li>"}</ol>`,
    primaryLabel: "Asignar",
    onPrimary: () => {
      assign(id);
      drawer.hide();
    },
  });
}
function openRecipeForm(source = null, duplicate = false, onSaved = null) {
  renderRecipeForm(elements.form, source, equivalences);
  const existing = source && !duplicate ? source.id : null;
  drawer.show({
    heading: existing ? "Editar receta" : duplicate ? "Duplicar receta" : "Nueva receta",
    mode: "form",
    primaryLabel: "Guardar",
    onPrimary: () => {
      if (!elements.form.reportValidity()) return;
      const name = elements.form.elements.name.value;
      const id =
        existing ??
        makeRecipeId(
          name,
          recipes().map((x) => x.id),
        );
      const recipe = readRecipeForm(elements.form, id);
      const result = validateRecipe(recipe, equivalences);
      if (!result.valid) {
        notify(result.errors[0]);
        return;
      }
      snapshot();
      const alreadyCustomized = state.customRecipes.some((item) => item.id === id);
      state.customRecipes = alreadyCustomized
        ? state.customRecipes.map((item) => (item.id === id ? recipe : item))
        : [...state.customRecipes, recipe];
      commit("Receta guardada");
      drawer.hide();
      onSaved?.();
    },
  });
}

function restoreRecipe(id) {
  const original = baseRecipes.find((recipe) => recipe.id === id);
  if (!original || !confirm("¿Restaurar la versión incluida de esta receta?")) return;
  snapshot();
  state.customRecipes = state.customRecipes.filter((recipe) => recipe.id !== id);
  commit("Receta restaurada");
  openRecipeManager();
}

function openRecipeManager() {
  drawer.show({
    heading: "Mis recetas",
    variant: "wide",
    content: recipeManagerTemplate(),
    primaryLabel: "+ Nueva receta",
    onPrimary: () => openRecipeForm(null, false, openRecipeManager),
  });
  const search = $("#managerSearch");
  const meal = $("#managerMeal");
  const origin = $("#managerOrigin");
  const list = $("#managerList");
  const count = $("#managerCount");
  const refresh = () => {
    const customizedIds = new Set(state.customRecipes.map((recipe) => recipe.id));
    const query = search.value.trim().toLocaleLowerCase("es");
    const filtered = recipes().filter((recipe) => {
      const text = [recipe.name, ...recipe.proteinTypes].join(" ").toLocaleLowerCase("es");
      const custom = customizedIds.has(recipe.id);
      return (
        (!query || text.includes(query)) &&
        (meal.value === "all" || recipe.mealTypes.includes(meal.value)) &&
        (origin.value === "all" || (origin.value === "custom" ? custom : !custom))
      );
    });
    count.textContent = `${filtered.length} de ${recipes().length} recetas`;
    renderManagerList(list, filtered, customizedIds, state.favorites);
    list
      .querySelectorAll("[data-manager-preview]")
      .forEach((button) => (button.onclick = () => previewRecipe(button.dataset.managerPreview)));
    list
      .querySelectorAll("[data-manager-edit]")
      .forEach(
        (button) =>
          (button.onclick = () =>
            openRecipeForm(byId(button.dataset.managerEdit), false, openRecipeManager)),
      );
    list
      .querySelectorAll("[data-manager-duplicate]")
      .forEach(
        (button) =>
          (button.onclick = () =>
            openRecipeForm(byId(button.dataset.managerDuplicate), true, openRecipeManager)),
      );
    list
      .querySelectorAll("[data-manager-restore]")
      .forEach((button) => (button.onclick = () => restoreRecipe(button.dataset.managerRestore)));
    list.querySelectorAll("[data-manager-delete]").forEach((button) => {
      button.onclick = () => {
        deleteRecipe(button.dataset.managerDelete);
        openRecipeManager();
      };
    });
  };
  search.oninput = refresh;
  meal.onchange = refresh;
  origin.onchange = refresh;
  refresh();
  search.focus();
}
function deleteRecipe(id) {
  if (!confirm("¿Eliminar esta receta personalizada?")) return;
  snapshot();
  state.customRecipes = state.customRecipes.filter((x) => x.id !== id);
  state.favorites = state.favorites.filter((x) => x !== id);
  for (const day of DAYS)
    for (const { key } of MEALS) if (state.menu[day][key] === id) state.menu[day][key] = null;
  commit("Receta eliminada");
}
function openShopping() {
  const items = collectShoppingItems(state.menu, recipes(), equivalences, state.servings);
  const grouped = Object.groupBy(items, (item) => item.category);
  drawer.show({
    heading: "Lista de compras",
    variant: "wide",
    content: `<div class="shopping-toolbar"><div><p class="shopping-lead">Todo lo necesario para el ritual semanal, con el origen de cada ingrediente.</p><strong>${items.length} ingredientes · ${items.reduce((total, item) => total + item.usages.length, 0)} usos programados</strong></div><div class="shopping-toolbar-actions"><button class="btn compact" id="shoppingToggleAll" type="button">Mostrar detalles</button><label><span>Multiplicador de porciones</span><input id="servingsInput" class="input" type="number" min="0.5" step="0.5" value="${state.servings}"></label></div></div><div class="shopping-categories">${
      Object.entries(grouped)
        .map(
          ([category, list]) =>
            `<section class="shopping-group"><div class="shopping-category-head"><h3>${escapeHtml(category.replaceAll("-", " "))}</h3><span>${list.length} ingredientes</span></div><div class="shopping-grid">${list
              .map(
                (item) =>
                  `<details class="shopping-item"><summary class="shopping-item-head"><span class="shopping-check"><input type="checkbox" data-shopping-check aria-label="Marcar ${escapeHtml(item.name)} como comprado"><strong>${escapeHtml(item.name)}</strong></span><span class="shopping-summary-tools"><span class="quantity-badge">${formatQuantity(item.quantity)} × ${escapeHtml(item.unit)}</span><span class="accordion-chevron" aria-hidden="true">⌄</span></span></summary><ul class="shopping-usages">${item.usages
                    .map(
                      (usage) =>
                        `<li><span class="usage-date">${escapeHtml(usage.day)} · ${escapeHtml(MEALS.find(({ key }) => key === usage.meal)?.label ?? usage.meal)}</span><span>${escapeHtml(usage.recipeName)}</span><small>${formatQuantity(usage.quantity)} × ${escapeHtml(item.unit)}</small></li>`,
                    )
                    .join("")}</ul></details>`,
              )
              .join("")}</div></section>`,
        )
        .join("") || "<p>No hay recetas programadas.</p>"
    }</div>`,
    primaryLabel: "Copiar",
    onPrimary: () => copyText(shoppingListText(items)),
  });
  $("#servingsInput").onchange = (event) => {
    state.servings = Math.max(0.5, Number(event.target.value) || 1);
    saveState(state);
    openShopping();
  };
  $("#shoppingToggleAll").onclick = (event) => {
    const details = [...document.querySelectorAll(".shopping-item")];
    const shouldOpen = details.some((item) => !item.open);
    details.forEach((item) => (item.open = shouldOpen));
    event.currentTarget.textContent = shouldOpen ? "Ocultar detalles" : "Mostrar detalles";
  };
  document.querySelectorAll("[data-shopping-check]").forEach((checkbox) => {
    checkbox.onclick = (event) => event.stopPropagation();
  });
}
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    notify("Copiado al portapapeles");
    drawer.hide();
  } catch {
    elements.textarea.value = text;
    elements.textarea.classList.remove("hidden");
    elements.textarea.select();
    notify("Selecciona el texto y cópialo manualmente");
  }
}
function openJson(heading, value, onImport = null) {
  elements.textarea.value = value;
  drawer.show({
    heading,
    content: onImport
      ? "Pega un respaldo generado por Grimorio."
      : "Copia este respaldo para conservar menú y recetas.",
    mode: "json",
    primaryLabel: onImport ? "Importar" : "Copiar",
    onPrimary: () => {
      if (!onImport) {
        copyText(elements.textarea.value);
        return;
      }
      try {
        const next = parseState(JSON.parse(elements.textarea.value), baseRecipes);
        for (const recipe of next.customRecipes) {
          const result = validateRecipe(recipe, equivalences);
          if (!result.valid) throw new Error(result.errors[0]);
        }
        snapshot();
        state = next;
        commit("Respaldo importado");
        drawer.hide();
      } catch (error) {
        notify(`No se pudo importar: ${error.message}`);
      }
    },
  });
}

$("#autoFillBtn").onclick = () => {
  snapshot();
  state.menu = fillMenu(recipes());
  commit("Semana creada");
};
$("#shoppingBtn").onclick = openShopping;
$("#newRecipeBtn").onclick = () => openRecipeForm();
$("#recipesBtn").onclick = openRecipeManager;
$("#exportBtn").onclick = () => openJson("Exportar Grimorio", exportState(state));
$("#importBtn").onclick = () => openJson("Importar Grimorio", "", true);
$("#clearBtn").onclick = () => {
  if (confirm("¿Limpiar todo el menú semanal?")) {
    snapshot();
    state.menu = createEmptyMenu();
    selectedSlot = null;
    commit("Menú limpio");
  }
};
elements.undo.onclick = () => {
  if (undoState) {
    const current = state;
    state = undoState;
    undoState = current;
    commit("Cambio deshecho");
  }
};
elements.search.oninput = () => {
  elements.clearSearch.classList.toggle("hidden", !elements.search.value);
  renderRecipes();
};
elements.clearSearch.onclick = () => {
  elements.search.value = "";
  elements.clearSearch.classList.add("hidden");
  renderRecipes();
  elements.search.focus();
};
elements.type.onchange = renderRecipes;
addEventListener("resize", renderSchedule);

if ("serviceWorker" in navigator)
  addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
render();
