// ==========================================
// DASHBOARD-ADMIN.JS - Panel de Administración
// ==========================================

const API_URL = "http://localhost:4000/api";
let adminToken = null;
let charts = {};
let currentSection = "dashboard";
let dashboardHTML = null; // Guardar HTML original del dashboard

// ==========================================
// INICIALIZAR TOKEN
// ==========================================
function initToken() {
  adminToken = localStorage.getItem("adminToken");
}

// ==========================================
// VERIFICAR AUTENTICACIÓN
// ==========================================
async function checkAuth() {
  if (!adminToken) {
    window.location.href = "login.html";
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const data = await response.json();

    if (!data.success || data.user.rol !== "admin") {
      localStorage.removeItem("adminToken");
      window.location.href = "login.html";
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verificando autenticación:", error);
    localStorage.removeItem("adminToken");
    window.location.href = "login.html";
    return false;
  }
}

// ==========================================
// SECTIONS CONFIGURATION
// ==========================================
const sections = {
  dashboard: {
    title: "Panel de Administración",
    render: renderDashboard,
  },
  estudiantes: {
    title: "Gestión de Estudiantes",
    render: renderEstudiantes,
  },
  tareas: {
    title: "Gestión de Tareas",
    render: renderTareas,
  },
  examenes: {
    title: "Gestión de Exámenes",
    render: renderExamenes,
  },
  monedas: {
    title: "Gestión de Monedas",
    render: renderMonedas,
  },
  codigos: {
    title: "Códigos de Acceso",
    render: renderCodigos,
  },
  rankings: {
    title: "Rankings",
    render: renderRankings,
  },
  reportes: {
    title: "Reportes",
    render: renderReportes,
  },
};

// ==========================================
// NAVIGATION SYSTEM
// ==========================================
function initNavigation() {
  const navItems = document.querySelectorAll(".sidebar-nav-items a");

  navItems.forEach((link, index) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Remover clase activa de todos los links
      navItems.forEach((l) => {
        l.classList.remove("bg-slate-700", "text-white");
      });

      // Agregar clase activa al link clickeado
      link.classList.add("bg-slate-700", "text-white");

      // Mapear índice a sección
      const sectionMap = [
        "dashboard",
        "estudiantes",
        "tareas",
        "examenes",
        "monedas",
        "codigos",
        "rankings",
        "reportes",
      ];
      const section = sectionMap[index];

      if (section) {
        navigateToSection(section);
      }
    });
  });
}

function navigateToSection(sectionName) {
  currentSection = sectionName;
  const section = sections[sectionName];

  if (section) {
    // Actualizar título
    const mainContent = document.querySelector("main");
    const titleElement = mainContent.querySelector("h1");
    if (titleElement) {
      titleElement.textContent = section.title;
    }

    // Renderizar contenido
    section.render();

    // Cerrar sidebar en móvil
    if (window.innerWidth < 1024) {
      const sidebar = document.getElementById("sidebar");
      const overlay = document.getElementById("sidebarOverlay");
      if (sidebar && overlay) {
        sidebar.classList.add("-translate-x-full");
        overlay.classList.add("hidden");
      }
    }
  }
}

function updateMainContent(htmlContent) {
  const mainContent = document.querySelector("main");

  // Mantener el título
  const currentTitle = mainContent.querySelector("h1");
  const titleHTML = currentTitle
    ? currentTitle.outerHTML
    : '<h1 class="text-2xl sm:text-3xl font-semibold text-slate-800 mb-6">Panel de Administración</h1>';

  mainContent.innerHTML = titleHTML + htmlContent;

  // Reinicializar iconos de Lucide
  lucide.createIcons();
}

// ==========================================
// RENDER: DASHBOARD
// ==========================================
function renderDashboard() {
  const mainContent = document.querySelector("main");

  // Si tenemos el HTML guardado, restaurarlo
  if (dashboardHTML) {
    const titleElement = mainContent.querySelector("h1");
    const titleHTML = titleElement ? titleElement.outerHTML : "";
    mainContent.innerHTML = titleHTML + dashboardHTML;
    lucide.createIcons();
  }

  // Cargar estadísticas
  loadDashboardStats();
}

