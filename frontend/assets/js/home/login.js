import { initFormToggle } from "../utils/toggle.js";

document.addEventListener("DOMContentLoaded", () => {
  initFormToggle();
});

const API_URL = "http://localhost:4000/api";

// Rutas relativas desde views/login.html
const ROUTES = {
  ADMIN_DASHBOARD: "./dashboard-admin.html",
  STUDENT_DASHBOARD: "./dashboard-student.html",
  LOGIN: "./login.html",
  HOME: "../index.html",
};

// ==========================================
// VERIFICAR SI YA ESTÁ AUTENTICADO (SOLO PARA LOGIN)
// ==========================================
function checkExistingAuth() {
  // Verificar si estamos en la página de login
  const isLoginPage =
    window.location.pathname.includes("login.html") ||
    window.location.pathname.endsWith("/views/") ||
    window.location.pathname.endsWith("/views");

  if (!isLoginPage) {
    return false;
  }

  const adminToken = localStorage.getItem("adminToken");
  const studentToken = localStorage.getItem("studentToken");

  if (adminToken) {
    window.location.href = ROUTES.ADMIN_DASHBOARD;
    return true;
  } else if (studentToken) {
    window.location.href = ROUTES.STUDENT_DASHBOARD;
    return true;
  }
  return false;
}

// ==========================================
// FUNCIONES DE NOTIFICACIÓN
// ==========================================
function showNotification(message, type = "error") {
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class='bx ${
      type === "success" ? "bx-check-circle" : "bx-error-circle"
    }'></i>
    <span>${message}</span>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 100);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 4000);
}

function showLoading(button, show = true) {
  if (show) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Cargando...';
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
  }
}

// ==========================================
// MANEJO DEL FORMULARIO DE LOGIN
// ==========================================
const loginForm = document.querySelector(".form-box.login form");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const submitBtn = loginForm.querySelector(".btn");

    // Validaciones
    if (!email || !password) {
      showNotification("Por favor completa todos los campos", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification("Por favor ingresa un email válido", "error");
      return;
    }

    showLoading(submitBtn);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification(`¡Bienvenido ${data.user.nombre}!`, "success");

        // Guardar token y datos del usuario
        const userData = {
          id: data.user.id,
          nombre: data.user.nombre,
          email: data.user.email,
          rol: data.user.rol,
        };

        if (data.user.rol === "admin") {
          localStorage.setItem("adminToken", data.token);
          localStorage.setItem("adminData", JSON.stringify(userData));

          setTimeout(() => {
            window.location.href = ROUTES.ADMIN_DASHBOARD;
          }, 1000);
        } else {
          localStorage.setItem("studentToken", data.token);
          localStorage.setItem("studentData", JSON.stringify(userData));

          setTimeout(() => {
            window.location.href = ROUTES.STUDENT_DASHBOARD;
          }, 1000);
        }
      } else {
        showNotification(data.message || "Credenciales incorrectas", "error");
        showLoading(submitBtn, false);
      }
    } catch (error) {
      console.error("❌ Error en login:", error);
      showNotification(
        "Error de conexión. Verifica que el servidor esté corriendo en el puerto 4000.",
        "error"
      );
      showLoading(submitBtn, false);
    }
  });
}

// ==========================================
// MANEJO DEL FORMULARIO DE REGISTRO
// ==========================================
const registerForm = document.querySelector(".form-box.register form");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    const registrationCode = document
      .getElementById("register-code")
      .value.trim()
      .toUpperCase();
    const submitBtn = registerForm.querySelector(".btn");

    // Validaciones
    if (!nombre || !email || !password || !registrationCode) {
      showNotification("Por favor completa todos los campos", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification("Por favor ingresa un email válido", "error");
      return;
    }

    if (password.length < 6) {
      showNotification(
        "La contraseña debe tener al menos 6 caracteres",
        "error"
      );
      return;
    }

    if (!registrationCode.startsWith("STHELA-")) {
      showNotification(
        "El código debe tener el formato STHELA-XXXX-XXXX",
        "error"
      );
      return;
    }

    showLoading(submitBtn);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre, email, password, registrationCode }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification("¡Registro exitoso! Redirigiendo...", "success");

        localStorage.setItem("studentToken", data.token);
        localStorage.setItem(
          "studentData",
          JSON.stringify({
            id: data.user.id,
            nombre: data.user.nombre,
            email: data.user.email,
            rol: data.user.rol,
          })
        );

        registerForm.reset();

        setTimeout(() => {
          window.location.href = ROUTES.STUDENT_DASHBOARD;
        }, 1500);
      } else {
        showNotification(data.message || "Error al registrarse", "error");
        showLoading(submitBtn, false);
      }
    } catch (error) {
      console.error("❌ Error en registro:", error);
      showNotification(
        "Error de conexión. Verifica que el servidor esté corriendo en el puerto 4000.",
        "error"
      );
      showLoading(submitBtn, false);
    }
  });
}

// ==========================================
// FUNCIONES AUXILIARES (solo para login/register)
// ==========================================
const registerCodeInput = document.getElementById("register-code");
if (registerCodeInput) {
  registerCodeInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase();
  });
}

document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.target.closest("form");
      if (form) {
        form.dispatchEvent(new Event("submit"));
      }
    }
  });
});

document.querySelectorAll('input[type="email"]').forEach((input) => {
  input.addEventListener("blur", (e) => {
    e.target.value = e.target.value.trim();
  });

  input.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\s/g, "");
  });
});

document.querySelectorAll(".input-box i.bx-lock-alt").forEach((icon) => {
  icon.style.cursor = "pointer";
  icon.addEventListener("click", () => {
    const input = icon.previousElementSibling;
    if (input && input.tagName === "INPUT") {
      if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("bx-lock-alt");
        icon.classList.add("bx-lock-open-alt");
      } else {
        input.type = "password";
        icon.classList.remove("bx-lock-open-alt");
        icon.classList.add("bx-lock-alt");
      }
    }
  });
});

document.querySelectorAll(".input-box input").forEach((input) => {
  input.addEventListener("focus", () => {
    input.parentElement.classList.add("focused");
  });

  input.addEventListener("blur", () => {
    if (!input.value) {
      input.parentElement.classList.remove("focused");
    }
  });

  if (input.value) {
    input.parentElement.classList.add("focused");
  }
});

// Solo verificar autenticación si estamos en la página de login
checkExistingAuth();
