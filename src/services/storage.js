import { STORAGE_VERSION } from "../domain/constants.js";
import { normalizeMenu } from "../domain/menu.js";

const KEY = "grimorio_state_v3";
const LEGACY_KEY = "menu_modular_semanal_v2";
const DATABASE = "grimorio";
const STORE = "state";

export function defaultState(recipes) {
  return {
    version: STORAGE_VERSION,
    menu: normalizeMenu(null, recipes),
    customRecipes: [],
    favorites: [],
    checkedShoppingItems: [],
    servings: 1,
  };
}

export function parseState(value, baseRecipes) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("El archivo debe contener un objeto.");
  if (value.version === STORAGE_VERSION)
    return {
      ...defaultState(baseRecipes),
      ...value,
      menu: normalizeMenu(value.menu, [
        ...baseRecipes,
        ...(Array.isArray(value.customRecipes) ? value.customRecipes : []),
      ]),
      customRecipes: Array.isArray(value.customRecipes) ? value.customRecipes : [],
      favorites: Array.isArray(value.favorites) ? value.favorites : [],
      checkedShoppingItems: Array.isArray(value.checkedShoppingItems)
        ? value.checkedShoppingItems.filter((item) => typeof item === "string")
        : [],
    };
  return { ...defaultState(baseRecipes), menu: normalizeMenu(value.menu ?? value, baseRecipes) };
}

function openDatabase() {
  if (!("indexedDB" in globalThis)) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readIndexedState() {
  const database = await openDatabase();
  if (!database) return null;
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE).objectStore(STORE).get(KEY);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function loadState(baseRecipes) {
  try {
    const indexed = await readIndexedState();
    if (indexed) return parseState(indexed, baseRecipes);
    const current = localStorage.getItem(KEY);
    if (current) return parseState(JSON.parse(current), baseRecipes);
    const legacy = localStorage.getItem(LEGACY_KEY);
    return legacy ? parseState(JSON.parse(legacy), baseRecipes) : defaultState(baseRecipes);
  } catch {
    return defaultState(baseRecipes);
  }
}

export async function saveState(state) {
  const value = { ...state, version: STORAGE_VERSION };
  localStorage.setItem(KEY, JSON.stringify(value));
  try {
    const database = await openDatabase();
    if (!database) return;
    await new Promise((resolve, reject) => {
      const request = database.transaction(STORE, "readwrite").objectStore(STORE).put(value, KEY);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });
  } catch {
    /* localStorage remains a safe fallback */
  }
}
export function exportState(state) {
  return JSON.stringify({ ...state, version: STORAGE_VERSION }, null, 2);
}