// ==========================================
// RENDER: ESTUDIANTES
// ==========================================
function renderEstudiantes() {
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
          <button onclick="openModal('newStudentModal')" class="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg flex items-center gap-2 text-sm">
            <i data-lucide="user-plus" class="w-4 h-4"></i>
            Nuevo Estudiante
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
  `;

  updateMainContent(content);
  loadStudentsData();
  initStudentSearch();
}

async function loadStudentsData() {
  try {
    const response = await fetch(`${API_URL}/admin/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await response.json();

    if (data.success) {
      const tbody = document.getElementById("studentsTableBody");

      if (!tbody) return;

      if (data.students.length === 0) {
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

      tbody.innerHTML = data.students
        .map(
          (student) => `
        <tr class="border-b border-slate-100 hover:bg-slate-50">
          <td class="px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold">
                ${student.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <p class="font-medium text-slate-800">${student.nombre}</p>
                <p class="text-xs text-slate-500">ID: ${
                  student.id_estudiante
                }</p>
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
              <button onclick="viewStudent(${
                student.id_estudiante
              })" class="p-2 text-sky-600 hover:bg-sky-50 rounded-lg" title="Ver detalles">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
              <button onclick="editStudent(${
                student.id_estudiante
              })" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Editar">
                <i data-lucide="edit" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteStudent(${
                student.id_estudiante
              })" class="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `
        )
        .join("");

      lucide.createIcons();
    }
  } catch (error) {
    console.error("Error cargando estudiantes:", error);
    showNotification("Error al cargar estudiantes", "error");
  }
}

function initStudentSearch() {
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

// ==========================================
// RENDER: TAREAS
// ==========================================
function renderTareas() {
  const content = `
    <div class="space-y-6">
      <div class="bg-white p-4 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="flex gap-2">
          <button class="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm">Todas</button>
          <button class="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm">Activas</button>
          <button class="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm">Completadas</button>
        </div>
        <button onclick="openModal('newTaskModal')" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-2 text-sm">
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

  updateMainContent(content);
  loadTasksData();
}

async function loadTasksData() {
  try {
    const response = await fetch(`${API_URL}/admin/tasks`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await response.json();

    const grid = document.getElementById("tasksGrid");
    if (!grid) return;

    if (data.success && data.tasks && data.tasks.length > 0) {
      grid.innerHTML = data.tasks
        .map(
          (task) => `
        <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div class="flex justify-between items-start mb-4">
            <h3 class="font-semibold text-slate-800 text-lg">${task.titulo}</h3>
            <span class="px-2 py-1 text-xs rounded-full ${
              task.estado === "activo"
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }">
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
              <button onclick="editTask(${
                task.id_tarea
              })" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                <i data-lucide="edit" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteTask(${
                task.id_tarea
              })" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      `
        )
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
  }
}

// ==========================================
// RENDER: OTRAS SECCIONES
// ==========================================
function renderExamenes() {
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
  updateMainContent(content);
}

function renderMonedas() {
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
  updateMainContent(content);
  loadCoinsStats();
}

