// ==========================================
// MÓDULO DE MONEDAS - COMPLETO
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";
import { NOTIFICATION_TYPES } from "../config.js";

class MonedasModule {
  constructor() {
    this.students = [];
    this.transactions = [];
  }

  // ==========================================
  // RENDERIZAR VISTA PRINCIPAL
  // ==========================================
  render() {
    const content = `
      <div class="space-y-6">
        <!-- Tarjetas de Estadísticas -->
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
                <p class="text-slate-500 text-sm">Estudiantes Activos</p>
                <p class="text-2xl font-bold text-emerald-600" id="activeStudents">0</p>
              </div>
              <div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <i data-lucide="users" class="w-6 h-6 text-emerald-600"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones Rápidas -->
        <div class="bg-white p-6 rounded-xl shadow-lg">
          <h3 class="text-lg font-semibold text-slate-700 mb-4">Gestión de Monedas</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onclick="window.monedasModule.openAddCoinsModal()"
              class="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-sky-500 hover:bg-sky-50 transition-colors"
            >
              <i data-lucide="plus-circle" class="w-8 h-8 mx-auto mb-2 text-sky-600"></i>
              <p class="text-sm font-medium text-slate-600">Agregar Monedas</p>
            </button>
            <button 
              onclick="window.monedasModule.openRemoveCoinsModal()"
              class="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
            >
              <i data-lucide="minus-circle" class="w-8 h-8 mx-auto mb-2 text-red-600"></i>
              <p class="text-sm font-medium text-slate-600">Retirar Monedas</p>
            </button>
            <button 
              onclick="window.monedasModule.loadTransactions()"
              class="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <i data-lucide="history" class="w-8 h-8 mx-auto mb-2 text-purple-600"></i>
              <p class="text-sm font-medium text-slate-600">Ver Historial</p>
            </button>
          </div>
        </div>

        <!-- Ranking de Monedas -->
        <div class="bg-white p-6 rounded-xl shadow-lg">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-slate-700">Top 10 - Más Monedas</h3>
            <button 
              onclick="window.monedasModule.loadStats()"
              class="text-sky-600 hover:text-sky-700 text-sm font-medium"
            >
              <i data-lucide="refresh-cw" class="w-4 h-4 inline"></i> Actualizar
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th class="px-4 py-3 text-left">Posición</th>
                  <th class="px-4 py-3 text-left">Estudiante</th>
                  <th class="px-4 py-3 text-right">CCED Coins</th>
                  <th class="px-4 py-3 text-right">Tareas</th>
                  <th class="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody id="topStudentsTable" class="divide-y divide-slate-200">
                <tr>
                  <td colspan="5" class="px-4 py-8 text-center text-slate-400">
                    <i data-lucide="loader" class="w-6 h-6 mx-auto mb-2 animate-spin"></i>
                    Cargando...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Historial de Transacciones -->
        <div id="transactionsSection" class="bg-white p-6 rounded-xl shadow-lg hidden">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-slate-700">Historial de Transacciones</h3>
            <button 
              onclick="document.getElementById('transactionsSection').classList.add('hidden')"
              class="text-slate-400 hover:text-slate-600"
            >
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th class="px-4 py-3 text-left">Fecha</th>
                  <th class="px-4 py-3 text-left">Estudiante</th>
                  <th class="px-4 py-3 text-left">Tipo</th>
                  <th class="px-4 py-3 text-right">Monto</th>
                  <th class="px-4 py-3 text-left">Motivo</th>
                </tr>
              </thead>
              <tbody id="transactionsTable" class="divide-y divide-slate-200">
                <!-- Se llenará dinámicamente -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Agregar Monedas -->
      <div id="addCoinsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 hidden opacity-0 transition-opacity duration-300">
        <div class="bg-white p-8 rounded-xl shadow-2xl w-11/12 max-w-md transform scale-95 transition-transform duration-300">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-slate-800 flex items-center">
              <i data-lucide="plus-circle" class="w-6 h-6 mr-2 text-sky-600"></i>
              Agregar Monedas
            </h2>
            <button onclick="window.monedasModule.closeModal('addCoinsModal')" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-6 h-6"></i>
            </button>
          </div>
          <form id="addCoinsForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Estudiante</label>
              <select 
                id="addCoinsStudent" 
                required
                class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="">Selecciona un estudiante</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
              <input 
                type="number" 
                id="addCoinsAmount" 
                min="1"
                required
                placeholder="Ej: 50"
                class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
              <textarea 
                id="addCoinsReason" 
                rows="3"
                required
                placeholder="Ej: Buen desempeño en clase"
                class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              ></textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-2">
              <button 
                type="button"
                onclick="window.monedasModule.closeModal('addCoinsModal')"
                class="px-4 py-2 text-sm font-medium rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                class="px-4 py-2 text-sm font-medium rounded-md bg-sky-600 text-white hover:bg-sky-700"
              >
                Agregar Monedas
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Retirar Monedas -->
      <div id="removeCoinsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 hidden opacity-0 transition-opacity duration-300">
        <div class="bg-white p-8 rounded-xl shadow-2xl w-11/12 max-w-md transform scale-95 transition-transform duration-300">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-slate-800 flex items-center">
              <i data-lucide="minus-circle" class="w-6 h-6 mr-2 text-red-600"></i>
              Retirar Monedas
            </h2>
            <button onclick="window.monedasModule.closeModal('removeCoinsModal')" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-6 h-6"></i>
            </button>
          </div>
          <form id="removeCoinsForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Estudiante</label>
              <select 
                id="removeCoinsStudent" 
                required
                class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="">Selecciona un estudiante</option>
              </select>
              <p class="text-xs text-slate-500 mt-1">
                Balance actual: <span id="currentBalance" class="font-semibold">0</span> CCED
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
              <input 
                type="number" 
                id="removeCoinsAmount" 
                min="1"
                required
                placeholder="Ej: 20"
                class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
              <textarea 
                id="removeCoinsReason" 
                rows="3"
                required
                placeholder="Ej: Compra de beneficio especial"
                class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              ></textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-2">
              <button 
                type="button"
                onclick="window.monedasModule.closeModal('removeCoinsModal')"
                class="px-4 py-2 text-sm font-medium rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                class="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Retirar Monedas
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    uiService.updateMainContent(content);
    this.init();
  }

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================
  async init() {
    await this.loadStats();
    await this.loadStudents();
    this.setupEventListeners();
    lucide.createIcons();
  }

  // ==========================================
  // CARGAR ESTADÍSTICAS
  // ==========================================
  async loadStats() {
    try {
      const [statsData, studentsData] = await Promise.all([
        apiService.getStatistics(),
        apiService.getStudents(),
      ]);

      if (statsData.success) {
        const stats = statsData.statistics;

        // Actualizar estadísticas generales
        const totalCoinsEl = document.getElementById("totalCoins");
        const avgCoinsEl = document.getElementById("avgCoins");
        const activeStudentsEl = document.getElementById("activeStudents");

        if (totalCoinsEl) {
          totalCoinsEl.textContent = Math.floor(
            stats.monedas_circulacion || 0
          ).toLocaleString("es-ES");
        }

        if (avgCoinsEl) {
          const avg =
            stats.total_estudiantes > 0
              ? Math.floor(stats.monedas_circulacion / stats.total_estudiantes)
              : 0;
          avgCoinsEl.textContent = avg.toLocaleString("es-ES");
        }

        if (activeStudentsEl) {
          activeStudentsEl.textContent = (
            stats.total_estudiantes || 0
          ).toLocaleString("es-ES");
        }
      }

      // Actualizar ranking
      if (studentsData.success) {
        this.renderTopStudents(studentsData.students);
      }

      lucide.createIcons();
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
      uiService.showNotification(
        "Error al cargar estadísticas",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  // ==========================================
  // RENDERIZAR TOP ESTUDIANTES
  // ==========================================
  renderTopStudents(students) {
    const tbody = document.getElementById("topStudentsTable");
    if (!tbody) return;

    const sortedStudents = [...students]
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);

    if (sortedStudents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="px-4 py-8 text-center text-slate-400">
            No hay estudiantes registrados
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = sortedStudents
      .map((student, index) => {
        const medals = ["🥇", "🥈", "🥉"];
        const medal = index < 3 ? medals[index] : `#${index + 1}`;

        return `
          <tr class="hover:bg-slate-50">
            <td class="px-4 py-3 font-semibold text-lg">${medal}</td>
            <td class="px-4 py-3">
              <div class="font-medium text-slate-900">${student.nombre}</div>
              <div class="text-xs text-slate-500">${student.email}</div>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="font-semibold text-amber-600">
                ${Math.floor(student.balance).toLocaleString("es-ES")} CCED
              </span>
            </td>
            <td class="px-4 py-3 text-right text-slate-600">
              ${student.tareas_completadas || 0}
            </td>
            <td class="px-4 py-3 text-center">
              <button 
                onclick="window.monedasModule.quickAddCoins(${student.id}, '${
          student.nombre
        }')"
                class="text-sky-600 hover:text-sky-700 mr-2"
                title="Agregar monedas"
              >
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
              </button>
              <button 
                onclick="window.monedasModule.quickRemoveCoins(${
                  student.id
                }, '${student.nombre}', ${student.balance})"
                class="text-red-600 hover:text-red-700"
                title="Retirar monedas"
              >
                <i data-lucide="minus-circle" class="w-4 h-4"></i>
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    lucide.createIcons();
  }

  // ==========================================
  // CARGAR ESTUDIANTES
  // ==========================================
  async loadStudents() {
    try {
      const data = await apiService.getStudents();

      if (data.success) {
        this.students = data.students.sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        );
        this.populateStudentSelects();
      }
    } catch (error) {
      console.error("Error cargando estudiantes:", error);
    }
  }

  // ==========================================
  // POBLAR SELECTORES
  // ==========================================
  populateStudentSelects() {
    const addSelect = document.getElementById("addCoinsStudent");
    const removeSelect = document.getElementById("removeCoinsStudent");

    const options = this.students
      .map(
        (s) =>
          `<option value="${s.id}">${s.nombre} (${Math.floor(
            s.balance
          )} CCED)</option>`
      )
      .join("");

    if (addSelect) {
      addSelect.innerHTML =
        '<option value="">Selecciona un estudiante</option>' + options;
    }

    if (removeSelect) {
      removeSelect.innerHTML =
        '<option value="">Selecciona un estudiante</option>' + options;
    }
  }

  // ==========================================
  // CONFIGURAR EVENT LISTENERS
  // ==========================================
  setupEventListeners() {
    // Formulario agregar monedas
    const addForm = document.getElementById("addCoinsForm");
    if (addForm) {
      addForm.addEventListener("submit", (e) => this.handleAddCoins(e));
    }

    // Formulario retirar monedas
    const removeForm = document.getElementById("removeCoinsForm");
    if (removeForm) {
      removeForm.addEventListener("submit", (e) => this.handleRemoveCoins(e));
    }

    // Actualizar balance al seleccionar estudiante
    const removeSelect = document.getElementById("removeCoinsStudent");
    if (removeSelect) {
      removeSelect.addEventListener("change", (e) => {
        const student = this.students.find((s) => s.id == e.target.value);
        const balanceEl = document.getElementById("currentBalance");
        if (balanceEl && student) {
          balanceEl.textContent = Math.floor(student.balance).toLocaleString(
            "es-ES"
          );
        }
      });
    }
  }

  // ==========================================
  // ABRIR MODALES
  // ==========================================
  openAddCoinsModal() {
    this.openModal("addCoinsModal");
  }

  openRemoveCoinsModal() {
    this.openModal("removeCoinsModal");
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove("hidden");
    setTimeout(() => {
      modal.classList.add("opacity-100");
      modal.querySelector(".transform").classList.remove("scale-95");
      modal.querySelector(".transform").classList.add("scale-100");
    }, 10);
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove("opacity-100");
    modal.querySelector(".transform").classList.remove("scale-100");
    modal.querySelector(".transform").classList.add("scale-95");

    setTimeout(() => {
      modal.classList.add("hidden");
      // Limpiar formularios
      const form = modal.querySelector("form");
      if (form) form.reset();
    }, 300);
  }

  // ==========================================
  // AGREGAR MONEDAS
  // ==========================================
  async handleAddCoins(e) {
    e.preventDefault();

    const studentId = document.getElementById("addCoinsStudent").value;
    const amount = parseInt(document.getElementById("addCoinsAmount").value);
    const reason = document.getElementById("addCoinsReason").value;

    if (!studentId || !amount || amount <= 0) {
      uiService.showNotification(
        "Por favor completa todos los campos correctamente",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    try {
      const data = await apiService.addCoinsToStudent(
        studentId,
        amount,
        reason
      );

      if (data.success) {
        uiService.showNotification(
          `✅ Se agregaron ${amount} CCED Coins exitosamente`,
          NOTIFICATION_TYPES.SUCCESS
        );
        this.closeModal("addCoinsModal");
        await this.loadStats();
        await this.loadStudents();
      } else {
        uiService.showNotification(
          data.message || "Error al agregar monedas",
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error agregando monedas:", error);
      uiService.showNotification(
        "Error al agregar monedas",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  // ==========================================
  // RETIRAR MONEDAS
  // ==========================================
  async handleRemoveCoins(e) {
    e.preventDefault();

    const studentId = document.getElementById("removeCoinsStudent").value;
    const amount = parseInt(document.getElementById("removeCoinsAmount").value);
    const reason = document.getElementById("removeCoinsReason").value;

    if (!studentId || !amount || amount <= 0) {
      uiService.showNotification(
        "Por favor completa todos los campos correctamente",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    const student = this.students.find((s) => s.id == studentId);
    if (!student || student.balance < amount) {
      uiService.showNotification(
        "El estudiante no tiene suficientes monedas",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    try {
      const data = await apiService.removeCoinsFromStudent(
        studentId,
        amount,
        reason
      );

      if (data.success) {
        uiService.showNotification(
          `✅ Se retiraron ${amount} CCED Coins exitosamente`,
          NOTIFICATION_TYPES.SUCCESS
        );
        this.closeModal("removeCoinsModal");
        await this.loadStats();
        await this.loadStudents();
      } else {
        uiService.showNotification(
          data.message || "Error al retirar monedas",
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error retirando monedas:", error);
      uiService.showNotification(
        "Error al retirar monedas",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  // ==========================================
  // ACCIONES RÁPIDAS
  // ==========================================
  quickAddCoins(studentId, studentName) {
    this.openAddCoinsModal();
    setTimeout(() => {
      const select = document.getElementById("addCoinsStudent");
      if (select) select.value = studentId;
    }, 100);
  }

  quickRemoveCoins(studentId, studentName, balance) {
    this.openRemoveCoinsModal();
    setTimeout(() => {
      const select = document.getElementById("removeCoinsStudent");
      if (select) {
        select.value = studentId;
        select.dispatchEvent(new Event("change"));
      }
    }, 100);
  }

  // ==========================================
  // CARGAR HISTORIAL DE TRANSACCIONES
  // ==========================================
  async loadTransactions() {
    try {
      const data = await apiService.getTransactions();

      if (data.success) {
        this.renderTransactions(data.transactions || []);
        document
          .getElementById("transactionsSection")
          .classList.remove("hidden");
      }
    } catch (error) {
      console.error("Error cargando transacciones:", error);
      uiService.showNotification(
        "Error al cargar historial",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  // ==========================================
  // RENDERIZAR TRANSACCIONES
  // ==========================================
  renderTransactions(transactions) {
    const tbody = document.getElementById("transactionsTable");
    if (!tbody) return;

    if (transactions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="px-4 py-8 text-center text-slate-400">
            No hay transacciones registradas
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = transactions
      .slice(0, 50)
      .map((t) => {
        const typeColor =
          t.tipo === "credito" ? "text-green-600" : "text-red-600";
        const typeIcon = t.tipo === "credito" ? "arrow-up" : "arrow-down";
        const typeText = t.tipo === "credito" ? "Crédito" : "Débito";
        const amount = t.tipo === "credito" ? `+${t.monto}` : `-${t.monto}`;

        return `
          <tr class="hover:bg-slate-50">
            <td class="px-4 py-3 text-xs text-slate-500">
              ${new Date(t.fecha).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </td>
            <td class="px-4 py-3">${t.estudiante_nombre || "N/A"}</td>
            <td class="px-4 py-3">
              <span class="${typeColor} flex items-center">
                <i data-lucide="${typeIcon}" class="w-3 h-3 mr-1"></i>
                ${typeText}
              </span>
            </td>
            <td class="px-4 py-3 text-right font-semibold ${typeColor}">
              ${amount} CCED
            </td>
            <td class="px-4 py-3 text-sm text-slate-600">${t.motivo || "-"}</td>
          </tr>
        `;
      })
      .join("");

    lucide.createIcons();
  }
}

// Exportar instancia única
const monedasModule = new MonedasModule();
export default monedasModule;
