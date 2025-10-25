// ==========================================
// RANKINGS MODULE - Módulo de Rankings Completo
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";
import { NOTIFICATION_TYPES } from "../config.js";

class RankingsModule {
  constructor() {
    this.allStudents = [];
    this.currentSortBy = "balance";
    this.searchTerm = "";
  }

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================
  render() {
    const content = `
      <div class="space-y-6">
        <!-- Estadísticas Generales -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl shadow-lg border-l-4 border-amber-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-amber-800 mb-1">Total Monedas</p>
                <p class="text-3xl font-bold text-amber-600" id="totalCoins">0</p>
                <p class="text-xs text-amber-700 mt-1">En circulación</p>
              </div>
              <div class="w-14 h-14 bg-amber-200 rounded-full flex items-center justify-center">
                <i data-lucide="coins" class="w-8 h-8 text-amber-600"></i>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl shadow-lg border-l-4 border-emerald-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-emerald-800 mb-1">Tareas Completadas</p>
                <p class="text-3xl font-bold text-emerald-600" id="totalTasks">0</p>
                <p class="text-xs text-emerald-700 mt-1">Total general</p>
              </div>
              <div class="w-14 h-14 bg-emerald-200 rounded-full flex items-center justify-center">
                <i data-lucide="check-circle" class="w-8 h-8 text-emerald-600"></i>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-sky-50 to-sky-100 p-6 rounded-xl shadow-lg border-l-4 border-sky-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-sky-800 mb-1">Estudiantes Activos</p>
                <p class="text-3xl font-bold text-sky-600" id="totalStudents">0</p>
                <p class="text-xs text-sky-700 mt-1">Registrados</p>
              </div>
              <div class="w-14 h-14 bg-sky-200 rounded-full flex items-center justify-center">
                <i data-lucide="users" class="w-8 h-8 text-sky-600"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Podio Top 3 -->
        <div class="bg-white p-8 rounded-xl shadow-lg">
          <h2 class="text-2xl font-bold text-slate-800 mb-6 text-center">🏆 Podio de Campeones</h2>
          <div id="podiumContainer" class="flex justify-center items-end gap-4 mb-8 min-h-[280px]">
            <div class="text-center py-8">
              <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin text-slate-400"></i>
              <p class="text-slate-400">Cargando podio...</p>
            </div>
          </div>
        </div>

        <!-- Controles de Filtrado y Búsqueda -->
        <div class="bg-white p-4 rounded-xl shadow-lg">
          <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <!-- Búsqueda -->
            <div class="relative flex-1 w-full sm:max-w-md">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3">
                <i data-lucide="search" class="h-5 w-5 text-slate-400"></i>
              </span>
              <input
                type="text"
                id="searchRanking"
                placeholder="Buscar estudiante..."
                class="w-full py-2.5 pl-10 pr-4 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <!-- Filtros de Ordenamiento -->
            <div class="flex gap-2 flex-wrap">
              <button type="button" class="sort-btn px-4 py-2 rounded-lg text-sm transition-colors bg-emerald-500 text-white" data-sort="balance">
                <i data-lucide="coins" class="w-4 h-4 inline mr-1"></i>
                Por Monedas
              </button>
              <button type="button" class="sort-btn px-4 py-2 rounded-lg text-sm transition-colors bg-slate-200 text-slate-700 hover:bg-slate-300" data-sort="tasks">
                <i data-lucide="check-square" class="w-4 h-4 inline mr-1"></i>
                Por Tareas
              </button>
              <button type="button" class="sort-btn px-4 py-2 rounded-lg text-sm transition-colors bg-slate-200 text-slate-700 hover:bg-slate-300" data-sort="exams">
                <i data-lucide="award" class="w-4 h-4 inline mr-1"></i>
                Por Exámenes
              </button>
            </div>

            <!-- Botón Exportar -->
            <button type="button" id="exportRanking" class="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg flex items-center gap-2 text-sm">
              <i data-lucide="download" class="w-4 h-4"></i>
              Exportar
            </button>
          </div>
        </div>

        <!-- Lista Completa de Rankings -->
        <div class="bg-white p-6 rounded-xl shadow-lg">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-slate-700">Ranking Completo</h2>
            <span id="rankingCount" class="text-sm text-slate-500">0 estudiantes</span>
          </div>
          
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
    this.setupEventListeners();
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById("searchRanking");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.filterAndRenderRankings();
      });
    }

    // Botones de ordenamiento
    document.addEventListener("click", (e) => {
      const sortBtn = e.target.closest(".sort-btn");
      if (sortBtn) {
        const sortType = sortBtn.dataset.sort;
        this.changeSortBy(sortType);
      }

      // Botón exportar
      if (e.target.closest("#exportRanking")) {
        this.exportRanking();
      }
    });
  }

  changeSortBy(sortType) {
    this.currentSortBy = sortType;

    // Actualizar estilos de botones
    document.querySelectorAll(".sort-btn").forEach((btn) => {
      if (btn.dataset.sort === sortType) {
        btn.classList.remove("bg-slate-200", "text-slate-700");
        btn.classList.add("bg-emerald-500", "text-white");
      } else {
        btn.classList.remove("bg-emerald-500", "text-white");
        btn.classList.add("bg-slate-200", "text-slate-700");
      }
    });

    this.filterAndRenderRankings();
  }

  // ==========================================
  // CARGAR DATOS
  // ==========================================
  async loadData() {
    try {
      const data = await apiService.getStudents();

      if (data.success && data.students) {
        this.allStudents = data.students;
        this.updateStatistics();
        this.filterAndRenderRankings();
      } else {
        this.showEmptyState();
      }
    } catch (error) {
      console.error("Error cargando rankings:", error);
      uiService.showNotification(
        "Error al cargar rankings",
        NOTIFICATION_TYPES.ERROR
      );
      this.showEmptyState();
    }
  }

  updateStatistics() {
    const totalCoins = this.allStudents.reduce(
      (sum, s) => sum + (s.balance || 0),
      0
    );
    const totalTasks = this.allStudents.reduce(
      (sum, s) => sum + (s.tareas_completadas || 0),
      0
    );
    const totalStudents = this.allStudents.length;

    const coinsEl = document.getElementById("totalCoins");
    const tasksEl = document.getElementById("totalTasks");
    const studentsEl = document.getElementById("totalStudents");

    if (coinsEl) coinsEl.textContent = totalCoins.toLocaleString();
    if (tasksEl) tasksEl.textContent = totalTasks.toLocaleString();
    if (studentsEl) studentsEl.textContent = totalStudents.toLocaleString();
  }

  // ==========================================
  // FILTRAR Y RENDERIZAR
  // ==========================================
  filterAndRenderRankings() {
    let filtered = [...this.allStudents];

    // Aplicar búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.nombre.toLowerCase().includes(this.searchTerm) ||
          s.email.toLowerCase().includes(this.searchTerm)
      );
    }

    // Ordenar según el criterio seleccionado
    filtered.sort((a, b) => {
      switch (this.currentSortBy) {
        case "balance":
          return (b.balance || 0) - (a.balance || 0);
        case "tasks":
          return (b.tareas_completadas || 0) - (a.tareas_completadas || 0);
        case "exams":
          return (b.examenes_completados || 0) - (a.examenes_completados || 0);
        default:
          return (b.balance || 0) - (a.balance || 0);
      }
    });

    // Renderizar podio (top 3)
    this.renderPodium(filtered.slice(0, 3));

    // Renderizar lista completa
    this.renderRankingsList(filtered);

    // Actualizar contador
    const countEl = document.getElementById("rankingCount");
    if (countEl) {
      countEl.textContent = `${filtered.length} estudiante${
        filtered.length !== 1 ? "s" : ""
      }`;
    }
  }

  // ==========================================
  // RENDERIZAR PODIO
  // ==========================================
  renderPodium(top3) {
    const podiumContainer = document.getElementById("podiumContainer");
    if (!podiumContainer) return;

    if (top3.length === 0) {
      podiumContainer.innerHTML = `
        <div class="text-center py-8">
          <i data-lucide="trophy" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>
          <p class="text-slate-400">No hay estudiantes registrados</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    // Reorganizar para que el 1ro esté en el centro: [2do, 1ro, 3ro]
    const positions = [
      top3[1] || null, // 2do lugar (izquierda)
      top3[0] || null, // 1er lugar (centro)
      top3[2] || null, // 3er lugar (derecha)
    ];

    const colors = [
      { bg: "from-slate-300 to-slate-400", medal: "🥈", height: "h-48" }, // 2do
      { bg: "from-amber-400 to-amber-600", medal: "🥇", height: "h-56" }, // 1ro
      { bg: "from-orange-400 to-orange-600", medal: "🥉", height: "h-40" }, // 3ro
    ];

    const realPositions = [2, 1, 3]; // Posiciones reales

    podiumContainer.innerHTML = positions
      .map((student, idx) => {
        if (!student) return "";

        const color = colors[idx];
        const position = realPositions[idx];

        return `
          <div class="flex flex-col items-center animate-fade-in-up" style="animation-delay: ${
            idx * 100
          }ms;">
            <!-- Tarjeta del estudiante -->
            <div class="mb-4 bg-white p-4 rounded-xl shadow-lg border-2 border-slate-200 hover:border-emerald-400 transition-all w-48">
              <div class="text-center">
                <div class="text-4xl mb-2">${color.medal}</div>
                <p class="font-bold text-slate-800 text-lg mb-1 truncate">${
                  student.nombre
                }</p>
                <p class="text-sm text-slate-500 mb-3 truncate">${
                  student.email
                }</p>
                
                <div class="space-y-2">
                  <div class="flex items-center justify-center gap-2 text-amber-600 font-bold">
                    <i data-lucide="coins" class="w-4 h-4"></i>
                    <span>${student.balance || 0}</span>
                  </div>
                  <div class="text-xs text-slate-500">
                    ${student.tareas_completadas || 0} tareas • ${
          student.examenes_completados || 0
        } exámenes
                  </div>
                </div>
              </div>
            </div>

            <!-- Podio -->
            <div class="w-32 ${color.height} bg-gradient-to-br ${
          color.bg
        } rounded-t-lg flex items-center justify-center text-white font-bold text-3xl shadow-lg">
              ${position}°
            </div>
          </div>
        `;
      })
      .join("");

    lucide.createIcons();
  }

