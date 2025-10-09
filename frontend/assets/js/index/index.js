import { initFormToggle } from "../utils/toggle.js";

document.addEventListener("DOMContentLoaded", () => {
  initFormToggle();
});

//-------------------------------------------
// ==========================================
// INDEX.JS - Login y Registro
// ==========================================

const API_URL = "http://localhost:4000/api";

// ==========================================
// VERIFICAR SI YA ESTÁ AUTENTICADO
// ==========================================
function checkExistingAuth() {
  const adminToken = localStorage.getItem("adminToken");
  const studentToken = localStorage.getItem("studentToken");

  if (adminToken) {
    window.location.href = "./views/dashboard-admin.html";
  } else if (studentToken) {
    window.location.href = "./views/dashboard-student.html";
  }
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

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const submitBtn = loginForm.querySelector(".btn");

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

      if (data.user.rol === "admin") {
        localStorage.setItem("adminToken", data.token);
        setTimeout(() => {
          window.location.href = "./views/dashboard-admin.html";
        }, 1000);
      } else {
        localStorage.setItem("studentToken", data.token);
        setTimeout(() => {
          window.location.href = "./views/dashboard-student.html";
        }, 1000);
      }
    } else {
      showNotification(data.message || "Credenciales incorrectas", "error");
      showLoading(submitBtn, false);
    }
  } catch (error) {
    console.error("Error en login:", error);
    showNotification(
      "Error de conexión. Verifica que el servidor esté corriendo.",
      "error"
    );
    showLoading(submitBtn, false);
  }
});

// ==========================================
// MANEJO DEL FORMULARIO DE REGISTRO
// ==========================================
const registerForm = document.querySelector(".form-box.register form");

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
    showNotification("La contraseña debe tener al menos 6 caracteres", "error");
    return;
  }

  if (!registrationCode.startsWith("CCED-")) {
    showNotification("El código debe tener el formato CCED-XXXX-XXXX", "error");
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
      registerForm.reset();

      setTimeout(() => {
        window.location.href = "./views/dashboard-student.html";
      }, 1500);
    } else {
      showNotification(data.message || "Error al registrarse", "error");
      showLoading(submitBtn, false);
    }
  } catch (error) {
    console.error("Error en registro:", error);
    showNotification(
      "Error de conexión. Verifica que el servidor esté corriendo.",
      "error"
    );
    showLoading(submitBtn, false);
  }
});

// ==========================================
// CONVERTIR CÓDIGO A MAYÚSCULAS
// ==========================================
document.getElementById("register-code").addEventListener("input", (e) => {
  e.target.value = e.target.value.toUpperCase();
});

// ==========================================
// MANEJO DE TECLA ENTER
// ==========================================
document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.target.form.dispatchEvent(new Event("submit"));
    }
  });
});

// ==========================================
// PREVENIR ESPACIOS EN EMAILS
// ==========================================
document.querySelectorAll('input[type="email"]').forEach((input) => {
  input.addEventListener("blur", (e) => {
    e.target.value = e.target.value.trim();
  });
});

// ==========================================
// MOSTRAR/OCULTAR CONTRASEÑA
// ==========================================
document.querySelectorAll(".input-box i.bx-lock-alt").forEach((icon) => {
  icon.style.cursor = "pointer";
  icon.addEventListener("click", () => {
    const input = icon.previousElementSibling;
    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("bx-lock-alt");
      icon.classList.add("bx-lock-open-alt");
    } else {
      input.type = "password";
      icon.classList.remove("bx-lock-open-alt");
      icon.classList.add("bx-lock-alt");
    }
  });
});

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  checkExistingAuth();

  document.querySelectorAll(".input-box input").forEach((input) => {
    input.addEventListener("focus", () => {
      input.parentElement.classList.add("focused");
    });

    input.addEventListener("blur", () => {
      if (!input.value) {
        input.parentElement.classList.remove("focused");
      }
    });
  });

  console.log("🚀 Sistema CCED Coin cargado correctamente");
  console.log("📡 API URL:", API_URL);
});