async function loadCoinsStats() {
  try {
    const response = await fetch(`${API_URL}/admin/statistics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await response.json();

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

function renderCodigos() {
  const content = `
    <div class="space-y-6">
      <div class="bg-white p-4 rounded-xl shadow-lg flex justify-between items-center">
        <h2 class="text-lg font-semibold text-slate-700">Códigos de Registro</h2>
        <button onclick="openModal('generateCodeModal')" class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2 text-sm">
          <i data-lucide="key-round" class="w-4 h-4"></i>
          Generar Código
        </button>
      </div>
      <div id="codesContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="text-center py-12 col-span-full">
          <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin text-slate-400"></i>
          <p class="text-slate-400">Cargando códigos...</p>
        </div>
      </div>
    </div>
  `;
  updateMainContent(content);
  loadCodesData();
}

async function loadCodesData() {
  try {
    const response = await fetch(`${API_URL}/admin/codes`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await response.json();

    const container = document.getElementById("codesContainer");
    if (!container) return;

    if (data.success && data.codes && data.codes.length > 0) {
      container.innerHTML = data.codes
        .map((code) => {
          // Determinar color del borde según estado
          let borderColor = "border-slate-200";
          let estadoBadgeColor = "bg-slate-100 text-slate-600";

          if (code.estado === "activo") {
            borderColor = "border-green-200";
            estadoBadgeColor = "bg-green-100 text-green-700";
          } else if (code.estado === "usado") {
            borderColor = "border-blue-200";
            estadoBadgeColor = "bg-blue-100 text-blue-700";
          } else if (code.estado === "expirado") {
            borderColor = "border-red-200";
            estadoBadgeColor = "bg-red-100 text-red-700";
          }

          return `
              <div class="bg-white p-6 rounded-xl shadow-lg border-2 ${borderColor}">
                <div class="flex justify-between items-start mb-4">
                  <code class="text-lg font-mono font-bold text-purple-600 break-all">${
                    code.codigo
                  }</code>
                  <span class="px-2 py-1 text-xs rounded-full ${estadoBadgeColor} ml-2 whitespace-nowrap">
                    ${code.estado}
                  </span>
                </div>
                <div class="space-y-2 text-sm text-slate-600">
                  <p class="flex items-center">
                    <i data-lucide="calendar" class="w-4 h-4 inline mr-2"></i> 
                    Creado: ${new Date(code.fecha_creacion).toLocaleDateString(
                      "es-ES"
                    )}
                  </p>
                  ${
                    code.fecha_expiracion
                      ? `<p class="flex items-center">
                          <i data-lucide="clock" class="w-4 h-4 inline mr-2"></i> 
                          Expira: ${new Date(
                            code.fecha_expiracion
                          ).toLocaleDateString("es-ES")}
                        </p>`
                      : '<p class="flex items-center"><i data-lucide="infinity" class="w-4 h-4 inline mr-2"></i> Sin expiración</p>'
                  }
                  ${
                    code.creado_por_nombre
                      ? `<p class="flex items-center">
                          <i data-lucide="user" class="w-4 h-4 inline mr-2"></i> 
                          Creado por: ${code.creado_por_nombre}
                        </p>`
                      : ""
                  }
                  ${
                    code.usado && code.usado_por_nombre
                      ? `<p class="flex items-center text-blue-600">
                          <i data-lucide="user-check" class="w-4 h-4 inline mr-2"></i> 
                          Usado por: ${code.usado_por_nombre}
                        </p>`
                      : ""
                  }
                </div>
                <div class="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                  <button 
                    onclick="copyCode('${code.codigo}')" 
                    class="flex-1 px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors"
                  >
                    <i data-lucide="copy" class="w-4 h-4 inline mr-1"></i>
                    Copiar
                  </button>
                  ${
                    code.estado === "activo"
                      ? `<button 
                          onclick="deactivateCode(${code.id})" 
                          class="px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        >
                          <i data-lucide="x-circle" class="w-4 h-4 inline"></i>
                        </button>`
                      : ""
                  }
                </div>
              </div>
            `;
        })
        .join("");
    } else {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i data-lucide="key" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>
          <p class="text-slate-400 mb-4">No hay códigos generados</p>
          <button 
            onclick="openModal('generateCodeModal')" 
            class="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
          >
            <i data-lucide="plus" class="w-4 h-4 inline mr-2"></i>
            Generar Primer Código
          </button>
        </div>
      `;
    }

    lucide.createIcons();
  } catch (error) {
    console.error("Error cargando códigos:", error);
    const container = document.getElementById("codesContainer");
    if (container) {
      container.innerHTML = `
        <div class="col-span-full bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <i data-lucide="alert-circle" class="w-16 h-16 mx-auto mb-4 text-red-500"></i>
          <h3 class="text-xl font-semibold text-red-800 mb-2">Error al Cargar Códigos</h3>
          <p class="text-red-700 mb-4">${error.message}</p>
          <button 
            onclick="loadCodesData()" 
            class="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
          >
            <i data-lucide="refresh-cw" class="w-4 h-4 inline mr-2"></i>
            Reintentar
          </button>
        </div>
      `;
      lucide.createIcons();
    }
  }
}

// Función para copiar código
function copyCode(code) {
  navigator.clipboard
    .writeText(code)
    .then(() => {
      showNotification("✅ Código copiado al portapapeles", "success");
    })
    .catch((err) => {
      console.error("Error copiando código:", err);
      showNotification("❌ Error al copiar código", "error");
    });
}

