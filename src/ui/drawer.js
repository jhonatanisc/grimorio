let previousFocus;

export function createDrawer(elements) {
  const { drawer, backdrop, title, text, textarea, form, primary, secondary, close } = elements;
  function hide() {
    drawer.hidden = true;
    backdrop.hidden = true;
    form.classList.add("hidden");
    textarea.classList.add("hidden");
    previousFocus?.focus();
  }
  function show({
    heading,
    content = "",
    mode = "content",
    primaryLabel = "Aceptar",
    onPrimary = hide,
  }) {
    previousFocus = document.activeElement;
    title.textContent = heading;
    text.innerHTML = content;
    textarea.classList.toggle("hidden", mode !== "json");
    form.classList.toggle("hidden", mode !== "form");
    primary.textContent = primaryLabel;
    primary.onclick = (event) => {
      event.preventDefault();
      onPrimary();
    };
    drawer.hidden = false;
    backdrop.hidden = false;
    close.focus();
  }
  close.onclick = hide;
  secondary.onclick = hide;
  backdrop.onclick = hide;
  drawer.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hide();
    if (event.key === "Tab") {
      const controls = [...drawer.querySelectorAll("button,input,select,textarea")].filter(
        (el) => !el.disabled && !el.closest(".hidden"),
      );
      const first = controls[0],
        last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  return { show, hide };
}
