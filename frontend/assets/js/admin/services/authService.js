// ==========================================
// AUTH-SERVICE.JS - Servicio de Autenticación
// ==========================================

import { CONFIG, ROUTES } from "../config.js";

class AuthService {
  constructor() {
    this.token = null;
    this.userData = null;
    this.timeoutId = null;
    this.warningTimeoutId = null;
    this.boundActivityHandler = this.handleUserActivity.bind(this);
  }

  initSessionMonitoring() {
    // Eventos para detectar actividad del usuario
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, this.boundActivityHandler);
    });
    
    // Iniciar monitoreo de sesión
    this.resetSessionTimer();
  }

  stopSessionMonitoring() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.removeEventListener(event, this.boundActivityHandler);
    });
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }
  }

  handleUserActivity() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
    this.resetSessionTimer();
  }

  resetSessionTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
    }

    // Configurar advertencia de sesión por expirar
    this.warningTimeoutId = setTimeout(() => {
      this.showSessionWarning();
    }, CONFIG.SESSION_TIMEOUT - CONFIG.TIMEOUT_WARNING);

    // Configurar cierre de sesión
    this.timeoutId = setTimeout(() => {
      this.handleSessionTimeout();
    }, CONFIG.SESSION_TIMEOUT);
  }

  showSessionWarning() {
    const remainingTime = Math.round(CONFIG.TIMEOUT_WARNING / 1000 / 60);
    const warning = document.createElement('div');
    warning.id = 'session-warning';
    warning.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            ¡Advertencia de Sesión!
          </h3>
          <p class="text-gray-600 mb-6">
            Su sesión expirará en ${remainingTime} minuto(s). ¿Desea mantener la sesión activa?
          </p>
          <div class="flex justify-end space-x-4">
            <button onclick="authService.handleSessionTimeout()" class="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cerrar Sesión
            </button>
            <button onclick="authService.resetSessionTimer(); document.getElementById('session-warning').remove();" 
                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Mantener Sesión
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(warning);
  }

  handleSessionTimeout() {
    this.stopSessionMonitoring();
    this.clearToken();
    this.redirectToLogin();
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
    localStorage.removeItem(CONFIG.STORAGE_KEYS.LAST_ACTIVITY);
    this.stopSessionMonitoring();
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

      // Iniciar monitoreo de sesión
      this.initSessionMonitoring();

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
