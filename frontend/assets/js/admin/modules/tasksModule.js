// ==========================================
// TASKS-MODULE.JS - Módulo de Tareas
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";
import { NOTIFICATION_TYPES } from "../config.js";

class TasksModule {
  render() {
    const content = `
      <div class="space-y-6">
        <div class="bg-white p-4 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="flex gap-2">
            <button class="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm">Todas</button>
            <button class="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm">Activas</button>
            <button class="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm">Completadas</button>
          </div>
          <button id="openNewTaskModal" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-2 text-sm">
            <i data-lucide="plus" class="w-4 h-4"></i>
            Nueva Tarea
          </button>
        </div>

        <div id="tasksGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="text-center py-12">
            <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin text-slate-400"></i>
            <p class="text-slate-400">Cargando tareas...</p>
          </div>
        </div>
      </div>
    `;

    uiService.updateMainContent(content);
    this.loadData();
  }

  async loadData() {
    try {
      const data = await apiService.getTasks();
      const grid = document.getElementById("tasksGrid");

      if (!grid) return;

      if (data.success && data.tasks && data.tasks.length > 0) {
        grid.innerHTML = data.tasks
          .map((task) => this.createTaskCard(task))
          .join("");
      } else {
        grid.innerHTML = `
          <div class="col-span-full text-center py-12">
            <i data-lucide="clipboard" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>
            <p class="text-slate-400">No hay tareas creadas</p>
          </div>
        `;
      }

      lucide.createIcons();
    } catch (error) {
      console.error("Error cargando tareas:", error);
      uiService.showNotification(
        "Error al cargar tareas",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  createTaskCard(task) {
    const statusClass =
      task.estado === "activo"
        ? "bg-green-100 text-green-700"
        : "bg-slate-100 text-slate-600";

    return `
      <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
        <div class="flex justify-between items-start mb-4">
          <h3 class="font-semibold text-slate-800 text-lg">${task.titulo}</h3>
          <span class="px-2 py-1 text-xs rounded-full ${statusClass}">
            ${task.estado}
          </span>
        </div>
        <p class="text-slate-600 text-sm mb-4">${
          task.descripcion || "Sin descripción"
        }</p>
        <div class="flex items-center justify-between pt-4 border-t border-slate-100">
          <span class="flex items-center text-amber-600 font-semibold">
            <i data-lucide="coins" class="w-4 h-4 mr-1"></i>
            ${task.recompensa}
          </span>
          <div class="flex gap-2">
            <button onclick="window.tasksModule.edit(${
              task.id_tarea
            })" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
              <i data-lucide="edit" class="w-4 h-4"></i>
            </button>
            <button onclick="window.tasksModule.delete(${
              task.id_tarea
            })" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  edit(id) {
    uiService.showNotification(
      `Editar tarea ID: ${id}`,
      NOTIFICATION_TYPES.INFO
    );
  }

  async delete(id) {
    if (!confirm("¿Estás seguro de eliminar esta tarea?")) return;

    try {
      const data = await apiService.deleteTask(id);

      if (data.success) {
        uiService.showNotification(
          "✅ Tarea eliminada exitosamente",
          NOTIFICATION_TYPES.SUCCESS
        );
        this.loadData();
      } else {
        uiService.showNotification(
          "❌ " + data.message,
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error eliminando tarea:", error);
      uiService.showNotification(
        "❌ Error al eliminar tarea",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }
}

export default new TasksModule();