// Función para desactivar código (opcional - si quieres implementarla)
async function deactivateCode(codeId) {
  if (!confirm("¿Estás seguro de desactivar este código?")) return;

  try {
    const response = await fetch(`${API_URL}/admin/codes/${codeId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const data = await response.json();

    if (data.success) {
      showNotification("✅ Código desactivado exitosamente", "success");
      loadCodesData();
    } else {
      showNotification("❌ " + data.message, "error");
    }
  } catch (error) {
    console.error("Error desactivando código:", error);
    showNotification("❌ Error al desactivar código", "error");
  }
}

function renderRankings() {
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
  updateMainContent(content);
  loadRankingsData();
}

async function loadRankingsData() {
  try {
    const response = await fetch(`${API_URL}/admin/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await response.json();

    const container = document.getElementById("rankingsList");
    if (!container) return;

    if (data.success && data.students.length > 0) {
      const top10 = data.students.slice(0, 10);

      container.innerHTML = top10
        .map(
          (student, index) => `
        <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full ${
              index < 3
                ? "bg-gradient-to-br from-amber-400 to-amber-600"
                : "bg-slate-300"
            } flex items-center justify-center text-white font-bold">
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
      `
        )
        .join("");

      lucide.createIcons();
    }
  } catch (error) {
    console.error("Error cargando rankings:", error);
  }
}

function renderReportes() {
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
  updateMainContent(content);
}

// ==========================================
// CRUD ACTIONS
// ==========================================
function viewStudent(id) {
  showNotification(`Ver detalles del estudiante ID: ${id}`, "info");
}

function editStudent(id) {
  showNotification(`Editar estudiante ID: ${id}`, "info");
}

async function deleteStudent(id) {
  if (!confirm("¿Estás seguro de eliminar este estudiante?")) return;

  try {
    const response = await fetch(`${API_URL}/admin/students/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const data = await response.json();

    if (data.success) {
      showNotification("✅ Estudiante eliminado exitosamente", "success");
      loadStudentsData();
    } else {
      showNotification("❌ " + data.message, "error");
    }
  } catch (error) {
    console.error("Error eliminando estudiante:", error);
    showNotification("❌ Error al eliminar estudiante", "error");
  }
}

function editTask(id) {
  showNotification(`Editar tarea ID: ${id}`, "info");
}

async function deleteTask(id) {
  if (!confirm("¿Estás seguro de eliminar esta tarea?")) return;

  try {
    const response = await fetch(`${API_URL}/admin/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const data = await response.json();

    if (data.success) {
      showNotification("✅ Tarea eliminada exitosamente", "success");
      loadTasksData();
    } else {
      showNotification("❌ " + data.message, "error");
    }
  } catch (error) {
    console.error("Error eliminando tarea:", error);
    showNotification("❌ Error al eliminar tarea", "error");
  }
}

// ==========================================
// DASHBOARD STATS
// ==========================================
async function loadDashboardStats() {
  try {
    const statsResponse = await fetch(`${API_URL}/admin/statistics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData = await statsResponse.json();

    if (statsData.success) {
      const stats = statsData.statistics;

      const totalStudentsEl = document.querySelector(
        '[data-stat="total-students"]'
      );
      const completedTasksEl = document.querySelector(
        '[data-stat="completed-tasks"]'
      );
      const totalCoinsEl = document.querySelector('[data-stat="total-coins"]');
      const activeExamsEl = document.querySelector(
        '[data-stat="active-exams"]'
      );

      if (totalStudentsEl)
        totalStudentsEl.textContent = stats.total_estudiantes || 0;
      if (completedTasksEl)
        completedTasksEl.textContent = stats.tareas_completadas_total || 0;

      if (totalCoinsEl) {
        const monedas = parseFloat(stats.monedas_circulacion);
        totalCoinsEl.textContent = isNaN(monedas) ? 0 : monedas.toFixed(0);
      }

      if (activeExamsEl) activeExamsEl.textContent = stats.tareas_activas || 0;
    }

    await loadRecentStudents();
    await loadCharts();
  } catch (error) {
    console.error("Error cargando estadísticas:", error);
    showNotification("Error al cargar estadísticas", "error");
  }
}

async function loadRecentStudents() {
  try {
    const response = await fetch(`${API_URL}/admin/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await response.json();

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
  } catch (error) {
    console.error("Error cargando estudiantes recientes:", error);
  }
}

async function loadCharts() {
  try {
    const response = await fetch(`${API_URL}/admin/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await response.json();

    if (data.success && data.students.length > 0) {
      const top5 = data.students.slice(0, 5);

      const ctx1 = document.getElementById("coinsDistributionChart");
      if (ctx1) {
        if (charts.coinsDistribution) charts.coinsDistribution.destroy();

        charts.coinsDistribution = new Chart(ctx1, {
          type: "line",
          data: {
            labels: top5.map((s) => s.nombre),
            datasets: [
              {
                label: "CCED Coins",
                data: top5.map((s) => s.balance),
                backgroundColor: "rgba(245, 158, 11, 0.2)",
                borderColor: "rgba(245, 158, 11, 1)",
                borderWidth: 3,
                fill: true,
                tension: 0.4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: "top",
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function (value) {
                    return value + " CCED";
                  },
                },
              },
            },
          },
        });
      }

      const ctx2 = document.getElementById("topStudentsChart");
      if (ctx2) {
        if (charts.topStudents) charts.topStudents.destroy();

        charts.topStudents = new Chart(ctx2, {
          type: "doughnut",
          data: {
            labels: top5.map((s) => s.nombre),
            datasets: [
              {
                data: top5.map((s) => s.tareas_completadas),
                backgroundColor: [
                  "rgba(59, 130, 246, 0.8)",
                  "rgba(34, 197, 94, 0.8)",
                  "rgba(245, 158, 11, 0.8)",
                  "rgba(168, 85, 247, 0.8)",
                  "rgba(239, 68, 68, 0.8)",
                ],
                borderWidth: 2,
                borderColor: "#fff",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
              },
              title: {
                display: true,
                text: "Tareas Completadas",
              },
            },
          },
        });
      }
    }
  } catch (error) {
    console.error("Error cargando gráficos:", error);
  }
}

// ==========================================
// MODALS
// ==========================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.add("opacity-100");
    const content = modal.querySelector(".modal-content");
    if (content) {
      content.classList.remove("scale-95", "opacity-0");
      content.classList.add("scale-100", "opacity-100");
    }
  }, 10);
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const content = modal.querySelector(".modal-content");
  if (content) {
    content.classList.add("scale-95", "opacity-0");
    content.classList.remove("scale-100", "opacity-100");
  }

  setTimeout(() => {
    modal.classList.remove("opacity-100");
    modal.classList.add("hidden");
  }, 300);
}

// ==========================================
// MODAL HANDLERS
// ==========================================
function initModals() {
  // Nuevo Estudiante
  document
    .getElementById("openNewStudentModal")
    ?.addEventListener("click", () => {
      openModal("newStudentModal");
    });

  document
    .getElementById("closeNewStudentModal")
    ?.addEventListener("click", () => {
      closeModal("newStudentModal");
    });

  document.getElementById("cancelNewStudent")?.addEventListener("click", () => {
    closeModal("newStudentModal");
  });

  document
    .getElementById("newStudentForm")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombre = document.getElementById("studentName").value;
      const email = document.getElementById("studentEmail").value;
      const password = document.getElementById("studentPassword").value;

      if (!nombre || !email || !password) {
        showNotification("Por favor completa todos los campos", "error");
        return;
      }

      if (password.length < 6) {
        showNotification(
          "La contraseña debe tener al menos 6 caracteres",
          "error"
        );
        return;
      }

      try {
        const response = await fetch(`${API_URL}/admin/students`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nombre, email, password }),
        });

        const data = await response.json();

        if (data.success) {
          showNotification("✅ Estudiante creado exitosamente", "success");
          closeModal("newStudentModal");
          document.getElementById("newStudentForm").reset();

          if (currentSection === "dashboard") {
            await loadDashboardStats();
          } else if (currentSection === "estudiantes") {
            await loadStudentsData();
          }
        } else {
          showNotification("❌ " + data.message, "error");
        }
      } catch (error) {
        console.error("Error creando estudiante:", error);
        showNotification("❌ Error al crear estudiante", "error");
      }
    });

  // Nueva Tarea
  document.getElementById("openNewTaskModal")?.addEventListener("click", () => {
    openModal("newTaskModal");
  });

  document
    .getElementById("closeNewTaskModal")
    ?.addEventListener("click", () => {
      closeModal("newTaskModal");
    });

  document.getElementById("cancelNewTask")?.addEventListener("click", () => {
    closeModal("newTaskModal");
  });

  document
    .getElementById("newTaskForm")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const titulo = document.getElementById("taskTitle").value;
      const descripcion = document.getElementById("taskDescription").value;
      const recompensa = document.getElementById("taskReward").value;
      const fecha_limite = document.getElementById("taskDueDate").value;

      if (!titulo || !recompensa) {
        showNotification(
          "Por favor completa el título y la recompensa",
          "error"
        );
        return;
      }

      try {
        const response = await fetch(`${API_URL}/admin/tasks`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            titulo,
            descripcion,
            recompensa: parseFloat(recompensa),
            fecha_limite: fecha_limite || null,
            dificultad: "media",
          }),
        });

        const data = await response.json();

        if (data.success) {
          showNotification("✅ Tarea creada exitosamente", "success");
          closeModal("newTaskModal");
          document.getElementById("newTaskForm").reset();

          if (currentSection === "dashboard") {
            await loadDashboardStats();
          } else if (currentSection === "tareas") {
            await loadTasksData();
          }
        } else {
          showNotification("❌ " + data.message, "error");
        }
      } catch (error) {
        console.error("Error creando tarea:", error);
        showNotification("❌ Error al crear tarea", "error");
      }
    });

  // Generar Código
  document
    .getElementById("openGenerateCodeModal")
    ?.addEventListener("click", () => {
      openModal("generateCodeModal");
      generateRegistrationCode();
    });

  document
    .getElementById("closeGenerateCodeModal")
    ?.addEventListener("click", () => {
      closeModal("generateCodeModal");
    });

  document
    .getElementById("cancelGenerateCode")
    ?.addEventListener("click", () => {
      closeModal("generateCodeModal");
    });

  document.getElementById("generateNewCode")?.addEventListener("click", () => {
    generateRegistrationCode();
  });

  document.getElementById("copyCodeButton")?.addEventListener("click", () => {
    const code = document.getElementById("generatedCode").textContent;
    navigator.clipboard.writeText(code);
    showNotification("✅ Código copiado al portapapeles", "success");
  });
}

async function generateRegistrationCode() {
  try {
    const expirationDate = document.getElementById("codeExpiration")?.value;
    let dias_validos = null;

    if (expirationDate) {
      const expDate = new Date(expirationDate);
      const today = new Date();
      const diffTime = expDate - today;
      dias_validos = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const response = await fetch(`${API_URL}/admin/codes/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dias_validos }),
    });

    const data = await response.json();

    if (data.success) {
      const codeEl = document.getElementById("generatedCode");
      if (codeEl) {
        codeEl.textContent = data.code;
      }
      showNotification("✅ Código generado exitosamente", "success");
    } else {
      showNotification("❌ " + data.message, "error");
    }
  } catch (error) {
    console.error("Error generando código:", error);
    showNotification("❌ Error al generar código", "error");
  }
}

