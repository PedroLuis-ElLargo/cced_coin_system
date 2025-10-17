// ==========================================
// MÓDULO DE EXÁMENES - FRONTEND COMPLETO (CORREGIDO)
// ==========================================

import uiService from "../services/uiService.js";
import { CONFIG, NOTIFICATION_TYPES } from "../config.js";

class ExamenesModule {
  constructor() {
    this.exams = [];
    this.currentExam = null;
    const adminData = JSON.parse(
      localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_DATA) || "{}"
    );
    this.userRole = adminData.rol || "student";
  }

  async render() {
    await this.loadExams();

    const content = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-white p-4 rounded-xl shadow-lg flex justify-between items-center">
          <div>
            <h2 class="text-lg font-semibold text-slate-700">Gestión de Exámenes</h2>
            <p class="text-sm text-slate-500">${
              this.exams.length
            } exámenes registrados</p>
          </div>
          ${
            this.userRole === "admin"
              ? `
            <button onclick="examenesModule.showCreateModal()" 
                    class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-2 text-sm">
              <i data-lucide="file-plus" class="w-4 h-4"></i>
              Nuevo Examen
            </button>
          `
              : ""
          }
        </div>

        <!-- Filtros -->
        <div class="bg-white p-4 rounded-xl shadow-lg">
          <div class="flex gap-3 items-center">
            <input type="text" 
                   id="searchExam" 
                   placeholder="Buscar examen..."
                   class="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm"
                   oninput="examenesModule.filterExams()">
            <select id="filterStatus" 
                    class="px-4 py-2 border border-slate-300 rounded-lg text-sm"
                    onchange="examenesModule.filterExams()">
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>

        <!-- Lista de Exámenes -->
        <div id="examsList" class="space-y-4">
          ${this.renderExamsList()}
        </div>
      </div>

      <!-- Modal Crear/Editar Examen -->
      <div id="examModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-semibold text-slate-800" id="modalTitle">Nuevo Examen</h3>
              <button onclick="examenesModule.closeModal()" class="text-slate-400 hover:text-slate-600">
                <i data-lucide="x" class="w-6 h-6"></i>
              </button>
            </div>
            
            <form id="examForm" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Nombre del Examen</label>
                <input type="text" 
                       id="examNombre" 
                       required
                       class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
                       placeholder="Ej: Examen Final de Matemáticas">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Fecha del Examen</label>
                  <input type="date" 
                         id="examFecha" 
                         required
                         class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Estado</label>
                  <select id="examActivo" class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm">
                    <option value="1">Activo</option>
                    <option value="0">Inactivo</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Nota Mínima</label>
                  <input type="number" 
                         id="examNotaMinima" 
                         step="0.01"
                         min="0"
                         max="10"
                         value="8.00"
                         class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Precio por Punto</label>
                  <input type="number" 
                         id="examPrecioPunto" 
                         step="0.01"
                         min="0"
                         value="2.00"
                         class="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm">
                </div>
              </div>

              <div class="flex gap-3 pt-4">
                <button type="submit" class="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium">
                  <span id="submitButtonText">Crear Examen</span>
                </button>
                <button type="button" onclick="examenesModule.closeModal()" class="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modal Archivos -->
      <div id="filesModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-semibold text-slate-800">Archivos del Examen</h3>
              <button onclick="examenesModule.closeFilesModal()" class="text-slate-400 hover:text-slate-600">
                <i data-lucide="x" class="w-6 h-6"></i>
              </button>
            </div>

            ${
              this.userRole === "admin"
                ? `
              <div class="mb-6 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <input type="file" 
                       id="fileInput" 
                       multiple
                       class="hidden"
                       onchange="examenesModule.handleFileSelect(event)">
                <button onclick="document.getElementById('fileInput').click()"
                        class="w-full px-4 py-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-slate-700">
                  <i data-lucide="upload" class="w-5 h-5"></i>
                  Subir Archivos
                </button>
                <p class="text-xs text-slate-500 text-center mt-2">PDF, DOC, DOCX, XLS, XLSX (Máx. 10MB por archivo)</p>
              </div>
            `
                : ""
            }

            <div id="filesList" class="space-y-3">
              <!-- Los archivos se cargan dinámicamente -->
            </div>
          </div>
        </div>
      </div>
    `;

    uiService.updateMainContent(content);
    lucide.createIcons();
    this.attachFormListeners();
  }

  renderExamsList() {
    if (this.exams.length === 0) {
      return `
        <div class="bg-white p-12 rounded-xl shadow-lg text-center">
          <i data-lucide="file-text" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>
          <p class="text-slate-400 mb-2">No hay exámenes registrados</p>
          ${
            this.userRole === "admin"
              ? '<p class="text-sm text-slate-500">Crea tu primer examen</p>'
              : ""
          }
        </div>
      `;
    }

    return this.exams
      .map(
        (exam) => `
      <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-semibold text-slate-800">${
                exam.nombre
              }</h3>
              <span class="px-2 py-1 rounded-full text-xs font-medium ${
                exam.activo
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-600"
              }">
                ${exam.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p class="text-xs text-slate-500">Fecha</p>
                <p class="text-sm font-medium text-slate-700">${this.formatDate(
                  exam.fecha
                )}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500">Nota Mínima</p>
                <p class="text-sm font-medium text-slate-700">${
                  exam.nota_minima
                }</p>
              </div>
              <div>
                <p class="text-xs text-slate-500">Precio/Punto</p>
                <p class="text-sm font-medium text-slate-700">$${
                  exam.precio_por_punto
                }</p>
              </div>
              <div>
                <p class="text-xs text-slate-500">Archivos</p>
                <p class="text-sm font-medium text-slate-700">${
                  exam.num_archivos || 0
                } archivo(s)</p>
              </div>
            </div>
          </div>

          <div class="flex gap-2 ml-4">
            <button onclick="examenesModule.showFiles(${exam.id})" 
                    class="p-2 hover:bg-slate-100 rounded-lg text-slate-600 tooltip"
                    title="Ver archivos">
              <i data-lucide="folder" class="w-5 h-5"></i>
            </button>
            ${
              this.userRole === "admin"
                ? `
              <button onclick="examenesModule.editExam(${exam.id})" 
                      class="p-2 hover:bg-blue-50 rounded-lg text-blue-600 tooltip"
                      title="Editar">
                <i data-lucide="edit" class="w-5 h-5"></i>
              </button>
              <button onclick="examenesModule.deleteExam(${exam.id})" 
                      class="p-2 hover:bg-red-50 rounded-lg text-red-600 tooltip"
                      title="Eliminar">
                <i data-lucide="trash-2" class="w-5 h-5"></i>
              </button>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }

  // ===== CARGAR DATOS =====
  async loadExams() {
    try {
      // ✅ CORREGIDO: Usar CONFIG.API_URL con puerto 4000
      const response = await fetch(`${CONFIG.API_URL}/admin/exams`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(
            CONFIG.STORAGE_KEYS.ADMIN_TOKEN
          )}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.exams = data.exams || [];
      }
    } catch (error) {
      console.error("Error al cargar exámenes:", error);
      uiService.showNotification(
        "Error al cargar exámenes",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  // ===== CREAR/EDITAR EXAMEN =====
  showCreateModal() {
    this.currentExam = null;
    document.getElementById("modalTitle").textContent = "Nuevo Examen";
    document.getElementById("submitButtonText").textContent = "Crear Examen";
    document.getElementById("examForm").reset();
    document.getElementById("examModal").classList.remove("hidden");
  }

  async editExam(id) {
    const exam = this.exams.find((e) => e.id === id);
    if (!exam) return;

    this.currentExam = exam;
    document.getElementById("modalTitle").textContent = "Editar Examen";
    document.getElementById("submitButtonText").textContent = "Guardar Cambios";

    document.getElementById("examNombre").value = exam.nombre;
    document.getElementById("examFecha").value = exam.fecha.split("T")[0];
    document.getElementById("examNotaMinima").value = exam.nota_minima;
    document.getElementById("examPrecioPunto").value = exam.precio_por_punto;
    document.getElementById("examActivo").value = exam.activo ? "1" : "0";

    document.getElementById("examModal").classList.remove("hidden");
  }

  closeModal() {
    document.getElementById("examModal").classList.add("hidden");
    this.currentExam = null;
  }

  attachFormListeners() {
    const form = document.getElementById("examForm");
    if (form) {
      form.onsubmit = (e) => this.handleSubmit(e);
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const examData = {
      nombre: document.getElementById("examNombre").value,
      fecha: document.getElementById("examFecha").value,
      nota_minima: parseFloat(document.getElementById("examNotaMinima").value),
      precio_por_punto: parseFloat(
        document.getElementById("examPrecioPunto").value
      ),
      activo: parseInt(document.getElementById("examActivo").value),
    };

    try {
      const url = this.currentExam
        ? `${CONFIG.API_URL}/admin/exams/${this.currentExam.id}`
        : `${CONFIG.API_URL}/admin/exams`;

      const method = this.currentExam ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            CONFIG.STORAGE_KEYS.ADMIN_TOKEN
          )}`,
        },
        body: JSON.stringify(examData),
      });

      const data = await response.json();

      if (data.success) {
        uiService.showNotification(data.message, NOTIFICATION_TYPES.SUCCESS);
        this.closeModal();
        await this.render();
      } else {
        uiService.showNotification(data.message, NOTIFICATION_TYPES.ERROR);
      }
    } catch (error) {
      console.error("Error:", error);
      uiService.showNotification(
        "Error al procesar la solicitud",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  async deleteExam(id) {
    if (
      !confirm(
        "¿Estás seguro de eliminar este examen? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${CONFIG.API_URL}/admin/exams/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem(
            CONFIG.STORAGE_KEYS.ADMIN_TOKEN
          )}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        uiService.showNotification(data.message, NOTIFICATION_TYPES.SUCCESS);
        await this.render();
      } else {
        uiService.showNotification(data.message, NOTIFICATION_TYPES.ERROR);
      }
    } catch (error) {
      console.error("Error:", error);
      uiService.showNotification(
        "Error al eliminar examen",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  // ===== GESTIÓN DE ARCHIVOS =====
  async showFiles(examId) {
    this.currentExam = this.exams.find((e) => e.id === examId);
    document.getElementById("filesModal").classList.remove("hidden");
    await this.loadFiles(examId);
  }

  closeFilesModal() {
    document.getElementById("filesModal").classList.add("hidden");
    this.currentExam = null;
  }

  async loadFiles(examId) {
    try {
      const response = await fetch(
        `${CONFIG.API_URL}/admin/exams/${examId}/files`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              CONFIG.STORAGE_KEYS.ADMIN_TOKEN
            )}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        this.renderFilesList(data.files || []);
      } else {
        console.error("Error al cargar archivos, status:", response.status);
      }
    } catch (error) {
      console.error("Error al cargar archivos:", error);
    }
  }

  renderFilesList(files) {
    const container = document.getElementById("filesList");

    if (!container) {
      console.error("Contenedor filesList no encontrado");
      return;
    }

    if (files.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8">
          <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 text-slate-300"></i>
          <p class="text-slate-400">No hay archivos adjuntos</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = files
      .map(
        (file) => `
      <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
        <div class="flex items-center gap-3 flex-1">
          <i data-lucide="file-text" class="w-8 h-8 text-slate-400"></i>
          <div>
            <p class="font-medium text-slate-700">${file.nombre_original}</p>
            <p class="text-xs text-slate-500">${this.formatFileSize(
              file.tamanio
            )} • ${this.formatDate(file.fecha_subida)}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <a href="${CONFIG.API_URL.replace(
            "/api",
            ""
          )}/api/admin/exams/files/${file.id}/download" 
             download
             class="p-2 hover:bg-white rounded-lg text-blue-600"
             title="Descargar">
            <i data-lucide="download" class="w-5 h-5"></i>
          </a>
          ${
            this.userRole === "admin"
              ? `
            <button onclick="examenesModule.deleteFile(${file.id})"
                    class="p-2 hover:bg-white rounded-lg text-red-600"
                    title="Eliminar">
              <i data-lucide="trash-2" class="w-5 h-5"></i>
            </button>
          `
              : ""
          }
        </div>
      </div>
    `
      )
      .join("");

    lucide.createIcons();
  }

  async handleFileSelect(event) {
    const files = event.target.files;
    if (!files.length || !this.currentExam) {
      console.warn("No files selected or no current exam");
      return;
    }

    const formData = new FormData();
    for (let file of files) {
      formData.append("files", file);
    }

    try {
      const response = await fetch(
        `${CONFIG.API_URL}/admin/exams/${this.currentExam.id}/files`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              CONFIG.STORAGE_KEYS.ADMIN_TOKEN
            )}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        uiService.showNotification(data.message, NOTIFICATION_TYPES.SUCCESS);
        await this.loadFiles(this.currentExam.id);
        event.target.value = "";
      } else {
        uiService.showNotification(data.message, NOTIFICATION_TYPES.ERROR);
      }
    } catch (error) {
      console.error("Error al subir archivos:", error);
      uiService.showNotification(
        "Error al subir archivos",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  async deleteFile(fileId) {
    if (!confirm("¿Eliminar este archivo?")) return;

    try {
      const response = await fetch(
        `${CONFIG.API_URL}/admin/exams/files/${fileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              CONFIG.STORAGE_KEYS.ADMIN_TOKEN
            )}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        uiService.showNotification(data.message, NOTIFICATION_TYPES.SUCCESS);
        if (this.currentExam) {
          await this.loadFiles(this.currentExam.id);
        } else {
          console.error("currentExam es null después de eliminar");
        }
      } else {
        uiService.showNotification(data.message, NOTIFICATION_TYPES.ERROR);
      }
    } catch (error) {
      console.error("Error al eliminar archivo:", error);
      uiService.showNotification(
        "Error al eliminar archivo",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  // ===== FILTROS =====
  filterExams() {
    const searchTerm = document
      .getElementById("searchExam")
      .value.toLowerCase();
    const statusFilter = document.getElementById("filterStatus").value;

    const filtered = this.exams.filter((exam) => {
      const matchesSearch = exam.nombre.toLowerCase().includes(searchTerm);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && exam.activo) ||
        (statusFilter === "inactive" && !exam.activo);
      return matchesSearch && matchesStatus;
    });

    const tempExams = this.exams;
    this.exams = filtered;
    document.getElementById("examsList").innerHTML = this.renderExamsList();
    lucide.createIcons();
    this.exams = tempExams;
  }

  // ===== UTILIDADES =====
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
}

// Inicializar módulo
export const examenesModule = new ExamenesModule();
