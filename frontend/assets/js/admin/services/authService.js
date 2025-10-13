// ==========================================
// AUTH-SERVICE.JS - Servicio de Autenticación
// ==========================================

import { CONFIG, ROUTES } from "../config.js";

class AuthService {
  constructor() {
    this.token = null;
  }

  initToken() {
    this.token = localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
    return this.token;
  }

  getToken() {
    return this.token || this.initToken();
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN, token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
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

      return true;
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      this.clearToken();
      this.redirectToLogin();
      return false;
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
