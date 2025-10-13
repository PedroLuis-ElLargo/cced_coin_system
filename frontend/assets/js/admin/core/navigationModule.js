// ==========================================
// NAVIGATION-MODULE.JS - Sistema de Navegación
// ==========================================

import dashboardModule from "../modules/dashboardModule.js";
import studentsModule from "../modules/studentsModule.js";
import tasksModule from "../modules/tasksModule.js";
import codesModule from "../modules/codesModule.js";
import monedasModule from "../modules/monedasModule.js";
import {
  examenesModule,
  rankingsModule,
  reportesModule,
} from "../modules/otherModules.js";
import uiService from "../services/uiService.js";

class NavigationModule {
  constructor() {
    this.currentSection = "dashboard";
    this.sections = {
      dashboard: {
        title: "Panel de Administración",
        module: dashboardModule,
      },
      estudiantes: {
        title: "Gestión de Estudiantes",
        module: studentsModule,
      },
      tareas: {
        title: "Gestión de Tareas",
        module: tasksModule,
      },
      examenes: {
        title: "Gestión de Exámenes",
        module: examenesModule,
      },
      monedas: {
        title: "Gestión de Monedas",
        module: monedasModule,
      },
      codigos: {
        title: "Códigos de Acceso",
        module: codesModule,
      },
      rankings: {
        title: "Rankings",
        module: rankingsModule,
      },
      reportes: {
        title: "Reportes",
        module: reportesModule,
      },
    };

    this.sectionMap = [
      "dashboard",
      "estudiantes",
      "tareas",
      "examenes",
      "monedas",
      "codigos",
      "rankings",
      "reportes",
    ];
  }

  init() {
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

        // Navegar a la sección
        const section = this.sectionMap[index];
        if (section) {
          this.navigateTo(section);
        }
      });
    });

    // Activar primer link del menú
    navItems[0]?.classList.add("bg-slate-700", "text-white");
  }

  navigateTo(sectionName) {
    this.currentSection = sectionName;
    const section = this.sections[sectionName];

    if (!section) {
      console.error(`Sección no encontrada: ${sectionName}`);
      return;
    }

    // Actualizar título
    this.updateTitle(section.title);

    // Renderizar contenido del módulo
    section.module.render();

    // Cerrar sidebar en móvil
    uiService.closeSidebarMobile();
  }

  updateTitle(title) {
    const mainContent = document.querySelector("main");
    const titleElement = mainContent?.querySelector("h1");

    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  getCurrentSection() {
    return this.currentSection;
  }
}

export default new NavigationModule();
