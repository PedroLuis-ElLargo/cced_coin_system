// ==========================================
// ACTIVITY LOGGER - Sistema de Registro de Actividades
// ==========================================

const { query } = require("../config/database");

/**
 * Sistema de registro de actividades recientes
 * Registra automáticamente todas las acciones importantes del sistema
 */
class ActivityLogger {
  /**
   * Registrar una actividad genérica
   * @param {Object} activity - Datos de la actividad
   */
  static async log(activity) {
    try {
      const {
        tipo,
        icono,
        color,
        titulo,
        realizado_por = null,
        usuario_afectado_id = null,
        materia_id = null,
        tarea_id = null,
        examen_id = null,
        inscripcion_id = null,
        metadata = {},
      } = activity;

      // Validaciones básicas
      if (!tipo || !icono || !color || !titulo) {
        console.error("❌ Faltan campos requeridos para registrar actividad");
        return;
      }

      await query(
        `INSERT INTO actividades_recientes 
         (tipo, icono, color, titulo, realizado_por, usuario_afectado_id, 
          materia_id, tarea_id, examen_id, inscripcion_id, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tipo,
          icono,
          color,
          titulo,
          realizado_por,
          usuario_afectado_id,
          materia_id,
          tarea_id,
          examen_id,
          inscripcion_id,
          JSON.stringify(metadata),
        ]
      );
    } catch (error) {
      console.error("❌ Error registrando actividad:", error.message);
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Obtener actividades recientes
   * @param {number} limit - Cantidad de actividades a obtener
   * @returns {Array} Lista de actividades con información relacionada
   */
  static async getRecent(limit = 20) {
    try {
      // Asegurar que limit sea un número entero válido
      const limitNum = parseInt(limit, 10);

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        console.warn("⚠️ Límite inválido, usando default de 20");
        limit = 20;
      } else {
        limit = limitNum;
      }

      const actividades = await query(
        `SELECT 
        a.id,
        a.tipo,
        a.icono,
        a.color,
        a.titulo,
        a.metadata,
        a.fecha_creacion,
        realizado.nombre as realizado_por_nombre,
        realizado.rol as realizado_por_rol,
        afectado.nombre as usuario_afectado_nombre,
        afectado.rol as usuario_afectado_rol,
        m.nombre as materia_nombre,
        t.titulo as tarea_titulo,
        e.nombre as examen_nombre
       FROM actividades_recientes a
       LEFT JOIN users realizado ON a.realizado_por = realizado.id
       LEFT JOIN users afectado ON a.usuario_afectado_id = afectado.id
       LEFT JOIN materias m ON a.materia_id = m.id
       LEFT JOIN tasks t ON a.tarea_id = t.id
       LEFT JOIN exams e ON a.examen_id = e.id
       ORDER BY a.fecha_creacion DESC
       LIMIT ${limit}`
      );

      return actividades.map((act) => {
        // ✅ SOLUCIÓN: Verificar si metadata ya es un objeto
        let metadata = {};
        if (act.metadata) {
          // Si es string, parsearlo; si ya es objeto, usarlo directamente
          if (typeof act.metadata === "string") {
            try {
              metadata = JSON.parse(act.metadata);
            } catch (e) {
              console.error("Error parseando metadata:", e);
              metadata = {};
            }
          } else if (typeof act.metadata === "object") {
            metadata = act.metadata;
          }
        }

        return {
          id: act.id,
          tipo: act.tipo,
          icono: act.icono,
          color: act.color,
          titulo: act.titulo,
          metadata: metadata, // ✅ Usar la metadata parseada correctamente
          fecha_creacion: act.fecha_creacion,
          realizado_por_nombre: act.realizado_por_nombre,
          realizado_por_rol: act.realizado_por_rol,
          usuario_afectado_nombre: act.usuario_afectado_nombre,
          usuario_afectado_rol: act.usuario_afectado_rol,
          materia_nombre: act.materia_nombre,
          tarea_titulo: act.tarea_titulo,
          examen_nombre: act.examen_nombre,
          tiempo_transcurrido: this.calcularTiempoTranscurrido(
            act.fecha_creacion
          ),
        };
      });
    } catch (error) {
      console.error("❌ Error obteniendo actividades:", error);
      return [];
    }
  }

  /**
   * Calcular tiempo transcurrido en formato legible
   * @param {Date|string} fecha - Fecha a calcular
   * @returns {string} Tiempo transcurrido en formato legible
   */
  static calcularTiempoTranscurrido(fecha) {
    const ahora = new Date();
    const entonces = new Date(fecha);
    const diff = Math.floor((ahora - entonces) / 1000); // Diferencia en segundos

    if (diff < 60) return "Hace unos segundos";
    if (diff < 120) return "Hace 1 minuto";
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
    if (diff < 7200) return "Hace 1 hora";
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
    if (diff < 172800) return "Hace 1 día";
    if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`;
    if (diff < 1209600) return "Hace 1 semana";
    if (diff < 2592000) return `Hace ${Math.floor(diff / 604800)} semanas`;

    return entonces.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year:
        entonces.getFullYear() !== ahora.getFullYear() ? "numeric" : undefined,
    });
  }

