// ==========================================
// MÓDULO DE NAVEGACIÓN - FRONTEND
// ==========================================

import dashboardModule from "../modules/dashboardModule.js";
import studentsModule from "../modules/studentsModule.js";
import tasksModule from "../modules/tasksModule.js";
import { examenesModule } from "../modules/examenesModule.js";
import monedasModule from "../modules/monedasModule.js";
import codesModule from "../modules/codesModule.js";
import rankingModule from "../modules/rankingModule.js";
import reportesModule from "../modules/reportesModule.js";
import gradesModule from "../modules/gradesModule.js"; // ✅ IMPORTAR

class NavigationModule {
  constructor() {
    this.modules = {
      dashboard: dashboardModule,
      students: studentsModule,
      tasks: tasksModule,
      exams: examenesModule,
      grades: gradesModule, // ✅ AGREGAR
      coins: monedasModule,
      codes: codesModule,
      ranking: rankingModule,
      reportes: reportesModule,
    };

    this.currentModule = "dashboard";
    this.init();
  }

  init() {
    // Agregar event listeners a los elementos de navegación
    const navItems = document.querySelectorAll(".sidebar-nav-items a");
    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const moduleId = this.getModuleIdFromMenuItem(item);
        if (moduleId) {
          this.navigateTo(moduleId);
        }
      });
    });

    // Activar el módulo inicial (dashboard)
    this.navigateTo("dashboard");
  }

  getModuleIdFromMenuItem(menuItem) {
    const menuText = menuItem
      .querySelector(".menu-text")
      .textContent.toLowerCase();

    const moduleMap = {
      dashboard: "dashboard",
      estudiantes: "students",
      tareas: "tasks",
      exámenes: "exams",
      calificaciones: "grades", // ✅ AGREGAR
      monedas: "coins",
      "códigos acceso": "codes",
      rankings: "ranking",
      reportes: "reportes",
    };

    return moduleMap[menuText];
  }

  async navigateTo(moduleId) {
    if (!this.modules[moduleId]) {
      console.error(`Module ${moduleId} not found`);
      return;
    }

    // Actualizar módulo actual
    this.currentModule = moduleId;

    // Actualizar estado visual de los elementos de navegación
    this.updateActiveNavItem(moduleId);

    // Limpiar el contenido principal
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.innerHTML = "";
    }

    // Renderizar el nuevo módulo
    const module = this.modules[moduleId];
    if (module && typeof module.render === "function") {
      try {
        await module.render();

        // ✅ IMPORTANTE: Reinicializar los iconos de Lucide después de renderizar
        if (typeof lucide !== "undefined" && lucide.createIcons) {
          lucide.createIcons();
        }
      } catch (error) {
        console.error(`Error rendering module ${moduleId}:`, error);

        // Mostrar error en la UI
        if (mainContent) {
          mainContent.innerHTML = `
            <div class="flex items-center justify-center h-full">
              <div class="text-center">
                <div class="text-6xl mb-4">❌</div>
                <h2 class="text-2xl font-bold text-slate-800 mb-2">Error al cargar módulo</h2>
                <p class="text-slate-600 mb-4">${error.message}</p>
                <button 
                  onclick="location.reload()" 
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Recargar Página
                </button>
              </div>
            </div>
          `;
        }
      }
    }
  }

  updateActiveNavItem(moduleId) {
    // Remover clase activa de todos los items
    const navItems = document.querySelectorAll(".sidebar-nav-items a");
    navItems.forEach((item) => {
      item.classList.remove("bg-slate-700", "text-white", "active-nav-item");
      item.classList.add("text-slate-300");
    });

    // Mapa de módulos a texto del menú
    const moduleTextMap = {
      dashboard: "dashboard",
      students: "estudiantes",
      tasks: "tareas",
      exams: "exámenes",
      grades: "calificaciones", // ✅ AGREGAR
      coins: "monedas",
      codes: "códigos acceso",
      ranking: "rankings",
      reportes: "reportes",
    };

    const searchText = moduleTextMap[moduleId];

    // Encontrar y activar el item correspondiente
    const activeItem = Array.from(navItems).find((item) =>
      item
        .querySelector(".menu-text")
        .textContent.toLowerCase()
        .includes(searchText)
    );

    if (activeItem) {
      activeItem.classList.remove("text-slate-300");
      activeItem.classList.add("bg-slate-700", "text-white", "active-nav-item");
    }
  }
}

// Create and export a single instance
const navigationModule = new NavigationModule();
export default navigationModule;
