// ==========================================
// LANDING.JS - Landing Page Scripts
// ==========================================

const API_URL = "http://localhost:4000/api";
const AOS_DELAY_INCREMENT = 100;
const STATS_UPDATE_INTERVAL = 30000; // 30 segundos

let statsInterval = null;

// ==========================================
// ANIMACIÓN DE CONTADORES
// ==========================================

function animateCounter(element, target, duration = 2000) {
  if (!element) return;

  const start = 0;
  const increment = target / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = Math.floor(target).toLocaleString("es-ES");
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current).toLocaleString("es-ES");
    }
  }, 16);
}

// ==========================================
// CARGAR ESTADÍSTICAS PÚBLICAS
// ==========================================

async function loadPublicStats() {
  try {
    const response = await fetch(`${API_URL}/public/statistics`);
    const data = await response.json();

    if (data.success) {
      const stats = data.statistics;

      // Elementos del DOM
      const elements = {
        // Hero Stats
        heroStudents: document.getElementById("heroStudents"),
        heroTasks: document.getElementById("heroTasks"),
        heroCoins: document.getElementById("heroCoins"),

        // Main Stats
        statStudents: document.getElementById("statStudents"),
        statTasksCompleted: document.getElementById("statTasksCompleted"),
        statCoins: document.getElementById("statCoins"),
        statActiveTasks: document.getElementById("statActiveTasks"),
        statAvgCoins: document.getElementById("statAvgCoins"),
        statAvgTasks: document.getElementById("statAvgTasks"),
        statCompletionRate: document.getElementById("statCompletionRate"),
      };

      // Animar Hero Stats
      if (elements.heroStudents)
        animateCounter(elements.heroStudents, stats.total_estudiantes);
      if (elements.heroTasks)
        animateCounter(elements.heroTasks, stats.tareas_completadas_total);
      if (elements.heroCoins)
        animateCounter(
          elements.heroCoins,
          Math.floor(stats.monedas_circulacion)
        );

      // Animar Main Stats
      if (elements.statStudents)
        animateCounter(elements.statStudents, stats.total_estudiantes);
      if (elements.statTasksCompleted)
        animateCounter(
          elements.statTasksCompleted,
          stats.tareas_completadas_total
        );
      if (elements.statCoins)
        animateCounter(
          elements.statCoins,
          Math.floor(stats.monedas_circulacion)
        );
      if (elements.statActiveTasks)
        animateCounter(elements.statActiveTasks, stats.tareas_activas);
      if (elements.statAvgCoins)
        animateCounter(
          elements.statAvgCoins,
          Math.floor(stats.promedio_monedas)
        );

      // Calcular promedio de tareas por estudiante
      if (elements.statAvgTasks) {
        const avgTasks =
          stats.total_estudiantes > 0
            ? (
                stats.tareas_completadas_total / stats.total_estudiantes
              ).toFixed(1)
            : "0.0";
        elements.statAvgTasks.textContent = avgTasks;
      }

      // Calcular tasa de completitud
      if (elements.statCompletionRate) {
        const totalTasks = stats.total_tareas;
        const completedTasks = stats.tareas_completadas_total;
        const completionRate =
          totalTasks > 0 ? Math.floor((completedTasks / totalTasks) * 100) : 0;
        elements.statCompletionRate.textContent = completionRate + "%";
      }
    } else {
      console.error("❌ Error en respuesta:", data);
      showDefaultStats();
    }
  } catch (error) {
    console.error("❌ Error cargando estadísticas:", error);
    showDefaultStats();
  }
}

// ==========================================
// MOSTRAR VALORES POR DEFECTO
// ==========================================

function showDefaultStats() {
  const defaultIds = [
    "heroStudents",
    "heroTasks",
    "heroCoins",
    "statStudents",
    "statTasksCompleted",
    "statCoins",
    "statActiveTasks",
    "statAvgCoins",
  ];

  defaultIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.textContent = "0";
  });

  const avgTasksElement = document.getElementById("statAvgTasks");
  if (avgTasksElement) avgTasksElement.textContent = "0.0";

  const completionRateElement = document.getElementById("statCompletionRate");
  if (completionRateElement) completionRateElement.textContent = "0%";
}

// ==========================================
// CARGAR RANKING PÚBLICO
// ==========================================

async function loadPublicRanking() {
  const container = document.getElementById("topStudentsRanking");
  if (!container) return;

  try {
    const response = await fetch(`${API_URL}/public/ranking?limit=5`);
    const data = await response.json();

    if (data.success && data.ranking.length > 0) {
      container.innerHTML = data.ranking
        .map((student, index) => {
          const medalColors = [
            "from-amber-400 to-amber-600", // Oro
            "from-slate-300 to-slate-500", // Plata
            "from-orange-400 to-orange-600", // Bronce
          ];

          const bgColor =
            index < 3
              ? `bg-gradient-to-br ${medalColors[index]}`
              : "bg-slate-300";

          return `
            <div class="bg-white rounded-xl shadow-lg p-6 flex items-center gap-6 hover:shadow-xl transition-shadow" data-aos="fade-up" data-aos-delay="${
              index * AOS_DELAY_INCREMENT
            }">
              <div class="w-16 h-16 ${bgColor} rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                ${student.posicion}
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-slate-900">${
                  student.nombre
                }</h3>
                <div class="flex items-center gap-4 mt-2 text-sm text-slate-600">
                  <span class="flex items-center gap-1">
                    <i data-lucide="coins" class="w-4 h-4 text-amber-600"></i>
                    ${student.balance.toLocaleString("es-ES")} CCED
                  </span>
                  <span class="flex items-center gap-1">
                    <i data-lucide="clipboard-check" class="w-4 h-4 text-emerald-600"></i>
                    ${student.tareas_completadas} tareas
                  </span>
                </div>
              </div>
            </div>
          `;
        })
        .join("");

      // Reinicializar iconos de Lucide
      if (typeof lucide !== "undefined") {
        lucide.createIcons();
      }
    } else {
      showEmptyRanking(container);
    }
  } catch (error) {
    console.error("❌ Error cargando ranking:", error);
    showErrorRanking(container);
  }
}

// ==========================================
// MOSTRAR RANKING VACÍO
// ==========================================

function showEmptyRanking(container) {
  container.innerHTML = `
    <div class="text-center py-12">
      <i data-lucide="users" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>
      <p class="text-slate-400">No hay estudiantes en el ranking aún</p>
    </div>
  `;

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// ==========================================
// MOSTRAR ERROR EN RANKING
// ==========================================

function showErrorRanking(container) {
  container.innerHTML = `
    <div class="text-center py-8 bg-red-50 rounded-lg">
      <i data-lucide="alert-circle" class="w-12 h-12 mx-auto mb-3 text-red-500"></i>
      <p class="text-red-600 font-medium">Error al cargar el ranking</p>
      <button onclick="loadPublicRanking()" class="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
        Reintentar
      </button>
    </div>
  `;

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

function initLandingPage() {
  // Cargar datos iniciales
  loadPublicStats();
  loadPublicRanking();

  // Actualizar estadísticas periódicamente
  if (statsInterval) {
    clearInterval(statsInterval);
  }
  statsInterval = setInterval(loadPublicStats, STATS_UPDATE_INTERVAL);
}

// ==========================================
// EVENT LISTENERS
// ==========================================

document.addEventListener("DOMContentLoaded", initLandingPage);

// Limpiar intervalo al cerrar/cambiar página
window.addEventListener("beforeunload", () => {
  if (statsInterval) {
    clearInterval(statsInterval);
  }
});
