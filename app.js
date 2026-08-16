const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MEALS = [
  { key: "desayuno", label: "Desayuno" },
  { key: "comida", label: "Comida" },
  { key: "colacion", label: "Colación" },
  { key: "cena", label: "Cena" },
];
const TAGS = ["pollo", "pavo", "res", "cerdo", "atun", "pescado", "huevo", "queso", "vegetal", "sin-proteina"];
const STORAGE_KEY = "menu_modular_semanal_v2";
const LEGACY_NAMES = {
  "des-001":"Huevo a la Mexicana", "des-002":"Chilaquiles verdes con pollo",
  "des-003":"Huevos rancheros con frijoles", "des-004":"Quesadillas de atún tipo marlin",
  "des-006":"Omelette de pollo y calabacita con cebolla", "des-007":"Bowl de huevo",
  "des-008":"Sándwich de atún y aguacate", "des-009":"Enfrijoladas de queso fresco",
  "des-010":"Pollo con brócoli en airfryer", "com-001":"Tacos de tilapia con aguacate y col",
  "com-002":"Flautas de pollo en airfryer", "com-003":"Ensalada de coditos",
  "com-004":"Arrachera en salsa de jitomate con chile poblano", "com-005":"Brochetas de pescado",
  "com-006":"Pollo a la piña", "com-007":"Bistec adobado", "com-009":"Tacos de pechuga de pollo con guacamole y chayote",
  "com-010":"Albóndigas de carne", "col-001":"Batido con proteína", "col-002":"Avena cocida con manzana y pasitas",
  "col-003":"Toast de fresa, yogurt y crema de cacahuate", "col-004":"Galletas de avena y plátano",
  "col-005":"Ceviche de mango", "col-006":"Brochetas de primavera con dip dulce",
  "col-007":"Smoothie de fresa con avena y semillas de girasol", "col-008":"Yogurt con papaya",
  "cen-001":"Wrap de lechuga y atún", "cen-002":"Atún express con galleta salada",
  "cen-003":"Ensalada fresca de atún", "cen-004":"Teriyaki de soya y vegetales",
  "cen-006":"Tacos de tilapia con aguacate y col", "cen-007":"Claras de huevo con frijoles refritos caseros",
  "cen-008":"Sándwich de queso y espinaca + Jugo verde"
};

let RECIPES_DB = [], EQUIVALENCES = {}, weeklyMenu, selectedSlot = null, activeTag = "all", activeMobileDay = 0;
const byId = (id) => RECIPES_DB.find((recipe) => recipe.id === id);
const ingredientName = (item) => EQUIVALENCES[item.ingredientId]?.name || item.ingredientId;
const allowedInMeal = (recipe, meal) => recipe.mealTypes.includes(meal);
const displayType = (recipe) => recipe.mealTypes.includes("comida") ? "comida" : recipe.mealTypes.includes("colacion") ? "colacion" : "desayuno";

const scheduleEl = document.getElementById("schedule");
const recipeListEl = document.getElementById("recipeList");
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const tagFilters = document.getElementById("tagFilters");
const selectedHint = document.getElementById("selectedHint");
const drawer = document.getElementById("drawer");
const drawerTitle = document.getElementById("drawerTitle");
const drawerText = document.getElementById("drawerText");
const drawerPrimary = document.getElementById("drawerPrimary");
const drawerSecondary = document.getElementById("drawerSecondary");
const jsonBox = document.getElementById("jsonBox");
const mobileDays = document.getElementById("mobileDays");

function emptyMenu() {
  return Object.fromEntries(DAYS.map((day) => [day, Object.fromEntries(MEALS.map(({key}) => [key, null]))]));
}

function normalizeMenu(value, migrate = false) {
  const menu = emptyMenu();
  if (!value || typeof value !== "object" || Array.isArray(value)) return menu;
  DAYS.forEach((day) => MEALS.forEach(({key}) => {
    let id = value[day]?.[key];
    if (migrate && id && !byId(id) && LEGACY_NAMES[id]) {
      id = RECIPES_DB.find((recipe) => recipe.name.toLocaleLowerCase("es") === LEGACY_NAMES[id].toLocaleLowerCase("es"))?.id || null;
    }
    const recipe = byId(id);
    menu[day][key] = recipe && allowedInMeal(recipe, key) ? recipe.id : null;
  }));
  return menu;
}

