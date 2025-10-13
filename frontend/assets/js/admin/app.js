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

      // Cargar dashboard inicial
      await dashboardModule.loadStats();

      // Exponer módulos globalmente para eventos onclick en HTML
      this.exposeGlobalMethods();

      this.isInitialized = true;

      console.log("✅ Aplicación inicializada correctamente");
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

  exposeGlobalMethods() {
    // Exponer módulos necesarios para onclick handlers
    window.studentsModule = studentsModule;
    window.tasksModule = tasksModule;
    window.codesModule = codesModule;

    // Exponer navegación
    window.navigateTo = (section) => navigationModule.navigateTo(section);
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
