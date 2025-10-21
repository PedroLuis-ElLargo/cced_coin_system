// ==========================================
// MÓDULO DE NAVEGACIÓN - FRONTEND
// ==========================================

import dashboardModule from "../modules/dashboardModule.js";
import studentsModule from "../modules/studentsModule.js";
import tasksModule from "../modules/tasksModule.js";
import { examenesModule } from "../modules/examenesModule.js";
import monedasModule from "../modules/monedasModule.js";
import codesModule from "../modules/codesModule.js";

class NavigationModule {
  constructor() {
    this.modules = {
      dashboard: dashboardModule,
      students: studentsModule,
      tasks: tasksModule,
      exams: examenesModule,
      coins: monedasModule,
      codes: codesModule
    };
    
    this.currentModule = 'dashboard';
    this.init();
  }

  init() {
    // Agregar event listeners a los elementos de navegación
    const navItems = document.querySelectorAll('.sidebar-nav-items a');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const moduleId = this.getModuleIdFromMenuItem(item);
        if (moduleId) {
          this.navigateTo(moduleId);
        }
      });
    });

    // Activar el módulo inicial (dashboard)
    this.navigateTo('dashboard');
  }

  getModuleIdFromMenuItem(menuItem) {
    const menuText = menuItem.querySelector('.menu-text').textContent.toLowerCase();
    const moduleMap = {
      'dashboard': 'dashboard',
      'estudiantes': 'students',
      'tareas': 'tasks',
      'exámenes': 'exams',
      'monedas': 'coins',
      'códigos acceso': 'codes'
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
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = '';
    }

    // Renderizar el nuevo módulo
    const module = this.modules[moduleId];
    if (module && typeof module.render === 'function') {
      try {
        await module.render();
      } catch (error) {
        console.error(`Error rendering module ${moduleId}:`, error);
      }
    }
  }

  updateActiveNavItem(moduleId) {
    // Remover clase activa de todos los items
    const navItems = document.querySelectorAll('.sidebar-nav-items a');
    navItems.forEach(item => {
      item.classList.remove('bg-slate-700', 'text-white');
      item.classList.add('text-slate-300');
    });

    // Encontrar y activar el item correspondiente al módulo actual
    const moduleText = Object.entries(this.modules).find(([key]) => key === moduleId)?.[1]?.name || moduleId;
    const activeItem = Array.from(navItems).find(item => 
      item.querySelector('.menu-text').textContent.toLowerCase().includes(moduleText.toLowerCase())
    );

    if (activeItem) {
      activeItem.classList.remove('text-slate-300');
      activeItem.classList.add('bg-slate-700', 'text-white');
    }
  }
}

// Create and export a single instance
const navigationModule = new NavigationModule();
export default navigationModule;