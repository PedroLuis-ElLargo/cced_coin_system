// ==========================================
// TASKS-MODULE.JS - Módulo de Tareas
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";
import { NOTIFICATION_TYPES } from "../config.js";

class TasksModule {
  constructor() {
    this.currentFilter = "all";
    this.allTasks = [];
  }

  render() {
    const content = `
      <div class="space-y-6">
        <!-- Barra de búsqueda y filtros -->
        <div class="bg-white p-4 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="relative flex-1 w-full sm:max-w-md">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3">
              <i data-lucide="search" class="h-5 w-5 text-slate-400"></i>
            </span>
            <input
              type="text"
              id="searchTasks"
              placeholder="Buscar tarea por título o descripción..."
              class="w-full py-2.5 pl-10 pr-4 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <button id="openNewTaskModal" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-2 text-sm">
            <i data-lucide="plus" class="w-4 h-4"></i>
            Nueva Tarea
          </button>
        </div>

        <!-- Filtros de estado -->
        <div class="bg-white p-4 rounded-xl shadow-lg">
          <div class="flex flex-wrap gap-2">
            <button onclick="window.tasksModule.applyFilter('all')" class="filter-task-btn px-4 py-2 rounded-lg text-sm transition-colors bg-emerald-500 text-white" data-filter="all">
              <i data-lucide="clipboard-list" class="w-4 h-4 inline mr-1"></i>
              Todas
            </button>
            <button onclick="window.tasksModule.applyFilter('active')" class="filter-task-btn px-4 py-2 rounded-lg text-sm transition-colors bg-slate-200 text-slate-700 hover:bg-slate-300" data-filter="active">
              <i data-lucide="check-circle" class="w-4 h-4 inline mr-1"></i>
              Activas
            </button>
            <button onclick="window.tasksModule.applyFilter('expired')" class="filter-task-btn px-4 py-2 rounded-lg text-sm transition-colors bg-slate-200 text-slate-700 hover:bg-slate-300" data-filter="vencida">
              <i data-lucide="x-circle" class="w-4 h-4 inline mr-1"></i>
              Vencidas
            </button>
            <button onclick="window.tasksModule.applyFilter('high-reward')" class="filter-task-btn px-4 py-2 rounded-lg text-sm transition-colors bg-slate-200 text-slate-700 hover:bg-slate-300" data-filter="high-reward">
              <i data-lucide="trophy" class="w-4 h-4 inline mr-1"></i>
              Alta Recompensa (>100)
            </button>
          </div>
        </div>

        <!-- Grid de tareas -->
        <div id="tasksGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="text-center py-12">
            <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin text-slate-400"></i>
            <p class="text-slate-400">Cargando tareas...</p>
          </div>
        </div>
      </div>

      <!-- Modal Ver Detalles de Tarea -->
      <div id="viewTaskModal" class="fixed inset-0 bg-black bg-opacity-50 hidden opacity-0 transition-opacity duration-300 z-50 flex items-center justify-center p-4">
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform scale-95 opacity-0 transition-all duration-300">
          <div class="p-6 border-b border-slate-200">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold text-slate-800">Detalles de la Tarea</h2>
              <button onclick="window.tasksModule.closeViewModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
                <i data-lucide="x" class="w-6 h-6"></i>
              </button>
            </div>
          </div>
          <div id="viewTaskContent" class="p-6">
            <!-- Contenido dinámico -->
          </div>
        </div>
      </div>

      <!-- Modal Editar Tarea -->
      <div id="editTaskModal" class="fixed inset-0 bg-black bg-opacity-50 hidden opacity-0 transition-opacity duration-300 z-50 flex items-center justify-center p-4">
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-lg w-full transform scale-95 opacity-0 transition-all duration-300">
          <div class="p-6 border-b border-slate-200">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold text-slate-800">Editar Tarea</h2>
              <button onclick="window.tasksModule.closeEditModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
                <i data-lucide="x" class="w-6 h-6"></i>
              </button>
            </div>
          </div>
          <form id="editTaskForm" class="p-6 space-y-4">
            <input type="hidden" id="editTaskId">
            
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Título de la Tarea</label>
              <input
                type="text"
                id="editTaskTitle"
                required
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="Ej: Completar módulo de matemáticas"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
              <textarea
                id="editTaskDescription"
                rows="3"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="Describe la tarea..."
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Recompensa (CCED)</label>
                <input
                  type="number"
                  id="editTaskReward"
                  required
                  min="0"
                  step="0.01"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="100"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Estado</label>
                <select
                  id="editTaskStatus"
                  required
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="activa">Activa</option>
                  <option value="completada">Completada</option>
                  <option value="vencida">Vencida</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Fecha Límite (opcional)</label>
              <input
                type="datetime-local"
                id="editTaskDueDate"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Dificultad</label>
              <select
                id="editTaskDifficulty"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="facil">Fácil</option>
                <option value="media">Media</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onclick="window.tasksModule.closeEditModal()"
                class="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                <i data-lucide="save" class="w-4 h-4"></i>
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Confirmar Eliminación -->
      <div id="deleteTaskModal" class="fixed inset-0 bg-black bg-opacity-50 hidden opacity-0 transition-opacity duration-300 z-50 flex items-center justify-center p-4">
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-md w-full transform scale-95 opacity-0 transition-all duration-300">
          <div class="p-6">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i data-lucide="alert-triangle" class="w-8 h-8 text-red-600"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800 text-center mb-2">¿Eliminar Tarea?</h3>
            <p class="text-slate-600 text-center mb-2">Esta acción no se puede deshacer.</p>
            <div id="deleteTaskInfo" class="bg-slate-50 rounded-lg p-4 mb-6">
              <!-- Información de la tarea a eliminar -->
            </div>
            <div class="flex gap-3">
              <button
                onclick="window.tasksModule.closeDeleteModal()"
                class="flex-1 px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onclick="window.tasksModule.confirmDelete()"
                class="flex-1 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <i data-lucide="trash-2" class="w-4 h-4"></i>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    uiService.updateMainContent(content);
    this.loadData();
    this.initSearch();
    this.initEditForm();
  }

  async loadData() {
    try {
      const data = await apiService.getTasks();
      const grid = document.getElementById("tasksGrid");

      if (!grid) return;

      if (data.success && data.tasks && data.tasks.length > 0) {
        this.allTasks = data.tasks;
        this.renderTasks(this.allTasks);
      } else {
        grid.innerHTML = `
          <div class="col-span-full text-center py-12">
            <i data-lucide="clipboard" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>
            <p class="text-slate-400 mb-4">No hay tareas creadas</p>
            <button 
              id="openNewTaskModal"
              class="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
            >
              <i data-lucide="plus" class="w-4 h-4 inline mr-2"></i>
              Crear Primera Tarea
            </button>
          </div>
        `;
        lucide.createIcons();
      }
    } catch (error) {
      console.error("Error cargando tareas:", error);
      uiService.showNotification(
        "Error al cargar tareas",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  renderTasks(tasks) {
    const grid = document.getElementById("tasksGrid");
    if (!grid) return;

    grid.innerHTML = tasks.map((task) => this.createTaskCard(task)).join("");
    lucide.createIcons();
  }

  createTaskCard(task) {
    const statusClass =
      task.estado === "activa"
        ? "bg-green-100 text-green-700"
        : "bg-slate-100 text-slate-600";

    const difficultyColors = {
      facil: "bg-blue-100 text-blue-700",
      media: "bg-yellow-100 text-yellow-700",
      dificil: "bg-red-100 text-red-700",
    };

    const difficultyClass =
      difficultyColors[task.dificultad] || "bg-slate-100 text-slate-600";

    return `
      <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-l-4 ${
        task.estado === "activa" ? "border-emerald-500" : "border-slate-300"
      }">
        <div class="flex justify-between items-start mb-3">
          <h3 class="font-semibold text-slate-800 text-lg flex-1">${
            task.titulo
          }</h3>
          <span class="px-2 py-1 text-xs rounded-full ${statusClass} ml-2 whitespace-nowrap">
            ${task.estado}
          </span>
        </div>
        
        <p class="text-slate-600 text-sm mb-4 line-clamp-2">${
          task.descripcion || "Sin descripción"
        }</p>

        ${
          task.dificultad
            ? `
          <div class="mb-3">
            <span class="px-2 py-1 text-xs rounded-full ${difficultyClass}">
              ${
                task.dificultad.charAt(0).toUpperCase() +
                task.dificultad.slice(1)
              }
            </span>
          </div>
        `
            : ""
        }

        ${
          task.fecha_limite
            ? `
          <div class="mb-3 flex items-center text-xs text-slate-500">
            <i data-lucide="calendar" class="w-3 h-3 mr-1"></i>
            Límite: ${new Date(task.fecha_limite).toLocaleDateString("es-ES")}
          </div>
        `
            : ""
        }

        <div class="flex items-center justify-between pt-4 border-t border-slate-100">
          <span class="flex items-center text-amber-600 font-semibold">
            <i data-lucide="coins" class="w-4 h-4 mr-1"></i>
            ${task.recompensa} CCED
          </span>
          <div class="flex gap-2">
            <button onclick="window.tasksModule.view(${
              task.id
            })" class="p-2 text-sky-600 hover:bg-sky-50 rounded-lg" title="Ver detalles">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            <button onclick="window.tasksModule.edit(${
              task.id
            })" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Editar">
              <i data-lucide="edit" class="w-4 h-4"></i>
            </button>
            <button onclick="window.tasksModule.delete(${
              task.id
            })" class="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  initSearch() {
    const searchInput = document.getElementById("searchTasks");
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const filteredTasks = this.allTasks.filter(
        (task) =>
          task.titulo.toLowerCase().includes(searchTerm) ||
          (task.descripcion &&
            task.descripcion.toLowerCase().includes(searchTerm))
      );
      this.renderTasks(filteredTasks);
    });
  }

  // En applyFilter, actualizar filtros
  applyFilter(filterType) {
    this.currentFilter = filterType;

    // Actualizar estilos de botones
    document.querySelectorAll(".filter-task-btn").forEach((btn) => {
      if (btn.dataset.filter === filterType) {
        btn.classList.remove("bg-slate-200", "text-slate-700");
        btn.classList.add("bg-emerald-500", "text-white");
      } else {
        btn.classList.remove("bg-emerald-500", "text-white");
        btn.classList.add("bg-slate-200", "text-slate-700");
      }
    });

    // Aplicar filtro
    let filteredTasks = [...this.allTasks];

    switch (filterType) {
      case "active":
        filteredTasks = this.allTasks.filter((t) => t.estado === "activa");
        break;
      case "completed":
        filteredTasks = this.allTasks.filter((t) => t.estado === "completada");
        break;
      case "expired":
        filteredTasks = this.allTasks.filter((t) => t.estado === "vencida");
        break;
      case "high-reward":
        filteredTasks = this.allTasks.filter((t) => t.recompensa > 100);
        break;
      default:
        filteredTasks = this.allTasks;
    }

    this.renderTasks(filteredTasks);

    uiService.showNotification(
      `Filtro aplicado: ${filteredTasks.length} tarea(s)`,
      NOTIFICATION_TYPES.INFO
    );
  }

  // ==========================================
  // VER DETALLES DE TAREA
  // ==========================================
  async view(id) {
    const task = this.allTasks.find((t) => t.id === id);
    if (!task) return;

    const statusClass =
      task.estado === "activo"
        ? "bg-green-100 text-green-700"
        : "bg-slate-100 text-slate-600";

    const difficultyLabels = {
      facil: { text: "Fácil", class: "bg-blue-100 text-blue-700" },
      media: { text: "Media", class: "bg-yellow-100 text-yellow-700" },
      dificil: { text: "Difícil", class: "bg-red-100 text-red-700" },
    };

    const difficulty = difficultyLabels[task.dificultad] || {
      text: "No especificada",
      class: "bg-slate-100 text-slate-600",
    };

    const content = `
      <div class="space-y-6">
        <!-- Encabezado -->
        <div class="pb-6 border-b border-slate-200">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-2xl font-bold text-slate-800 mb-2">${
                task.titulo
              }</h3>
              <p class="text-slate-600">${
                task.descripcion || "Sin descripción"
              }</p>
            </div>
            <span class="px-3 py-1 text-sm rounded-full ${statusClass} ml-4 whitespace-nowrap">
              ${task.estado}
            </span>
          </div>
          <div class="flex flex-wrap gap-2">
            <span class="px-3 py-1 text-sm rounded-full ${difficulty.class}">
              ${difficulty.text}
            </span>
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-amber-800 mb-1">Recompensa</p>
                <p class="text-3xl font-bold text-amber-600">${
                  task.recompensa
                }</p>
                <p class="text-xs text-amber-700">CCED Coins</p>
              </div>
              <div class="w-14 h-14 bg-amber-200 rounded-full flex items-center justify-center">
                <i data-lucide="coins" class="w-7 h-7 text-amber-600"></i>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-emerald-800 mb-1">Completada Por</p>
                <p class="text-3xl font-bold text-emerald-600">${
                  task.completadas || 0
                }</p>
                <p class="text-xs text-emerald-700">Estudiantes</p>
              </div>
              <div class="w-14 h-14 bg-emerald-200 rounded-full flex items-center justify-center">
                <i data-lucide="users" class="w-7 h-7 text-emerald-600"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Información adicional -->
        <div class="bg-slate-50 rounded-xl p-6">
          <h4 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <i data-lucide="info" class="w-5 h-5"></i>
            Información Adicional
          </h4>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-slate-600">ID de Tarea:</span>
              <span class="font-semibold text-slate-800">${task.id}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Fecha de Creación:</span>
              <span class="font-semibold text-slate-800">${
                task.fecha_creacion
                  ? new Date(task.fecha_creacion).toLocaleDateString("es-ES")
                  : "No disponible"
              }</span>
            </div>
            ${
              task.fecha_limite
                ? `
              <div class="flex justify-between">
                <span class="text-slate-600">Fecha Límite:</span>
                <span class="font-semibold text-slate-800">${new Date(
                  task.fecha_limite
                ).toLocaleDateString("es-ES")}</span>
              </div>
            `
                : ""
            }
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex gap-3">
          <button
            onclick="window.tasksModule.edit(${id})"
            class="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <i data-lucide="edit" class="w-5 h-5"></i>
            Editar Tarea
          </button>
          <button
            onclick="window.tasksModule.closeViewModal()"
            class="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    `;

    document.getElementById("viewTaskContent").innerHTML = content;
    uiService.openModal("viewTaskModal");
    lucide.createIcons();
  }

  closeViewModal() {
    uiService.closeModal("viewTaskModal");
  }

  // ==========================================
  // EDITAR TAREA
  // ==========================================
  edit(id) {
    const task = this.allTasks.find((t) => t.id === id);
    if (!task) return;

    // Prellenar formulario
    document.getElementById("editTaskId").value = task.id;
    document.getElementById("editTaskTitle").value = task.titulo;
    document.getElementById("editTaskDescription").value =
      task.descripcion || "";
    document.getElementById("editTaskReward").value = task.recompensa;
    document.getElementById("editTaskStatus").value = task.estado;
    document.getElementById("editTaskDifficulty").value =
      task.dificultad || "media";

    if (task.fecha_limite) {
      const date = new Date(task.fecha_limite);
      const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
      document.getElementById("editTaskDueDate").value = localDate;
    } else {
      document.getElementById("editTaskDueDate").value = "";
    }

    // Cerrar modal de vista si está abierto
    this.closeViewModal();

    // Abrir modal de edición
    uiService.openModal("editTaskModal");
    lucide.createIcons();
  }

  initEditForm() {
    const form = document.getElementById("editTaskForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleEditSubmit();
    });
  }

  async handleEditSubmit() {
    const id = document.getElementById("editTaskId").value;
    const titulo = document.getElementById("editTaskTitle").value;
    const descripcion = document.getElementById("editTaskDescription").value;
    const recompensa = document.getElementById("editTaskReward").value;
    const estado = document.getElementById("editTaskStatus").value;
    const fecha_limite = document.getElementById("editTaskDueDate").value;
    const dificultad = document.getElementById("editTaskDifficulty").value;

    if (!titulo || !recompensa) {
      uiService.showNotification(
        "Por favor completa el título y la recompensa",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    try {
      const updateData = {
        titulo,
        descripcion,
        recompensa: parseFloat(recompensa),
        estado,
        dificultad,
        fecha_limite: fecha_limite || null,
      };

      const data = await apiService.updateTask(id, updateData);

      if (data.success) {
        uiService.showNotification(
          "✅ Tarea actualizada exitosamente",
          NOTIFICATION_TYPES.SUCCESS
        );
        this.closeEditModal();
        this.loadData();
      } else {
        uiService.showNotification(
          "❌ " + data.message,
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error actualizando tarea:", error);
      uiService.showNotification(
        "❌ Error al actualizar tarea",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  closeEditModal() {
    uiService.closeModal("editTaskModal");
    document.getElementById("editTaskForm").reset();
  }

  // ==========================================
  // ELIMINAR TAREA
  // ==========================================
  delete(id) {
    const task = this.allTasks.find((t) => t.id === id);
    if (!task) return;

    const statusClass =
      task.estado === "activo" ? "text-green-600" : "text-slate-600";

    // Mostrar información de la tarea
    const infoHtml = `
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <i data-lucide="clipboard-list" class="w-5 h-5 text-slate-500"></i>
          <div class="text-left flex-1">
            <p class="font-semibold text-slate-800">${task.titulo}</p>
            <p class="text-sm text-slate-600">${
              task.descripcion || "Sin descripción"
            }</p>
          </div>
        </div>
        <div class="flex items-center justify-between pt-2 border-t border-slate-200">
          <span class="text-sm ${statusClass}">
            <i data-lucide="circle" class="w-3 h-3 inline mr-1"></i>
            ${task.estado}
          </span>
          <span class="text-sm text-amber-600 font-semibold">
            <i data-lucide="coins" class="w-4 h-4 inline mr-1"></i>
            ${task.recompensa} CCED
          </span>
        </div>
      </div>
    `;

    document.getElementById("deleteTaskInfo").innerHTML = infoHtml;

    // Guardar ID para confirmación
    this.taskToDelete = id;

    uiService.openModal("deleteTaskModal");
    lucide.createIcons();
  }

  async confirmDelete() {
    if (!this.taskToDelete) return;

    try {
      const data = await apiService.deleteTask(this.taskToDelete);

      if (data.success) {
        uiService.showNotification(
          "✅ Tarea eliminada exitosamente",
          NOTIFICATION_TYPES.SUCCESS
        );
        this.closeDeleteModal();
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

  closeDeleteModal() {
    uiService.closeModal("deleteTaskModal");
    this.taskToDelete = null;
  }
}

export default new TasksModule();
