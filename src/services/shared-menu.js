import { normalizeMenu } from "../domain/menu.js";

export const SHARED_MENU_VERSION = 1;
const MAX_PAYLOAD_LENGTH = 12_000;

function encode(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decode(value) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(base64);
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0))));
}

function usedRecipeIds(menu) {
  return new Set(Object.values(menu).flatMap((day) => Object.values(day)).filter(Boolean));
}

export function createSharedMenu(state) {
  const referenced = usedRecipeIds(state.menu);
  return {
    version: SHARED_MENU_VERSION,
    menu: state.menu,
    servings: state.servings,
    customRecipes: state.customRecipes.filter((recipe) => referenced.has(recipe.id)),
  };
}

export function createSharedMenuUrl(state, currentUrl = window.location.href) {
  const url = new URL(currentUrl);
  url.hash = `menu=${encode(createSharedMenu(state))}`;
  if (url.href.length > MAX_PAYLOAD_LENGTH)
    throw new Error("Este menú es demasiado grande para compartirlo por enlace.");
  return url.href;
}

export function readSharedMenu(hash, baseRecipes) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const encoded = params.get("menu");
  if (!encoded) return null;
  if (encoded.length > MAX_PAYLOAD_LENGTH) throw new Error("El enlace compartido es demasiado grande.");
  let payload;
  try {
    payload = decode(encoded);
  } catch {
    throw new Error("El enlace compartido no es válido.");
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    payload.version !== SHARED_MENU_VERSION ||
    !payload.menu ||
    typeof payload.menu !== "object" ||
    Array.isArray(payload.menu)
  )
    throw new Error("El enlace usa un formato de menú no compatible.");
  if (!Array.isArray(payload.customRecipes)) throw new Error("Las recetas compartidas no son válidas.");
  if (!Number.isFinite(payload.servings) || payload.servings < 0.5)
    throw new Error("Las porciones compartidas no son válidas.");
  const recipeIds = new Set();
  for (const recipe of payload.customRecipes) {
    if (!recipe?.id || recipeIds.has(recipe.id)) throw new Error("Las recetas compartidas no son válidas.");
    recipeIds.add(recipe.id);
  }
  return {
    ...payload,
    menu: normalizeMenu(payload.menu, [...baseRecipes, ...payload.customRecipes]),
  };
}
