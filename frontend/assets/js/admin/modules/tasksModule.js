// ==========================================
// TASKS-MODULE.JS - Módulo de Tareas CORREGIDO
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";
import { NOTIFICATION_TYPES } from "../config.js";

class TasksModule {
  constructor() {
    this.currentFilter = "all";
    this.allTasks = [];
    this.selectedFiles = new Map();
    this.taskToDelete = null;
  }

  // ==========================================
  // MANEJO DE ARCHIVOS
  // ==========================================
  initFileUpload(modalType = "edit") {
    const fileInputId = modalType === "new" ? "newTaskFiles" : "taskFiles";
    const selectedFilesId =
      modalType === "new" ? "newSelectedFiles" : "selectedFiles";

    console.log(`🔧 Inicializando upload para modal: ${modalType}`);
    console.log(`🔧 Buscando input: #${fileInputId}`);

    const fileInput = document.getElementById(fileInputId);
    const dropZone = fileInput?.closest("div.border-dashed");
    const selectedFilesDiv = document.getElementById(selectedFilesId);

    if (!fileInput) {
      console.error(`❌ No se encontró el input: #${fileInputId}`);
      return;
    }

    if (!dropZone) {
      console.error(`❌ No se encontró la drop zone para: #${fileInputId}`);
      return;
    }

    if (!selectedFilesDiv) {
      console.error(
        `❌ No se encontró el div de archivos: #${selectedFilesId}`
      );
      return;
    }

    console.log("✅ Elementos encontrados, configurando listeners...");

    // 🔧 MEJORADO: Remover todos los listeners previos
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);

    // 🔧 MEJORADO: Agregar listener al input
    newFileInput.addEventListener("change", (e) => {
      console.log("📁 Archivos seleccionados:", e.target.files.length);
      e.preventDefault();
      e.stopPropagation();
      this.handleFileSelection(e.target.files, modalType);
    });

    // 🔧 MEJORADO: Recrear toda la zona de drop
    const newDropZone = dropZone.cloneNode(true);
    dropZone.parentNode.replaceChild(newDropZone, dropZone);

    // 🔧 MEJORADO: Buscar el nuevo input dentro de la nueva zona
    const finalInput = newDropZone.querySelector(`#${fileInputId}`);

    if (finalInput) {
      // Remover listener anterior si existe
      const newerInput = finalInput.cloneNode(true);
      finalInput.parentNode.replaceChild(newerInput, finalInput);

      // Agregar nuevo listener
      newerInput.addEventListener("change", (e) => {
        console.log(
          "📁 Archivos seleccionados (final input):",
          e.target.files.length
        );
        e.preventDefault();
        e.stopPropagation();
        this.handleFileSelection(e.target.files, modalType);
      });

      // 🔧 NUEVO: Agregar evento de click al label
      const label = newDropZone.querySelector(`label[for="${fileInputId}"]`);
      if (label) {
        label.addEventListener("click", (e) => {
          console.log("🖱️ Click en label detectado");
          // El click se propagará naturalmente al input
        });
      }
    }

