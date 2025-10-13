// ==========================================
// DASHBOARD-MODULE.JS - Módulo Dashboard
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";
import chartService from "../services/chartService.js";
import { NOTIFICATION_TYPES } from "../config.js";

class DashboardModule {
  constructor() {
    this.dashboardHTML = null;
  }

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

    this.loadStats();
  }

  async loadStats() {
    try {
      await this.loadStatisticsCards();
      await this.loadRecentStudents();
      await this.loadCharts();
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
      uiService.showNotification(
        "Error al cargar estadísticas",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  async loadStatisticsCards() {
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
  }

  updateStatElement(dataAttr, value) {
    const element = document.querySelector(`[data-stat="${dataAttr}"]`);
    if (element) {
      element.textContent = value;
    }
  }

  async loadRecentStudents() {
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
  }

  async loadCharts() {
    const data = await apiService.getStudents();

    if (data.success && data.students.length > 0) {
      chartService.createCoinsDistributionChart(data.students);
      chartService.createTopStudentsChart(data.students);
    }
  }
}

export default new DashboardModule();