  /**
   * Limpiar actividades antiguas (más de 30 días)
   * @returns {number} Cantidad de actividades eliminadas
   */
  static async cleanOldActivities() {
    try {
      const result = await query(
        `DELETE FROM actividades_recientes 
         WHERE fecha_creacion < DATE_SUB(NOW(), INTERVAL 30 DAY)`
      );

      const deleted = result.affectedRows || 0;
      return deleted;
    } catch (error) {
      return 0;
    }
  }

  // ==========================================
  // MÉTODOS ESPECÍFICOS PARA CALIFICACIONES
  // ==========================================

  /**
   * Registrar calificación académica
   */
  static async logCalificacionAcademica(data) {
    const {
      estudiante_nombre,
      materia_nombre,
      calificacion,
      periodo,
      realizado_por,
      usuario_afectado_id,
      materia_id,
      inscripcion_id,
    } = data;

    const aprobado = calificacion >= 70;

    await this.log({
      tipo: "calificacion_academica",
      icono: "check-circle-2",
      color: aprobado ? "green" : "red",
      titulo: `${estudiante_nombre} recibió ${calificacion.toFixed(
        1
      )} en ${materia_nombre} (Periodo ${periodo})`,
      realizado_por,
      usuario_afectado_id,
      materia_id,
      inscripcion_id,
      metadata: {
        materia: materia_nombre,
        calificacion: calificacion.toFixed(1),
        periodo,
        aprobado,
      },
    });
  }

  /**
   * Registrar calificación de módulo formativo
   */
  static async logCalificacionModulo(data) {
    const {
      estudiante_nombre,
      materia_nombre,
      ra_nombre,
      calificacion,
      oportunidad,
      completado,
      realizado_por,
      usuario_afectado_id,
      materia_id,
      inscripcion_id,
    } = data;

    const oppText =
      oportunidad == 4 ? "Eval. Especial" : `Oport. ${oportunidad}`;

    await this.log({
      tipo: "calificacion_modulo",
      icono: completado ? "check-circle-2" : "alert-circle",
      color: completado ? "green" : "orange",
      titulo: `${estudiante_nombre} - ${materia_nombre}: ${ra_nombre} (${oppText}) = ${calificacion.toFixed(
        1
      )} ${completado ? "✓" : ""}`,
      realizado_por,
      usuario_afectado_id,
      materia_id,
      inscripcion_id,
      metadata: {
        materia: materia_nombre,
        ra: ra_nombre,
        calificacion: calificacion.toFixed(1),
        oportunidad,
        completado,
      },
    });
  }

  // ==========================================
  // MÉTODOS ESPECÍFICOS PARA INSCRIPCIONES
  // ==========================================

  /**
   * Registrar inscripción de estudiante
   */
  static async logInscripcion(data) {
    const {
      estudiante_nombre,
      materia_nombre,
      periodo_nombre,
      realizado_por,
      usuario_afectado_id,
      materia_id,
      inscripcion_id,
    } = data;

    await this.log({
      tipo: "inscripcion",
      icono: "user-check",
      color: "blue",
      titulo: `${estudiante_nombre} inscrito en ${materia_nombre} (${periodo_nombre})`,
      realizado_por,
      usuario_afectado_id,
      materia_id,
      inscripcion_id,
      metadata: {
        materia: materia_nombre,
        periodo: periodo_nombre,
      },
    });
  }

  // ==========================================
  // MÉTODOS ESPECÍFICOS PARA USUARIOS
  // ==========================================

  /**
   * Registrar nuevo usuario
   */
  static async logNuevoUsuario(data) {
    const { nombre, rol, realizado_por, usuario_afectado_id } = data;

    await this.log({
      tipo: "nuevo_usuario",
      icono: "user-plus",
      color: rol === "student" ? "blue" : "purple",
      titulo: `Nuevo ${
        rol === "student" ? "estudiante" : "administrador"
      } registrado: ${nombre}`,
      realizado_por,
      usuario_afectado_id,
      metadata: { rol },
    });
  }

  // ==========================================
  // MÉTODOS ESPECÍFICOS PARA TAREAS
  // ==========================================

  /**
   * Registrar tarea completada
   */
  static async logTareaCompletada(data) {
    const {
      estudiante_nombre,
      tarea_titulo,
      recompensa,
      usuario_afectado_id,
      tarea_id,
    } = data;

    await this.log({
      tipo: "tarea_completada",
      icono: "check-circle-2",
      color: "green",
      titulo: `${estudiante_nombre} completó "${tarea_titulo}" (+${recompensa} STHELA Coins)`,
      usuario_afectado_id,
      tarea_id,
      metadata: {
        tarea: tarea_titulo,
        recompensa,
      },
    });
  }