  // ==========================================
  // RENDERIZAR LISTA
  // ==========================================
  renderRankingsList(students) {
    const container = document.getElementById("rankingsList");
    if (!container) return;

    if (students.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <i data-lucide="users" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>
          <p class="text-slate-400 mb-2">No se encontraron estudiantes</p>
          <p class="text-sm text-slate-500">Intenta con otro término de búsqueda</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = students
      .map((student, index) => this.createRankingRow(student, index))
      .join("");

    lucide.createIcons();
  }

  createRankingRow(student, index) {
    // Medallas para top 3
    const medals = ["🥇", "🥈", "🥉"];
    const medal = index < 3 ? medals[index] : "";

    // Color del número de posición
    const positionColors = [
      "bg-gradient-to-br from-amber-400 to-amber-600",
      "bg-gradient-to-br from-slate-300 to-slate-400",
      "bg-gradient-to-br from-orange-400 to-orange-600",
    ];
    const positionClass = index < 3 ? positionColors[index] : "bg-slate-300";

    // Badge para top 3
    const topBadge =
      index < 3
        ? `<span class="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Top ${
            index + 1
          }</span>`
        : "";

    // Determinar qué métrica mostrar según el ordenamiento
    let metricLabel = "";
    let metricValue = 0;

    switch (this.currentSortBy) {
      case "balance":
        metricLabel = "STHELA";
        metricValue = student.balance || 0;
        break;
      case "tasks":
        metricLabel = "tareas";
        metricValue = student.tareas_completadas || 0;
        break;
      case "exams":
        metricLabel = "exámenes";
        metricValue = student.examenes_completados || 0;
        break;
      default:
        metricLabel = "STHELA";
        metricValue = student.balance || 0;
    }

    return `
      <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all hover:shadow-md border border-transparent hover:border-emerald-200 animate-fade-in" style="animation-delay: ${
        index * 50
      }ms;">
        <div class="flex items-center gap-4 flex-1">
          <!-- Posición -->
          <div class="flex items-center gap-2">
            <div class="w-12 h-12 rounded-full ${positionClass} flex items-center justify-center text-white font-bold shadow-md">
              ${index + 1}
            </div>
            ${medal ? `<span class="text-3xl">${medal}</span>` : ""}
          </div>

          <!-- Info del estudiante -->
          <div class="flex-1">
            <div class="flex items-center">
              <p class="font-semibold text-slate-800 text-lg">${
                student.nombre
              }</p>
              ${topBadge}
            </div>
            <p class="text-sm text-slate-500">${student.email}</p>
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="flex items-center gap-6">
          <!-- Métrica principal según ordenamiento -->
          <div class="text-right">
            <p class="text-2xl font-bold ${
              this.currentSortBy === "balance"
                ? "text-amber-600"
                : "text-emerald-600"
            }">
              ${this.currentSortBy === "balance" ? "💰 " : ""}${metricValue}
            </p>
            <p class="text-xs text-slate-500">${metricLabel}</p>
          </div>

          <!-- Detalles adicionales -->
          <div class="text-right hidden sm:block">
            <div class="flex items-center gap-4 text-sm text-slate-600">
              <div class="text-center">
                <i data-lucide="coins" class="w-4 h-4 inline text-amber-500"></i>
                <span class="ml-1">${student.balance || 0}</span>
              </div>
              <div class="text-center">
                <i data-lucide="check-circle" class="w-4 h-4 inline text-emerald-500"></i>
                <span class="ml-1">${student.tareas_completadas || 0}</span>
              </div>
              <div class="text-center">
                <i data-lucide="award" class="w-4 h-4 inline text-sky-500"></i>
                <span class="ml-1">${student.examenes_completados || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // EXPORTAR RANKING
  // ==========================================
  exportRanking() {
    if (this.allStudents.length === 0) {
      uiService.showNotification(
        "No hay datos para exportar",
        NOTIFICATION_TYPES.WARNING
      );
      return;
    }

    // Ordenar según criterio actual
    const sorted = [...this.allStudents].sort((a, b) => {
      switch (this.currentSortBy) {
        case "balance":
          return (b.balance || 0) - (a.balance || 0);
        case "tasks":
          return (b.tareas_completadas || 0) - (a.tareas_completadas || 0);
        case "exams":
          return (b.examenes_completados || 0) - (a.examenes_completados || 0);
        default:
          return (b.balance || 0) - (a.balance || 0);
      }
    });

    // Crear CSV
    const headers = [
      "Posición",
      "Nombre",
      "Email",
      "Monedas STHELA",
      "Tareas Completadas",
      "Exámenes Completados",
    ];

    const rows = sorted.map((student, index) => [
      index + 1,
      student.nombre,
      student.email,
      student.balance || 0,
      student.tareas_completadas || 0,
      student.examenes_completados || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Descargar archivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const sortLabel = {
      balance: "monedas",
      tasks: "tareas",
      exams: "examenes",
    }[this.currentSortBy];

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `ranking_${sortLabel}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    uiService.showNotification(
      "✅ Ranking exportado exitosamente",
      NOTIFICATION_TYPES.SUCCESS
    );
  }

  // ==========================================
  // ESTADO VACÍO
  // ==========================================
  showEmptyState() {
    const podiumContainer = document.getElementById("podiumContainer");
    const rankingsList = document.getElementById("rankingsList");

    if (podiumContainer) {
      podiumContainer.innerHTML = `
        <div class="text-center py-12">
          <i data-lucide="trophy" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>
          <p class="text-slate-400">No hay estudiantes registrados</p>
        </div>
      `;
    }

    if (rankingsList) {
      rankingsList.innerHTML = `
        <div class="text-center py-12">
          <i data-lucide="users" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>
          <p class="text-slate-400">No hay estudiantes para mostrar</p>
        </div>
      `;
    }

    lucide.createIcons();
  }
}

// Exportar instancia única
const rankingModule = new RankingsModule();
export default rankingModule;
