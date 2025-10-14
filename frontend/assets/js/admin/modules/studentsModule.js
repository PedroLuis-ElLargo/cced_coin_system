// ==========================================
// STUDENTS-MODULE.JS - Módulo de Estudiantes
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";
import { NOTIFICATION_TYPES } from "../config.js";

class StudentsModule {
  constructor() {
    this.currentFilter = "all"; // all, active, inactive
    this.allStudents = [];
  }

  render() {
    const content = `
      <div class="space-y-6">
        <div class="bg-white p-4 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="relative flex-1 w-full sm:max-w-md">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3">
              <i data-lucide="search" class="h-5 w-5 text-slate-400"></i>
            </span>
            <input
              type="text"
              id="searchStudents"
              placeholder="Buscar estudiante por nombre o email..."
              class="w-full py-2.5 pl-10 pr-4 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            />
          </div>
          <div class="flex gap-2">
            <button id="filterStudentsBtn" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg flex items-center gap-2 text-sm">
              <i data-lucide="filter" class="w-4 h-4"></i>
              Filtros
            </button>
            <button id="openNewStudentModal" class="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg flex items-center gap-2 text-sm">
              <i data-lucide="user-plus" class="w-4 h-4"></i>
              Nuevo Estudiante
            </button>
          </div>
        </div>

        <!-- Filtros desplegables -->
        <div id="filtersContainer" class="hidden bg-white p-4 rounded-xl shadow-lg">
          <div class="flex flex-wrap gap-2">
            <button class="filter-btn px-4 py-2 rounded-lg text-sm transition-colors bg-sky-500 text-white" data-filter="all">
              Todos
            </button>
            <button class="filter-btn px-4 py-2 rounded-lg text-sm transition-colors bg-slate-200 text-slate-700 hover:bg-slate-300" data-filter="high-balance">
              Alto Balance (>100)
            </button>
            <button class="filter-btn px-4 py-2 rounded-lg text-sm transition-colors bg-slate-200 text-slate-700 hover:bg-slate-300" data-filter="low-balance">
              Bajo Balance (<50)
            </button>
            <button class="filter-btn px-4 py-2 rounded-lg text-sm transition-colors bg-slate-200 text-slate-700 hover:bg-slate-300" data-filter="many-tasks">
              Muchas Tareas (>5)
            </button>
            <button class="filter-btn px-4 py-2 rounded-lg text-sm transition-colors bg-slate-200 text-slate-700 hover:bg-slate-300" data-filter="few-tasks">
              Pocas Tareas (<3)
            </button>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Estudiante</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Balance</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tareas</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Estado</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody id="studentsTableBody">
                <tr>
                  <td colspan="6" class="px-4 py-8 text-center text-slate-400">
                    <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin"></i>
                    <p>Cargando estudiantes...</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Ver Detalles -->
      <div id="viewStudentModal" class="fixed inset-0 bg-black bg-opacity-50 hidden opacity-0 transition-opacity duration-300 z-50 flex items-center justify-center p-4">
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform scale-95 opacity-0 transition-all duration-300">
          <div class="p-6 border-b border-slate-200">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold text-slate-800">Detalles del Estudiante</h2>
              <button id="closeViewStudentModalBtn" class="text-slate-400 hover:text-slate-600 transition-colors">
                <i data-lucide="x" class="w-6 h-6"></i>
              </button>
            </div>
          </div>
          <div id="viewStudentContent" class="p-6">
            <!-- Contenido dinámico -->
          </div>
        </div>
      </div>

      <!-- Modal Editar Estudiante -->
      <div id="editStudentModal" class="fixed inset-0 bg-black bg-opacity-50 hidden opacity-0 transition-opacity duration-300 z-50 flex items-center justify-center p-4">
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-lg w-full transform scale-95 opacity-0 transition-all duration-300">
          <div class="p-6 border-b border-slate-200">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold text-slate-800">Editar Estudiante</h2>
              <button id="closeEditStudentModalBtn" class="text-slate-400 hover:text-slate-600 transition-colors">
                <i data-lucide="x" class="w-6 h-6"></i>
              </button>
            </div>
          </div>
          <form id="editStudentForm" class="p-6 space-y-4">
            <input type="hidden" id="editStudentId">
            
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Nombre Completo</label>
              <input
                type="text"
                id="editStudentName"
                required
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                id="editStudentEmail"
                required
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="estudiante@ejemplo.com"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Balance de Monedas</label>
              <input
                type="number"
                id="editStudentBalance"
                required
                min="0"
                step="0.01"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="0"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Nueva Contraseña (opcional)</label>
              <input
                type="password"
                id="editStudentPassword"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="Dejar vacío para mantener la actual"
              />
              <p class="text-xs text-slate-500 mt-1">Mínimo 6 caracteres si deseas cambiarla</p>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <button
                type="button"
                id="cancelEditStudentBtn"
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
      <div id="deleteStudentModal" class="fixed inset-0 bg-black bg-opacity-50 hidden opacity-0 transition-opacity duration-300 z-50 flex items-center justify-center p-4">
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-md w-full transform scale-95 opacity-0 transition-all duration-300">
          <div class="p-6">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i data-lucide="alert-triangle" class="w-8 h-8 text-red-600"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800 text-center mb-2">¿Eliminar Estudiante?</h3>
            <p class="text-slate-600 text-center mb-2">Esta acción no se puede deshacer.</p>
            <div id="deleteStudentInfo" class="bg-slate-50 rounded-lg p-4 mb-6">
              <!-- Información del estudiante a eliminar -->
            </div>
            <div class="flex gap-3">
              <button
                id="cancelDeleteStudentBtn"
                class="flex-1 px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                id="confirmDeleteStudentBtn"
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
    this.initFilterButton();
    this.initEditForm();
    this.setupEventListeners();
  }

  // ==========================================
  // CONFIGURAR EVENT LISTENERS
  // ==========================================
  setupEventListeners() {
    // Filters (buttons inside filtersContainer)
    const filtersContainer = document.getElementById('filtersContainer');
    if (filtersContainer) {
      filtersContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-filter]');
        if (!btn) return;
        const filter = btn.getAttribute('data-filter');
        this.applyFilter(filter);
      });
    }

    // Delegate actions in students table
    const tbody = document.getElementById('studentsTableBody');
    if (tbody) {
      tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'view') this.view(Number(id));
        else if (action === 'edit') this.edit(Number(id));
        else if (action === 'delete') this.delete(Number(id));
      });
    }

    // Modal close/cancel/confirm buttons
    const closeViewBtn = document.getElementById('closeViewStudentModalBtn');
    if (closeViewBtn) closeViewBtn.addEventListener('click', () => this.closeViewModal());

    const closeEditBtn = document.getElementById('closeEditStudentModalBtn');
    if (closeEditBtn) closeEditBtn.addEventListener('click', () => this.closeEditModal());

    const cancelEditBtn = document.getElementById('cancelEditStudentBtn');
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => this.closeEditModal());

    const cancelDeleteBtn = document.getElementById('cancelDeleteStudentBtn');
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());

    const confirmDeleteBtn = document.getElementById('confirmDeleteStudentBtn');
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());

    // Actions inside the view modal (e.g., edit-from-view)
    const viewContent = document.getElementById('viewStudentContent');
    if (viewContent) {
      viewContent.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        if (action === 'edit-from-view') this.edit(Number(id));
      });
    }
  }

  async loadData() {
    try {
      const data = await apiService.getStudents();
      const tbody = document.getElementById("studentsTableBody");

      if (!tbody) return;

      if (!data.success || data.students.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="px-4 py-8 text-center text-slate-400">
              <i data-lucide="users" class="w-12 h-12 mx-auto mb-2 text-slate-300"></i>
              <p>No hay estudiantes registrados</p>
            </td>
          </tr>
        `;
        lucide.createIcons();
        return;
      }

