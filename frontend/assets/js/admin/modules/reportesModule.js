// ==========================================
// REPORTES MODULE - Módulo de Reportes Completo
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";
import { NOTIFICATION_TYPES } from "../config.js";

class ReportesModule {
  constructor() {
    this.reportHistory = this.loadReportHistory();
    this.currentReportData = null;
  }

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================
  render() {
    const content = `
      <div class="space-y-6">
        <!-- Encabezado -->
        <div class="bg-gradient-to-r from-slate-700 to-slate-800 p-6 rounded-xl shadow-lg text-white">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold mb-2">📊 Centro de Reportes</h2>
              <p class="text-slate-300">Genera y descarga reportes detallados del sistema</p>
            </div>
            <div class="text-right">
              <p class="text-3xl font-bold">${this.reportHistory.length}</p>
              <p class="text-sm text-slate-300">Reportes generados</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Columna Principal: Generación de Reportes -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Tipos de Reportes -->
            <div class="bg-white p-6 rounded-xl shadow-lg">
              <h3 class="text-xl font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <i data-lucide="file-plus" class="w-5 h-5 text-emerald-600"></i>
                Generar Nuevo Reporte
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <!-- Reporte de Estudiantes -->
                <button type="button" data-report="students" class="report-btn group p-4 border-2 border-slate-200 rounded-lg hover:border-sky-500 hover:bg-sky-50 transition-all text-left hover:shadow-md">
                  <div class="flex items-start gap-3">
                    <div class="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center group-hover:bg-sky-500 transition-colors">
                      <i data-lucide="users" class="w-6 h-6 text-sky-600 group-hover:text-white"></i>
                    </div>
                    <div>
                      <p class="font-semibold text-slate-800 mb-1">Estudiantes</p>
                      <p class="text-sm text-slate-500">Listado completo con estadísticas</p>
                    </div>
                  </div>
                </button>

                <!-- Reporte de Tareas -->
                <button type="button" data-report="tasks" class="report-btn group p-4 border-2 border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left hover:shadow-md">
                  <div class="flex items-start gap-3">
                    <div class="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                      <i data-lucide="clipboard-check" class="w-6 h-6 text-emerald-600 group-hover:text-white"></i>
                    </div>
                    <div>
                      <p class="font-semibold text-slate-800 mb-1">Tareas</p>
                      <p class="text-sm text-slate-500">Estado y completitud de tareas</p>
                    </div>
                  </div>
                </button>

                <!-- Reporte de Monedas -->
                <button type="button" data-report="coins" class="report-btn group p-4 border-2 border-slate-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all text-left hover:shadow-md">
                  <div class="flex items-start gap-3">
                    <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                      <i data-lucide="coins" class="w-6 h-6 text-amber-600 group-hover:text-white"></i>
                    </div>
                    <div>
                      <p class="font-semibold text-slate-800 mb-1">Monedas</p>
                      <p class="text-sm text-slate-500">Balance y distribución de STHELA</p>
                    </div>
                  </div>
                </button>

                <!-- Reporte de Transacciones -->
                <button type="button" data-report="transactions" class="report-btn group p-4 border-2 border-slate-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left hover:shadow-md">
                  <div class="flex items-start gap-3">
                    <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                      <i data-lucide="arrow-right-left" class="w-6 h-6 text-purple-600 group-hover:text-white"></i>
                    </div>
                    <div>
                      <p class="font-semibold text-slate-800 mb-1">Transacciones</p>
                      <p class="text-sm text-slate-500">Historial de movimientos</p>
                    </div>
                  </div>
                </button>

                <!-- Reporte de Exámenes -->
                <button type="button" data-report="exams" class="report-btn group p-4 border-2 border-slate-200 rounded-lg hover:border-rose-500 hover:bg-rose-50 transition-all text-left hover:shadow-md">
                  <div class="flex items-start gap-3">
                    <div class="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center group-hover:bg-rose-500 transition-colors">
                      <i data-lucide="award" class="w-6 h-6 text-rose-600 group-hover:text-white"></i>
                    </div>
                    <div>
                      <p class="font-semibold text-slate-800 mb-1">Exámenes</p>
                      <p class="text-sm text-slate-500">Resultados y calificaciones</p>
                    </div>
                  </div>
                </button>

                <!-- Reporte General -->
                <button type="button" data-report="general" class="report-btn group p-4 border-2 border-slate-200 rounded-lg hover:border-slate-500 hover:bg-slate-50 transition-all text-left hover:shadow-md">
                  <div class="flex items-start gap-3">
                    <div class="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-500 transition-colors">
                      <i data-lucide="bar-chart-3" class="w-6 h-6 text-slate-600 group-hover:text-white"></i>
                    </div>
                    <div>
                      <p class="font-semibold text-slate-800 mb-1">General</p>
                      <p class="text-sm text-slate-500">Resumen completo del sistema</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Vista Previa del Reporte -->
            <div id="reportPreview" class="hidden bg-white p-6 rounded-xl shadow-lg">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold text-slate-700 flex items-center gap-2">
                  <i data-lucide="eye" class="w-5 h-5 text-slate-600"></i>
                  Vista Previa
                </h3>
                <button type="button" id="closePreview" class="text-slate-400 hover:text-slate-600">
                  <i data-lucide="x" class="w-5 h-5"></i>
                </button>
              </div>
              
              <div id="previewContent" class="border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-96 overflow-y-auto">
                <!-- Contenido dinámico -->
              </div>

              <div class="flex gap-3 mt-4">
                <button type="button" id="downloadPDF" class="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors">
                  <i data-lucide="file-down" class="w-5 h-5"></i>
                  Descargar PDF
                </button>
                <button type="button" id="downloadCSV" class="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors">
                  <i data-lucide="file-spreadsheet" class="w-5 h-5"></i>
                  Descargar CSV
                </button>
              </div>
            </div>
          </div>

          <!-- Columna Lateral: Historial y Filtros -->
          <div class="space-y-6">
            <!-- Filtros de Fecha -->
            <div class="bg-white p-6 rounded-xl shadow-lg">
              <h3 class="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <i data-lucide="calendar" class="w-5 h-5 text-slate-600"></i>
                Filtros de Fecha
              </h3>
              
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Desde</label>
                  <input type="date" id="dateFrom" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
                  <input type="date" id="dateTo" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                </div>
                <button type="button" id="clearDates" class="w-full px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                  Limpiar fechas
                </button>
              </div>
            </div>

            <!-- Historial de Reportes -->
            <div class="bg-white p-6 rounded-xl shadow-lg">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-slate-700 flex items-center gap-2">
                  <i data-lucide="history" class="w-5 h-5 text-slate-600"></i>
                  Historial
                </h3>
                <button type="button" id="clearHistory" class="text-xs text-red-600 hover:text-red-700">
                  Limpiar
                </button>
              </div>
              
              <div id="reportHistoryList" class="space-y-2 max-h-96 overflow-y-auto">
                ${this.renderHistoryList()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    uiService.updateMainContent(content);
    this.setupEventListeners();
    this.setDefaultDates();
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  setupEventListeners() {
    // Botones de tipo de reporte
    document.addEventListener("click", async (e) => {
      const reportBtn = e.target.closest(".report-btn");
      if (reportBtn) {
        const reportType = reportBtn.dataset.report;
        await this.generateReport(reportType);
      }

      // Cerrar vista previa
      if (e.target.closest("#closePreview")) {
        this.closePreview();
      }

      // Descargar PDF
      if (e.target.closest("#downloadPDF")) {
        this.downloadPDF();
      }

      // Descargar CSV
      if (e.target.closest("#downloadCSV")) {
        this.downloadCSV();
      }

      // Limpiar fechas
      if (e.target.closest("#clearDates")) {
        this.clearDates();
      }

      // Limpiar historial
      if (e.target.closest("#clearHistory")) {
        this.clearHistory();
      }

      // Recargar reporte desde historial
      const historyBtn = e.target.closest(".history-item");
      if (historyBtn) {
        const index = parseInt(historyBtn.dataset.index);
        this.loadFromHistory(index);
      }
    });
  }

  // ==========================================
  // GENERACIÓN DE REPORTES
  // ==========================================
  async generateReport(type) {
    uiService.showNotification("Generando reporte...", NOTIFICATION_TYPES.INFO);

    try {
      const dateFrom = document.getElementById("dateFrom")?.value;
      const dateTo = document.getElementById("dateTo")?.value;

      let data;
      let reportData;

      switch (type) {
        case "students":
          data = await apiService.getStudents();
          reportData = this.generateStudentsReport(
            data.students || [],
            dateFrom,
            dateTo
          );
          break;

        case "tasks":
          data = await apiService.getTasks();
          reportData = this.generateTasksReport(
            data.tasks || [],
            dateFrom,
            dateTo
          );
          break;

        case "coins":
          data = await apiService.getStudents();
          reportData = this.generateCoinsReport(
            data.students || [],
            dateFrom,
            dateTo
          );
          break;

        case "transactions":
          data = await apiService.getTransactions();
          reportData = this.generateTransactionsReport(
            data.transactions || [],
            dateFrom,
            dateTo
          );
          break;

        case "exams":
          data = (await apiService.getExams?.()) || { exams: [] };
          reportData = this.generateExamsReport(
            data.exams || [],
            dateFrom,
            dateTo
          );
          break;

        case "general":
          reportData = await this.generateGeneralReport(dateFrom, dateTo);
          break;

        default:
          throw new Error("Tipo de reporte no válido");
      }

      this.currentReportData = reportData;
      this.showPreview(reportData);
      this.addToHistory(reportData);

      uiService.showNotification(
        "✅ Reporte generado exitosamente",
        NOTIFICATION_TYPES.SUCCESS
      );
    } catch (error) {
      console.error("Error generando reporte:", error);
      uiService.showNotification(
        "❌ Error al generar reporte",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  // ==========================================
  // GENERADORES DE REPORTES ESPECÍFICOS
  // ==========================================
  generateStudentsReport(students, dateFrom, dateTo) {
    const filtered = this.filterByDate(
      students,
      dateFrom,
      dateTo,
      "fecha_registro"
    );

    const totalBalance = filtered.reduce((sum, s) => sum + (s.balance || 0), 0);
    const totalTasks = filtered.reduce(
      (sum, s) => sum + (s.tareas_completadas || 0),
      0
    );
    const avgBalance = filtered.length > 0 ? totalBalance / filtered.length : 0;

    return {
      type: "students",
      title: "Reporte de Estudiantes",
      date: new Date().toLocaleDateString("es-ES"),
      dateRange: { from: dateFrom, to: dateTo },
      summary: {
        total: filtered.length,
        totalBalance: totalBalance,
        avgBalance: avgBalance.toFixed(2),
        totalTasks: totalTasks,
      },
      data: filtered,
      headers: [
        "ID",
        "Nombre",
        "Email",
        "Balance STHELA",
        "Tareas Completadas",
        "Fecha Registro",
      ],
      rows: filtered.map((s) => [
        s.id_estudiante,
        s.nombre,
        s.email,
        s.balance || 0,
        s.tareas_completadas || 0,
        s.fecha_registro
          ? new Date(s.fecha_registro).toLocaleDateString("es-ES")
          : "N/A",
      ]),
    };
  }

  generateTasksReport(tasks, dateFrom, dateTo) {
    const filtered = this.filterByDate(
      tasks,
      dateFrom,
      dateTo,
      "fecha_creacion"
    );

    const byStatus = filtered.reduce((acc, task) => {
      acc[task.estado] = (acc[task.estado] || 0) + 1;
      return acc;
    }, {});

    const totalReward = filtered.reduce(
      (sum, t) => sum + (t.recompensa || 0),
      0
    );

    return {
      type: "tasks",
      title: "Reporte de Tareas",
      date: new Date().toLocaleDateString("es-ES"),
      dateRange: { from: dateFrom, to: dateTo },
      summary: {
        total: filtered.length,
        activas: byStatus.activa || 0,
        completadas: byStatus.completada || 0,
        vencidas: byStatus.vencida || 0,
        totalReward: totalReward,
      },
      data: filtered,
      headers: [
        "ID",
        "Título",
        "Estado",
        "Recompensa",
        "Dificultad",
        "Fecha Límite",
      ],
      rows: filtered.map((t) => [
        t.id,
        t.titulo,
        t.estado,
        t.recompensa || 0,
        t.dificultad || "N/A",
        t.fecha_limite
          ? new Date(t.fecha_limite).toLocaleDateString("es-ES")
          : "Sin límite",
      ]),
    };
  }

  generateCoinsReport(students, dateFrom, dateTo) {
    const filtered = this.filterByDate(
      students,
      dateFrom,
      dateTo,
      "fecha_registro"
    );

    const totalBalance = filtered.reduce((sum, s) => sum + (s.balance || 0), 0);
    const sorted = [...filtered].sort(
      (a, b) => (b.balance || 0) - (a.balance || 0)
    );
    const top10 = sorted.slice(0, 10);

    return {
      type: "coins",
      title: "Reporte de Monedas STHELA",
      date: new Date().toLocaleDateString("es-ES"),
      dateRange: { from: dateFrom, to: dateTo },
      summary: {
        totalCirculation: totalBalance,
        students: filtered.length,
        avgBalance:
          filtered.length > 0 ? (totalBalance / filtered.length).toFixed(2) : 0,
        topHolder: sorted[0]?.nombre || "N/A",
      },
      data: top10,
      headers: [
        "Posición",
        "Estudiante",
        "Balance STHELA",
        "Tareas Completadas",
      ],
      rows: top10.map((s, idx) => [
        idx + 1,
        s.nombre,
        s.balance || 0,
        s.tareas_completadas || 0,
      ]),
    };
  }

  generateTransactionsReport(transactions, dateFrom, dateTo) {
    const filtered = this.filterByDate(transactions, dateFrom, dateTo, "fecha");

    const totalAmount = filtered.reduce(
      (sum, t) => sum + Math.abs(t.monto || 0),
      0
    );

    // Contar transacciones por tipo
    const byType = filtered.reduce((acc, t) => {
      const type = t.tipo || "desconocido";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Separar ingresos y egresos
    const ingresos = filtered.filter((t) => t.monto > 0);
    const egresos = filtered.filter((t) => t.monto < 0);
    const totalIngresos = ingresos.reduce((sum, t) => sum + t.monto, 0);
    const totalEgresos = egresos.reduce((sum, t) => sum + Math.abs(t.monto), 0);

    // Crear resumen mejorado
    const summary = {
      "Total Transacciones": filtered.length,
      "Total Ingresos": `+${totalIngresos.toFixed(2)} STHELA`,
      "Total Egresos": `-${totalEgresos.toFixed(2)} STHELA`,
      "Balance Neto": `${(totalIngresos - totalEgresos).toFixed(2)} STHELA`,
      "---": "---", // Separador visual
    };

    // Agregar cada tipo de transacción al resumen
    Object.entries(byType).forEach(([tipo, cantidad]) => {
      const tipoFormateado = tipo
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      summary[tipoFormateado] = cantidad;
    });

    return {
      type: "transactions",
      title: "Reporte de Transacciones",
      date: new Date().toLocaleDateString("es-ES"),
      dateRange: { from: dateFrom, to: dateTo },
      summary: summary,
      data: filtered,
      headers: [
        "ID",
        "Estudiante",
        "Tipo",
        "Monto",
        "Motivo",
        "Relacionado",
        "Fecha",
      ],
      rows: filtered.map((t) => {
        // Formatear tipo
        const tipoFormateado = (t.tipo || "desconocido")
          .replace(/_/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        // Formatear monto con signo y color
        const montoFormateado = t.monto > 0 ? `+${t.monto}` : `${t.monto}`;

        // Obtener motivo (ahora sabemos que el campo correcto es "motivo")
        const motivo = t.motivo || "Sin motivo especificado";

        // Determinar si está relacionado con tarea o examen
        let relacionado = "General";
        if (t.tarea) {
          relacionado = `Tarea #${t.tarea}`;
        } else if (t.examen) {
          relacionado = `Examen #${t.examen}`;
        }