// ==========================================
// UI INTERACTIONS
// ==========================================
function initUIInteractions() {
  // Logout
  document.getElementById("logoutButton")?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("adminToken");
    window.location.href = "../../../../frontend/index.html";
  });

  // Mobile Menu
  document.getElementById("mobileMenuButton")?.addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar && overlay) {
      sidebar.classList.toggle("-translate-x-full");
      overlay.classList.toggle("hidden");
    }
  });

  document.getElementById("sidebarOverlay")?.addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar && overlay) {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    }
  });

  // Profile Dropdown
  document.getElementById("profileButton")?.addEventListener("click", () => {
    const dropdown = document.getElementById("profileDropdown");
    if (!dropdown) return;

    const isHidden = dropdown.classList.contains("pointer-events-none");

    if (isHidden) {
      dropdown.classList.remove(
        "pointer-events-none",
        "opacity-0",
        "scale-95",
        "-translate-y-2"
      );
      dropdown.classList.add(
        "pointer-events-auto",
        "opacity-100",
        "scale-100",
        "translate-y-0"
      );
    } else {
      dropdown.classList.add(
        "pointer-events-none",
        "opacity-0",
        "scale-95",
        "-translate-y-2"
      );
      dropdown.classList.remove(
        "pointer-events-auto",
        "opacity-100",
        "scale-100",
        "translate-y-0"
      );
    }
  });

  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("profileDropdown");
    const button = document.getElementById("profileButton");

    if (
      dropdown &&
      button &&
      !dropdown.contains(e.target) &&
      !button.contains(e.target)
    ) {
      dropdown.classList.add(
        "pointer-events-none",
        "opacity-0",
        "scale-95",
        "-translate-y-2"
      );
      dropdown.classList.remove(
        "pointer-events-auto",
        "opacity-100",
        "scale-100",
        "translate-y-0"
      );
    }
  });

  // Sidebar Toggle
  document.getElementById("sidebarToggle")?.addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    const logoText = document.getElementById("sidebarLogoText");
    const menuTexts = document.querySelectorAll(".menu-text");
    const toggleIconOpen = document.getElementById("toggleIconOpen");
    const toggleIconClosed = document.getElementById("toggleIconClosed");

    if (!sidebar || !mainContent) return;

    const isCollapsed = sidebar.classList.contains("w-64");

    if (isCollapsed) {
      sidebar.classList.remove("w-64");
      sidebar.classList.add("w-20");
      mainContent.classList.remove("lg:ml-64");
      mainContent.classList.add("lg:ml-20");
      logoText?.classList.add("hidden");
      menuTexts.forEach((text) => text.classList.add("hidden"));
      toggleIconOpen?.classList.add("hidden");
      toggleIconClosed?.classList.remove("hidden");
    } else {
      sidebar.classList.add("w-64");
      sidebar.classList.remove("w-20");
      mainContent.classList.add("lg:ml-64");
      mainContent.classList.remove("lg:ml-20");
      logoText?.classList.remove("hidden");
      menuTexts.forEach((text) => text.classList.remove("hidden"));
      toggleIconOpen?.classList.remove("hidden");
      toggleIconClosed?.classList.add("hidden");
    }
  });
}