      this.allStudents = data.students;
      this.renderStudents(this.allStudents);
    } catch (error) {
      console.error("Error cargando estudiantes:", error);
      uiService.showNotification(
        "Error al cargar estudiantes",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  renderStudents(students) {
    const tbody = document.getElementById("studentsTableBody");
    if (!tbody) return;

    tbody.innerHTML = students
      .map((student) => this.createStudentRow(student))
      .join("");

    lucide.createIcons();
  }

  createStudentRow(student) {
    return `
      <tr class="border-b border-slate-100 hover:bg-slate-50">
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold">
              ${student.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <p class="font-medium text-slate-800">${student.nombre}</p>
              <p class="text-xs text-slate-500">ID: ${student.id_estudiante}</p>
            </div>
          </div>
        </td>
        <td class="px-4 py-3 text-slate-600">${student.email}</td>
        <td class="px-4 py-3">
          <span class="flex items-center text-amber-600 font-semibold">
            <i data-lucide="coins" class="w-4 h-4 mr-1"></i>
            ${student.balance}
          </span>
        </td>
        <td class="px-4 py-3">
          <span class="text-slate-700">${student.tareas_completadas}</span>
        </td>
        <td class="px-4 py-3">
          <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Activo</span>
        </td>
        <td class="px-4 py-3">
          <div class="flex gap-2">
            <button data-action="view" data-id="${student.id_estudiante}" class="p-2 text-sky-600 hover:bg-sky-50 rounded-lg" title="Ver detalles">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            <button data-action="edit" data-id="${student.id_estudiante}" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Editar">
              <i data-lucide="edit" class="w-4 h-4"></i>
            </button>
            <button data-action="delete" data-id="${student.id_estudiante}" class="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  initSearch() {
    const searchInput = document.getElementById("searchStudents");
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const rows = document.querySelectorAll("#studentsTableBody tr");

      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
      });
    });
  }

  initFilterButton() {
    const filterBtn = document.getElementById("filterStudentsBtn");
    const filtersContainer = document.getElementById("filtersContainer");

    if (filterBtn && filtersContainer) {
      filterBtn.addEventListener("click", () => {
        filtersContainer.classList.toggle("hidden");
      });
    }
  }

  applyFilter(filterType) {
    this.currentFilter = filterType;

    // Actualizar estilos de botones
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      if (btn.dataset.filter === filterType) {
        btn.classList.remove("bg-slate-200", "text-slate-700");
        btn.classList.add("bg-sky-500", "text-white");
      } else {
        btn.classList.remove("bg-sky-500", "text-white");
        btn.classList.add("bg-slate-200", "text-slate-700");
      }
    });

    // Aplicar filtro
    let filteredStudents = [...this.allStudents];

    switch (filterType) {
      case "high-balance":
        filteredStudents = this.allStudents.filter((s) => s.balance > 100);
        break;
      case "low-balance":
        filteredStudents = this.allStudents.filter((s) => s.balance < 50);
        break;
      case "many-tasks":
        filteredStudents = this.allStudents.filter(
          (s) => s.tareas_completadas > 5
        );
        break;
      case "few-tasks":
        filteredStudents = this.allStudents.filter(
          (s) => s.tareas_completadas < 3
        );
        break;
      default:
        filteredStudents = this.allStudents;
    }

    this.renderStudents(filteredStudents);

    uiService.showNotification(
      `Filtro aplicado: ${filteredStudents.length} estudiante(s)`,
      NOTIFICATION_TYPES.INFO
    );
  }

  // ==========================================
  // VER DETALLES
  // ==========================================
  view(id) {
    const student = this.allStudents.find((s) => s.id_estudiante === id);
    if (!student) return;

    const content = `
      <div class="space-y-6">
        <div class="flex items-center gap-4 pb-6 border-b border-slate-200">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-3xl font-bold">
            ${student.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 class="text-2xl font-bold text-slate-800">${student.nombre}</h3>
            <p class="text-slate-600">${student.email}</p>
            <span class="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">Activo</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-amber-800 mb-1">Balance de Monedas</p>
                <p class="text-3xl font-bold text-amber-600">${
                  student.balance
                }</p>
              </div>
              <div class="w-14 h-14 bg-amber-200 rounded-full flex items-center justify-center">
                <i data-lucide="coins" class="w-7 h-7 text-amber-600"></i>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-emerald-800 mb-1">Tareas Completadas</p>
                <p class="text-3xl font-bold text-emerald-600">${
                  student.tareas_completadas
                }</p>
              </div>
              <div class="w-14 h-14 bg-emerald-200 rounded-full flex items-center justify-center">
                <i data-lucide="check-circle" class="w-7 h-7 text-emerald-600"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-slate-50 rounded-xl p-6">
          <h4 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <i data-lucide="info" class="w-5 h-5"></i>
            Información Adicional
          </h4>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-slate-600">ID de Estudiante:</span>
              <span class="font-semibold text-slate-800">${
                student.id_estudiante
              }</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Fecha de Registro:</span>
              <span class="font-semibold text-slate-800">${
                student.fecha_registro
                  ? new Date(student.fecha_registro).toLocaleDateString("es-ES")
                  : "No disponible"
              }</span>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            data-action="edit-from-view"
            data-id="${id}"
            class="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <i data-lucide="edit" class="w-5 h-5"></i>
            Editar Estudiante
          </button>
          <button
            id="closeViewStudentModalBtn"
            class="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    `;

    document.getElementById("viewStudentContent").innerHTML = content;
    uiService.openModal("viewStudentModal");
    lucide.createIcons();
  }

  closeViewModal() {
    uiService.closeModal("viewStudentModal");
  }

  // ==========================================
  // EDITAR ESTUDIANTE
  // ==========================================
  edit(id) {
    const student = this.allStudents.find((s) => s.id_estudiante === id);
    if (!student) return;

    // Prellenar formulario
    document.getElementById("editStudentId").value = student.id_estudiante;
    document.getElementById("editStudentName").value = student.nombre;
    document.getElementById("editStudentEmail").value = student.email;
    document.getElementById("editStudentBalance").value = student.balance;
    document.getElementById("editStudentPassword").value = "";

    // Cerrar modal de vista si está abierto
    this.closeViewModal();

    // Abrir modal de edición
    uiService.openModal("editStudentModal");
    lucide.createIcons();
  }

  initEditForm() {
    const form = document.getElementById("editStudentForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleEditSubmit();
    });
  }

  async handleEditSubmit() {
    const id = document.getElementById("editStudentId").value;
    const nombre = document.getElementById("editStudentName").value;
    const email = document.getElementById("editStudentEmail").value;
    const balance = document.getElementById("editStudentBalance").value;
    const password = document.getElementById("editStudentPassword").value;

    if (!nombre || !email || !balance) {
      uiService.showNotification(
        "Por favor completa todos los campos requeridos",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    if (password && password.length < 6) {
      uiService.showNotification(
        "La contraseña debe tener al menos 6 caracteres",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    try {
      const updateData = {
        nombre,
        email,
        balance: parseFloat(balance),
      };

      if (password) {
        updateData.password = password;
      }

      const data = await apiService.updateStudent(id, updateData);

      if (data.success) {
        uiService.showNotification(
          "✅ Estudiante actualizado exitosamente",
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
      console.error("Error actualizando estudiante:", error);
      uiService.showNotification(
        "❌ Error al actualizar estudiante",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  closeEditModal() {
    uiService.closeModal("editStudentModal");
    document.getElementById("editStudentForm").reset();
  }

  // ==========================================
  // ELIMINAR ESTUDIANTE
  // ==========================================
  delete(id) {
    const student = this.allStudents.find((s) => s.id_estudiante === id);
    if (!student) return;

    // Mostrar información del estudiante
    const infoHtml = `
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold text-lg">
          ${student.nombre.charAt(0).toUpperCase()}
        </div>
        <div class="text-left">
          <p class="font-semibold text-slate-800">${student.nombre}</p>
          <p class="text-sm text-slate-600">${student.email}</p>
          <p class="text-xs text-slate-500 mt-1">
            ${student.balance} monedas • ${student.tareas_completadas} tareas
          </p>
        </div>
      </div>
    `;

    document.getElementById("deleteStudentInfo").innerHTML = infoHtml;

    // Guardar ID para confirmación
    this.studentToDelete = id;

    uiService.openModal("deleteStudentModal");
    lucide.createIcons();
  }

  async confirmDelete() {
    if (!this.studentToDelete) return;

    try {
      const data = await apiService.deleteStudent(this.studentToDelete);

      if (data.success) {
        uiService.showNotification(
          "✅ Estudiante eliminado exitosamente",
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
      console.error("Error eliminando estudiante:", error);
      uiService.showNotification(
        "❌ Error al eliminar estudiante",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  closeDeleteModal() {
    uiService.closeModal("deleteStudentModal");
    this.studentToDelete = null;
  }
}

export default new StudentsModule();