function loadMenu() {
  try { return normalizeMenu(JSON.parse(localStorage.getItem(STORAGE_KEY)), true); }
  catch { return emptyMenu(); }
}
function saveMenu() { localStorage.setItem(STORAGE_KEY, JSON.stringify(weeklyMenu)); showToast("Menú guardado"); }
function typeColor(type) { return getComputedStyle(document.documentElement).getPropertyValue(`--${type}`).trim(); }
function labelTag(tag) { return tag === "sin-proteina" ? "sin proteína" : tag; }

function renderMobileDays() {
  mobileDays.innerHTML = DAYS.map((day,i) => `<button class="day-tab ${i===activeMobileDay?"active":""}" data-day-index="${i}">${day}</button>`).join("");
  mobileDays.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    activeMobileDay=Number(button.dataset.dayIndex); renderSchedule(); renderMobileDays();
  }));
}

function slotTemplate(day, meal, recipe) {
  const selected=selectedSlot?.day===day && selectedSlot?.meal===meal.key;
  if (!recipe) return `<div class="slot empty ${selected?"selected":""}" data-slot data-day="${day}" data-meal="${meal.key}"><span>+ Agregar</span><small>${meal.label}</small></div>`;
  const tags=recipe.proteinTypes.map((tag)=>`<span class="tag protein">${labelTag(tag)}</span>`).join("");
  return `<div class="slot slot-filled ${selected?"selected":""}" data-slot data-day="${day}" data-meal="${meal.key}" style="background:${typeColor(meal.key)}22;border-left:4px solid ${typeColor(meal.key)}"><div><div class="slot-title">${recipe.name}</div><div class="slot-tags">${tags}</div></div><div class="slot-tools"><button class="icon-only" title="Cambiar receta" aria-label="Cambiar receta" data-random data-day="${day}" data-meal="${meal.key}">↺</button><button class="icon-only danger" title="Quitar receta" aria-label="Quitar receta" data-remove data-day="${day}" data-meal="${meal.key}">✕</button></div></div>`;
}

function renderSchedule() {
  const mobile=matchMedia("(max-width: 980px)").matches;
  scheduleEl.innerHTML='<div class="head-cell">Tiempo</div>'+DAYS.map((day,i)=>`<div class="head-cell day-header ${mobile&&i!==activeMobileDay?"hidden-mobile-day":""}">${day}</div>`).join("");
  MEALS.forEach((meal)=>{
    scheduleEl.insertAdjacentHTML("beforeend",`<div class="cell meal-cell ${meal.key}">${meal.label}</div>`);
    DAYS.forEach((day,i)=>scheduleEl.insertAdjacentHTML("beforeend",`<div class="cell ${mobile&&i!==activeMobileDay?"hidden-mobile-day":""}">${slotTemplate(day,meal,byId(weeklyMenu[day][meal.key]))}</div>`));
  });
  scheduleEl.querySelectorAll("[data-slot]").forEach((el)=>el.addEventListener("click",()=>selectSlot(el.dataset.day,el.dataset.meal)));
  scheduleEl.querySelectorAll("[data-remove]").forEach((el)=>el.addEventListener("click",(event)=>{event.stopPropagation();weeklyMenu[el.dataset.day][el.dataset.meal]=null;saveMenu();renderSchedule();}));
  scheduleEl.querySelectorAll("[data-random]").forEach((el)=>el.addEventListener("click",(event)=>{event.stopPropagation();const r=randomRecipe(el.dataset.meal);if(r){weeklyMenu[el.dataset.day][el.dataset.meal]=r.id;saveMenu();renderSchedule();}}));
}

function selectSlot(day,meal) { selectedSlot={day,meal};typeFilter.value=meal;selectedHint.textContent=`Seleccionado: ${day} · ${MEALS.find((m)=>m.key===meal).label}`;renderSchedule();renderRecipes(); }
function renderTagFilters() {
  tagFilters.innerHTML=`<button class="chip ${activeTag==="all"?"active":""}" data-tag="all">Todas</button>`+TAGS.map((tag)=>`<button class="chip ${activeTag===tag?"active":""}" data-tag="${tag}">${labelTag(tag)}</button>`).join("");
  tagFilters.querySelectorAll("button").forEach((button)=>button.addEventListener("click",()=>{activeTag=button.dataset.tag;renderTagFilters();renderRecipes();}));
}

