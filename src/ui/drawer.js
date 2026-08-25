let previousFocus;

export function createDrawer(elements) {
  const { drawer, backdrop, title, text, textarea, form, primary, secondary, close } = elements;
  let onDismiss = () => {};
  function hide() {
    drawer.hidden = true;
    backdrop.hidden = true;
    drawer.classList.remove("drawer-wide");
    form.classList.add("hidden");
    textarea.classList.add("hidden");
    previousFocus?.focus();
  }
  function show({
    heading,
    content = "",
    mode = "content",
    variant = "default",
    primaryLabel = "Aceptar",
    secondaryLabel = "Cerrar",
    onPrimary = hide,
    onSecondary = hide,
    onDismiss: dismiss = () => {},
  }) {
    previousFocus = document.activeElement;
    title.textContent = heading;
    text.innerHTML = content;
    textarea.classList.toggle("hidden", mode !== "json");
    form.classList.toggle("hidden", mode !== "form");
    primary.classList.toggle("hidden", !primaryLabel);
    primary.textContent = primaryLabel ?? "";
    secondary.textContent = secondaryLabel;
    primary.onclick = (event) => {
      event.preventDefault();
      onPrimary();
    };
    onDismiss = dismiss;
    secondary.onclick = (event) => {
      event.preventDefault();
      onSecondary();
    };
    drawer.classList.toggle("drawer-wide", variant === "wide");
    drawer.hidden = false;
    backdrop.hidden = false;
    close.focus();
  }
  const dismiss = () => {
    onDismiss();
    hide();
  };
  close.onclick = dismiss;
  backdrop.onclick = dismiss;
  drawer.addEventListener("keydown", (event) => {
    if (event.key === "Escape") dismiss();
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
