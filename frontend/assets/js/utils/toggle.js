export function initFormToggle(containerClass = ".container") {
  const container = document.querySelector(containerClass);

  if (!container) {
    console.warn(`Contenedor ${containerClass} no encontrado`);
    return;
  }

  const registerBtn = container.querySelector(".register-btn");
  const loginBtn = container.querySelector(".login-btn");

  if (registerBtn) {
    registerBtn.addEventListener("click", () => {
      container.classList.add("active");
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      container.classList.remove("active");
    });
  }
}