  /**
   * Registrar nueva tarea publicada
   */
  static async logNuevaTarea(data) {
    const { tarea_titulo, recompensa, dificultad, realizado_por, tarea_id } =
      data;

    await this.log({
      tipo: "tarea_nueva",
      icono: "clipboard-plus",
      color: "purple",
      titulo: `Nueva tarea: "${tarea_titulo}" (${dificultad}) - Recompensa: ${recompensa} Coins`,
      realizado_por,
      tarea_id,
      metadata: {
        tarea: tarea_titulo,
        recompensa,
        dificultad,
      },
    });
  }

  // ==========================================
  // MÉTODOS ESPECÍFICOS PARA EXÁMENES Y COINS
  // ==========================================

  /**
   * Registrar compra de puntos en examen
   */
  static async logCompraPuntos(data) {
    const {
      estudiante_nombre,
      examen_nombre,
      puntos,
      costo,
      usuario_afectado_id,
      examen_id,
    } = data;

    await this.log({
      tipo: "compra_puntos",
      icono: "coins",
      color: "yellow",
      titulo: `${estudiante_nombre} compró ${puntos} punto${
        puntos > 1 ? "s" : ""
      } para ${examen_nombre} (-${costo} Coins)`,
      usuario_afectado_id,
      examen_id,
      metadata: {
        examen: examen_nombre,
        puntos,
        costo,
      },
    });
  }

  /**
   * Registrar ajuste manual de coins
   */
  static async logAjusteCoins(data) {
    const {
      estudiante_nombre,
      cantidad,
      motivo,
      realizado_por,
      usuario_afectado_id,
    } = data;

    await this.log({
      tipo: "ajuste_coins",
      icono: cantidad > 0 ? "trending-up" : "trending-down",
      color: cantidad > 0 ? "green" : "red",
      titulo: `${estudiante_nombre} recibió ajuste de ${
        cantidad > 0 ? "+" : ""
      }${cantidad} Coins${motivo ? ": " + motivo : ""}`,
      realizado_por,
      usuario_afectado_id,
      metadata: {
        cantidad,
        motivo: motivo || "Ajuste manual",
      },
    });
  }

  /**
   * Registrar nuevo examen
   */
  static async logNuevoExamen(data) {
    const { examen_nombre, fecha, realizado_por, examen_id } = data;

    const fechaFormateada = new Date(fecha).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
    });

    await this.log({
      tipo: "examen_nuevo",
      icono: "file-text",
      color: "indigo",
      titulo: `Nuevo examen programado: "${examen_nombre}" (${fechaFormateada})`,
      realizado_por,
      examen_id,
      metadata: {
        examen: examen_nombre,
        fecha: fechaFormateada,
      },
    });
  }

  // ==========================================
  // MÉTODOS ESPECÍFICOS PARA MATERIAS
  // ==========================================

  /**
   * Registrar nueva materia/módulo creado
   */
  static async logNuevaMateria(data) {
    const { materia_nombre, tipo, grado, realizado_por, materia_id } = data;

    await this.log({
      tipo: "materia_nueva",
      icono: "book",
      color: "indigo",
      titulo: `Nueva ${
        tipo === "academica" ? "materia" : "módulo formativo"
      } creada: "${materia_nombre}" (Grado ${grado})`,
      realizado_por,
      materia_id,
      metadata: {
        materia: materia_nombre,
        tipo,
        grado,
      },
    });
  }

  /**
   * Registrar módulo completado por estudiante
   */
  static async logModuloCompletado(data) {
    const {
      estudiante_nombre,
      modulo_nombre,
      calificacion_final,
      usuario_afectado_id,
      materia_id,
    } = data;

    await this.log({
      tipo: "modulo_completado",
      icono: "graduation-cap",
      color: "green",
      titulo: `¡${estudiante_nombre} completó el módulo "${modulo_nombre}" con ${calificacion_final.toFixed(
        1
      )}!`,
      usuario_afectado_id,
      materia_id,
      metadata: {
        modulo: modulo_nombre,
        calificacion_final,
      },
    });
  }

  // ==========================================
  // MÉTODOS ESPECÍFICOS PARA PERIODOS
  // ==========================================

  /**
   * Registrar nuevo periodo escolar
   */
  static async logNuevoPeriodo(data) {
    const { periodo_nombre, year, realizado_por } = data;

    await this.log({
      tipo: "periodo_nuevo",
      icono: "calendar",
      color: "blue",
      titulo: `Nuevo periodo escolar creado: ${periodo_nombre} (${year})`,
      realizado_por,
      metadata: {
        periodo: periodo_nombre,
        year,
      },
    });
  }

  /**
   * Registrar activación de periodo
   */
  static async logPeriodoActivado(data) {
    const { periodo_nombre, realizado_por } = data;

    await this.log({
      tipo: "periodo_activado",
      icono: "check-circle",
      color: "green",
      titulo: `Periodo escolar activado: ${periodo_nombre}`,
      realizado_por,
      metadata: {
        periodo: periodo_nombre,
      },
    });
  }
}

module.exports = ActivityLogger;
