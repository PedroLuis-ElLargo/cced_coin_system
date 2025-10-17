// ==========================================
// APP.JS - Aplicación Principal (Punto de Entrada)
// ==========================================

import authService from "./services/authService.js";
import navigationModule from "./core/navigationModule.js";
import dashboardModule from "./modules/dashboardModule.js";
import modalHandler from "./core/modalHandler.js";
import uiInteractions from "./core/uiInteractions.js";
import studentsModule from "./modules/studentsModule.js";
import tasksModule from "./modules/tasksModule.js";
import codesModule from "./modules/codesModule.js";
import monedasModule from "./modules/monedasModule.js";
import { examenesModule } from "./modules/examenesModule.js";

class App {
  constructor() {
    this.isInitialized = false;
  }

  async init() {
    try {
      // Inicializar iconos de Lucide
      lucide.createIcons();

      // Inicializar token de autenticación
      authService.initToken();

      // Verificar autenticación
      const isAuthenticated = await authService.verifyAuth();

      if (!isAuthenticated) {
        return; // El servicio de auth redirigirá al login
      }

      // Guardar HTML original del dashboard
      dashboardModule.saveDashboardHTML();

      // Inicializar módulos
      this.initializeModules();

      // Configurar logout
      this.setupLogout();

      // Cargar dashboard inicial
      await dashboardModule.loadStats();

      // Exponer módulos globalmente para eventos onclick en HTML
      this.exposeGlobalMethods();

      this.isInitialized = true;
    } catch (error) {
      console.error("❌ Error inicializando aplicación:", error);
    }
  }

  initializeModules() {
    // Inicializar navegación
    navigationModule.init();

    // Inicializar interacciones de UI
    uiInteractions.init();

    // Inicializar modales
    modalHandler.init();
  }

  setupLogout() {
    // Configurar todos los botones de logout
    const logoutButtons = document.querySelectorAll(
      "[data-logout], #logoutButton"
    );

    logoutButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        authService.logout();
      });
    });
  }

  exposeGlobalMethods() {
    // Exponer módulos necesarios para onclick handlers
    window.studentsModule = studentsModule;
    window.tasksModule = tasksModule;
    window.codesModule = codesModule;
    window.monedasModule = monedasModule;
    window.examenesModule = examenesModule;

    // Exponer navegación
    window.navigateTo = (section) => navigationModule.navigateTo(section);

    // Exponer logout
    window.logout = () => authService.logout();
  }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
const app = new App();

document.addEventListener("DOMContentLoaded", () => {
  app.init();
});

export default app;