function renderRecipes() {
  const q=searchInput.value.trim().toLocaleLowerCase("es"), type=typeFilter.value;
  const filtered=RECIPES_DB.filter((r)=>{
    const blob=[r.name,...r.mealTypes,...r.proteinTypes,...r.ingredients.map(ingredientName)].join(" ").toLocaleLowerCase("es");
    return (type==="all"||r.mealTypes.includes(type))&&(activeTag==="all"||r.proteinTypes.includes(activeTag))&&(!q||blob.includes(q));
  });
  recipeListEl.innerHTML=filtered.map((r)=>`<article class="recipe-card"><div class="recipe-top"><div class="recipe-title">${r.name}</div><span class="type-dot" style="background:${typeColor(displayType(r))}"></span></div><div class="recipe-ingredients">${r.ingredients.slice(0,6).map(ingredientName).join(" · ")}</div><div class="tag-row">${r.proteinTypes.map((tag)=>`<span class="tag protein">${labelTag(tag)}</span>`).join("")}</div><div class="card-actions"><button class="mini-btn icon-only" title="Asignar receta" aria-label="Asignar receta" data-assign="${r.id}">＋</button><button class="mini-btn ghost icon-only" title="Vista rápida" aria-label="Vista rápida" data-preview="${r.id}">👁</button></div></article>`).join("")||'<div class="recipe-card"><strong>No encontré recetas.</strong><p class="panel-sub">Prueba con otro filtro o búsqueda.</p></div>';
  recipeListEl.querySelectorAll("[data-assign]").forEach((el)=>el.addEventListener("click",()=>assignRecipe(el.dataset.assign)));
  recipeListEl.querySelectorAll("[data-preview]").forEach((el)=>el.addEventListener("click",()=>openRecipe(el.dataset.preview)));
}

function assignRecipe(id) {
  const recipe=byId(id); if(!recipe)return;
  if(!selectedSlot) selectedSlot={day:DAYS[activeMobileDay]||DAYS[0],meal:recipe.mealTypes[0]};
  if(!allowedInMeal(recipe,selectedSlot.meal)){showToast("Esta receta no corresponde a ese tiempo");return;}
  weeklyMenu[selectedSlot.day][selectedSlot.meal]=recipe.id;saveMenu();renderSchedule();
}
function openRecipe(id) {
  const r=byId(id);drawerTitle.textContent=r.name;
  const prep=r.instructions.length?`<section class="recipe-preparation"><strong>Preparación</strong><ol>${r.instructions.map((step)=>`<li>${step}</li>`).join("")}</ol></section>`:"";
  drawerText.innerHTML=`<strong>${r.mealTypes.map((x)=>x.toUpperCase()).join(" / ")}</strong><br>${r.ingredients.map(ingredientName).join(" · ")}<br><br>${r.prepTime} min · ${r.speed} · ${r.heaviness}${prep}`;
  jsonBox.style.display="none";drawerPrimary.textContent="Asignar al espacio seleccionado";drawerPrimary.onclick=()=>{assignRecipe(r.id);closeDrawer();};drawerSecondary.textContent="Cerrar";drawerSecondary.onclick=closeDrawer;drawer.classList.add("open");
}
function closeDrawer(){drawer.classList.remove("open");jsonBox.style.display="block";}
function randomRecipe(meal){const pool=RECIPES_DB.filter((r)=>allowedInMeal(r,meal));return pool[Math.floor(Math.random()*pool.length)];}
function autoFill(){DAYS.forEach((day)=>MEALS.forEach(({key})=>{const r=randomRecipe(key);weeklyMenu[day][key]=r?.id||null;}));saveMenu();renderSchedule();}

