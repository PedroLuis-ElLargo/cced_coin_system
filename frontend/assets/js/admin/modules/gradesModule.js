// ==========================================
// GRADES-MODULE.JS - Módulo de Calificaciones (COMPLETO)
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";
import { NOTIFICATION_TYPES } from "../config.js";

class GradesModule {
  constructor() {
    this.periodoActivo = null;
    this.vistaActual = "inicio";
    this.estudianteSeleccionado = null;
    this.materiaSeleccionada = null;
  }

  async render() {
    const content = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-2xl font-bold mb-2">📊 Sistema de Calificaciones</h2>
              <p class="text-indigo-100">Gestión integral de evaluaciones académicas y módulos formativos</p>
            </div>
            <div id="periodoBadge" class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p class="text-sm">Periodo Activo</p>
              <p class="font-bold text-lg">Cargando...</p>
            </div>
          </div>
        </div>

        <!-- Menú de navegación -->
        <div class="bg-white rounded-xl shadow-lg p-4">
          <div class="flex gap-3 overflow-x-auto pb-2">
            <button 
              data-vista="inicio"
              class="vista-btn px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap"
            >
              <i data-lucide="home" class="w-4 h-4 inline mr-2"></i>
              Inicio
            </button>
            <button 
              data-vista="academicas"
              class="vista-btn px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap"
            >
              <i data-lucide="book-open" class="w-4 h-4 inline mr-2"></i>
              Calificaciones Académicas
            </button>
            <button 
              data-vista="modulos"
              class="vista-btn px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap"
            >
              <i data-lucide="award" class="w-4 h-4 inline mr-2"></i>
              Módulos Formativos
            </button>
            <button 
              data-vista="reportes"
              class="vista-btn px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap"
            >
              <i data-lucide="file-text" class="w-4 h-4 inline mr-2"></i>
              Reportes
            </button>
            <button 
              data-vista="configuracion"
              class="vista-btn px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap"
            >
              <i data-lucide="settings" class="w-4 h-4 inline mr-2"></i>
              Configuración
            </button>
          </div>
        </div>

        <!-- Contenedor de vistas -->
        <div id="gradesContent" class="min-h-[400px]">
          <div class="text-center py-12">
            <i data-lucide="loader" class="w-12 h-12 mx-auto mb-4 animate-spin text-indigo-500"></i>
            <p class="text-slate-600">Cargando...</p>
          </div>
        </div>
      </div>
    `;

    uiService.updateMainContent(content);
    await this.loadPeriodoActivo();
    this.setupEventListeners();
    await this.loadVista("inicio");
  }

  async loadPeriodoActivo() {
    try {
      const data = await apiService.getPeriodoActivo();
      if (data.success && data.periodo) {
        this.periodoActivo = data.periodo;

        const badge = document.getElementById("periodoBadge");
        if (badge) {
          badge.innerHTML = `
            <p class="text-sm">Periodo Activo</p>
            <p class="font-bold text-lg">${data.periodo.nombre}</p>
          `;
        }
      }
    } catch (error) {
      console.error("Error cargando periodo activo:", error);

      // Modo fallback
      this.periodoActivo = {
        id: 1,
        nombre: "Sin configurar",
        year: new Date().getFullYear(),
      };

      const badge = document.getElementById("periodoBadge");
      if (badge) {
        badge.innerHTML = `
          <p class="text-sm text-yellow-200">⚠️ No configurado</p>
          <p class="text-xs text-yellow-100">Configure en Configuración</p>
        `;
      }
    }
  }

  setupEventListeners() {
    document.querySelectorAll(".vista-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const vista = e.target.closest("button").dataset.vista;
        this.loadVista(vista);
      });
    });
  }

  async loadVista(vista) {
    this.vistaActual = vista;

    // Actualizar botones activos
    document.querySelectorAll(".vista-btn").forEach((btn) => {
      if (btn.dataset.vista === vista) {
        btn.classList.add("bg-indigo-600", "text-white", "shadow-lg");
        btn.classList.remove(
          "bg-slate-100",
          "text-slate-600",
          "hover:bg-slate-200"
        );
      } else {
        btn.classList.remove("bg-indigo-600", "text-white", "shadow-lg");
        btn.classList.add(
          "bg-slate-100",
          "text-slate-600",
          "hover:bg-slate-200"
        );
      }
    });

    const container = document.getElementById("gradesContent");
    if (!container) return;

    switch (vista) {
      case "inicio":
        await this.renderInicio(container);
        break;
      case "academicas":
        await this.renderAcademicas(container);
        break;
      case "modulos":
        await this.renderModulos(container);
        break;
      case "reportes":
        await this.renderReportes(container);
        break;
      case "configuracion":
        await this.renderConfiguracion(container);
        break;
      default:
        container.innerHTML = "<p>Vista no encontrada</p>";
    }

    lucide.createIcons();
  }

  // ==========================================
  // VISTA: INICIO
  // ==========================================
  async renderInicio(container) {
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Card: Calificaciones Académicas -->
        <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-blue-200" data-action="ir-academicas">
          <div class="flex items-center mb-4">
            <div class="p-3 bg-blue-100 rounded-lg">
              <i data-lucide="book-open" class="w-8 h-8 text-blue-600"></i>
            </div>
            <div class="ml-4">
              <h3 class="text-xl font-bold text-slate-800">Calificaciones Académicas</h3>
              <p class="text-slate-500 text-sm">Sistema tradicional de calificaciones</p>
            </div>
          </div>
          <ul class="space-y-2 text-sm text-slate-600">
            <li class="flex items-center">
              <i data-lucide="check" class="w-4 h-4 text-green-500 mr-2"></i>
              Calificaciones por periodo (trimestres)
            </li>
            <li class="flex items-center">
              <i data-lucide="check" class="w-4 h-4 text-green-500 mr-2"></i>
              Escala de 0 a 100 puntos
            </li>
            <li class="flex items-center">
              <i data-lucide="check" class="w-4 h-4 text-green-500 mr-2"></i>
              Mínimo aprobatorio: 70 puntos
            </li>
          </ul>
          <button class="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Gestionar Calificaciones
          </button>
        </div>

        <!-- Card: Módulos Formativos -->
        <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-purple-200" data-action="ir-modulos">
          <div class="flex items-center mb-4">
            <div class="p-3 bg-purple-100 rounded-lg">
              <i data-lucide="award" class="w-8 h-8 text-purple-600"></i>
            </div>
            <div class="ml-4">
              <h3 class="text-xl font-bold text-slate-800">Módulos Formativos</h3>
              <p class="text-slate-500 text-sm">Evaluación por competencias</p>
            </div>
          </div>
          <ul class="space-y-2 text-sm text-slate-600">
            <li class="flex items-center">
              <i data-lucide="check" class="w-4 h-4 text-green-500 mr-2"></i>
              Resultados de Aprendizaje (RA)
            </li>
            <li class="flex items-center">
              <i data-lucide="check" class="w-4 h-4 text-green-500 mr-2"></i>
              3 oportunidades + evaluación especial
            </li>
            <li class="flex items-center">
              <i data-lucide="check" class="w-4 h-4 text-green-500 mr-2"></i>
              Seguimiento detallado por RA
            </li>
          </ul>
          <button class="mt-4 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
            Gestionar Módulos
          </button>
        </div>

        <!-- Card: Reportes -->
        <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-green-200" data-action="ir-reportes">
          <div class="flex items-center mb-4">
            <div class="p-3 bg-green-100 rounded-lg">
              <i data-lucide="file-text" class="w-8 h-8 text-green-600"></i>
            </div>
            <div class="ml-4">
              <h3 class="text-xl font-bold text-slate-800">Reportes</h3>
              <p class="text-slate-500 text-sm">Análisis y estadísticas</p>
            </div>
          </div>
          <ul class="space-y-2 text-sm text-slate-600">
            <li class="flex items-center">
              <i data-lucide="check" class="w-4 h-4 text-green-500 mr-2"></i>
              Boletines de calificaciones
            </li>
            <li class="flex items-center">
              <i data-lucide="check" class="w-4 h-4 text-green-500 mr-2"></i>
              Estadísticas por materia
            </li>
          </ul>
          <button class="mt-4 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
            Ver Reportes
          </button>
        </div>

        <!-- Card: Estadísticas Rápidas -->
        <div class="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <h3 class="text-xl font-bold mb-4">📈 Estadísticas del Periodo</h3>
          <div id="quickStats" class="space-y-3">
            <div class="flex justify-between items-center">
              <span>Total Estudiantes:</span>
              <span class="text-2xl font-bold">-</span>
            </div>
            <div class="flex justify-between items-center">
              <span>Promedio General:</span>
              <span class="text-2xl font-bold">-</span>
            </div>
            <div class="flex justify-between items-center">
              <span>Aprobados:</span>
              <span class="text-2xl font-bold">-</span>
            </div>
          </div>
        </div>

        <!-- Card: Acciones Rápidas -->
        <div class="bg-white p-6 rounded-xl shadow-lg">
          <h3 class="text-xl font-bold mb-4 text-slate-800">⚡ Acciones Rápidas</h3>
          <div class="space-y-2">
            <button onclick="gradesModule.loadVista('configuracion')" class="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-left">
              <i data-lucide="user-plus" class="w-4 h-4 inline mr-2"></i>
              Inscribir Estudiante
            </button>
            <button onclick="gradesModule.loadVista('configuracion')" class="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-left">
              <i data-lucide="book" class="w-4 h-4 inline mr-2"></i>
              Crear Materia
            </button>
            <button onclick="gradesModule.loadVista('configuracion')" class="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-left">
              <i data-lucide="calendar" class="w-4 h-4 inline mr-2"></i>
              Configurar Periodo
            </button>
            <button onclick="gradesModule.loadVista('reportes')" class="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-left">
              <i data-lucide="download" class="w-4 h-4 inline mr-2"></i>
              Exportar Datos
            </button>
          </div>
        </div>
      </div>
    `;

    // Event listeners para las tarjetas
    container
      .querySelector('[data-action="ir-academicas"]')
      ?.addEventListener("click", () => {
        this.loadVista("academicas");
      });

    container
      .querySelector('[data-action="ir-modulos"]')
      ?.addEventListener("click", () => {
        this.loadVista("modulos");
      });

    container
      .querySelector('[data-action="ir-reportes"]')
      ?.addEventListener("click", () => {
        this.loadVista("reportes");
      });

    await this.loadQuickStats();
  }

