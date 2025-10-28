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

  // ... (mantener renderInicio y loadQuickStats igual) ...

  // ==========================================
  // VISTA: CALIFICACIONES ACADÉMICAS (MEJORADO)
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
      // Cargar materias académicas
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
      // Obtener todos los estudiantes
      const studentsData = await apiService.getStudents();

      if (!studentsData.success || !studentsData.students) {
        throw new Error("No se pudieron cargar los estudiantes");
      }

      // Obtener la materia seleccionada
      const materias = await apiService.getMaterias({ tipo: "academica" });
      const materia = materias.materias.find((m) => m.id == materiaId);

      // Para cada estudiante, obtener su inscripción y calificaciones
      const estudiantesConCalif = [];

      for (const student of studentsData.students) {
        try {
          // Obtener inscripciones del estudiante
          const inscripcionesData = await apiService.getInscripcionesEstudiante(
            student.id_estudiante, // ✅ Corregido: era .id, ahora es .id_estudiante
            this.periodoActivo.id
          );

          const inscripcion = inscripcionesData.inscripciones?.find(
            (i) => i.materia_id == materiaId
          );

          if (inscripcion) {
            // Obtener calificaciones
            const califData = await apiService.getCalificacionesAcademicas(
              inscripcion.id
            );

            // Organizar calificaciones por periodo
            const calificaciones = {};
            califData.calificaciones.forEach((c) => {
              calificaciones[c.periodo_evaluacion] = parseFloat(c.calificacion);
            });

            estudiantesConCalif.push({
              id: student.id_estudiante, // ✅ Corregido
              nombre: student.nombre,
              inscripcion_id: inscripcion.id,
              calificaciones: calificaciones,
              promedio: parseFloat(califData.promedio) || 0,
            });
          }
        } catch (error) {
          console.log(
            `Estudiante ${student.nombre} no inscrito en esta materia`
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

    // Event listeners para editar calificaciones
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

        // Recargar tabla
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

  // ... (mantener las otras funciones igual hasta renderReportes) ...

  // ==========================================
  // VISTA: REPORTES (MEJORADO)
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

    // Event listeners para los botones de reportes
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
    // Obtener estudiantes
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

        try {
          const data = await apiService.getReporteEstudiante(
            estudianteId,
            this.periodoActivo.id
          );

          document.getElementById("reporteResult").innerHTML = `
          <div class="border border-slate-200 rounded-lg p-6 mt-4">
            <h5 class="text-xl font-bold mb-4">${data.estudiante.nombre}</h5>
            <div class="space-y-4">
              ${data.reporte
                .map(
                  (materia) => `
                <div class="border-b border-slate-200 pb-4">
                  <p class="font-semibold">${materia.materia_nombre}</p>
                  <p class="text-sm text-slate-600">Promedio: <span class="font-bold ${
                    materia.aprobado ? "text-green-600" : "text-red-600"
                  }">${materia.promedio}</span></p>
                  <p class="text-sm text-slate-600">Estado: ${
                    materia.aprobado ? "✅ Aprobado" : "❌ Reprobado"
                  }</p>
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
          </div>
        `;
        } catch (error) {
          console.error(error);
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

  // ... (mantener todas las demás funciones igual) ...
}

// Hacer que gradesModule sea accesible globalmente para onclick
window.gradesModule = new GradesModule();

export default window.gradesModule;