function shoppingItems(){
  const ids=new Set();DAYS.forEach((day)=>MEALS.forEach(({key})=>byId(weeklyMenu[day][key])?.ingredients.forEach(({ingredientId})=>{if(EQUIVALENCES[ingredientId]?.includeInShoppingList)ids.add(ingredientId);})));return [...ids].sort((a,b)=>ingredientName({ingredientId:a}).localeCompare(ingredientName({ingredientId:b}),"es"));
}
function groupBy(items, keyFor) {
  return items.reduce((groups, item) => {
    const key = keyFor(item);
    (groups[key] ||= []).push(item);
    return groups;
  }, {});
}
function buildShoppingList(){
  const grouped=groupBy(shoppingItems(),(id)=>EQUIVALENCES[id].category);
  const body=Object.entries(grouped).sort().map(([category,ids])=>`${category.replaceAll("-"," ").toUpperCase()}\n${ids.map((id)=>`☐ ${EQUIVALENCES[id].name}`).join("\n")}`).join("\n\n");
  return `GRIMORIO — LISTA DE COMPRAS\n\n${body||"No hay recetas programadas."}`;
}
async function copyText(text,message){try{await navigator.clipboard.writeText(text);showToast(message);}catch{showToast("No se pudo copiar; selecciona el texto manualmente");}}
function openShoppingList(){
  const grouped=groupBy(shoppingItems(),(id)=>EQUIVALENCES[id].category);drawerTitle.textContent="Lista de compras";
  drawerText.innerHTML=Object.entries(grouped).sort().map(([category,ids])=>`<section class="shopping-group"><strong>${category.replaceAll("-"," ")}</strong>${ids.map((id)=>`<label><input type="checkbox"> ${EQUIVALENCES[id].name}</label>`).join("")}</section>`).join("")||"No hay recetas programadas.";
  jsonBox.style.display="none";drawerPrimary.textContent="Copiar lista";drawerPrimary.onclick=()=>copyText(buildShoppingList(),"Lista de compras copiada");drawerSecondary.textContent="Cerrar";drawerSecondary.onclick=closeDrawer;drawer.classList.add("open");
}
function showToast(message){const toast=document.getElementById("toast");toast.textContent=message;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),1800);}
function exportJSON(){drawerTitle.textContent="Exportar planeación JSON";drawerText.textContent="Copia este JSON para respaldar o mover tu menú semanal.";jsonBox.style.display="block";jsonBox.value=JSON.stringify(weeklyMenu,null,2);drawerPrimary.textContent="Copiar";drawerPrimary.onclick=()=>copyText(jsonBox.value,"JSON copiado");drawerSecondary.textContent="Cerrar";drawerSecondary.onclick=closeDrawer;drawer.classList.add("open");}
function importJSON(){drawerTitle.textContent="Importar planeación JSON";drawerText.textContent="Pega una planeación compatible.";jsonBox.style.display="block";jsonBox.value="";drawerPrimary.textContent="Importar";drawerPrimary.onclick=()=>{try{const parsed=JSON.parse(jsonBox.value);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error();weeklyMenu=normalizeMenu(parsed);saveMenu();renderSchedule();closeDrawer();showToast("Planeación importada");}catch{alert("JSON inválido o incompatible");}};drawerSecondary.textContent="Cerrar";drawerSecondary.onclick=closeDrawer;drawer.classList.add("open");}

async function init(){
  try{[RECIPES_DB,EQUIVALENCES]=await Promise.all([fetch("data/recipes.json").then((r)=>{if(!r.ok)throw Error();return r.json();}),fetch("data/equivalences.json").then((r)=>{if(!r.ok)throw Error();return r.json();})]);}
  catch{recipeListEl.innerHTML='<div class="recipe-card"><strong>No se pudieron cargar las recetas.</strong><p class="panel-sub">Abre Grimorio desde un servidor estático.</p></div>';return;}
  weeklyMenu=loadMenu();saveMenu();renderMobileDays();renderTagFilters();renderSchedule();renderRecipes();
}
document.getElementById("autoFillBtn").addEventListener("click",autoFill);document.getElementById("shoppingBtn").addEventListener("click",openShoppingList);document.getElementById("exportBtn").addEventListener("click",exportJSON);document.getElementById("importBtn").addEventListener("click",importJSON);
document.getElementById("clearBtn").addEventListener("click",()=>{if(confirm("¿Limpiar todo el menú semanal?")){weeklyMenu=emptyMenu();saveMenu();selectedSlot=null;selectedHint.textContent="Toca un espacio para asignar una receta.";renderSchedule();}});
searchInput.addEventListener("input",renderRecipes);typeFilter.addEventListener("change",renderRecipes);addEventListener("resize",()=>{if(weeklyMenu){renderSchedule();renderMobileDays();}});init();