  async loadQuickStats() {
    if (!this.periodoActivo) return;

    try {
      const data = await apiService.getListadoEstudiantes({
        periodoId: this.periodoActivo.id,
      });

      if (data.success) {
        const totalEstudiantes = data.estudiantes.length;
        const aprobados = data.estudiantes.filter(
          (e) => e.promedio_general >= 70
        ).length;
        const promedioGeneral =
          totalEstudiantes > 0
            ? (
                data.estudiantes.reduce(
                  (sum, e) => sum + e.promedio_general,
                  0
                ) / totalEstudiantes
              ).toFixed(2)
            : 0;

        const statsContainer = document.getElementById("quickStats");
        if (statsContainer) {
          statsContainer.innerHTML = `
            <div class="flex justify-between items-center">
              <span>Total Estudiantes:</span>
              <span class="text-2xl font-bold">${totalEstudiantes}</span>
            </div>
            <div class="flex justify-between items-center">
              <span>Promedio General:</span>
              <span class="text-2xl font-bold">${promedioGeneral}</span>
            </div>
            <div class="flex justify-between items-center">
              <span>Aprobados:</span>
              <span class="text-2xl font-bold">${aprobados} (${
            totalEstudiantes > 0
              ? ((aprobados / totalEstudiantes) * 100).toFixed(0)
              : 0
          }%)</span>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  }

  // ==========================================
  // VISTA: CALIFICACIONES ACADÉMICAS
  // ==========================================
  async renderAcademicas(container) {
    if (!this.periodoActivo) {
      container.innerHTML = `
        <div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
          <i data-lucide="alert-triangle" class="w-16 h-16 mx-auto mb-4 text-yellow-500"></i>
          <h3 class="text-xl font-semibold text-yellow-800 mb-2">No hay periodo activo</h3>
          <p class="text-yellow-700 mb-4">Debes configurar un periodo escolar antes de registrar calificaciones</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-white p-6 rounded-xl shadow-lg">
          <h3 class="text-2xl font-bold text-slate-800 mb-4">
            <i data-lucide="book-open" class="w-6 h-6 inline mr-2 text-blue-600"></i>
            Calificaciones Académicas
          </h3>
          <p class="text-slate-600 mb-4">
            Selecciona una materia para ver y editar las calificaciones de todos los estudiantes inscritos.
          </p>

          <!-- Filtros -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Materia Académica</label>
              <select id="academicMateriaSelect" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccionar materia...</option>
              </select>
            </div>
            <div class="flex items-end">
              <button 
                id="loadAcademicGrades"
                class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <i data-lucide="search" class="w-4 h-4 inline mr-2"></i>
                Cargar Estudiantes
              </button>
            </div>
          </div>
        </div>

        <!-- Contenedor de calificaciones -->
        <div id="academicGradesContainer">
          <div class="bg-white p-12 rounded-xl shadow-lg text-center">
            <i data-lucide="search" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>
            <p class="text-slate-500">Selecciona una materia para ver todos los estudiantes inscritos</p>
          </div>
        </div>
      </div>
    `;

    await this.loadAcademicFilters();
    this.setupAcademicListeners();
  }

  async loadAcademicFilters() {
    try {
      const materias = await apiService.getMaterias({ tipo: "academica" });
      const materiaSelect = document.getElementById("academicMateriaSelect");

      if (materiaSelect && materias.success) {
        materias.materias.forEach((materia) => {
          const option = document.createElement("option");
          option.value = materia.id;
          option.textContent = materia.nombre;
          materiaSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Error cargando filtros:", error);
    }
  }

  setupAcademicListeners() {
    const loadBtn = document.getElementById("loadAcademicGrades");
    if (loadBtn) {
      loadBtn.addEventListener("click", () => this.loadAcademicGradesData());
    }
  }

  async loadAcademicGradesData() {
    const materiaId = document.getElementById("academicMateriaSelect").value;

    if (!materiaId) {
      uiService.showNotification(
        "⚠️ Debes seleccionar una materia",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    this.materiaSeleccionada = materiaId;

    try {
      const studentsData = await apiService.getStudents();

      if (!studentsData.success || !studentsData.students) {
        throw new Error("No se pudieron cargar los estudiantes");
      }

      const materias = await apiService.getMaterias({ tipo: "academica" });
      const materia = materias.materias.find((m) => m.id == materiaId);

      const estudiantesConCalif = [];

      for (const student of studentsData.students) {
        try {
          const inscripcionesData = await apiService.getInscripcionesEstudiante(
            student.id_estudiante,
            this.periodoActivo.id
          );

          const inscripcion = inscripcionesData.inscripciones?.find(
            (i) => i.materia_id == materiaId
          );

          if (inscripcion) {
            const califData = await apiService.getCalificacionesAcademicas(
              inscripcion.id
            );

            const calificaciones = {};
            califData.calificaciones.forEach((c) => {
              calificaciones[c.periodo_evaluacion] = parseFloat(c.calificacion);
            });

            estudiantesConCalif.push({
              id: student.id_estudiante,
              nombre: student.nombre,
              inscripcion_id: inscripcion.id,
              calificaciones: calificaciones,
              promedio: parseFloat(califData.promedio) || 0,
            });
          }
        } catch (error) {
          uiService.showNotification(
            `⚠️ No se pudieron cargar las calificaciones de ${student.nombre}`,
            NOTIFICATION_TYPES.ERROR
          );
        }
      }

      if (estudiantesConCalif.length === 0) {
        document.getElementById("academicGradesContainer").innerHTML = `
          <div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
            <i data-lucide="alert-circle" class="w-16 h-16 mx-auto mb-4 text-yellow-500"></i>
            <p class="text-yellow-700">No hay estudiantes inscritos en esta materia</p>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      this.renderAcademicGradesTable(estudiantesConCalif, materia);
    } catch (error) {
      console.error("Error cargando calificaciones:", error);
      uiService.showNotification(
        "❌ Error al cargar calificaciones",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  renderAcademicGradesTable(estudiantes, materia) {
    const container = document.getElementById("academicGradesContainer");

    container.innerHTML = `
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <h4 class="text-xl font-bold">${materia.nombre}</h4>
          <p class="text-blue-100">Total de estudiantes: ${
            estudiantes.length
          }</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold text-slate-700 sticky left-0 bg-slate-50">Estudiante</th>
                <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700">Periodo 1</th>
                <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700">Periodo 2</th>
                <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700">Periodo 3</th>
                <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700">Periodo 4</th>
                <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700 bg-slate-100">Promedio</th>
                <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700 bg-slate-100">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${estudiantes
                .map((est) => {
                  const promedio = est.promedio;
                  const aprobado = promedio >= 70;

                  return `
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 sticky left-0 bg-white">
                      <div class="font-medium text-slate-800">${
                        est.nombre
                      }</div>
                    </td>
                    ${[1, 2, 3, 4]
                      .map((periodo) => {
                        const calif = est.calificaciones[periodo];
                        const califAprobado = calif && calif >= 70;

                        return `
                        <td class="px-4 py-3 text-center">
                          <button 
                            class="edit-calif-btn px-3 py-2 rounded ${
                              calif !== undefined
                                ? califAprobado
                                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                                  : "bg-red-50 text-red-700 hover:bg-red-100"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            } transition-colors font-semibold text-sm"
                            data-inscripcion="${est.inscripcion_id}"
                            data-periodo="${periodo}"
                            data-calificacion="${calif || ""}"
                            data-estudiante="${est.nombre}"
                          >
                            ${calif !== undefined ? calif.toFixed(1) : "NC"}
                          </button>
                        </td>
                      `;
                      })
                      .join("")}
                    <td class="px-4 py-3 text-center bg-slate-50">
                      <span class="text-xl font-bold ${
                        aprobado ? "text-green-600" : "text-red-600"
                      }">
                        ${promedio.toFixed(1)}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-center bg-slate-50">
                      <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                        aprobado
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }">
                        ${aprobado ? "✓ APROBADO" : "✗ REPROBADO"}
                      </span>
                    </td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- Estadísticas -->
        <div class="p-4 bg-slate-50 border-t border-slate-200">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-sm text-slate-600">Promedio General</p>
              <p class="text-2xl font-bold text-indigo-600">
                ${(
                  estudiantes.reduce((sum, e) => sum + e.promedio, 0) /
                  estudiantes.length
                ).toFixed(1)}
              </p>
            </div>
            <div>
              <p class="text-sm text-slate-600">Aprobados</p>
              <p class="text-2xl font-bold text-green-600">
                ${estudiantes.filter((e) => e.promedio >= 70).length}
              </p>
            </div>
            <div>
              <p class="text-sm text-slate-600">Reprobados</p>
              <p class="text-2xl font-bold text-red-600">
                ${estudiantes.filter((e) => e.promedio < 70).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll(".edit-calif-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const button = e.target.closest("button");
        const inscripcionId = button.dataset.inscripcion;
        const periodo = button.dataset.periodo;
        const calificacionActual = button.dataset.calificacion;
        const estudiante = button.dataset.estudiante;

        this.showEditAcademicGradeModal(
          inscripcionId,
          periodo,
          calificacionActual,
          estudiante
        );
      });
    });

    lucide.createIcons();
  }

  showEditAcademicGradeModal(
    inscripcionId,
    periodo,
    calificacionActual,
    estudianteNombre
  ) {
    const calificacion = prompt(
      `${estudianteNombre}\nPeriodo ${periodo}\n\nIngrese la calificación (0-100):`,
      calificacionActual || ""
    );

    if (calificacion === null) return;

    const calif = parseFloat(calificacion);

    if (isNaN(calif) || calif < 0 || calif > 100) {
      uiService.showNotification(
        "❌ La calificación debe ser un número entre 0 y 100",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    this.saveAcademicGrade(inscripcionId, periodo, calif);
  }

  async saveAcademicGrade(inscripcionId, periodo, calificacion) {
    try {
      const data = await apiService.registrarCalificacionAcademica({
        inscripcion_id: inscripcionId,
        periodo_evaluacion: periodo,
        calificacion: calificacion,
      });

      if (data.success) {
        uiService.showNotification(
          "✅ Calificación registrada exitosamente",
          NOTIFICATION_TYPES.SUCCESS
        );

        this.loadAcademicGradesData();
      } else {
        uiService.showNotification(
          "❌ " + data.message,
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error guardando calificación:", error);
      uiService.showNotification(
        "❌ Error al guardar calificación",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  // ==========================================
  // VISTA: MÓDULOS FORMATIVOS
  // ==========================================
  async renderModulos(container) {
    if (!this.periodoActivo) {
      container.innerHTML = `
        <div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
          <i data-lucide="alert-triangle" class="w-16 h-16 mx-auto mb-4 text-yellow-500"></i>
          <h3 class="text-xl font-semibold text-yellow-800 mb-2">No hay periodo activo</h3>
          <p class="text-yellow-700 mb-4">Debes configurar un periodo escolar antes de registrar calificaciones</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header de Módulos Formativos -->
        <div class="bg-white p-6 rounded-xl shadow-lg">
          <h3 class="text-2xl font-bold text-slate-800 mb-4">
            <i data-lucide="award" class="w-6 h-6 inline mr-2 text-purple-600"></i>
            Módulos Formativos - Evaluación por Competencias
          </h3>
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <p class="text-sm text-purple-800 mb-2">
              <strong>📋 Ordenanza 04-2023:</strong> Evaluación basada en Resultados de Aprendizaje (RA)
            </p>
            <ul class="text-sm text-purple-700 space-y-1 ml-4">
              <li>• Cada RA tiene un porcentaje del módulo (suma total = 100%)</li>
              <li>• 3 oportunidades durante el proceso + 1 evaluación especial</li>
              <li>• Mínimo aprobatorio: 70% del porcentaje del RA</li>
            </ul>
          </div>

          <!-- Filtros -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Módulo Formativo</label>
              <select id="moduloMateriaSelect" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option value="">Seleccionar módulo...</option>
              </select>
            </div>
            <div class="flex items-end">
              <button 
                id="loadModuloGrades"
                class="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <i data-lucide="search" class="w-4 h-4 inline mr-2"></i>
                Cargar Estudiantes
              </button>
            </div>
          </div>
        </div>

        <!-- Contenedor de calificaciones de módulo -->
        <div id="moduloGradesContainer">
          <div class="bg-white p-12 rounded-xl shadow-lg text-center">
            <i data-lucide="search" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>
            <p class="text-slate-500">Selecciona un módulo para ver todos los estudiantes y sus Resultados de Aprendizaje</p>
          </div>
        </div>
      </div>
    `;

    await this.loadModuloFilters();
    this.setupModuloListeners();
  }

  async loadModuloFilters() {
    try {
      const materias = await apiService.getMaterias({ tipo: "formativa" });
      const materiaSelect = document.getElementById("moduloMateriaSelect");

      if (materiaSelect && materias.success) {
        materias.materias.forEach((materia) => {
          const option = document.createElement("option");
          option.value = materia.id;
          option.textContent = materia.nombre;
          materiaSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Error cargando filtros:", error);
    }
  }

  setupModuloListeners() {
    const loadBtn = document.getElementById("loadModuloGrades");
    if (loadBtn) {
      loadBtn.addEventListener("click", () => this.loadModuloGradesData());
    }
  }

  async loadModuloGradesData() {
    const materiaId = document.getElementById("moduloMateriaSelect").value;

    if (!materiaId) {
      uiService.showNotification(
        "⚠️ Debes seleccionar un módulo",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    this.materiaSeleccionada = materiaId;

    try {
      const studentsData = await apiService.getStudents();

      if (!studentsData.success || !studentsData.students) {
        throw new Error("No se pudieron cargar los estudiantes");
      }

      const materias = await apiService.getMaterias({ tipo: "formativa" });
      const materia = materias.materias.find((m) => m.id == materiaId);

      const resultadosData = await apiService.getResultadosAprendizaje(
        materiaId
      );

      if (
        !resultadosData.success ||
        !resultadosData.resultados ||
        resultadosData.resultados.length === 0
      ) {
        document.getElementById("moduloGradesContainer").innerHTML = `
          <div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
            <i data-lucide="alert-circle" class="w-16 h-16 mx-auto mb-4 text-yellow-500"></i>
            <p class="text-yellow-700">Este módulo no tiene Resultados de Aprendizaje configurados</p>
            <button onclick="gradesModule.loadVista('configuracion')" class="mt-4 px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg">
              Configurar RAs
            </button>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      const resultadosAprendizaje = resultadosData.resultados;

      const estudiantesConCalif = [];

      for (const student of studentsData.students) {
        try {
          const inscripcionesData = await apiService.getInscripcionesEstudiante(
            student.id_estudiante,
            this.periodoActivo.id
          );

          const inscripcion = inscripcionesData.inscripciones?.find(
            (i) => i.materia_id == materiaId
          );

          if (inscripcion) {
            const califData = await apiService.getCalificacionesModulo(
              inscripcion.id
            );

            estudiantesConCalif.push({
              id: student.id_estudiante,
              nombre: student.nombre,
              inscripcion_id: inscripcion.id,
              calificaciones: califData,
            });
          }
        } catch (error) {
          uiService.showNotification(
            `⚠️ No se pudieron cargar las calificaciones de ${student.nombre}`,
            NOTIFICATION_TYPES.ERROR
          );
        }
      }

      if (estudiantesConCalif.length === 0) {
        document.getElementById("moduloGradesContainer").innerHTML = `
          <div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
            <i data-lucide="alert-circle" class="w-16 h-16 mx-auto mb-4 text-yellow-500"></i>
            <p class="text-yellow-700">No hay estudiantes inscritos en este módulo</p>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      this.renderModuloGradesTable(
        estudiantesConCalif,
        materia,
        resultadosAprendizaje
      );
    } catch (error) {
      console.error("Error cargando calificaciones de módulo:", error);
      uiService.showNotification(
        "❌ Error al cargar calificaciones",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  // renderModuloGradesTable(estudiantes, materia, resultadosAprendizaje) {
  //   const container = document.getElementById("moduloGradesContainer");

  //   container.innerHTML = `
  //     <div class="bg-white rounded-xl shadow-lg overflow-hidden">
  //       <div class="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
  //         <h4 class="text-xl font-bold">${materia.nombre}</h4>
  //         <p class="text-purple-100">Total de estudiantes: ${
  //           estudiantes.length
  //         } | RAs: ${resultadosAprendizaje.length}</p>
  //       </div>

  //       <!-- Selector de estudiante -->
  //       <div class="p-4 bg-slate-50 border-b border-slate-200">
  //         <label class="block text-sm font-medium text-slate-700 mb-2">Seleccionar Estudiante para Ver Detalle</label>
  //         <select id="estudianteModuloSelect" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500">
  //           <option value="">Ver todos...</option>
  //           ${estudiantes
  //             .map(
  //               (e) => `
  //             <option value="${e.id}">${e.nombre}</option>
  //           `
  //             )
  //             .join("")}
  //         </select>
  //       </div>

  //       <!-- Tabla de RAs -->
  //       <div id="moduloTableContainer" class="overflow-x-auto">
  //         ${this.renderEstudiantesModuloTable(
  //           estudiantes,
  //           resultadosAprendizaje
  //         )}
  //       </div>
  //     </div>
  //   `;

  //   document
  //     .getElementById("estudianteModuloSelect")
  //     .addEventListener("change", (e) => {
  //       const estudianteId = e.target.value;
  //       const tableContainer = document.getElementById("moduloTableContainer");

  //       if (estudianteId) {
  //         const estudiante = estudiantes.find((est) => est.id == estudianteId);
  //         tableContainer.innerHTML = this.renderDetalleEstudianteModulo(
  //           estudiante,
  //           resultadosAprendizaje
  //         );
  //       } else {
  //         tableContainer.innerHTML = this.renderEstudiantesModuloTable(
  //           estudiantes,
  //           resultadosAprendizaje
  //         );
  //       }

  //       lucide.createIcons();
  //       this.setupModuloEditListeners();
  //     });

  //   lucide.createIcons();
  // }
  setupModuloInlineEditListeners() {
    document.querySelectorAll(".edit-modulo-grade-inline").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const button = e.target.closest("button");
        this.showEditModuloGradeModal(
          button.dataset.inscripcion,
          button.dataset.ra,
          button.dataset.oportunidad,
          button.dataset.calificacion,
          button.dataset.estudiante,
          button.dataset.raPorcentaje,
          button.dataset.raNombre
        );
      });
    });
  }

  setupConfigurarRAsButton(materiaId, resultadosActuales) {
    const btn = document.getElementById("btnConfigurarRAs");
    if (btn) {
      btn.addEventListener("click", () => {
        this.showConfigRAsModal(materiaId, resultadosActuales);
      });
    }
  }

  showConfigRAsModal(materiaId, resultadosActuales) {
    // Por ahora, un mensaje simple
    alert(
      "Configuración de Resultados de Aprendizaje\n\n" +
        `Total configurados: ${resultadosActuales.length} de 10\n\n` +
        "Para agregar más RAs, usa la sección de Configuración en el menú principal."
    );

    // TODO: Crear modal completo para gestionar RAs
    this.loadVista("configuracion");
  }

  renderModuloGradesTable(estudiantes, materia, resultadosAprendizaje) {
    const container = document.getElementById("moduloGradesContainer");

    // ✅ SIEMPRE mostrar 10 RAs, rellenar con vacíos si faltan
    const rasCompletos = [];
    for (let i = 0; i < 10; i++) {
      if (resultadosAprendizaje[i]) {
        rasCompletos.push(resultadosAprendizaje[i]);
      } else {
        // RA vacío
        rasCompletos.push({
          id: null,
          nombre: `-`,
          porcentaje: 0,
          orden: i + 1,
          vacio: true,
        });
      }
    }

    // Calcular suma de porcentajes (solo RAs configurados)
    const sumaPortcentajes = rasCompletos
      .filter((ra) => !ra.vacio)
      .reduce((sum, ra) => sum + parseFloat(ra.porcentaje), 0);

    container.innerHTML = `
    <div class="bg-white rounded-xl shadow-lg overflow-hidden">
      <!-- Header del Módulo -->
      <div class="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <div class="flex justify-between items-center">
          <div>
            <h4 class="text-xl font-bold">${materia.nombre}</h4>
            <p class="text-purple-100">Total de estudiantes: ${
              estudiantes.length
            } | RAs: ${resultadosAprendizaje.length}</p>
          </div>
          <button 
            id="btnConfigurarRAs"
            class="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
          >
            <i data-lucide="settings" class="w-4 h-4 inline mr-2"></i>
            Configurar RAs
          </button>
        </div>
      </div>

      <!-- Tabla Estilo Ordenanza -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <!-- Header Principal -->
          <thead>
            <tr class="bg-gray-800 text-white">
              <th rowspan="3" class="border border-gray-600 px-3 py-2 sticky left-0 bg-gray-800 z-10" style="min-width: 150px;">
                Estudiante
              </th>
              <th colspan="40" class="border border-gray-600 px-3 py-2 text-center">
                RESULTADO DE APRENDIZAJE (RA)
              </th>
              <th rowspan="3" class="border border-gray-600 px-3 py-2 text-center bg-gray-700" style="min-width: 80px;">
                <div class="font-bold">Total</div>
                <div class="text-xs font-normal">${sumaPortcentajes.toFixed(
                  0
                )}%</div>
              </th>
              <th rowspan="3" class="border border-gray-600 px-3 py-2 text-center bg-gray-700" style="min-width: 100px;">
                <div class="font-bold">SITUACIÓN</div>
                <div class="text-xs font-normal">ACADÉMICA</div>
              </th>
            </tr>
            
            <!-- Fila de Porcentajes -->
            <tr class="bg-purple-600 text-white">
              ${rasCompletos
                .map(
                  (ra, idx) => `
                <th colspan="4" class="border border-purple-500 px-2 py-1 text-center ${
                  ra.vacio ? "bg-gray-400" : ""
                }">
                  <button 
                    class="edit-porcentaje-btn hover:underline ${
                      ra.vacio ? "cursor-not-allowed" : "cursor-pointer"
                    }"
                    data-ra-index="${idx}"
                    data-ra-id="${ra.id}"
                    data-porcentaje="${ra.porcentaje}"
                    data-nombre="${ra.nombre}"
                    ${ra.vacio ? "disabled" : ""}
                    title="${
                      ra.vacio
                        ? "RA no configurado"
                        : "Click para editar porcentaje"
                    }"
                  >
                    <div class="font-bold">%RA${idx + 1}</div>
                    <div class="text-xs">${
                      ra.vacio ? "-" : ra.porcentaje + "%"
                    }</div>
                  </button>
                </th>
              `
                )
                .join("")}
            </tr>
            
            <!-- Fila de Oportunidades -->
            <tr class="bg-purple-100 text-purple-900">
              ${rasCompletos
                .map(
                  (ra) => `
                <th class="border border-purple-300 px-1 py-1 text-xs" style="width: 60px;">1</th>
                <th class="border border-purple-300 px-1 py-1 text-xs" style="width: 60px;">2</th>
                <th class="border border-purple-300 px-1 py-1 text-xs" style="width: 60px;">3</th>
                <th class="border border-purple-300 px-1 py-1 text-xs bg-yellow-100" style="width: 60px;">EE</th>
              `
                )
                .join("")}
            </tr>
          </thead>

          <!-- Cuerpo de la Tabla -->
          <tbody>
            ${estudiantes
              .map((est) => {
                const calificacionFinal =
                  parseFloat(est.calificaciones.calificacion_final) || 0;
                const aprobado = est.calificaciones.aprobado;

                return `
                <tr class="hover:bg-gray-50">
                  <!-- Nombre del Estudiante -->
                  <td class="border border-gray-300 px-3 py-2 font-medium sticky left-0 bg-white z-10">
                    ${est.nombre}
                  </td>
                  
                  <!-- Casillas de Calificaciones (4 por RA x 10 RAs = 40 casillas) -->
                  ${rasCompletos
                    .map((ra) => {
                      if (ra.vacio) {
                        // RA vacío - mostrar casillas deshabilitadas
                        return `
                        ${[0, 1, 2, 3]
                          .map(
                            () => `
                          <td class="border border-gray-300 p-0 text-center bg-gray-100">
                            <div class="w-full h-full px-2 py-3 text-gray-400 text-xs">-</div>
                          </td>
                        `
                          )
                          .join("")}
                      `;
                      }

                      const raData = est.calificaciones.resultados?.find(
                        (r) => r.id === ra.id
                      ) || { oportunidades: {} };

                      return `
                      ${[0, 1, 2, 3]
                        .map((oppIndex) => {
                          const opp = raData.oportunidades?.[oppIndex];
                          const calificacion =
                            opp?.calificacion_sobre_100 || opp?.calificacion;
                          const completado = opp?.completado;
                          const esEvalEspecial = oppIndex === 3;

                          return `
                          <td class="border border-gray-300 p-0 text-center ${
                            esEvalEspecial ? "bg-yellow-50" : ""
                          }">
                            <button 
                              class="edit-modulo-grade-inline w-full h-full px-1 py-2 text-xs ${
                                calificacion !== undefined &&
                                calificacion !== null
                                  ? completado
                                    ? "bg-green-100 text-green-800 font-bold hover:bg-green-200"
                                    : "bg-red-100 text-red-700 font-semibold hover:bg-red-200"
                                  : "bg-white text-gray-400 hover:bg-gray-50"
                              } transition-colors"
                              data-inscripcion="${est.inscripcion_id}"
                              data-ra="${ra.id}"
                              data-ra-porcentaje="${ra.porcentaje}"
                              data-ra-nombre="${ra.nombre}"
                              data-oportunidad="${oppIndex + 1}"
                              data-calificacion="${calificacion || ""}"
                              data-estudiante="${est.nombre}"
                              title="${est.nombre} - ${ra.nombre} - ${
                            esEvalEspecial
                              ? "Eval. Especial"
                              : "Oport. " + (oppIndex + 1)
                          }"
                            >
                              ${
                                calificacion !== undefined &&
                                calificacion !== null
                                  ? `<div class="font-bold">${parseFloat(
                                      calificacion
                                    ).toFixed(0)}</div>
                                   <div class="text-xs text-gray-500">(${(
                                     (parseFloat(calificacion) / 100) *
                                     ra.porcentaje
                                   ).toFixed(1)})</div>`
                                  : '<div class="text-base">-</div>'
                              }
                            </button>
                          </td>
                        `;
                        })
                        .join("")}
                    `;
                    })
                    .join("")}
                  
                  <!-- Total -->
                  <td class="border border-gray-400 px-2 py-2 text-center bg-gray-50">
                    <div class="text-xl font-bold ${
                      aprobado ? "text-green-600" : "text-red-600"
                    }">
                      ${calificacionFinal.toFixed(1)}
                    </div>
                  </td>
                  
                  <!-- Estado -->
                  <td class="border border-gray-400 px-2 py-2 text-center bg-gray-50">
                    <span class="px-2 py-1 rounded text-xs font-semibold ${
                      aprobado
                        ? "bg-green-100 text-green-700"
                        : est.calificaciones.todos_completados
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }">
                      ${
                        aprobado
                          ? "✓ APROBADO"
                          : est.calificaciones.todos_completados
                          ? "✗ REPROBADO"
                          : "⏳ PENDIENTE"
                      }
                    </span>
                  </td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </div>

      <!-- Leyenda -->
      <div class="p-4 bg-gray-50 border-t border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div class="bg-blue-50 border border-blue-200 rounded p-3">
            <h6 class="font-bold text-blue-900 mb-1">📊 Cómo se Califica</h6>
            <ul class="text-blue-800 space-y-1">
              <li>• <strong>Número grande:</strong> Calificación sobre 100</li>
              <li>• <strong>(Número pequeño):</strong> Convertido al % del RA</li>
              <li>• <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded">Verde</span> = Completado (≥70%)</li>
              <li>• <span class="px-2 py-0.5 bg-red-100 text-red-700 rounded">Rojo</span> = No alcanzó mínimo</li>
            </ul>
          </div>
          
          <div class="bg-purple-50 border border-purple-200 rounded p-3">
            <h6 class="font-bold text-purple-900 mb-1">📋 Oportunidades</h6>
            <ul class="text-purple-800 space-y-1">
              <li>• <strong>1, 2, 3:</strong> Oportunidades regulares</li>
              <li>• <strong>EE:</strong> Evaluación Especial</li>
              <li>• Click en cualquier casilla para calificar</li>
              <li>• Se marca como completado automáticamente</li>
            </ul>
          </div>
          
          <div class="bg-amber-50 border border-amber-200 rounded p-3">
            <h6 class="font-bold text-amber-900 mb-1">⚙️ Configuración</h6>
            <ul class="text-amber-800 space-y-1">
              <li>• Click en <strong>%RA#</strong> para editar porcentaje</li>
              <li>• Click en <strong>"Configurar RAs"</strong> para gestionar</li>
              <li>• Suma total debe ser <strong>100%</strong></li>
              <li>• <strong>Estado actual:</strong> ${
                sumaPortcentajes === 100
                  ? "✅ Válido"
                  : "⚠️ " + sumaPortcentajes.toFixed(0) + "%"
              }</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

    // Event Listeners
    this.setupModuloInlineEditListeners();
    this.setupPorcentajeEditListeners(materia.id);
    this.setupConfigurarRAsButton(materia.id, resultadosAprendizaje);

    lucide.createIcons();
  }

  setupPorcentajeEditListeners(materiaId) {
    document.querySelectorAll(".edit-porcentaje-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const button = e.target.closest("button");
        if (button.disabled) return;

        const raId = button.dataset.raId;
        const raIndex = button.dataset.raIndex;
        const porcentajeActual = button.dataset.porcentaje;
        const nombre = button.dataset.nombre;

        const nuevoPorcentaje = prompt(
          `Editar Porcentaje del RA ${parseInt(raIndex) + 1}\n` +
            `${nombre}\n\n` +
            `Porcentaje actual: ${porcentajeActual}%\n` +
            `Ingrese el nuevo porcentaje (0-100):`,
          porcentajeActual
        );

        if (nuevoPorcentaje === null) return;

        const pct = parseFloat(nuevoPorcentaje);

        if (isNaN(pct) || pct < 0 || pct > 100) {
          uiService.showNotification(
            "❌ El porcentaje debe ser un número entre 0 y 100",
            NOTIFICATION_TYPES.ERROR
          );
          return;
        }

        try {
          // Llamar al backend para actualizar el porcentaje
          const response = await fetch(
            `/api/admin/materias/${materiaId}/resultados/${raId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({ porcentaje: pct }),
            }
          );

          const data = await response.json();

          if (data.success) {
            uiService.showNotification(
              "✅ Porcentaje actualizado exitosamente",
              NOTIFICATION_TYPES.SUCCESS
            );

            // Recargar la tabla
            this.loadModuloGradesData();
          } else {
            uiService.showNotification(
              "❌ " + data.message,
              NOTIFICATION_TYPES.ERROR
            );
          }
        } catch (error) {
          console.error("Error actualizando porcentaje:", error);
          uiService.showNotification(
            "❌ Error al actualizar porcentaje",
            NOTIFICATION_TYPES.ERROR
          );
        }
      });
    });
  }

  renderEstudiantesModuloTable(estudiantes, resultadosAprendizaje) {
    return `
      <table class="w-full">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-semibold text-slate-700 sticky left-0 bg-slate-50">Estudiante</th>
            ${resultadosAprendizaje
              .map(
                (ra, idx) => `
              <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                <div class="min-w-[100px]">
                  RA ${idx + 1}
                  <div class="text-xs font-normal text-slate-500">${
                    ra.porcentaje
                  }%</div>
                </div>
              </th>
            `
              )
              .join("")}
            <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700 bg-slate-100">Final</th>
            <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700 bg-slate-100">Estado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          ${estudiantes
            .map((est) => {
              const calificacionFinal =
                parseFloat(est.calificaciones.calificacion_final) || 0;
              const aprobado = est.calificaciones.aprobado;

              return `
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 sticky left-0 bg-white">
                  <div class="font-medium text-slate-800">${est.nombre}</div>
                </td>
                ${resultadosAprendizaje
                  .map((ra) => {
                    const raData = est.calificaciones.resultados?.find(
                      (r) => r.id === ra.id
                    );
                    const completado = raData?.completado || false;
                    const calificacion = raData?.calificacion_final || 0;

                    return `
                    <td class="px-4 py-3 text-center">
                      <span class="px-3 py-1 rounded text-sm font-semibold ${
                        completado
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }">
                        ${completado ? calificacion.toFixed(1) : "-"}
                      </span>
                    </td>
                  `;
                  })
                  .join("")}
                <td class="px-4 py-3 text-center bg-slate-50">
                  <span class="text-xl font-bold ${
                    aprobado ? "text-green-600" : "text-red-600"
                  }">
                    ${calificacionFinal.toFixed(1)}
                  </span>
                </td>
                <td class="px-4 py-3 text-center bg-slate-50">
                  <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                    aprobado
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }">
                    ${
                      aprobado
                        ? "✓ APROBADO"
                        : est.calificaciones.todos_completados
                        ? "✗ REPROBADO"
                        : "PENDIENTE"
                    }
                  </span>
                </td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    `;
  }

  // renderDetalleEstudianteModulo(estudiante, resultadosAprendizaje) {
  //   return `
  //     <div class="p-6">
  //       <h5 class="text-lg font-bold text-slate-800 mb-4">${
  //         estudiante.nombre
  //       }</h5>

  //       <table class="w-full">
  //         <thead class="bg-slate-50">
  //           <tr>
  //             <th class="px-4 py-3 text-left text-sm font-semibold text-slate-700">RA</th>
  //             <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700">%</th>
  //             <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700">Mín.</th>
  //             <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700">Oport. 1</th>
  //             <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700">Oport. 2</th>
  //             <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700">Oport. 3</th>
  //             <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700">Eval. Esp.</th>
  //             <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700">Final</th>
  //             <th class="px-4 py-3 text-center text-sm font-semibold text-slate-700">Estado</th>
  //           </tr>
  //         </thead>
  //         <tbody class="divide-y divide-slate-200">
  //           ${resultadosAprendizaje
  //             .map((ra, index) => {
  //               const raData = estudiante.calificaciones.resultados?.find(
  //                 (r) => r.id === ra.id
  //               ) || { oportunidades: {} };

  //               return `
  //               <tr class="hover:bg-slate-50">
  //                 <td class="px-4 py-3">
  //                   <div>
  //                     <p class="font-medium text-slate-800">RA ${index + 1}</p>
  //                     <p class="text-xs text-slate-500">${ra.nombre}</p>
  //                   </div>
  //                 </td>
  //                 <td class="px-4 py-3 text-center">
  //                   <span class="font-semibold text-purple-600">${
  //                     ra.porcentaje
  //                   }%</span>
  //                 </td>
  //                 <td class="px-4 py-3 text-center">
  //                   <span class="text-sm text-slate-600">${
  //                     ra.minimo_aprobatorio
  //                   }</span>
  //                 </td>
  //                 ${[0, 1, 2, 3]
  //                   .map((opp) => {
  //                     const calif = raData.oportunidades?.[opp];
  //                     return `
  //                     <td class="px-4 py-3 text-center">
  //                       <button
  //                         class="edit-modulo-grade px-3 py-1 rounded ${
  //                           calif
  //                             ? calif.completado
  //                               ? "bg-green-100 text-green-700"
  //                               : "bg-red-100 text-red-700"
  //                             : "bg-slate-100 text-slate-600"
  //                         } hover:opacity-80 transition-opacity text-sm font-semibold"
  //                         data-inscripcion="${estudiante.inscripcion_id}"
  //                         data-ra="${ra.id}"
  //                         data-oportunidad="${opp + 1}"
  //                         data-calificacion="${calif?.calificacion || ""}"
  //                         data-estudiante="${estudiante.nombre}"
  //                       >
  //                         ${
  //                           calif
  //                             ? calif.calificacion.toFixed(2)
  //                             : opp === 3
  //                             ? "EE"
  //                             : "NC"
  //                         }
  //                       </button>
  //                     </td>
  //                   `;
  //                   })
  //                   .join("")}
  //                 <td class="px-4 py-3 text-center">
  //                   <span class="text-lg font-bold ${
  //                     raData.completado ? "text-green-600" : "text-slate-400"
  //                   }">
  //                     ${
  //                       raData.completado
  //                         ? raData.calificacion_final.toFixed(2)
  //                         : "-"
  //                     }
  //                   </span>
  //                 </td>
  //                 <td class="px-4 py-3 text-center">
  //                   <span class="px-3 py-1 rounded-full text-xs font-semibold ${
  //                     raData.completado
  //                       ? "bg-green-100 text-green-700"
  //                       : "bg-slate-100 text-slate-600"
  //                   }">
  //                     ${raData.completado ? "✓ Completado" : "Pendiente"}
  //                   </span>
  //                 </td>
  //               </tr>
  //             `;
  //             })
  //             .join("")}
  //         </tbody>
  //         <tfoot class="bg-slate-100">
  //           <tr>
  //             <td colspan="7" class="px-4 py-4 font-bold text-slate-800">Calificación Final del Módulo</td>
  //             <td class="px-4 py-4 text-center">
  //               <span class="text-3xl font-bold ${
  //                 estudiante.calificaciones.aprobado
  //                   ? "text-green-600"
  //                   : "text-red-600"
  //               }">
  //                 ${estudiante.calificaciones.calificacion_final}
  //               </span>
  //             </td>
  //             <td class="px-4 py-4 text-center">
  //               <span class="px-4 py-2 rounded-full text-sm font-semibold ${
  //                 estudiante.calificaciones.aprobado
  //                   ? "bg-green-100 text-green-700"
  //                   : "bg-red-100 text-red-700"
  //               }">
  //                 ${
  //                   estudiante.calificaciones.aprobado
  //                     ? "✓ APROBADO"
  //                     : estudiante.calificaciones.todos_completados
  //                     ? "✗ REPROBADO"
  //                     : "PENDIENTE"
  //                 }
  //               </span>
  //             </td>
  //           </tr>
  //         </tfoot>
  //       </table>
  //     </div>
  //   `;
  // }
  renderDetalleEstudianteModulo(estudiante, resultadosAprendizaje) {
    return `
    <div class="p-6">
      <div class="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h5 class="text-lg font-bold text-purple-900 mb-2">${
          estudiante.nombre
        }</h5>
        <p class="text-sm text-purple-700">
          <strong>💡 Instrucciones:</strong> Los maestros califican sobre 100 puntos. 
          El sistema convierte automáticamente al porcentaje del RA.
        </p>
        <p class="text-xs text-purple-600 mt-1">
          <strong>Ejemplo:</strong> Si el RA vale 25% y el maestro da 80 puntos → se registra 20 (80% de 25)
        </p>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-purple-600 text-white">
              ${resultadosAprendizaje
                .map(
                  (ra, index) => `
                <th class="border border-purple-500 px-3 py-2 text-center" colspan="4">
                  <div class="font-bold">RA ${index + 1} (${
                    ra.porcentaje
                  }%)</div>
                  <div class="text-xs font-normal mt-1">${ra.nombre}</div>
                </th>
              `
                )
                .join("")}
              <th class="border border-purple-700 px-3 py-2 bg-purple-800" rowspan="2">
                <div class="font-bold">Total</div>
                <div class="text-xs font-normal">100%</div>
              </th>
              <th class="border border-purple-700 px-3 py-2 bg-purple-800" rowspan="2">
                <div class="font-bold">Situación</div>
                <div class="text-xs font-normal">Académica</div>
              </th>
            </tr>
            <tr class="bg-purple-100 text-purple-900">
              ${resultadosAprendizaje
                .map(
                  () => `
                <th class="border border-purple-300 px-2 py-1 text-xs w-16">Oport. 1</th>
                <th class="border border-purple-300 px-2 py-1 text-xs w-16">Oport. 2</th>
                <th class="border border-purple-300 px-2 py-1 text-xs w-16">Oport. 3</th>
                <th class="border border-purple-300 px-2 py-1 text-xs w-16 bg-yellow-100">Eval. Esp.</th>
              `
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            <tr>
              ${resultadosAprendizaje
                .map((ra) => {
                  const raData = estudiante.calificaciones.resultados?.find(
                    (r) => r.id === ra.id
                  ) || {
                    oportunidades: {},
                  };

                  return `
                  ${[0, 1, 2, 3]
                    .map((oppIndex) => {
                      const opp = raData.oportunidades?.[oppIndex];
                      const calificacion =
                        opp?.calificacion_sobre_100 || opp?.calificacion; // Usar la calificación sobre 100 si existe
                      const completado = opp?.completado;
                      const esEvalEspecial = oppIndex === 3;

                      return `
                      <td class="border border-slate-300 p-0 text-center ${
                        esEvalEspecial ? "bg-yellow-50" : ""
                      }">
                        <button 
                          class="edit-modulo-grade w-full h-full px-2 py-3 ${
                            calificacion !== undefined && calificacion !== null
                              ? completado
                                ? "bg-green-100 text-green-700 font-bold hover:bg-green-200"
                                : "bg-red-100 text-red-700 font-semibold hover:bg-red-200"
                              : "bg-white text-slate-400 hover:bg-slate-100"
                          } transition-colors"
                          data-inscripcion="${estudiante.inscripcion_id}"
                          data-ra="${ra.id}"
                          data-ra-porcentaje="${ra.porcentaje}"
                          data-ra-nombre="${ra.nombre}"
                          data-oportunidad="${oppIndex + 1}"
                          data-calificacion="${calificacion || ""}"
                          data-estudiante="${estudiante.nombre}"
                          title="${
                            esEvalEspecial
                              ? "Evaluación Especial"
                              : "Oportunidad " + (oppIndex + 1)
                          }"
                        >
                          ${
                            calificacion !== undefined && calificacion !== null
                              ? `<div class="text-base">${parseFloat(
                                  calificacion
                                ).toFixed(0)}</div>
                               <div class="text-xs text-slate-500">(${(
                                 (parseFloat(calificacion) / 100) *
                                 ra.porcentaje
                               ).toFixed(1)})</div>`
                              : '<div class="text-lg">NC</div>'
                          }
                        </button>
                      </td>
                    `;
                    })
                    .join("")}
                `;
                })
                .join("")}
              <td class="border border-slate-400 px-3 py-3 text-center bg-slate-50">
                <div class="text-2xl font-bold ${
                  estudiante.calificaciones.aprobado
                    ? "text-green-600"
                    : "text-red-600"
                }">
                  ${parseFloat(
                    estudiante.calificaciones.calificacion_final
                  ).toFixed(1)}
                </div>
              </td>
              <td class="border border-slate-400 px-3 py-3 text-center bg-slate-50">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                  estudiante.calificaciones.aprobado
                    ? "bg-green-100 text-green-700"
                    : estudiante.calificaciones.todos_completados
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }">
                  ${
                    estudiante.calificaciones.aprobado
                      ? "✓ APROBADO"
                      : estudiante.calificaciones.todos_completados
                      ? "✗ REPROBADO"
                      : "⏳ PENDIENTE"
                  }
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Leyenda -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h6 class="font-bold text-blue-900 mb-2">📊 Cómo se Califica</h6>
          <ul class="text-sm text-blue-800 space-y-1">
            <li>• Los números grandes son sobre <strong>100 puntos</strong></li>
            <li>• Los números pequeños (entre paréntesis) son la <strong>conversión al porcentaje del RA</strong></li>
            <li>• <span class="px-2 py-1 bg-green-100 text-green-700 rounded">Verde</span> = RA completado (alcanzó el mínimo)</li>
            <li>• <span class="px-2 py-1 bg-red-100 text-red-700 rounded">Rojo</span> = RA no completado</li>
            <li>• NC = No Calificado</li>
          </ul>
        </div>

        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h6 class="font-bold text-purple-900 mb-2">📋 Resumen del Módulo</h6>
          <div class="space-y-2 text-sm">
            ${resultadosAprendizaje
              .map((ra, idx) => {
                const raData = estudiante.calificaciones.resultados?.find(
                  (r) => r.id === ra.id
                );
                return `
                <div class="flex justify-between items-center">
                  <span class="text-purple-700">RA ${idx + 1} (${
                  ra.porcentaje
                }%):</span>
                  <span class="font-semibold ${
                    raData?.completado ? "text-green-600" : "text-slate-400"
                  }">
                    ${
                      raData?.completado
                        ? raData.calificacion_final.toFixed(1) + " pts"
                        : "Pendiente"
                    }
                  </span>
                </div>
              `;
              })
              .join("")}
            <div class="pt-2 border-t border-purple-300 flex justify-between items-center">
              <span class="text-purple-900 font-bold">Total:</span>
              <span class="text-xl font-bold ${
                estudiante.calificaciones.aprobado
                  ? "text-green-600"
                  : "text-red-600"
              }">
                ${estudiante.calificaciones.calificacion_final} / 100
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  }

  // setupModuloEditListeners() {
  //   document.querySelectorAll(".edit-modulo-grade").forEach((btn) => {
  //     btn.addEventListener("click", (e) => {
  //       const button = e.target.closest("button");
  //       this.showEditModuloGradeModal(
  //         button.dataset.inscripcion,
  //         button.dataset.ra,
  //         button.dataset.oportunidad,
  //         button.dataset.calificacion,
  //         button.dataset.estudiante
  //       );
  //     });
  //   });
  // }

  // showEditModuloGradeModal(
  //   inscripcionId,
  //   raId,
  //   oportunidad,
  //   calificacionActual,
  //   estudianteNombre
  // ) {
  //   const oppName =
  //     oportunidad == 4 ? "Evaluación Especial" : `Oportunidad ${oportunidad}`;

  //   const calificacion = prompt(
  //     `${estudianteNombre}\n${oppName}\n\nIngrese la calificación:`,
  //     calificacionActual || ""
  //   );

  //   if (calificacion === null) return;

  //   if (calificacion === "") {
  //     uiService.showNotification(
  //       "ℹ️ No se registró calificación (NC)",
  //       NOTIFICATION_TYPES.INFO
  //     );
  //     return;
  //   }

  //   const calif = parseFloat(calificacion);

  //   if (isNaN(calif) || calif < 0) {
  //     uiService.showNotification(
  //       "❌ La calificación debe ser un número mayor o igual a 0",
  //       NOTIFICATION_TYPES.ERROR
  //     );
  //     return;
  //   }

  //   this.saveModuloGrade(inscripcionId, raId, oportunidad, calif);
  // }
  setupModuloEditListeners() {
    document.querySelectorAll(".edit-modulo-grade").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const button = e.target.closest("button");
        this.showEditModuloGradeModal(
          button.dataset.inscripcion,
          button.dataset.ra,
          button.dataset.oportunidad,
          button.dataset.calificacion,
          button.dataset.estudiante,
          button.dataset.raPorcentaje, // ← Nuevo
          button.dataset.raNombre // ← Nuevo
        );
      });
    });
  }

  showEditModuloGradeModal(
    inscripcionId,
    raId,
    oportunidad,
    calificacionActual,
    estudianteNombre,
    raPorcentaje,
    raNombre
  ) {
    const oppName =
      oportunidad == 4 ? "Evaluación Especial" : `Oportunidad ${oportunidad}`;

    const mensaje = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 CALIFICACIÓN DE MÓDULO FORMATIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👨‍🎓 Estudiante: ${estudianteNombre}
📊 ${raNombre}
📈 Porcentaje del RA: ${raPorcentaje}%
🎯 ${oppName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ CALIFICA SOBRE 100 PUNTOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Ejemplo: Si calificas con 80 puntos y el RA vale 25%
   → El sistema registrará: 20 puntos (80% de 25)

Ingrese la calificación (0-100):
  `.trim();

    const calificacion = prompt(mensaje, calificacionActual || "");

    if (calificacion === null) return;

    if (calificacion === "") {
      uiService.showNotification(
        "ℹ️ No se registró calificación (NC)",
        NOTIFICATION_TYPES.INFO
      );
      return;
    }

    const calif = parseFloat(calificacion);

    if (isNaN(calif) || calif < 0 || calif > 100) {
      uiService.showNotification(
        "❌ La calificación debe ser un número entre 0 y 100",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    // Calcular la conversión para mostrarla al usuario
    const calificacionConvertida = (calif / 100) * parseFloat(raPorcentaje);

    const confirmar = confirm(
      `¿Confirmar calificación?\n\n` +
        `Calificación ingresada: ${calif} / 100\n` +
        `Equivale a: ${calificacionConvertida.toFixed(
          2
        )} puntos del ${raPorcentaje}% del RA\n\n` +
        `¿Desea registrar esta calificación?`
    );

    if (!confirmar) return;

    this.saveModuloGrade(inscripcionId, raId, oportunidad, calif);
  }

  async saveModuloGrade(inscripcionId, raId, oportunidad, calificacion) {
    try {
      const data = await apiService.registrarCalificacionModulo({
        inscripcion_id: inscripcionId,
        resultado_aprendizaje_id: raId,
        oportunidad: oportunidad,
        calificacion: calificacion,
      });

      if (data.success) {
        uiService.showNotification(
          `✅ Calificación registrada: ${calificacion.toFixed(2)} ${
            data.completado ? "(RA Completado)" : "(No alcanza mínimo)"
          }`,
          NOTIFICATION_TYPES.SUCCESS
        );

        this.loadModuloGradesData();
      } else {
        uiService.showNotification(
          "❌ " + data.message,
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error guardando calificación:", error);
      uiService.showNotification(
        "❌ Error al guardar calificación",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  // ==========================================
  // VISTA: REPORTES
  // ==========================================
  async renderReportes(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="bg-white p-6 rounded-xl shadow-lg">
          <h3 class="text-2xl font-bold text-slate-800 mb-4">
            <i data-lucide="file-text" class="w-6 h-6 inline mr-2 text-green-600"></i>
            Reportes y Estadísticas
          </h3>
          <p class="text-slate-600">Selecciona el tipo de reporte que deseas generar</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Boletín Individual -->
          <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-green-200 cursor-pointer" data-reporte="individual">
            <div class="p-3 bg-green-100 rounded-lg w-fit mb-4">
              <i data-lucide="user" class="w-8 h-8 text-green-600"></i>
            </div>
            <h4 class="text-xl font-bold text-slate-800 mb-2">Boletín Individual</h4>
            <p class="text-slate-600 text-sm mb-4">Reporte completo de un estudiante</p>
            <button class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              Generar
            </button>
          </div>

          <!-- Listado por Materia -->
          <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-blue-200 cursor-pointer" data-reporte="materia">
            <div class="p-3 bg-blue-100 rounded-lg w-fit mb-4">
              <i data-lucide="book" class="w-8 h-8 text-blue-600"></i>
            </div>
            <h4 class="text-xl font-bold text-slate-800 mb-2">Listado por Materia</h4>
            <p class="text-slate-600 text-sm mb-4">Todos los estudiantes de una materia</p>
            <button class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Generar
            </button>
          </div>

          <!-- Estadísticas Generales -->
          <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-indigo-200 cursor-pointer" data-reporte="estadisticas">
            <div class="p-3 bg-indigo-100 rounded-lg w-fit mb-4">
              <i data-lucide="bar-chart" class="w-8 h-8 text-indigo-600"></i>
            </div>
            <h4 class="text-xl font-bold text-slate-800 mb-2">Estadísticas</h4>
            <p class="text-slate-600 text-sm mb-4">Análisis general del periodo</p>
            <button class="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              Ver
            </button>
          </div>
        </div>

        <!-- Contenedor de reportes -->
        <div id="reporteContainer"></div>
      </div>
    `;

    container.querySelectorAll("[data-reporte]").forEach((card) => {
      card.addEventListener("click", (e) => {
        const tipoReporte = e.target.closest("[data-reporte]").dataset.reporte;
        this.generarReporte(tipoReporte);
      });
    });

    lucide.createIcons();
  }

  async generarReporte(tipo) {
    const reporteContainer = document.getElementById("reporteContainer");

    switch (tipo) {
      case "individual":
        await this.generarReporteIndividual(reporteContainer);
        break;
      case "materia":
        await this.generarReporteMateria(reporteContainer);
        break;
      case "estadisticas":
        await this.generarEstadisticas(reporteContainer);
        break;
    }
  }

  async generarReporteIndividual(container) {
    const studentsData = await apiService.getStudents();

    container.innerHTML = `
    <div class="bg-white rounded-xl shadow-lg p-6">
      <h4 class="text-lg font-bold text-slate-800 mb-4">Seleccionar Estudiante</h4>
      <select id="reporteEstudianteSelect" class="w-full px-4 py-2 border border-slate-300 rounded-lg mb-4">
        <option value="">Seleccionar estudiante...</option>
        ${studentsData.students
          .map(
            (s) => `
          <option value="${s.id_estudiante}">${s.nombre}</option>
        `
          )
          .join("")}
      </select>
      <button id="generarReporteBtn" class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
        Generar Reporte
      </button>
      <div id="reporteResult" class="mt-4"></div>
    </div>
  `;

    document
      .getElementById("generarReporteBtn")
      .addEventListener("click", async () => {
        const estudianteId = document.getElementById(
          "reporteEstudianteSelect"
        ).value;

        if (!estudianteId) {
          uiService.showNotification(
            "Selecciona un estudiante",
            NOTIFICATION_TYPES.ERROR
          );
          return;
        }

        // Mostrar loading
        document.getElementById("reporteResult").innerHTML = `
      <div class="text-center py-8">
        <i data-lucide="loader" class="w-12 h-12 mx-auto mb-4 animate-spin text-indigo-500"></i>
        <p class="text-slate-600">Generando reporte...</p>
      </div>
    `;
        lucide.createIcons();

        try {
          const data = await apiService.getReporteEstudiante(
            estudianteId,
            this.periodoActivo.id
          );

          // ✅ Verificar que data tiene los campos necesarios
          if (!data.success || !data.estudiante) {
            throw new Error("Respuesta inválida del servidor");
          }

          document.getElementById("reporteResult").innerHTML = `
        <div class="border border-slate-200 rounded-lg p-6 mt-4">
          <h5 class="text-xl font-bold mb-4">${data.estudiante.nombre}</h5>
          
          ${
            data.reporte.length === 0
              ? `
            <div class="text-center py-8 text-slate-500">
              <i data-lucide="alert-circle" class="w-12 h-12 mx-auto mb-4"></i>
              <p>El estudiante no tiene materias inscritas en este periodo</p>
            </div>
          `
              : `
            <div class="space-y-4">
              ${data.reporte
                .map(
                  (materia) => `
                <div class="border-b border-slate-200 pb-4">
                  <p class="font-semibold">${materia.materia_nombre}</p>
                  <p class="text-sm text-slate-600">
                    Tipo: ${
                      materia.tipo === "academica"
                        ? "Académica"
                        : "Módulo Formativo"
                    }
                  </p>
                  <p class="text-sm text-slate-600">
                    Promedio: <span class="font-bold ${
                      materia.aprobado ? "text-green-600" : "text-red-600"
                    }">${materia.promedio}</span>
                  </p>
                  <p class="text-sm text-slate-600">
                    Estado: ${materia.aprobado ? "✅ Aprobado" : "❌ Reprobado"}
                  </p>
                </div>
              `
                )
                .join("")}
            </div>
            
            <div class="mt-6 p-4 bg-indigo-50 rounded-lg">
              <p class="font-bold text-indigo-900">Promedio General: ${
                data.estadisticas.promedio_general
              }</p>
              <p class="text-indigo-700">Materias Aprobadas: ${
                data.estadisticas.materias_aprobadas
              } / ${data.estadisticas.total_materias}</p>
            </div>
          `
          }
        </div>
      `;

          lucide.createIcons();
        } catch (error) {
          console.error("Error generando reporte:", error);

          document.getElementById("reporteResult").innerHTML = `
        <div class="bg-red-50 border-2 border-red-200 rounded-lg p-6 mt-4">
          <div class="flex items-center mb-2">
            <i data-lucide="alert-circle" class="w-6 h-6 text-red-600 mr-2"></i>
            <h5 class="text-lg font-bold text-red-800">Error al Generar Reporte</h5>
          </div>
          <p class="text-red-700 text-sm mb-2">${error.message}</p>
          <p class="text-red-600 text-xs">Verifica que el backend esté funcionando correctamente</p>
        </div>
      `;

          lucide.createIcons();
          uiService.showNotification(
            "Error generando reporte",
            NOTIFICATION_TYPES.ERROR
          );
        }
      });

    lucide.createIcons();
  }

  async generarReporteMateria(container) {
    container.innerHTML = `
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h4 class="text-lg font-bold text-slate-800 mb-4">📊 Reporte por Materia</h4>
        <p class="text-slate-600">Ve a la sección de "Calificaciones Académicas" o "Módulos Formativos" para ver los listados completos por materia.</p>
        <button onclick="gradesModule.loadVista('academicas')" class="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
          Ir a Calificaciones Académicas
        </button>
      </div>
    `;
  }

  async generarEstadisticas(container) {
    if (!this.periodoActivo) return;

    try {
      const data = await apiService.getListadoEstudiantes({
        periodoId: this.periodoActivo.id,
      });

      if (data.success) {
        const totalEstudiantes = data.estudiantes.length;
        const aprobados = data.estudiantes.filter(
          (e) => e.promedio_general >= 70
        ).length;
        const reprobados = totalEstudiantes - aprobados;
        const promedioGeneral =
          totalEstudiantes > 0
            ? (
                data.estudiantes.reduce(
                  (sum, e) => sum + e.promedio_general,
                  0
                ) / totalEstudiantes
              ).toFixed(2)
            : 0;

        container.innerHTML = `
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h4 class="text-lg font-bold text-slate-800 mb-6">📊 Estadísticas Generales</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="text-center p-6 bg-indigo-50 rounded-lg">
                <p class="text-sm text-slate-600 mb-2">Total Estudiantes</p>
                <p class="text-4xl font-bold text-indigo-600">${totalEstudiantes}</p>
              </div>
              
              <div class="text-center p-6 bg-green-50 rounded-lg">
                <p class="text-sm text-slate-600 mb-2">Aprobados</p>
                <p class="text-4xl font-bold text-green-600">${aprobados}</p>
                <p class="text-sm text-green-700">${
                  totalEstudiantes > 0
                    ? ((aprobados / totalEstudiantes) * 100).toFixed(1)
                    : 0
                }%</p>
              </div>
              
              <div class="text-center p-6 bg-red-50 rounded-lg">
                <p class="text-sm text-slate-600 mb-2">Reprobados</p>
                <p class="text-4xl font-bold text-red-600">${reprobados}</p>
                <p class="text-sm text-red-700">${
                  totalEstudiantes > 0
                    ? ((reprobados / totalEstudiantes) * 100).toFixed(1)
                    : 0
                }%</p>
              </div>
            </div>

            <div class="mt-6 p-6 bg-slate-50 rounded-lg">
              <p class="text-center text-slate-600 mb-2">Promedio General del Periodo</p>
              <p class="text-center text-5xl font-bold ${
                parseFloat(promedioGeneral) >= 70
                  ? "text-green-600"
                  : "text-red-600"
              }">${promedioGeneral}</p>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error("Error generando estadísticas:", error);
      uiService.showNotification(
        "Error al cargar estadísticas",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  // ==========================================
  // VISTA: CONFIGURACIÓN
  // ==========================================
  async renderConfiguracion(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="bg-white p-6 rounded-xl shadow-lg">
          <h3 class="text-2xl font-bold text-slate-800 mb-2">
            <i data-lucide="settings" class="w-6 h-6 inline mr-2 text-indigo-600"></i>
            Configuración del Sistema
          </h3>
          <p class="text-slate-600">Gestión de periodos, materias y configuración general</p>
        </div>

        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="border-b border-slate-200">
            <div class="flex overflow-x-auto">
              <button class="config-tab px-6 py-4 font-medium transition-colors border-b-2 border-indigo-600 text-indigo-600" data-tab="periodos">
                Periodos Escolares
              </button>
              <button class="config-tab px-6 py-4 font-medium transition-colors border-b-2 border-transparent text-slate-600 hover:text-indigo-600" data-tab="materias">
                Materias
              </button>
              <button class="config-tab px-6 py-4 font-medium transition-colors border-b-2 border-transparent text-slate-600 hover:text-indigo-600" data-tab="inscripciones">
                Inscripciones
              </button>
            </div>
          </div>

          <div id="configTabContent" class="p-6">
            <p class="text-slate-500">Cargando...</p>
          </div>
        </div>
      </div>
    `;

    this.setupConfigListeners();
    await this.loadConfigTab("periodos");
    lucide.createIcons();
  }

  setupConfigListeners() {
    document.querySelectorAll(".config-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        const tabName = e.target.dataset.tab;

        document.querySelectorAll(".config-tab").forEach((t) => {
          t.classList.remove("border-indigo-600", "text-indigo-600");
          t.classList.add("border-transparent", "text-slate-600");
        });
        e.target.classList.add("border-indigo-600", "text-indigo-600");
        e.target.classList.remove("border-transparent", "text-slate-600");

        this.loadConfigTab(tabName);
      });
    });
  }

  async loadConfigTab(tabName) {
    const container = document.getElementById("configTabContent");
    if (!container) return;

    switch (tabName) {
      case "periodos":
        await this.renderPeriodosConfig(container);
        break;
      case "materias":
        await this.renderMateriasConfig(container);
        break;
      case "inscripciones":
        await this.renderInscripcionesConfig(container);
        break;
    }

    lucide.createIcons();
  }

  async renderPeriodosConfig(container) {
    try {
      const data = await apiService.getPeriodos();

      container.innerHTML = `
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h4 class="text-lg font-semibold text-slate-800">Periodos Escolares</h4>
            <button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              <i data-lucide="plus" class="w-4 h-4 inline mr-2"></i>
              Nuevo Periodo
            </button>
          </div>

          <div class="space-y-3">
            ${data.periodos
              .map(
                (periodo) => `
              <div class="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                <div class="flex justify-between items-start">
                  <div>
                    <h5 class="font-semibold text-slate-800">${
                      periodo.nombre
                    }</h5>
                    <p class="text-sm text-slate-600">
                      ${new Date(periodo.fecha_inicio).toLocaleDateString(
                        "es-ES"
                      )} - 
                      ${new Date(periodo.fecha_fin).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    ${
                      periodo.activo
                        ? '<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Activo</span>'
                        : '<span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">Inactivo</span>'
                    }
                  </div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    } catch (error) {
      console.error("Error cargando periodos:", error);
      container.innerHTML = `<p class="text-red-600">Error al cargar periodos</p>`;
    }
  }

  async renderMateriasConfig(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h4 class="text-lg font-semibold text-slate-800">Materias y Módulos</h4>
          <button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
            <i data-lucide="plus" class="w-4 h-4 inline mr-2"></i>
            Nueva Materia
          </button>
        </div>
        <p class="text-slate-600">Configuración de materias disponible próximamente...</p>
      </div>
    `;
  }

  async renderInscripcionesConfig(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h4 class="text-lg font-semibold text-slate-800">Inscripciones</h4>
          <button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
            <i data-lucide="plus" class="w-4 h-4 inline mr-2"></i>
            Inscribir Estudiante
          </button>
        </div>
        <p class="text-slate-600">Gestión de inscripciones disponible próximamente...</p>
      </div>
    `;
  }
}

// Hacer que gradesModule sea accesible globalmente
window.gradesModule = new GradesModule();

export default window.gradesModule;
