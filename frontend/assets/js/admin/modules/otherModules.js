// ==========================================
// OTHER-MODULES.JS - Módulos Adicionales
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";

// ==========================================
// MÓDULO DE EXÁMENES
// ==========================================
class ExamenesModule {
  render() {
    const content = `
      <div class="space-y-6">
        <div class="bg-white p-4 rounded-xl shadow-lg flex justify-between items-center">
          <h2 class="text-lg font-semibold text-slate-700">Gestión de Exámenes</h2>
          <button class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-2 text-sm">
            <i data-lucide="file-plus" class="w-4 h-4"></i>
            Nuevo Examen
          </button>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-lg">
          <div class="text-center py-12">
            <i data-lucide="file-text" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>
            <p class="text-slate-400 mb-2">Función en desarrollo</p>
            <p class="text-sm text-slate-500">Pronto podrás gestionar exámenes aquí</p>
          </div>
        </div>
      </div>
    `;
    uiService.updateMainContent(content);
  }
}

// ==========================================
// MÓDULO DE MONEDAS
// ==========================================
class MonedasModule {
  render() {
    const content = `
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-xl shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-slate-500 text-sm">Total en Circulación</p>
                <p class="text-2xl font-bold text-amber-600" id="totalCoins">0</p>
              </div>
              <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <i data-lucide="coins" class="w-6 h-6 text-amber-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-slate-500 text-sm">Promedio por Estudiante</p>
                <p class="text-2xl font-bold text-sky-600" id="avgCoins">0</p>
              </div>
              <div class="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                <i data-lucide="trending-up" class="w-6 h-6 text-sky-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-slate-500 text-sm">Transacciones Hoy</p>
                <p class="text-2xl font-bold text-emerald-600" id="todayTransactions">0</p>
              </div>
              <div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <i data-lucide="arrow-right-left" class="w-6 h-6 text-emerald-600"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-lg">
          <h3 class="text-lg font-semibold text-slate-700 mb-4">Gestión de Monedas</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button class="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-sky-500 hover:bg-sky-50 transition-colors">
              <i data-lucide="plus-circle" class="w-8 h-8 mx-auto mb-2 text-sky-600"></i>
              <p class="text-sm font-medium text-slate-600">Agregar Monedas</p>
            </button>
            <button class="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors">
              <i data-lucide="minus-circle" class="w-8 h-8 mx-auto mb-2 text-red-600"></i>
              <p class="text-sm font-medium text-slate-600">Retirar Monedas</p>
            </button>
            <button class="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
              <i data-lucide="history" class="w-8 h-8 mx-auto mb-2 text-purple-600"></i>
              <p class="text-sm font-medium text-slate-600">Historial</p>
            </button>
          </div>
        </div>
      </div>
    `;
    uiService.updateMainContent(content);
    this.loadStats();
  }

  async loadStats() {
    try {
      const data = await apiService.getStatistics();

      if (data.success) {
        const stats = data.statistics;
        const totalCoinsEl = document.getElementById("totalCoins");
        const avgCoinsEl = document.getElementById("avgCoins");

        if (totalCoinsEl) {
          totalCoinsEl.textContent = (
            Number(stats.monedas_circulacion) || 0
          ).toFixed(0);
        }

        if (avgCoinsEl) {
          const avg =
            stats.total_estudiantes > 0
              ? (stats.monedas_circulacion / stats.total_estudiantes).toFixed(0)
              : 0;
          avgCoinsEl.textContent = avg;
        }
      }
    } catch (error) {
      console.error("Error cargando estadísticas de monedas:", error);
    }
  }
}

// ==========================================
// MÓDULO DE RANKINGS
// ==========================================
class RankingsModule {
  render() {
    const content = `
      <div class="space-y-6">
        <div class="bg-white p-6 rounded-xl shadow-lg">
          <h2 class="text-xl font-semibold text-slate-700 mb-6">Top 10 Estudiantes</h2>
          <div id="rankingsList" class="space-y-3">
            <div class="text-center py-8">
              <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin text-slate-400"></i>
              <p class="text-slate-400">Cargando ranking...</p>
            </div>
          </div>
        </div>
      </div>
    `;
    uiService.updateMainContent(content);
    this.loadData();
  }

  async loadData() {
    try {
      const data = await apiService.getStudents();
      const container = document.getElementById("rankingsList");

      if (!container) return;

      if (data.success && data.students.length > 0) {
        const top10 = data.students.slice(0, 10);

        container.innerHTML = top10
          .map((student, index) => this.createRankingRow(student, index))
          .join("");

        lucide.createIcons();
      }
    } catch (error) {
      console.error("Error cargando rankings:", error);
    }
  }

  createRankingRow(student, index) {
    const medalClass =
      index < 3
        ? "bg-gradient-to-br from-amber-400 to-amber-600"
        : "bg-slate-300";

    return `
      <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full ${medalClass} flex items-center justify-center text-white font-bold">
            ${index + 1}
          </div>
          <div>
            <p class="font-semibold text-slate-800">${student.nombre}</p>
            <p class="text-sm text-slate-500">${student.email}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="flex items-center text-amber-600 font-bold">
            <i data-lucide="coins" class="w-4 h-4 mr-1"></i>
            ${student.balance}
          </p>
          <p class="text-sm text-slate-500">${
            student.tareas_completadas
          } tareas</p>
        </div>
      </div>
    `;
  }
}

// ==========================================
// MÓDULO DE REPORTES
// ==========================================
class ReportesModule {
  render() {
    const content = `
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white p-6 rounded-xl shadow-lg">
            <h3 class="text-lg font-semibold text-slate-700 mb-4">Generar Reporte</h3>
            <div class="space-y-3">
              <button class="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-sky-500 hover:bg-sky-50 transition-colors text-left">
                <i data-lucide="file-text" class="w-5 h-5 inline mr-2 text-sky-600"></i>
                <span class="font-medium">Reporte de Estudiantes</span>
              </button>
              <button class="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left">
                <i data-lucide="clipboard-check" class="w-5 h-5 inline mr-2 text-emerald-600"></i>
                <span class="font-medium">Reporte de Tareas</span>
              </button>
              <button class="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors text-left">
                <i data-lucide="coins" class="w-5 h-5 inline mr-2 text-amber-600"></i>
                <span class="font-medium">Reporte de Monedas</span>
              </button>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl shadow-lg">
            <h3 class="text-lg font-semibold text-slate-700 mb-4">Últimos Reportes</h3>
            <div class="text-center py-12">
              <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-2 text-slate-300"></i>
              <p class="text-slate-400">No hay reportes generados</p>
            </div>
          </div>
        </div>
      </div>
    `;
    uiService.updateMainContent(content);
  }
}

// ==========================================
// EXPORTAR MÓDULOS
// ==========================================
export const examenesModule = new ExamenesModule();
export const monedasModule = new MonedasModule();
export const rankingsModule = new RankingsModule();
export const reportesModule = new ReportesModule();