    // Drag and drop events
    newDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      newDropZone.classList.add("border-emerald-500", "bg-emerald-50");
    });

    newDropZone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      newDropZone.classList.remove("border-emerald-500", "bg-emerald-50");
    });

    newDropZone.addEventListener("drop", (e) => {
      console.log("📦 Archivos soltados en drop zone");
      e.preventDefault();
      e.stopPropagation();
      newDropZone.classList.remove("border-emerald-500", "bg-emerald-50");
      this.handleFileSelection(e.dataTransfer.files, modalType);
    });

    console.log("✅ Upload inicializado correctamente");
  }

  handleFileSelection(files, modalType = "edit") {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        uiService.showNotification(
          `El archivo ${file.name} excede el límite de 10MB`,
          NOTIFICATION_TYPES.ERROR
        );
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
      ];

      if (!allowedTypes.includes(file.type)) {
        uiService.showNotification(
          `Tipo de archivo no permitido: ${file.name}`,
          NOTIFICATION_TYPES.ERROR
        );
        return;
      }

      // Agregar archivo a la lista
      this.selectedFiles.set(file.name, file);
    });

    this.updateSelectedFilesList(modalType);
  }

  updateSelectedFilesList(modalType = "edit") {
    const selectedFilesId =
      modalType === "new" ? "newSelectedFiles" : "selectedFiles";
    const selectedFilesDiv = document.getElementById(selectedFilesId);
    if (!selectedFilesDiv) return;

    selectedFilesDiv.innerHTML = Array.from(this.selectedFiles.entries())
      .map(([name, file]) => {
        // Escapar caracteres especiales en el nombre
        const safeName = name.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        return `
          <div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
            <div class="flex items-center gap-2">
              <i data-lucide="file" class="w-4 h-4 text-slate-400"></i>
              <span class="text-sm text-slate-600">${name}</span>
              <span class="text-xs text-slate-400">(${this.formatFileSize(
                file.size
              )})</span>
            </div>
            <button 
              type="button"
              class="remove-file-btn text-red-500 hover:text-red-600"
              data-file-name="${safeName}"
              data-modal-type="${modalType}"
            >
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        `;
      })
      .join("");

    lucide.createIcons();

    // Agregar event listeners
    selectedFilesDiv.querySelectorAll(".remove-file-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const fileName = btn.dataset.fileName.replace(/\\'/g, "'");
        const modalType = btn.dataset.modalType;
        this.removeFile(fileName, modalType);
      });
    });
  }

  removeFile(fileName, modalType = "edit") {
    this.selectedFiles.delete(fileName);
    this.updateSelectedFilesList(modalType);
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  async uploadFiles(taskId) {
    if (this.selectedFiles.size === 0) return [];

    const formData = new FormData();
    this.selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const data = await apiService.uploadTaskFiles(taskId, formData);
      return data.files || [];
    } catch (error) {
      console.error("Error subiendo archivos:", error);
      throw error;
    }
  }

  async loadTaskFiles(taskId) {
    try {
      const data = await apiService.getTaskFiles(taskId);
      return data.files || [];
    } catch (error) {
      console.error("Error cargando archivos:", error);
      return [];
    }
  }

  async deleteTaskFile(taskId, fileId) {
    try {
      await apiService.deleteTaskFile(taskId, fileId);
      return true;
    } catch (error) {
      console.error("Error eliminando archivo:", error);
      throw error;
    }
  }

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================
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
          <button type="button" id="openNewTaskModal" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-2 text-sm">
            <i data-lucide="plus" class="w-4 h-4"></i>
            Nueva Tarea
          </button>
        </div>

        <!-- Filtros de estado -->
        <div class="bg-white p-4 rounded-xl shadow-lg">
          <div class="flex flex-wrap gap-2">
            <button type="button" class="filter-task-btn px-4 py-2 rounded-lg text-sm transition-colors bg-emerald-500 text-white" data-filter="all">
              <i data-lucide="clipboard-list" class="w-4 h-4 inline mr-1"></i>
              Todas
            </button>
            <button type="button" class="filter-task-btn px-4 py-2 rounded-lg text-sm transition-colors bg-slate-200 text-slate-700 hover:bg-slate-300" data-filter="active">
              <i data-lucide="check-circle" class="w-4 h-4 inline mr-1"></i>
              Activas
            </button>
            <button type="button" class="filter-task-btn px-4 py-2 rounded-lg text-sm transition-colors bg-slate-200 text-slate-700 hover:bg-slate-300" data-filter="vencida">
              <i data-lucide="x-circle" class="w-4 h-4 inline mr-1"></i>
              Vencidas
            </button>
            <button type="button" class="filter-task-btn px-4 py-2 rounded-lg text-sm transition-colors bg-slate-200 text-slate-700 hover:bg-slate-300" data-filter="high-reward">
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

      <!-- Modal NUEVA Tarea -->
      <div id="newTaskModal" class="fixed inset-0 bg-black bg-opacity-50 hidden opacity-0 transition-opacity duration-300 z-50 flex items-center justify-center p-4">
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col transform scale-95 opacity-0 transition-all duration-300">
          <div class="p-6 border-b border-slate-200 flex-shrink-0">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold text-slate-800">Nueva Tarea</h2>
              <button type="button" id="closeNewTaskModalBtn" class="text-slate-400 hover:text-slate-600 transition-colors">
                <i data-lucide="x" class="w-6 h-6"></i>
              </button>
            </div>
          </div>
          
          <form id="newTaskForm" class="flex flex-col flex-1 min-h-0">
            <div class="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Título de la Tarea *</label>
                <input
                  type="text"
                  id="newTaskTitle"
                  required
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Ej: Completar módulo de matemáticas"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
                <textarea
                  id="newTaskDescription"
                  rows="3"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Describe la tarea..."
                ></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Recompensa (STHELA) *</label>
                  <input
                    type="number"
                    id="newTaskReward"
                    required
                    min="0"
                    step="0.01"
                    class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Dificultad</label>
                  <select
                    id="newTaskDifficulty"
                    class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="facil">Fácil</option>
                    <option value="media" selected>Media</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Fecha Límite (opcional)</label>
                <input
                  type="datetime-local"
                  id="newTaskDueDate"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  Archivos Adjuntos
                  <span class="text-xs text-slate-500 ml-1">(PDF, Word, Excel, imágenes - Max 10MB)</span>
                </label>
                <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-emerald-500 transition-colors">
                  <div class="space-y-2 text-center">
                    <i data-lucide="upload-cloud" class="mx-auto h-12 w-12 text-slate-400"></i>
                    <div class="text-sm text-slate-600">
                      <label for="newTaskFiles" class="relative cursor-pointer rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                        <span>Sube archivos</span>
                        <input id="newTaskFiles" name="files" type="file" class="sr-only" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png">
                      </label>
                      <p class="pl-1">o arrastra y suelta aquí</p>
                    </div>
                    <p class="text-xs text-slate-500">Hasta 10MB por archivo</p>
                  </div>
                </div>
                <div id="newSelectedFiles" class="mt-3 space-y-2"></div>
              </div>
            </div>
            
            <div class="p-6 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0 bg-white rounded-b-2xl">
              <button
                type="button"
                id="cancelNewTaskBtn"
                class="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                <i data-lucide="plus" class="w-4 h-4"></i>
                Crear Tarea
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Ver Detalles -->
      <div id="viewTaskModal" class="fixed inset-0 bg-black bg-opacity-50 hidden opacity-0 transition-opacity duration-300 z-50 flex items-center justify-center p-4">
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform scale-95 opacity-0 transition-all duration-300">
          <div class="p-6 border-b border-slate-200">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold text-slate-800">Detalles de la Tarea</h2>
              <button type="button" id="closeViewTaskModalBtn" class="text-slate-400 hover:text-slate-600 transition-colors">
                <i data-lucide="x" class="w-6 h-6"></i>
              </button>
            </div>
          </div>
          <div id="viewTaskContent" class="p-6"></div>
        </div>
      </div>

      <!-- Modal Editar Tarea -->
      <div id="editTaskModal" class="fixed inset-0 bg-black bg-opacity-50 hidden opacity-0 transition-opacity duration-300 z-50 flex items-center justify-center p-4">
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col transform scale-95 opacity-0 transition-all duration-300">
          <div class="p-6 border-b border-slate-200 flex-shrink-0">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold text-slate-800">Editar Tarea</h2>
              <button type="button" id="closeEditTaskModalBtn" class="text-slate-400 hover:text-slate-600 transition-colors">
                <i data-lucide="x" class="w-6 h-6"></i>
              </button>
            </div>
          </div>
          
          <form id="editTaskForm" class="flex flex-col flex-1 min-h-0">
            <div class="p-6 space-y-4 overflow-y-auto flex-1">
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
                  <label class="block text-sm font-medium text-slate-700 mb-2">Recompensa (STHELA)</label>
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

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  Archivos Adjuntos
                  <span class="text-xs text-slate-500 ml-1">(PDF, Word, Excel, imágenes)</span>
                </label>
                <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-emerald-500 transition-colors">
                  <div class="space-y-2 text-center">
                    <i data-lucide="upload-cloud" class="mx-auto h-12 w-12 text-slate-400"></i>
                    <div class="text-sm text-slate-600">
                      <label for="taskFiles" class="relative cursor-pointer rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                        <span>Sube archivos</span>
                        <input id="taskFiles" name="files" type="file" class="sr-only" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png">
                      </label>
                      <p class="pl-1">o arrastra y suelta aquí</p>
                    </div>
                    <p class="text-xs text-slate-500">Hasta 10MB por archivo</p>
                  </div>
                </div>
                <div id="selectedFiles" class="mt-3 space-y-2"></div>
              </div>
            </div>
            
            <div class="p-6 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0 bg-white rounded-b-2xl">
              <button
                type="button"
                id="cancelEditTaskBtn"
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

      <!-- Modal Eliminar -->
      <div id="deleteTaskModal" class="fixed inset-0 bg-black bg-opacity-50 hidden opacity-0 transition-opacity duration-300 z-50 flex items-center justify-center p-4">
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-md w-full transform scale-95 opacity-0 transition-all duration-300">
          <div class="p-6">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i data-lucide="alert-triangle" class="w-8 h-8 text-red-600"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800 text-center mb-2">¿Eliminar Tarea?</h3>
            <p class="text-slate-600 text-center mb-2">Esta acción no se puede deshacer.</p>
            <div id="deleteTaskInfo" class="bg-slate-50 rounded-lg p-4 mb-6"></div>
            <div class="flex gap-3">
              <button
                type="button"
                id="cancelDeleteTaskBtn"
                class="flex-1 px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirmDeleteTaskBtn"
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
    this.initNewTaskForm();
    this.initEditForm();
    this.setupEventListeners();
  }

  // ==========================================
  // CARGAR Y RENDERIZAR TAREAS
  // ==========================================
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
              type="button"
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
            ${task.recompensa} STHELA
          </span>
          <div class="flex gap-2">
            <button type="button" data-action="view" data-id="${
              task.id
            }" class="p-2 text-sky-600 hover:bg-sky-50 rounded-lg" title="Ver detalles">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            <button type="button" data-action="edit" data-id="${
              task.id
            }" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Editar">
              <i data-lucide="edit" class="w-4 h-4"></i>
            </button>
            <button type="button" data-action="delete" data-id="${
              task.id
            }" class="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  setupEventListeners() {
    // Filtros
    document.addEventListener("click", (e) => {
      const fbtn = e.target.closest("button[data-filter]");
      if (fbtn) {
        const filter = fbtn.getAttribute("data-filter");
        this.applyFilter(filter);
      }
    });

    // Acciones en el grid
    const grid = document.getElementById("tasksGrid");
    if (grid) {
      grid.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        const id = btn.getAttribute("data-id");
        if (action === "view") this.view(Number(id));
        else if (action === "edit") this.edit(Number(id));
        else if (action === "delete") this.delete(Number(id));
      });
    }

    // Botón abrir modal nueva tarea
    document.addEventListener("click", (e) => {
      if (e.target.closest("#openNewTaskModal")) {
        this.openNewTaskModal();
      }
    });

    // Modales
    this.setupModalListeners("closeNewTaskModalBtn", () =>
      this.closeNewTaskModal()
    );
    this.setupModalListeners("cancelNewTaskBtn", () =>
      this.closeNewTaskModal()
    );
    this.setupModalListeners("closeViewTaskModalBtn", () =>
      this.closeViewModal()
    );
    this.setupModalListeners("closeEditTaskModalBtn", () =>
      this.closeEditModal()
    );
    this.setupModalListeners("cancelEditTaskBtn", () => this.closeEditModal());
    this.setupModalListeners("cancelDeleteTaskBtn", () =>
      this.closeDeleteModal()
    );
    this.setupModalListeners("confirmDeleteTaskBtn", () =>
      this.confirmDelete()
    );
  }

  setupModalListeners(btnId, callback) {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        callback();
      });
    }
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

  applyFilter(filterType) {
    this.currentFilter = filterType;

    document.querySelectorAll(".filter-task-btn").forEach((btn) => {
      if (btn.dataset.filter === filterType) {
        btn.classList.remove("bg-slate-200", "text-slate-700");
        btn.classList.add("bg-emerald-500", "text-white");
      } else {
        btn.classList.remove("bg-emerald-500", "text-white");
        btn.classList.add("bg-slate-200", "text-slate-700");
      }
    });

    let filteredTasks = [...this.allTasks];

    switch (filterType) {
      case "active":
        filteredTasks = this.allTasks.filter((t) => t.estado === "activa");
        break;
      case "completed":
        filteredTasks = this.allTasks.filter((t) => t.estado === "completada");
        break;
      case "vencida":
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
  // NUEVA TAREA
  // ==========================================
  openNewTaskModal() {
    this.selectedFiles.clear();
    uiService.openModal("newTaskModal");
    lucide.createIcons();
    setTimeout(() => this.initFileUpload("new"), 100);
  }

  initNewTaskForm() {
    const form = document.getElementById("newTaskForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleNewTaskSubmit();
    });
  }

  async handleNewTaskSubmit() {
    const titulo = document.getElementById("newTaskTitle").value;
    const descripcion = document.getElementById("newTaskDescription").value;
    const recompensa = document.getElementById("newTaskReward").value;
    const fecha_limite = document.getElementById("newTaskDueDate").value;
    const dificultad = document.getElementById("newTaskDifficulty").value;

    if (!titulo || !recompensa) {
      uiService.showNotification(
        "Por favor completa el título y la recompensa",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    try {
      const newTaskData = {
        titulo,
        descripcion,
        recompensa: parseFloat(recompensa),
        dificultad,
        fecha_limite: fecha_limite || null,
        estado: "activa",
      };

      const data = await apiService.createTask(newTaskData);

      if (data.success) {
        if (this.selectedFiles.size > 0 && data.task && data.task.id) {
          try {
            await this.uploadFiles(data.task.id);
            uiService.showNotification(
              "✅ Tarea creada con archivos exitosamente",
              NOTIFICATION_TYPES.SUCCESS
            );
          } catch (error) {
            console.error("Error al subir archivos:", error);
            uiService.showNotification(
              "⚠️ Tarea creada, pero hubo un error al subir los archivos",
              NOTIFICATION_TYPES.WARNING
            );
          }
        } else {
          uiService.showNotification(
            "✅ Tarea creada exitosamente",
            NOTIFICATION_TYPES.SUCCESS
          );
        }

        this.closeNewTaskModal();
        this.loadData();
      } else {
        uiService.showNotification(
          "❌ " + data.message,
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error creando tarea:", error);
      uiService.showNotification(
        "❌ Error al crear tarea",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  closeNewTaskModal() {
    uiService.closeModal("newTaskModal");
    document.getElementById("newTaskForm").reset();
    this.selectedFiles.clear();
    const filesDiv = document.getElementById("newSelectedFiles");
    if (filesDiv) filesDiv.innerHTML = "";
  }

  // ==========================================
  // VER DETALLES
  // ==========================================
  async view(id) {
    const task = this.allTasks.find((t) => t.id === id);
    if (!task) return;

    const files = await this.loadTaskFiles(id);

    const statusClass =
      task.estado === "activa"
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

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-amber-800 mb-1">Recompensa</p>
                <p class="text-3xl font-bold text-amber-600">${
                  task.recompensa
                }</p>
                <p class="text-xs text-amber-700">STHELA Coins</p>
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

        <div class="bg-white rounded-xl p-6 border border-slate-200">
          <h4 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <i data-lucide="paperclip" class="w-5 h-5"></i>
            Archivos Adjuntos
          </h4>
          <div id="selectedFiles" class="mt-3 space-y-2">
            ${
              files && files.length > 0
                ? files
                    .map(
                      (file) => `
              <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <i data-lucide="file" class="w-5 h-5 text-slate-400"></i>
                  <div>
                    <p class="text-sm font-medium text-slate-700">${
                      file.nombre_original
                    }</p>
                    <p class="text-xs text-slate-500">${this.formatFileSize(
                      file.tamanio || 0
                    )}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <a href="${apiService.getFileDownloadUrl(task.id, file.id)}" 
                     class="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                     title="Descargar archivo"
                     target="_blank">
                    <i data-lucide="download" class="w-4 h-4"></i>
                  </a>
                  <button 
                    type="button"
                    class="delete-file-btn p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    data-task-id="${task.id}"
                    data-file-id="${file.id}"
                    title="Eliminar archivo">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            `
                    )
                    .join("")
                : `
              <div class="text-center py-6">
                <i data-lucide="file" class="w-12 h-12 mx-auto mb-3 text-slate-300"></i>
                <p class="text-slate-500">No hay archivos adjuntos</p>
              </div>
            `
            }
          </div>
        </div>

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

        <div class="flex gap-3">
          <button
            type="button"
            data-action="edit-from-view"
            data-id="${id}"
            class="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <i data-lucide="edit" class="w-5 h-5"></i>
            Editar Tarea
          </button>
          <button
            type="button"
            id="closeViewTaskModalBtn"
            class="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    `;

    document.getElementById("viewTaskContent").innerHTML = content;

    // Agregar event listeners para eliminar archivos
    const deleteButtons = document.querySelectorAll(".delete-file-btn");
    deleteButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const taskId = parseInt(btn.dataset.taskId);
        const fileId = parseInt(btn.dataset.fileId);
        this.handleDeleteFile(taskId, fileId);
      });
    });

    // Agregar event listener para el botón de editar
    const editBtn = document.querySelector('[data-action="edit-from-view"]');
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const taskId = parseInt(editBtn.dataset.id);
        this.edit(taskId);
      });
    }

    uiService.openModal("viewTaskModal");
    lucide.createIcons();
  }

  closeViewModal() {
    uiService.closeModal("viewTaskModal");
  }

  async edit(id) {
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

    this.closeViewModal();

    // Limpiar archivos seleccionados
    this.selectedFiles.clear();

    // Abrir modal de edición
    uiService.openModal("editTaskModal");

    // 🔧 AUMENTAR EL TIMEOUT Y REINICIALIZAR TODO
    setTimeout(() => {
      // Primero limpiar la lista de archivos
      this.updateSelectedFilesList("edit");

      // Luego inicializar el upload
      this.initFileUpload("edit");

      // 🔧 NUEVO: Forzar recreación de los iconos
      lucide.createIcons();

      // 🔧 NUEVO: Log de debug para verificar
      console.log("🔧 Edit modal: Input de archivos inicializado");
      const fileInput = document.getElementById("taskFiles");
      if (fileInput) {
        console.log("✅ Input de archivos encontrado:", fileInput);
      } else {
        console.error("❌ Input de archivos NO encontrado");
      }
    }, 200); // 🔧 Aumentado de 100ms a 200ms
  }

  initEditForm() {
    const form = document.getElementById("editTaskForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();
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
        if (this.selectedFiles.size > 0) {
          try {
            await this.uploadFiles(id);
            uiService.showNotification(
              "✅ Tarea y archivos actualizados correctamente",
              NOTIFICATION_TYPES.SUCCESS
            );
          } catch (error) {
            console.error("Error al subir archivos:", error);
            uiService.showNotification(
              "⚠️ Tarea actualizada, pero hubo un error al subir los archivos",
              NOTIFICATION_TYPES.WARNING
            );
          }
        } else {
          uiService.showNotification(
            "✅ Tarea actualizada exitosamente",
            NOTIFICATION_TYPES.SUCCESS
          );
        }

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
    this.selectedFiles.clear();
    const filesDiv = document.getElementById("selectedFiles");
    if (filesDiv) filesDiv.innerHTML = "";
  }

  // ==========================================
  // ELIMINAR TAREA
  // ==========================================
  delete(id) {
    const task = this.allTasks.find((t) => t.id === id);
    if (!task) return;

    const statusClass =
      task.estado === "activa" ? "text-green-600" : "text-slate-600";

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
            ${task.recompensa} STHELA
          </span>
        </div>
      </div>
    `;

    document.getElementById("deleteTaskInfo").innerHTML = infoHtml;
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

  async handleDeleteFile(taskId, fileId) {
    if (!confirm("¿Está seguro de que desea eliminar este archivo?")) {
      return;
    }

    try {
      await this.deleteTaskFile(taskId, fileId);
      uiService.showNotification(
        "✅ Archivo eliminado exitosamente",
        NOTIFICATION_TYPES.SUCCESS
      );
      this.view(taskId);
    } catch (error) {
      console.error("Error eliminando archivo:", error);
      uiService.showNotification(
        "❌ Error al eliminar el archivo",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }
}

export default new TasksModule();
