// ==========================================
// DASHBOARD-MODULE.JS - Módulo Dashboard Optimizado
// Con Smart Refresh + Detección de Inactividad Mejorada
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";
import chartService from "../services/chartService.js";
import { NOTIFICATION_TYPES } from "../config.js";

class DashboardModule {
  constructor() {
    this.dashboardHTML = null;
    this.autoRefreshInterval = null;
    this.activityContainer = null;
    this.lastUserActivity = Date.now();
    this.isRefreshing = false;
    this.refreshFailures = 0;

    // Configuración de tiempos
    this.inactivityThreshold = 600000; // 10 minutos de inactividad
    this.refreshIntervalTime = 120000; // 2 minutos
    this.maxRefreshInterval = 600000; // 10 minutos máximo en backoff
    this.currentRefreshInterval = this.refreshIntervalTime;
  }

  // ==========================================
  // GESTIÓN DEL ESTADO DEL DASHBOARD
  // ==========================================

  saveDashboardHTML() {
    const mainContent = document.querySelector("main");
    if (mainContent) {
      const titleElement = mainContent.querySelector("h1");
      this.dashboardHTML = mainContent.innerHTML.replace(
        titleElement?.outerHTML || "",
        ""
      );
    }
  }

  render() {
    const mainContent = document.querySelector("main");

    if (this.dashboardHTML) {
      const titleElement = mainContent.querySelector("h1");
      const titleHTML = titleElement ? titleElement.outerHTML : "";
      mainContent.innerHTML = titleHTML + this.dashboardHTML;
      lucide.createIcons();
    }

    // Resetear contenedor cacheado
    this.activityContainer = null;

    this.loadStats();
    this.setupEventListeners();
    this.setupActivityDetection();
    this.setupAutoRefresh();
  }

  // ==========================================
  // DETECCIÓN DE ACTIVIDAD DEL USUARIO OPTIMIZADA
  // ==========================================

  setupActivityDetection() {
    const events = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "mousemove",
    ];
    let activityTimeout;