// ==========================================
// NOTIFICATIONS
// ==========================================
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl transform transition-all duration-300 translate-x-full`;

  const colors = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
    warning: "bg-yellow-500 text-white",
  };

  notification.className += " " + (colors[type] || colors.info);
  notification.innerHTML = `
    <div class="flex items-center space-x-3">
      <i data-lucide="${
        type === "success"
          ? "check-circle"
          : type === "error"
          ? "alert-circle"
          : "info"
      }" class="w-5 h-5"></i>
      <span class="font-medium">${message}</span>
    </div>
  `;

  document.body.appendChild(notification);
  lucide.createIcons();

  setTimeout(() => {
    notification.classList.remove("translate-x-full");
    notification.classList.add("translate-x-0");
  }, 10);

  setTimeout(() => {
    notification.classList.add("translate-x-full");
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// ==========================================
// GLOBAL EXPORTS
// ==========================================
window.navigateToSection = navigateToSection;
window.viewStudent = viewStudent;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.openModal = openModal;
window.closeModal = closeModal;
window.copyCode = copyCode;
window.deactivateCode = deactivateCode;

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  // Inicializar token
  initToken();

  // Inicializar iconos
  lucide.createIcons();

  // Verificar autenticación
  const isAuthenticated = await checkAuth();

  if (isAuthenticated) {
    // Guardar HTML original del dashboard
    const mainContent = document.querySelector("main");
    if (mainContent) {
      const titleElement = mainContent.querySelector("h1");
      dashboardHTML = mainContent.innerHTML.replace(
        titleElement?.outerHTML || "",
        ""
      );
    }

    // Inicializar interacciones UI
    initUIInteractions();

    // Inicializar modales
    initModals();

    // Inicializar navegación
    initNavigation();

    // Cargar dashboard inicial
    await loadDashboardStats();

    // Activar primer link del menú
    document
      .querySelector(".sidebar-nav-items a")
      ?.classList.add("bg-slate-700", "text-white");
  }
});
