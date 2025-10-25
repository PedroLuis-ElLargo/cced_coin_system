// ==========================================
// MÓDULO DE CALIFICACIONES
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";
import { CONFIG, NOTIFICATION_TYPES } from "../config.js";

class CalificacionModule {
  constructor() {
    this.modulos = [];
    this.moduloActual = null;
    this.estudiantesInscritos = [];
    this.initialized = false;
  }

  async render() {
    console.log("🔧 Renderizando módulo de calificaciones...");

    const mainContent = document.getElementById("mainContent");
    if (!mainContent) {
      console.error("❌ No se encontró main-content");
      return;
    }

    try {
      // 1. Limpiar contenido previo
      mainContent.innerHTML = "";

      // 2. Crear estructura de manera más controlada
      const calificacionesHTML = `
      <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-slate-800">Módulos Formativos</h1>
            <p class="text-slate-600 mt-1">Sistema de calificaciones por Resultados de Aprendizaje</p>
          </div>
          <button id="btn-nuevo-modulo" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <i data-lucide="plus" class="w-5 h-5"></i>
            Nuevo Módulo
          </button>
        </div>

        <!-- Tabs de navegación -->
        <div class="border-b border-slate-200">
          <nav class="flex space-x-4">
            <button data-tab="modulos" class="tab-btn active px-4 py-2 font-medium text-blue-600 border-b-2 border-blue-600">
              Módulos
            </button>
            <button data-tab="estadisticas" class="tab-btn px-4 py-2 font-medium text-slate-600 hover:text-blue-600">
              Estadísticas
            </button>
            <button data-tab="reportes" class="tab-btn px-4 py-2 font-medium text-slate-600 hover:text-blue-600">
              Reportes
            </button>
          </nav>
        </div>

        <!-- Contenedor de tabs -->
        <div id="tab-content">
          <div class="flex items-center justify-center py-12">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p class="text-slate-500">Cargando módulos...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Nuevo Módulo -->
      <div id="modal-nuevo-modulo" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <h2 class="text-2xl font-bold text-slate-800 mb-4">Nuevo Módulo Formativo</h2>
            <form id="form-nuevo-modulo" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="block text-sm font-medium text-slate-700 mb-1">Nombre del Módulo *</label>
                  <input type="text" name="nombre" required class="w-full px-3 py-2 border border-slate-300 rounded-lg">
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Código *</label>
                  <input type="text" name="codigo" required class="w-full px-3 py-2 border border-slate-300 rounded-lg">
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Grado *</label>
                  <input type="text" name="grado" required class="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="ej: 4to Bachillerato">
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Área *</label>
                  <input type="text" name="area" required class="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="ej: Informática">
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Créditos</label>
                  <input type="number" name="creditos" min="0" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                  <textarea name="descripcion" rows="3" class="w-full px-3 py-2 border border-slate-300 rounded-lg"></textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Año Escolar</label>
                  <input type="text" name="ano_escolar" class="w-full px-3 py-2 border border-slate-300 rounded-lg" value="2024-2025">
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio</label>
                  <input type="date" name="fecha_inicio" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Fecha Fin</label>
                  <input type="date" name="fecha_fin" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Recompensa Completado (STHELA)</label>
                  <input type="number" name="recompensa_completado" min="0" step="0.01" value="100" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Bonus Excelencia (≥90)</label>
                  <input type="number" name="recompensa_excelencia" min="0" step="0.01" value="200" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
                </div>
              </div>
              <div class="flex justify-end gap-2 pt-4">
                <button type="button" id="btn-cancelar-modulo" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  Crear Módulo
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
      // 3. Insertar HTML
      mainContent.innerHTML = calificacionesHTML;

      // 4. INICIALIZAR ICONOS PRIMERO
      await this.initializeIcons();

      // 5. ESPERAR un frame del DOM para asegurar que los elementos existen
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 6. Adjuntar event listeners
      this.attachEventListeners();

      // 7. Cargar datos
      await this.cargarModulos();

      this.initialized = true;
      console.log("✅ Módulo de calificaciones renderizado correctamente");
    } catch (error) {
      console.error("❌ Error renderizando módulo de calificaciones:", error);
    }
  }
  // Agregar método para inicializar icons
  async initializeIcons() {
    if (window.lucide) {
      try {
        lucide.createIcons();
        console.log("✅ Iconos de Lucide inicializados");
      } catch (iconError) {
        console.warn("⚠️ Error inicializando iconos:", iconError);
      }
    }
  }

  attachEventListeners() {
    console.log("🔧 Adjuntando event listeners...");

    // Usar delegación de eventos para elementos dinámicos
    document.addEventListener("click", (e) => {
      // Tabs
      if (e.target.matches(".tab-btn") || e.target.closest(".tab-btn")) {
        const btn = e.target.matches(".tab-btn")
          ? e.target
          : e.target.closest(".tab-btn");
        const tab = btn.dataset.tab;
        if (tab) {
          e.preventDefault();
          this.cambiarTab(tab);
        }
      }

      // Botón nuevo módulo
      if (
        e.target.matches("#btn-nuevo-modulo") ||
        e.target.closest("#btn-nuevo-modulo")
      ) {
        e.preventDefault();
        this.mostrarModalNuevoModulo();
      }
    });

    // Listeners directos para elementos estáticos
    const cancelarBtn = document.getElementById("btn-cancelar-modulo");
    if (cancelarBtn) {
      cancelarBtn.addEventListener("click", () => {
        this.cerrarModalNuevoModulo();
      });
    }

    const formNuevoModulo = document.getElementById("form-nuevo-modulo");
    if (formNuevoModulo) {
      formNuevoModulo.addEventListener("submit", (e) => {
        e.preventDefault();
        this.crearModulo(e.target);
      });
    }

    console.log("✅ Event listeners adjuntados");
  }

  async cambiarTab(tab) {
    // Actualizar botones
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove(
        "active",
        "text-blue-600",
        "border-blue-600",
        "border-b-2"
      );
      btn.classList.add("text-slate-600");
    });
    const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
    activeBtn.classList.remove("text-slate-600");
    activeBtn.classList.add(
      "active",
      "text-blue-600",
      "border-blue-600",
      "border-b-2"
    );

    // Cambiar contenido
    const content = document.getElementById("tab-content");
    switch (tab) {
      case "modulos":
        await this.renderModulos();
        break;
      case "estadisticas":
        await this.renderEstadisticas();
        break;
      case "reportes":
        await this.renderReportes();
        break;
    }
  }

  async cargarModulos() {
    try {
      // Usar apiService helper
      const data = await apiService.getModulos();

      if (data.success) {
        // Compatibilidad con distintas respuestas
        this.modulos = data.data || data.modulos || data.modulos_list || [];
        await this.renderModulos();
      } else {
        uiService.showNotification(
          "Error al cargar módulos: " + (data.message || ""),
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error:", error);
      uiService.showNotification(
        "Error al cargar módulos",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  async renderModulos() {
    const content = document.getElementById("tab-content");
    if (!content) return;

    if (this.modulos.length === 0) {
      content.innerHTML = `
        <div class="text-center py-12">
          <i data-lucide="book-open" class="w-16 h-16 mx-auto text-slate-300 mb-4"></i>
          <h3 class="text-lg font-medium text-slate-600">No hay módulos creados</h3>
          <p class="text-slate-500 mt-2">Comienza creando tu primer módulo formativo</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    content.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${this.modulos
          .map(
            (modulo) => `
          <div class="bg-white rounded-lg border border-slate-200 hover:shadow-lg transition-shadow">
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h3 class="text-lg font-bold text-slate-800">${
                    modulo.nombre
                  }</h3>
                  <p class="text-sm text-slate-600">${modulo.codigo} - ${
              modulo.grado
            }</p>
                </div>
                <span class="px-2 py-1 text-xs font-medium rounded-full ${
                  modulo.estado === "activo"
                    ? "bg-green-100 text-green-800"
                    : "bg-slate-100 text-slate-800"
                }">
                  ${modulo.estado}
                </span>
              </div>
              
              <div class="space-y-2 mb-4">
                <div class="flex items-center gap-2 text-sm text-slate-600">
                  <i data-lucide="users" class="w-4 h-4"></i>
                  <span>${modulo.total_estudiantes || 0} estudiantes</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-slate-600">
                  <i data-lucide="target" class="w-4 h-4"></i>
                  <span>${modulo.total_ra || 0} RAs</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-slate-600">
                  <i data-lucide="award" class="w-4 h-4"></i>
                  <span>${modulo.area}</span>
                </div>
              </div>

              <div class="flex gap-2">
                <button onclick="calificacionModule.verDetallesModulo(${
                  modulo.id
                })" 
                        class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
                  Ver Detalles
                </button>
                <button onclick="calificacionModule.mostrarModalInscribirEstudiantes(${
                  modulo.id
                })" 
                        class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg">
                  <i data-lucide="user-plus" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  async renderEstadisticas() {
    const content = document.getElementById("tab-content");
    if (!content) return;

    content.innerHTML = `
      <div class="bg-white rounded-lg border border-slate-200 p-6">
        <h3 class="text-lg font-bold text-slate-800 mb-4">Estadísticas Generales</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center p-6 bg-blue-50 rounded-lg">
            <div class="text-3xl font-bold text-blue-600">${
              this.modulos.length
            }</div>
            <div class="text-sm text-slate-600 mt-1">Módulos Activos</div>
          </div>
          <div class="text-center p-6 bg-green-50 rounded-lg">
            <div class="text-3xl font-bold text-green-600">${this.modulos.reduce(
              (sum, m) => sum + (m.total_estudiantes || 0),
              0
            )}</div>
            <div class="text-sm text-slate-600 mt-1">Estudiantes Inscritos</div>
          </div>
          <div class="text-center p-6 bg-purple-50 rounded-lg">
            <div class="text-3xl font-bold text-purple-600">${this.modulos.reduce(
              (sum, m) => sum + (m.total_resultados || 0),
              0
            )}</div>
            <div class="text-sm text-slate-600 mt-1">RAs Totales</div>
          </div>
        </div>
      </div>
    `;
  }

  async renderReportes() {
    const content = document.getElementById("tab-content");
    if (!content) return;

    content.innerHTML = `
      <div class="bg-white rounded-lg border border-slate-200 p-6">
        <h3 class="text-lg font-bold text-slate-800 mb-4">Reportes</h3>
        <div class="space-y-4">
          ${this.modulos
            .map(
              (modulo) => `
            <div class="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div>
                <h4 class="font-medium text-slate-800">${modulo.nombre}</h4>
                <p class="text-sm text-slate-600">${modulo.codigo}</p>
              </div>
              <button onclick="calificacionModule.generarReporte(${modulo.id})" 
                      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
                Generar Reporte
              </button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  mostrarModalNuevoModulo() {
    const modal = document.getElementById("modal-nuevo-modulo");
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  cerrarModalNuevoModulo() {
    const modal = document.getElementById("modal-nuevo-modulo");
    if (modal) {
      modal.classList.add("hidden");
      document.getElementById("form-nuevo-modulo")?.reset();
    }
  }

  async crearModulo(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      // Usar apiService helper
      const result = await apiService.createModulo(data);

      if (result.success) {
        uiService.showNotification(
          "✅ Módulo creado exitosamente",
          NOTIFICATION_TYPES.SUCCESS
        );
        this.cerrarModalNuevoModulo();
        await this.cargarModulos();
      } else {
        uiService.showNotification(
          "❌ " + result.message,
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error:", error);
      uiService.showNotification(
        "Error al crear módulo",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  async verDetallesModulo(moduloId) {
    try {
      // Usar apiService helper
      const data = await apiService.getModuloDetalles(moduloId);

      if (data.success) {
        this.moduloActual =
          data.modulo || data.data || data.modulo_info || null;
        this.estudiantesInscritos = data.estudiantes || data.students || [];
        this.renderDetallesModulo();
      } else {
        uiService.showNotification(
          "Error al cargar detalles",
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error:", error);
      uiService.showNotification(
        "Error al cargar detalles",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  renderDetallesModulo() {
    const mainContent = document.getElementById("mainContent");
    if (!mainContent || !this.moduloActual) return;

    const modulo = this.moduloActual;

    mainContent.innerHTML = `
      <div class="p-6 space-y-6">
        <!-- Header con Botón Volver -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button onclick="calificacionModule.render()" class="p-2 hover:bg-slate-100 rounded-lg">
              <i data-lucide="arrow-left" class="w-5 h-5"></i>
            </button>
            <div>
              <h1 class="text-3xl font-bold text-slate-800">${
                modulo.nombre
              }</h1>
              <p class="text-slate-600 mt-1">${modulo.codigo} - ${
      modulo.grado
    }</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="calificacionModule.mostrarModalAgregarRA(${
              modulo.id
            })" 
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <i data-lucide="plus" class="w-5 h-5"></i>
              Agregar RA
            </button>
            <button onclick="calificacionModule.mostrarModalInscribirEstudiantes(${
              modulo.id
            })" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <i data-lucide="user-plus" class="w-5 h-5"></i>
              Inscribir Estudiantes
            </button>
          </div>
        </div>

        <!-- Info del Módulo -->
        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p class="text-sm text-slate-600">Área</p>
              <p class="text-lg font-medium text-slate-800">${modulo.area}</p>
            </div>
            <div>
              <p class="text-sm text-slate-600">Créditos</p>
              <p class="text-lg font-medium text-slate-800">${
                modulo.creditos || "N/A"
              }</p>
            </div>
            <div>
              <p class="text-sm text-slate-600">Estado</p>
              <span class="inline-block px-2 py-1 text-sm font-medium rounded-full ${
                modulo.estado === "activo"
                  ? "bg-green-100 text-green-800"
                  : "bg-slate-100 text-slate-800"
              }">
                ${modulo.estado}
              </span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-slate-200">
          <nav class="flex space-x-4">
            <button data-tab-detalle="estudiantes" class="tab-detalle-btn active px-4 py-2 font-medium text-blue-600 border-b-2 border-blue-600">
              Estudiantes (${this.estudiantesInscritos.length})
            </button>
            <button data-tab-detalle="resultados" class="tab-detalle-btn px-4 py-2 font-medium text-slate-600 hover:text-blue-600">
              Resultados de Aprendizaje (${
                modulo.resultados_aprendizaje?.length || 0
              })
            </button>
          </nav>
        </div>

        <!-- Contenedor de tabs -->
        <div id="tab-detalle-content"></div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Event listeners para tabs
    document.querySelectorAll(".tab-detalle-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tabDetalle;
        this.cambiarTabDetalle(tab);
      });
    });

    this.renderEstudiantes();
  }

  cambiarTabDetalle(tab) {
    // Actualizar botones
    document.querySelectorAll(".tab-detalle-btn").forEach((btn) => {
      btn.classList.remove(
        "active",
        "text-blue-600",
        "border-blue-600",
        "border-b-2"
      );
      btn.classList.add("text-slate-600");
    });
    const activeBtn = document.querySelector(`[data-tab-detalle="${tab}"]`);
    activeBtn.classList.remove("text-slate-600");
    activeBtn.classList.add(
      "active",
      "text-blue-600",
      "border-blue-600",
      "border-b-2"
    );

    // Cambiar contenido
    switch (tab) {
      case "estudiantes":
        this.renderEstudiantes();
        break;
      case "resultados":
        this.renderResultadosAprendizaje();
        break;
    }
  }

  renderEstudiantes() {
    const content = document.getElementById("tab-detalle-content");
    if (!content) return;

    if (this.estudiantesInscritos.length === 0) {
      content.innerHTML = `
        <div class="text-center py-12 bg-white rounded-lg border border-slate-200">
          <i data-lucide="users" class="w-16 h-16 mx-auto text-slate-300 mb-4"></i>
          <h3 class="text-lg font-medium text-slate-600">No hay estudiantes inscritos</h3>
          <p class="text-slate-500 mt-2">Inscribe estudiantes para comenzar</p>
          <button onclick="calificacionModule.mostrarModalInscribirEstudiantes(${this.moduloActual.id})" 
                  class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            Inscribir Estudiantes
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    content.innerHTML = `
      <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Estudiante</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Progreso</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Promedio</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            ${this.estudiantesInscritos
              .map(
                (est) => `
              <tr class="hover:bg-slate-50">
                <td class="px-6 py-4">
                  <div class="font-medium text-slate-800">${est.nombre}</div>
                </td>
                <td class="px-6 py-4 text-slate-600">${est.email}</td>
                <td class="px-6 py-4">
                  <div class="w-full bg-slate-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full" style="width: ${
                      est.progreso || 0
                    }%"></div>
                  </div>
                  <span class="text-xs text-slate-600 mt-1">${
                    est.progreso || 0
                  }%</span>
                </td>
                <td class="px-6 py-4">
                  <span class="font-medium ${
                    (est.promedio || 0) >= 90
                      ? "text-green-600"
                      : (est.promedio || 0) >= 70
                      ? "text-blue-600"
                      : "text-slate-600"
                  }">
                    ${est.promedio || 0}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <button onclick="calificacionModule.verCalificacionesEstudiante(${
                    this.moduloActual.id
                  }, ${est.id_estudiante})" 
                          class="text-blue-600 hover:text-blue-800">
                    Ver Calificaciones
                  </button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  renderResultadosAprendizaje() {
    const content = document.getElementById("tab-detalle-content");
    if (!content || !this.moduloActual) return;

    const resultados = this.moduloActual.resultados_aprendizaje || [];

    if (resultados.length === 0) {
      content.innerHTML = `
        <div class="text-center py-12 bg-white rounded-lg border border-slate-200">
          <i data-lucide="target" class="w-16 h-16 mx-auto text-slate-300 mb-4"></i>
          <h3 class="text-lg font-medium text-slate-600">No hay RAs definidos</h3>
          <p class="text-slate-500 mt-2">Define los Resultados de Aprendizaje para evaluar</p>
          <button onclick="calificacionModule.mostrarModalAgregarRA(${this.moduloActual.id})" 
                  class="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
            Agregar RA
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    content.innerHTML = `
      <div class="space-y-4">
        ${resultados
          .map(
            (ra) => `
          <div class="bg-white rounded-lg border border-slate-200 p-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    RA ${ra.orden}
                  </span>
                  <h3 class="text-lg font-bold text-slate-800">${ra.nombre}</h3>
                </div>
                ${
                  ra.descripcion
                    ? `<p class="text-slate-600 mb-4">${ra.descripcion}</p>`
                    : ""
                }
                <div class="flex gap-6 text-sm">
                  <div>
                    <span class="text-slate-600">Porcentaje:</span>
                    <span class="font-medium text-slate-800 ml-1">${
                      ra.porcentaje
                    }%</span>
                  </div>
                  <div>
                    <span class="text-slate-600">Recompensa:</span>
                    <span class="font-medium text-slate-800 ml-1">${
                      ra.recompensa_completado || 0
                    } STHELA</span>
                  </div>
                </div>
              </div>
              <div class="flex gap-2">
                <button onclick="calificacionModule.editarRA(${ra.id_ra})" 
                        class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <i data-lucide="edit" class="w-4 h-4"></i>
                </button>
                <button onclick="calificacionModule.eliminarRA(${ra.id_ra})" 
                        class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  async verCalificacionesEstudiante(moduloId, estudianteId) {
    try {
      // Usar apiService helper (ruta: /admin/calificaciones/estudiante/:estudianteId/modulo/:moduloId)
      const data = await apiService.getCalificacionesEstudiante(
        estudianteId,
        moduloId
      );

      if (data && data.success) {
        // backend devuelve { success: true, data: [...] }
        this.mostrarModalCalificaciones(data.data || [], estudianteId);
      } else {
        uiService.showNotification(
          "Error al cargar calificaciones",
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error:", error);
      uiService.showNotification(
        "Error al cargar calificaciones",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  mostrarModalCalificaciones(calificaciones, estudianteId) {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <h2 class="text-2xl font-bold text-slate-800 mb-6">Calificaciones por RA</h2>
          <div class="space-y-4">
            ${calificaciones
              .map(
                (cal) => `
              <div class="border border-slate-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <h3 class="font-medium text-slate-800">RA ${cal.orden}: ${
                  cal.nombre_ra
                }</h3>
                    <p class="text-sm text-slate-600">Peso: ${
                      cal.porcentaje
                    }%</p>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-bold ${
                      (cal.calificacion || 0) >= 90
                        ? "text-green-600"
                        : (cal.calificacion || 0) >= 70
                        ? "text-blue-600"
                        : "text-slate-600"
                    }">
                      ${cal.calificacion || "N/A"}
                    </div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <input type="number" 
                         id="cal-${cal.id_ra}" 
                         min="0" 
                         max="100" 
                         step="0.01"
                         value="${cal.calificacion || ""}"
                         placeholder="0-100"
                         class="flex-1 px-3 py-2 border border-slate-300 rounded-lg">
                  <button onclick="calificacionModule.guardarCalificacion(${
                    this.moduloActual.id
                  }, ${estudianteId}, ${cal.id_ra})" 
                          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    Guardar
                  </button>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
          <div class="flex justify-end gap-2 pt-6 mt-6 border-t">
            <button class="btn-cerrar px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal
      .querySelector(".btn-cerrar")
      .addEventListener("click", () => modal.remove());
  }

  async guardarCalificacion(moduloId, estudianteId, raId) {
    const input = document.getElementById(`cal-${raId}`);
    const calificacion = parseFloat(input.value);

    if (isNaN(calificacion) || calificacion < 0 || calificacion > 100) {
      uiService.showNotification(
        "Calificación inválida (0-100)",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    try {
      // Usar apiService helper (registro estándar de calificación por RA)
      const payload = {
        estudianteId: estudianteId,
        raId: raId,
        moduloId: moduloId,
        calificacion: calificacion,
      };

      const result = await apiService.guardarCalificacionRA(payload);

      if (result.success) {
        uiService.showNotification(
          "✅ Calificación guardada",
          NOTIFICATION_TYPES.SUCCESS
        );
        await this.verDetallesModulo(moduloId);
      } else {
        uiService.showNotification(
          "❌ " + result.message,
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error:", error);
      uiService.showNotification(
        "Error al guardar calificación",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  async mostrarModalAgregarRA(moduloId) {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-lg w-full">
        <div class="p-6">
          <h2 class="text-xl font-bold text-slate-800 mb-4">Agregar Resultado de Aprendizaje</h2>
          <form id="form-agregar-ra" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Nombre del RA *</label>
              <input type="text" name="nombre" required class="w-full px-3 py-2 border border-slate-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea name="descripcion" rows="2" class="w-full px-3 py-2 border border-slate-300 rounded-lg"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Porcentaje (%) *</label>
                <input type="number" name="porcentaje" required min="0" max="100" step="0.01" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Orden *</label>
                <input type="number" name="orden" required min="1" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Recompensa (STHELA)</label>
              <input type="number" name="recompensa_completado" min="0" step="0.01" value="10" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
            </div>
            <div class="flex justify-end gap-2 pt-4">
              <button type="button" class="btn-cancelar px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancelar
              </button>
              <button type="submit" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
                Agregar RA
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal
      .querySelector(".btn-cancelar")
      .addEventListener("click", () => modal.remove());

    modal
      .querySelector("#form-agregar-ra")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
          // Usar apiService helper
          const result = await apiService.createRA(moduloId, data);

          if (result.success) {
            uiService.showNotification(
              "✅ RA agregado exitosamente",
              NOTIFICATION_TYPES.SUCCESS
            );
            modal.remove();
            this.verDetallesModulo(moduloId);
          } else {
            uiService.showNotification(
              "❌ " + result.message,
              NOTIFICATION_TYPES.ERROR
            );
          }
        } catch (error) {
          console.error("Error:", error);
          uiService.showNotification(
            "Error al agregar RA",
            NOTIFICATION_TYPES.ERROR
          );
        }
      });
  }

  async mostrarModalInscribirEstudiantes(moduloId) {
    try {
      // Usar apiService
      const data = await apiService.getStudents();

      if (data.success) {
        const estudiantes = data.students;

        const modal = document.createElement("div");
        modal.className =
          "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4";
        modal.innerHTML = `
          <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
              <h2 class="text-xl font-bold text-slate-800 mb-4">Inscribir Estudiantes</h2>
              <div class="space-y-2 max-h-96 overflow-y-auto">
                ${estudiantes
                  .map(
                    (est) => `
                  <label class="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" value="${est.id_estudiante}" class="checkbox-estudiante mr-3">
                    <div class="flex-1">
                      <p class="font-medium text-slate-800">${est.nombre}</p>
                      <p class="text-sm text-slate-500">${est.email}</p>
                    </div>
                  </label>
                `
                  )
                  .join("")}
              </div>
              <div class="flex justify-end gap-2 pt-4 mt-4 border-t">
                <button type="button" class="btn-cancelar px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancelar
                </button>
                <button type="button" class="btn-inscribir px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  Inscribir Seleccionados
                </button>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        modal
          .querySelector(".btn-cancelar")
          .addEventListener("click", () => modal.remove());

        modal
          .querySelector(".btn-inscribir")
          .addEventListener("click", async () => {
            const checkboxes = modal.querySelectorAll(
              ".checkbox-estudiante:checked"
            );
            const estudiantesIds = Array.from(checkboxes).map((cb) =>
              parseInt(cb.value)
            );

            if (estudiantesIds.length === 0) {
              uiService.showNotification(
                "Selecciona al menos un estudiante",
                NOTIFICATION_TYPES.WARNING
              );
              return;
            }

              try {
              // Usar helper apiService.inscribirEstudiantes
              const result = await apiService.inscribirEstudiantes({
                moduloId,
                estudiantesIds,
              });

              if (result.success) {
                uiService.showNotification(
                  "✅ " + result.message,
                  NOTIFICATION_TYPES.SUCCESS
                );
                modal.remove();
                await this.cargarModulos();
              } else {
                uiService.showNotification(
                  "❌ " + result.message,
                  NOTIFICATION_TYPES.ERROR
                );
              }
            } catch (error) {
              console.error("Error:", error);
              uiService.showNotification(
                "Error al inscribir estudiantes",
                NOTIFICATION_TYPES.ERROR
              );
            }
          });
      }
    } catch (error) {
      console.error("Error:", error);
      uiService.showNotification(
        "Error al cargar estudiantes",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  async generarReporte(moduloId) {
    try {
      // Usar apiService helper
      const data = await apiService.generarReporteCalificaciones(moduloId);

      if (data.success) {
        uiService.showNotification(
          "✅ Reporte generado (ver consola)",
          NOTIFICATION_TYPES.SUCCESS
        );
      }
    } catch (error) {
      console.error("Error:", error);
      uiService.showNotification(
        "Error al generar reporte",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  async editarRA(raId) {
    uiService.showNotification(
      "Función en desarrollo",
      NOTIFICATION_TYPES.INFO
    );
  }

  async eliminarRA(raId) {
    if (!confirm("¿Estás seguro de eliminar este RA?")) return;

    try {
      // Usar apiService helper
      const result = await apiService.deleteRA(raId);

      if (result.success) {
        uiService.showNotification(
          "✅ RA eliminado",
          NOTIFICATION_TYPES.SUCCESS
        );
        await this.verDetallesModulo(this.moduloActual.id);
      } else {
        uiService.showNotification(
          "❌ " + result.message,
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error:", error);
      uiService.showNotification(
        "Error al eliminar RA",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }
}

// Crear instancia global
const calificacionModule = new CalificacionModule();

// Hacer accesible globalmente para los onclick en el HTML
window.calificacionModule = calificacionModule;

// Exportar
export default calificacionModule;