    const updateActivity = () => {
      // Debounce para evitar llamadas excesivas
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        this.lastUserActivity = Date.now();
      }, 100);
    };

    // Usar passive events para mejor performance
    const options = { passive: true, capture: true };
    events.forEach((event) => {
      document.addEventListener(event, updateActivity, options);
    });
  }

  isUserInactive() {
    const inactive =
      Date.now() - this.lastUserActivity > this.inactivityThreshold;
    return inactive;
  }

  // ==========================================
  // AUTO-REFRESH INTELIGENTE MEJORADO
  // ==========================================

  setupAutoRefresh() {
    // Limpiar interval previo si existe
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }

    // Auto-refresh con detección mejorada
    this.autoRefreshInterval = setInterval(() => {
      this.executeConditionalRefresh();
    }, this.currentRefreshInterval);

    const minutes = this.currentRefreshInterval / 60000;
    const inactivityMinutes = this.inactivityThreshold / 60000;
  }

  executeConditionalRefresh() {
    const shouldRefresh =
      document.visibilityState === "visible" &&
      !this.isUserInactive() &&
      !this.isRefreshing &&
      navigator.onLine;

    if (shouldRefresh) {
      this.smartRefresh();
    } else {
      if (!navigator.onLine) {
        console.log("📡 Sin conexión, omitiendo refresh");
      }
    }
  }

  async smartRefresh() {
    this.isRefreshing = true;

    try {
      // Solo refrescar datos esenciales (actividades recientes)
      await this.loadRecentActivities();
      this.refreshFailures = 0; // Resetear contador de fallos

      // Restaurar intervalo original si estaba en backoff
      if (this.currentRefreshInterval !== this.refreshIntervalTime) {
        this.currentRefreshInterval = this.refreshIntervalTime;
        this.setupAutoRefresh();
      }
    } catch (error) {
      console.warn("⚠️ Error en refresh automático:", error);
      this.handleRefreshError();
    } finally {
      this.isRefreshing = false;
    }
  }

  handleRefreshError() {
    this.refreshFailures++;

    // Exponential backoff para errores consecutivos
    const backoffTime = Math.min(
      this.refreshIntervalTime * Math.pow(1.5, this.refreshFailures),
      this.maxRefreshInterval
    );

    console.warn(
      `⏳ Backoff: ${backoffTime / 1000}s por ${
        this.refreshFailures
      } errores consecutivos`
    );

    if (backoffTime !== this.currentRefreshInterval) {
      this.currentRefreshInterval = backoffTime;
      this.setupAutoRefresh(); // Reconfigurar con nuevo intervalo
    }
  }

  adjustRefreshInterval(newInterval) {
    if (newInterval !== this.currentRefreshInterval) {
      this.currentRefreshInterval = newInterval;
      this.setupAutoRefresh();
    }
  }

  setupEventListeners() {
    // Botón de refresh manual
    const refreshBtn = document.getElementById("refreshActivities");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.lastUserActivity = Date.now(); // Resetear inactividad
        this.refreshActivities();
      });
    }
  }

  // ==========================================
  // CARGA DE ESTADÍSTICAS
  // ==========================================

  async loadStats() {
    try {
      await Promise.all([
        this.loadStatisticsCards(),
        this.loadRecentStudents(),
        this.loadRecentActivities(),
        this.loadCharts(),
      ]);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
      uiService.showNotification(
        "Error al cargar estadísticas",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  async loadStatisticsCards() {
    try {
      const data = await apiService.getStatistics();

      if (data.success) {
        const stats = data.statistics;

        this.updateStatElement("total-students", stats.total_estudiantes || 0);
        this.updateStatElement(
          "completed-tasks",
          stats.tareas_completadas_total || 0
        );
        this.updateStatElement("active-exams", stats.tareas_activas || 0);

        const monedas = parseFloat(stats.monedas_circulacion);
        this.updateStatElement(
          "total-coins",
          isNaN(monedas) ? 0 : monedas.toFixed(0)
        );
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  }

  updateStatElement(dataAttr, value) {
    const element = document.querySelector(`[data-stat="${dataAttr}"]`);
    if (element) {
      element.textContent = value;
    }
  }

  async loadRecentStudents() {
    try {
      const data = await apiService.getStudents();

      if (data.success && data.students.length > 0) {
        const tbody = document.querySelector("#recentStudentsTable tbody");
        if (!tbody) return;

        tbody.innerHTML = "";

        const recentStudents = data.students.slice(0, 5);

        recentStudents.forEach((student) => {
          const row = document.createElement("tr");
          row.className = "bg-white border-b hover:bg-slate-50";
          row.innerHTML = `
            <td class="px-4 py-3 font-medium text-slate-900">${student.nombre}</td>
            <td class="px-4 py-3">${student.email}</td>
            <td class="px-4 py-3">
              <span class="flex items-center text-amber-600">
                <i data-lucide="coins" class="w-4 h-4 mr-1"></i> ${student.balance}
              </span>
            </td>
            <td class="px-4 py-3">${student.tareas_completadas}</td>
          `;
          tbody.appendChild(row);
        });

        lucide.createIcons();
      }
    } catch (error) {
      console.error("Error cargando estudiantes recientes:", error);
    }
  }

  // ==========================================
  // ACTIVIDADES RECIENTES OPTIMIZADA
  // ==========================================

  async loadRecentActivities() {
    // Cachear contenedor para mejor performance
    if (!this.activityContainer) {
      this.activityContainer =
        document.querySelector("#activityList") ||
        document.querySelector(".lg\\:col-span-3 ul");
    }

    if (!this.activityContainer) {
      console.warn(
        "⚠️ Contenedor de actividades no encontrado, reintentando..."
      );
      setTimeout(() => this.loadRecentActivities(), 500);
      return;
    }

    try {
      // Mostrar loader optimizado
      this.showActivityLoader();

      const data = await apiService.getActividadesRecientes(15);

      if (!data.success || !data.actividades || data.actividades.length === 0) {
        this.showEmptyActivities();
        return;
      }

      // Renderizar actividades
      this.renderActivities(data.actividades);
    } catch (error) {
      console.error("❌ Error cargando actividades:", error);
      this.showActivityError(error);
    }
  }

  showActivityLoader() {
    if (this.activityContainer) {
      this.activityContainer.innerHTML = `
        <li class="flex items-center justify-center py-8">
          <i data-lucide="loader" class="w-8 h-8 animate-spin text-indigo-500"></i>
          <span class="ml-2 text-slate-500">Cargando actividades...</span>
        </li>
      `;
      lucide.createIcons();
    }
  }

  showEmptyActivities() {
    if (this.activityContainer) {
      this.activityContainer.innerHTML = `
        <li class="flex flex-col items-center justify-center py-12">
          <i data-lucide="activity" class="w-16 h-16 text-slate-300 mb-3"></i>
          <p class="text-slate-500 text-lg font-medium">No hay actividades recientes</p>
          <p class="text-slate-400 text-sm mt-2">Las actividades del sistema aparecerán aquí</p>
        </li>
      `;
      lucide.createIcons();
    }
  }

  renderActivities(actividades) {
    if (this.activityContainer) {
      this.activityContainer.innerHTML = actividades
        .map(
          (act) => `
        <li class="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-${act.color}-100 text-${act.color}-600 flex items-center justify-center">
            <i data-lucide="${act.icono}" class="w-5 h-5"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-slate-700 leading-relaxed">${act.titulo}</p>
            <p class="text-xs text-slate-400 mt-1">${act.tiempo_transcurrido}</p>
          </div>
        </li>
      `
        )
        .join("");

      lucide.createIcons();
    }
  }

  showActivityError(error) {
    if (this.activityContainer) {
      this.activityContainer.innerHTML = `
        <li class="flex flex-col items-center justify-center py-8">
          <i data-lucide="alert-circle" class="w-12 h-12 text-red-400 mb-3"></i>
          <p class="text-red-600 font-medium">Error al cargar actividades</p>
          <p class="text-slate-500 text-sm mt-2">${error.message}</p>
          <button 
            onclick="dashboardModule.refreshActivities()" 
            class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Reintentar
          </button>
        </li>
      `;
      lucide.createIcons();
    }
  }

  async refreshActivities() {
    const refreshBtn = document.getElementById("refreshActivities");

    // Deshabilitar botón temporalmente
    if (refreshBtn) {
      this.disableRefreshButton(refreshBtn);
    }

    // Resetear inactividad y recargar
    this.lastUserActivity = Date.now();
    await this.loadRecentActivities();

    // Rehabilitar botón
    if (refreshBtn) {
      setTimeout(() => {
        this.enableRefreshButton(refreshBtn);
      }, 1000);
    }
  }

  disableRefreshButton(button) {
    button.disabled = true;
    button.classList.add("opacity-50", "cursor-not-allowed");

    const icon = button.querySelector("i");
    if (icon) {
      icon.classList.add("animate-spin");
    }
  }

  enableRefreshButton(button) {
    button.disabled = false;
    button.classList.remove("opacity-50", "cursor-not-allowed");

    const icon = button.querySelector("i");
    if (icon) {
      icon.classList.remove("animate-spin");
    }
  }

  // ==========================================
  // GRÁFICOS
  // ==========================================

  async loadCharts() {
    try {
      const data = await apiService.getStudents();

      if (data.success && data.students.length > 0) {
        chartService.createCoinsDistributionChart(data.students);
        chartService.createTopStudentsChart(data.students);
      }
    } catch (error) {
      console.error("Error cargando gráficos:", error);
    }
  }

  // ==========================================
  // LIMPIEZA MEJORADA
  // ==========================================

  cleanup() {
    // Limpiar interval cuando se destruye el dashboard
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }

    // Limpiar referencias
    this.activityContainer = null;
    this.isRefreshing = false;
  }

  // ==========================================
  // ESTADO DEL SISTEMA (para debugging)
  // ==========================================

  getSystemStatus() {
    return {
      isRefreshing: this.isRefreshing,
      userInactive: this.isUserInactive(),
      tabVisible: document.visibilityState === "visible",
      online: navigator.onLine,
      refreshFailures: this.refreshFailures,
      currentInterval: this.currentRefreshInterval,
      timeSinceLastActivity: Date.now() - this.lastUserActivity,
    };
  }
}

// Exportar instancia única
const dashboardModule = new DashboardModule();

// Hacer accesible globalmente para el botón de reintentar
window.dashboardModule = dashboardModule;

export default dashboardModule;
