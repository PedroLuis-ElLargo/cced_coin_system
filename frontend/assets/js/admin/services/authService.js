// ==========================================
// AUTH-SERVICE.JS - Servicio de Autenticación
// ==========================================

import { CONFIG, ROUTES } from "../config.js";

class AuthService {
  constructor() {
    this.token = null;
    this.userData = null;
  }

  initToken() {
    this.token = localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN);

    // Cargar datos del usuario
    const userDataStr = localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_DATA);
    if (userDataStr) {
      try {
        this.userData = JSON.parse(userDataStr);
      } catch (e) {
        console.error("Error parseando userData:", e);
        this.userData = null;
      }
    }

    return this.token;
  }

  getToken() {
    return this.token || this.initToken();
  }

  getUserData() {
    if (!this.userData) {
      this.initToken();
    }
    return this.userData;
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN, token);
  }

  clearToken() {
    this.token = null;
    this.userData = null;
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ADMIN_DATA);
  }

  async verifyAuth() {
    const token = this.getToken();

    if (!token) {
      this.redirectToLogin();
      return false;
    }

    try {
      const response = await fetch(`${CONFIG.API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!data.success || data.user.rol !== "admin") {
        this.clearToken();
        this.redirectToLogin();
        return false;
      }

      // Actualizar datos del usuario si es necesario
      if (!this.userData) {
        this.userData = data.user;
        localStorage.setItem(
          CONFIG.STORAGE_KEYS.ADMIN_DATA,
          JSON.stringify(data.user)
        );
      }

      // Mostrar nombre del usuario en el header
      this.updateUserInterface();

      return true;
    } catch (error) {
      console.error("❌ Error verificando autenticación:", error);
      this.clearToken();
      this.redirectToLogin();
      return false;
    }
  }

  updateUserInterface() {
    // Actualizar nombre del usuario en el header
    const nameElements = document.querySelectorAll("[data-user-name]");
    if (this.userData && nameElements.length > 0) {
      nameElements.forEach((element) => {
        element.textContent = this.userData.nombre || "Admin";
      });
    }
  }

  redirectToLogin() {
    window.location.href = ROUTES.LOGIN;
  }

  logout() {
    this.clearToken();
    window.location.href = ROUTES.HOME;
  }
}

export default new AuthService();