        return [
          t.id,
          t.estudiante_nombre || "N/A",
          tipoFormateado,
          montoFormateado,
          motivo,
          relacionado,
          t.fecha ? new Date(t.fecha).toLocaleDateString("es-ES") : "N/A",
        ];
      }),
    };
  }

  generateExamsReport(exams, dateFrom, dateTo) {
    const filtered = this.filterByDate(
      exams,
      dateFrom,
      dateTo,
      "fecha_creacion"
    );

    return {
      type: "exams",
      title: "Reporte de Exámenes",
      date: new Date().toLocaleDateString("es-ES"),
      dateRange: { from: dateFrom, to: dateTo },
      summary: {
        total: filtered.length,
      },
      data: filtered,
      headers: ["ID", "Título", "Puntos", "Fecha Creación"],
      rows: filtered.map((e) => [
        e.id,
        e.titulo,
        e.puntos_maximos || 0,
        e.fecha_creacion
          ? new Date(e.fecha_creacion).toLocaleDateString("es-ES")
          : "N/A",
      ]),
    };
  }

  async generateGeneralReport(dateFrom, dateTo) {
    const [studentsData, tasksData, transactionsData] = await Promise.all([
      apiService.getStudents(),
      apiService.getTasks(),
      apiService.getTransactions(),
    ]);

    const students = studentsData.students || [];
    const tasks = tasksData.tasks || [];
    const transactions = transactionsData.transactions || [];

    return {
      type: "general",
      title: "Reporte General del Sistema",
      date: new Date().toLocaleDateString("es-ES"),
      dateRange: { from: dateFrom, to: dateTo },
      summary: {
        estudiantes: students.length,
        tareas: tasks.length,
        transacciones: transactions.length,
        totalMonedas: students.reduce((sum, s) => sum + (s.balance || 0), 0),
        tareasActivas: tasks.filter((t) => t.estado === "activa").length,
        tareasCompletadas: tasks.filter((t) => t.estado === "completada")
          .length,
      },
      data: null,
      headers: ["Métrica", "Valor"],
      rows: [
        ["Total Estudiantes", students.length],
        ["Total Tareas", tasks.length],
        ["Tareas Activas", tasks.filter((t) => t.estado === "activa").length],
        [
          "Tareas Completadas",
          tasks.filter((t) => t.estado === "completada").length,
        ],
        [
          "Total Monedas en Circulación",
          students.reduce((sum, s) => sum + (s.balance || 0), 0),
        ],
        ["Total Transacciones", transactions.length],
      ],
    };
  }

  // ==========================================
  // UTILIDADES
  // ==========================================
  filterByDate(data, dateFrom, dateTo, dateField) {
    if (!dateFrom && !dateTo) return data;

    return data.filter((item) => {
      const itemDate = item[dateField] ? new Date(item[dateField]) : null;
      if (!itemDate) return true;

      if (dateFrom && itemDate < new Date(dateFrom)) return false;
      if (dateTo && itemDate > new Date(dateTo + "T23:59:59")) return false;

      return true;
    });
  }

  setDefaultDates() {
    const dateToInput = document.getElementById("dateTo");
    if (dateToInput) {
      const today = new Date().toISOString().split("T")[0];
      dateToInput.value = today;
    }
  }

  clearDates() {
    const dateFromInput = document.getElementById("dateFrom");
    const dateToInput = document.getElementById("dateTo");
    if (dateFromInput) dateFromInput.value = "";
    if (dateToInput) dateToInput.value = "";
  }

  // ==========================================
  // VISTA PREVIA
  // ==========================================
  showPreview(reportData) {
    const preview = document.getElementById("reportPreview");
    const content = document.getElementById("previewContent");

    if (!preview || !content) return;

    // Construir vista previa
    let html = `
      <div class="space-y-4">
        <div class="border-b border-slate-200 pb-4">
          <h4 class="text-lg font-bold text-slate-800">${reportData.title}</h4>
          <p class="text-sm text-slate-500">Generado el ${reportData.date}</p>
          ${
            reportData.dateRange.from || reportData.dateRange.to
              ? `<p class="text-sm text-slate-500">
                  Rango: ${reportData.dateRange.from || "Inicio"} - ${
                  reportData.dateRange.to || "Fin"
                }
                </p>`
              : ""
          }
        </div>

        <div class="bg-slate-100 p-4 rounded-lg">
          <h5 class="font-semibold text-slate-700 mb-3">Resumen</h5>
          <div class="grid grid-cols-2 gap-3">
            ${Object.entries(reportData.summary)
              .map(
                ([key, value]) => `
              <div class="bg-white p-3 rounded">
                <p class="text-xs text-slate-500 uppercase">${this.formatKey(
                  key
                )}</p>
                <p class="text-lg font-bold text-slate-800">${value}</p>
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div>
          <h5 class="font-semibold text-slate-700 mb-3">Datos (primeras 10 filas)</h5>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-200">
                <tr>
                  ${reportData.headers
                    .map((h) => `<th class="px-3 py-2 text-left">${h}</th>`)
                    .join("")}
                </tr>
              </thead>
              <tbody>
                ${reportData.rows
                  .slice(0, 10)
                  .map(
                    (row) => `
                  <tr class="border-b border-slate-100">
                    ${row
                      .map((cell) => `<td class="px-3 py-2">${cell}</td>`)
                      .join("")}
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            ${
              reportData.rows.length > 10
                ? `<p class="text-xs text-slate-500 mt-2 text-center">... y ${
                    reportData.rows.length - 10
                  } filas más</p>`
                : ""
            }
          </div>
        </div>
      </div>
    `;

    content.innerHTML = html;
    preview.classList.remove("hidden");
    lucide.createIcons();
  }

  closePreview() {
    const preview = document.getElementById("reportPreview");
    if (preview) {
      preview.classList.add("hidden");
    }
  }

  formatKey(key) {
    const map = {
      total: "Total",
      totalBalance: "Balance Total",
      avgBalance: "Balance Promedio",
      totalTasks: "Tareas Totales",
      activas: "Activas",
      completadas: "Completadas",
      vencidas: "Vencidas",
      totalReward: "Recompensa Total",
      totalCirculation: "En Circulación",
      students: "Estudiantes",
      topHolder: "Mayor Balance",
      totalAmount: "Monto Total",
      tipos: "Tipos",
      estudiantes: "Estudiantes",
      tareas: "Tareas",
      transacciones: "Transacciones",
      totalMonedas: "Total Monedas",
      tareasActivas: "Tareas Activas",
      tareasCompletadas: "Tareas Completadas",
    };
    return map[key] || key;
  }

  // ==========================================
  // DESCARGAS
  // ==========================================
  downloadCSV() {
    if (!this.currentReportData) return;

    const csv = [
      this.currentReportData.headers.join(","),
      ...this.currentReportData.rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reporte_${this.currentReportData.type}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    uiService.showNotification("✅ CSV descargado", NOTIFICATION_TYPES.SUCCESS);
  }

  downloadPDF() {
    if (!this.currentReportData) return;

    // Nota: Para generar PDFs reales necesitarías una librería como jsPDF
    // Aquí simulo la descarga mostrando un mensaje
    uiService.showNotification(
      "ℹ️ Para generar PDFs instala la librería jsPDF",
      NOTIFICATION_TYPES.INFO
    );

    // Código de ejemplo si usaras jsPDF:
    /*
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text(this.currentReportData.title, 20, 20);
    doc.text(`Fecha: ${this.currentReportData.date}`, 20, 30);
    
    // Agregar tabla...
    
    doc.save(`reporte_${this.currentReportData.type}_${new Date().toISOString().split('T')[0]}.pdf`);
    */
  }

  // ==========================================
  // HISTORIAL
  // ==========================================
  loadReportHistory() {
    const stored = localStorage.getItem("reportHistory");
    return stored ? JSON.parse(stored) : [];
  }

  saveReportHistory() {
    localStorage.setItem("reportHistory", JSON.stringify(this.reportHistory));
  }

  addToHistory(reportData) {
    const historyItem = {
      type: reportData.type,
      title: reportData.title,
      date: reportData.date,
      timestamp: new Date().toISOString(),
      summary: reportData.summary,
    };

    this.reportHistory.unshift(historyItem);

    // Mantener solo los últimos 20
    if (this.reportHistory.length > 20) {
      this.reportHistory = this.reportHistory.slice(0, 20);
    }

    this.saveReportHistory();
    this.updateHistoryList();
  }

  loadFromHistory(index) {
    const item = this.reportHistory[index];
    if (!item) return;

    uiService.showNotification(
      `Reporte del ${item.date} - ${item.title}`,
      NOTIFICATION_TYPES.INFO
    );
  }

  clearHistory() {
    if (
      confirm("¿Estás seguro de que quieres limpiar el historial de reportes?")
    ) {
      this.reportHistory = [];
      this.saveReportHistory();
      this.updateHistoryList();
      uiService.showNotification(
        "Historial limpiado",
        NOTIFICATION_TYPES.SUCCESS
      );
    }
  }

  updateHistoryList() {
    const container = document.getElementById("reportHistoryList");
    if (!container) return;

    container.innerHTML = this.renderHistoryList();
    lucide.createIcons();
  }

  renderHistoryList() {
    if (this.reportHistory.length === 0) {
      return `
        <div class="text-center py-8">
          <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-2 text-slate-300"></i>
          <p class="text-sm text-slate-400">No hay reportes generados</p>
        </div>
      `;
    }

    const typeIcons = {
      students: "users",
      tasks: "clipboard-check",
      coins: "coins",
      transactions: "arrow-right-left",
      exams: "award",
      general: "bar-chart-3",
    };

    const typeColors = {
      students: "text-sky-600 bg-sky-50",
      tasks: "text-emerald-600 bg-emerald-50",
      coins: "text-amber-600 bg-amber-50",
      transactions: "text-purple-600 bg-purple-50",
      exams: "text-rose-600 bg-rose-50",
      general: "text-slate-600 bg-slate-50",
    };

    return this.reportHistory
      .map(
        (item, index) => `
        <button type="button" class="history-item w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left" data-index="${index}">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 ${
              typeColors[item.type] || "bg-slate-100"
            } rounded-lg flex items-center justify-center flex-shrink-0">
              <i data-lucide="${
                typeIcons[item.type] || "file"
              }" class="w-5 h-5"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-slate-800 text-sm truncate">${
                item.title
              }</p>
              <p class="text-xs text-slate-500">${item.date}</p>
            </div>
          </div>
        </button>
      `
      )
      .join("");
  }
}
const reportesModule = new ReportesModule();
export default reportesModule;
