// ==========================================
// GRADES-CONTROLLER.JS - Controlador de Calificaciones
// ==========================================

const { query, transaction } = require("../../config/database");

// ==========================================
// PERIODOS ESCOLARES
// ==========================================

// Obtener todos los periodos
exports.getPeriodos = async (req, res) => {
  try {
    const periodos = await query(`
      SELECT * FROM periodos_escolares
      ORDER BY year DESC, fecha_inicio DESC
    `);

    res.json({
      success: true,
      periodos,
    });
  } catch (error) {
    console.error("Error obteniendo periodos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener periodos escolares",
    });
  }
};

// Obtener periodo activo
exports.getPeriodoActivo = async (req, res) => {
  try {
    const [periodo] = await query(`
      SELECT * FROM periodos_escolares
      WHERE activo = TRUE
      LIMIT 1
    `);

    if (!periodo) {
      return res.status(404).json({
        success: false,
        message: "No hay periodo escolar activo",
      });
    }

    res.json({
      success: true,
      periodo,
    });
  } catch (error) {
    console.error("Error obteniendo periodo activo:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener periodo activo",
    });
  }
};

// Crear periodo escolar
exports.createPeriodo = async (req, res) => {
  try {
    const { nombre, year, fecha_inicio, fecha_fin, activo } = req.body;

    if (!nombre || !year || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos",
      });
    }

    // Si se marca como activo, desactivar otros periodos
    if (activo) {
      await query("UPDATE periodos_escolares SET activo = FALSE");
    }

    const result = await query(
      `INSERT INTO periodos_escolares (nombre, year, fecha_inicio, fecha_fin, activo)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, year, fecha_inicio, fecha_fin, activo || false]
    );

    res.status(201).json({
      success: true,
      message: "Periodo escolar creado exitosamente",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error creando periodo:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear periodo escolar",
    });
  }
};

// ==========================================
// MATERIAS
// ==========================================

// Obtener todas las materias
exports.getMaterias = async (req, res) => {
  try {
    const { tipo } = req.query; // 'academica' o 'formativa'

    let whereClause = "WHERE m.activo = 1";

    // IDs de tipos académicos y formativos
    const ACADEMICAS = [1, 3, 4, 5];
    const FORMATIVAS = [2, 6, 7];

    if (tipo === "academica") {
      whereClause += ` AND m.tipo_id IN (${ACADEMICAS.join(",")})`;
    } else if (tipo === "formativa") {
      whereClause += ` AND m.tipo_id IN (${FORMATIVAS.join(",")})`;
    }

    const materias = await query(`
      SELECT 
        m.id, 
        m.nombre, 
        m.codigo, 
        m.descripcion,
        m.tipo_id,
        m.creditos,
        m.grado,
        tm.nombre as tipo_nombre,
        tm.tipo as tipo_categoria
      FROM materias m
      INNER JOIN tipos_materia tm ON m.tipo_id = tm.id
      ${whereClause}
      ORDER BY m.nombre
    `);

    res.json({
      success: true,
      materias: materias,
    });
  } catch (error) {
    console.error("Error obteniendo materias:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener materias",
      error: error.message,
    });
  }
};

// Crear materia
exports.createMateria = async (req, res) => {
  try {
    const { nombre, codigo, descripcion, tipo_id, creditos, grado } = req.body;

    if (!nombre || !tipo_id || !grado) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos",
      });
    }

    const result = await query(
      `INSERT INTO materias (nombre, codigo, descripcion, tipo_id, creditos, grado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        codigo || null,
        descripcion || null,
        tipo_id,
        creditos || 1,
        grado,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Materia creada exitosamente",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error creando materia:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear materia",
    });
  }
};

// ==========================================
// RESULTADOS DE APRENDIZAJE
// ==========================================

// Obtener RA de una materia
exports.getResultadosAprendizaje = async (req, res) => {
  try {
    const { materiaId } = req.params;

    const resultados = await query(
      `SELECT 
        id, 
        materia_id,
        nombre, 
        descripcion,
        porcentaje,
        orden
      FROM resultados_aprendizaje 
      WHERE materia_id = ? 
      ORDER BY orden, id`,
      [materiaId]
    );

    // Verificar que la suma de porcentajes sea 100
    const sumaPortcentajes = resultados.reduce(
      (sum, r) => sum + parseFloat(r.porcentaje),
      0
    );

    res.json({
      success: true,
      resultados: resultados,
      suma_porcentajes: sumaPortcentajes.toFixed(2),
      valido: Math.abs(sumaPortcentajes - 100) < 0.01,
    });
  } catch (error) {
    console.error("Error obteniendo resultados de aprendizaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener resultados de aprendizaje",
      error: error.message,
    });
  }
};

// Crear múltiples RA para una materia
exports.createResultadosAprendizaje = async (req, res) => {
  try {
    const { materiaId } = req.params;
    const { resultados } = req.body; // Array de { nombre, descripcion, porcentaje, orden }

    if (!Array.isArray(resultados) || resultados.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar un array de resultados de aprendizaje",
      });
    }

    // Validar que la suma de porcentajes sea 100
    const sumaPortentajes = resultados.reduce(
      (sum, ra) => sum + parseFloat(ra.porcentaje),
      0
    );

    if (Math.abs(sumaPortentajes - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `La suma de porcentajes debe ser 100. Actual: ${sumaPortentajes}`,
      });
    }

    await transaction(async (connection) => {
      // Eliminar RA existentes
      await connection.execute(
        "DELETE FROM resultados_aprendizaje WHERE materia_id = ?",
        [materiaId]
      );

      // Insertar nuevos RA
      for (const ra of resultados) {
        await connection.execute(
          `INSERT INTO resultados_aprendizaje (materia_id, nombre, descripcion, porcentaje, orden)
           VALUES (?, ?, ?, ?, ?)`,
          [
            materiaId,
            ra.nombre,
            ra.descripcion || null,
            ra.porcentaje,
            ra.orden,
          ]
        );
      }
    });

    res.status(201).json({
      success: true,
      message: "Resultados de aprendizaje creados exitosamente",
    });
  } catch (error) {
    console.error("Error creando resultados de aprendizaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear resultados de aprendizaje",
    });
  }
};

// ==========================================
// INSCRIPCIONES
// ==========================================

// Inscribir estudiante a materia
exports.inscribirEstudiante = async (req, res) => {
  try {
    const { estudiante_id, materia_id, periodo_id } = req.body;

    if (!estudiante_id || !materia_id || !periodo_id) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos",
      });
    }

    const result = await query(
      `INSERT INTO inscripciones (estudiante_id, materia_id, periodo_id)
       VALUES (?, ?, ?)`,
      [estudiante_id, materia_id, periodo_id]
    );

    res.status(201).json({
      success: true,
      message: "Estudiante inscrito exitosamente",
      id: result.insertId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "El estudiante ya está inscrito en esta materia",
      });
    }

    console.error("Error inscribiendo estudiante:", error);
    res.status(500).json({
      success: false,
      message: "Error al inscribir estudiante",
    });
  }
};

// Obtener inscripciones de un estudiante
exports.getInscripcionesEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.params;
    const { periodoId } = req.query;

    let sql = `
      SELECT 
        i.*,
        m.nombre as materia_nombre,
        m.codigo as materia_codigo,
        tm.tipo as tipo_materia,
        p.nombre as periodo_nombre
      FROM inscripciones i
      INNER JOIN materias m ON i.materia_id = m.id
      INNER JOIN tipos_materia tm ON m.tipo_id = tm.id
      INNER JOIN periodos_escolares p ON i.periodo_id = p.id
      WHERE i.estudiante_id = ?
    `;

    const params = [estudianteId];

    if (periodoId) {
      sql += " AND i.periodo_id = ?";
      params.push(periodoId);
    }

    sql += " ORDER BY m.nombre";

    const inscripciones = await query(sql, params);

    res.json({
      success: true,
      inscripciones,
    });
  } catch (error) {
    console.error("Error obteniendo inscripciones:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener inscripciones",
    });
  }
};

// ==========================================
// CALIFICACIONES ACADÉMICAS
// ==========================================

// Registrar calificación académica
exports.registrarCalificacionAcademica = async (req, res) => {
  try {
    const { inscripcion_id, periodo_evaluacion, calificacion } = req.body;

    if (!inscripcion_id || !periodo_evaluacion || calificacion === undefined) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos",
      });
    }

    if (calificacion < 0 || calificacion > 100) {
      return res.status(400).json({
        success: false,
        message: "La calificación debe estar entre 0 y 100",
      });
    }

    // Verificar si ya existe una calificación
    const [existente] = await query(
      `SELECT id FROM calificaciones_academicas
       WHERE inscripcion_id = ? AND periodo_evaluacion = ?`,
      [inscripcion_id, periodo_evaluacion]
    );

    if (existente) {
      // Actualizar
      await query(
        `UPDATE calificaciones_academicas
         SET calificacion = ?, registrado_por = ?
         WHERE id = ?`,
        [calificacion, req.user.id, existente.id]
      );
    } else {
      // Insertar
      await query(
        `INSERT INTO calificaciones_academicas (inscripcion_id, periodo_evaluacion, calificacion, registrado_por)
         VALUES (?, ?, ?, ?)`,
        [inscripcion_id, periodo_evaluacion, calificacion, req.user.id]
      );
    }

    res.json({
      success: true,
      message: "Calificación registrada exitosamente",
    });
  } catch (error) {
    console.error("Error registrando calificación:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar calificación",
    });
  }
};

// Obtener calificaciones académicas de una inscripción
exports.getCalificacionesAcademicas = async (req, res) => {
  try {
    const { inscripcionId } = req.params;

    const calificaciones = await query(
      `SELECT * FROM calificaciones_academicas
       WHERE inscripcion_id = ?
       ORDER BY periodo_evaluacion`,
      [inscripcionId]
    );

    // Calcular promedio
    const promedio =
      calificaciones.length > 0
        ? calificaciones.reduce(
            (sum, c) => sum + parseFloat(c.calificacion),
            0
          ) / calificaciones.length
        : 0;

    res.json({
      success: true,
      calificaciones,
      promedio: promedio.toFixed(2),
    });
  } catch (error) {
    console.error("Error obteniendo calificaciones:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener calificaciones",
    });
  }
};

// ==========================================
// CALIFICACIONES MÓDULOS FORMATIVOS
// ==========================================

// Registrar calificación de RA
exports.registrarCalificacionModulo = async (req, res) => {
  try {
    const {
      inscripcion_id,
      resultado_aprendizaje_id,
      oportunidad,
      calificacion,
    } = req.body;

    console.log("📊 Datos recibidos:", {
      inscripcion_id,
      resultado_aprendizaje_id,
      oportunidad,
      calificacion,
      tipoCalificacion: typeof calificacion,
    });

    // Validaciones
    if (
      !inscripcion_id ||
      !resultado_aprendizaje_id ||
      !oportunidad ||
      calificacion === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos",
      });
    }

    if (oportunidad < 1 || oportunidad > 4) {
      return res.status(400).json({
        success: false,
        message: "La oportunidad debe estar entre 1 y 4",
      });
    }

    // Obtener información del RA
    const [ra] = await query(
      `SELECT id, nombre, porcentaje FROM resultados_aprendizaje WHERE id = ?`,
      [resultado_aprendizaje_id]
    );

    console.log("📋 RA encontrado:", ra);

    if (!ra) {
      return res.status(404).json({
        success: false,
        message: "Resultado de Aprendizaje no encontrado",
      });
    }

    // ✅ Asegurar que todos los valores sean números válidos
    const calificacionSobre100 = parseFloat(calificacion);
    const porcentajeRA = parseFloat(ra.porcentaje);

    if (isNaN(calificacionSobre100) || isNaN(porcentajeRA)) {
      return res.status(400).json({
        success: false,
        message: "Calificación o porcentaje inválido",
      });
    }

    const calificacionConvertida = (calificacionSobre100 / 100) * porcentajeRA;
    const minimoRA = (70 / 100) * porcentajeRA;
    const completado = calificacionConvertida >= minimoRA ? 1 : 0;

    // ✅ Asegurar que registrado_por sea null si no existe
    const registradoPor =
      req.user && typeof req.user.id === "number" ? req.user.id : null;

    console.log("💾 Valores a guardar:", {
      calificacionSobre100,
      calificacionConvertida,
      porcentajeRA,
      minimoRA,
      completado,
      registradoPor,
    });

    await transaction(async (connection) => {
      // Verificar si ya existe
      const [rows] = await connection.execute(
        `SELECT id FROM calificaciones_modulos 
         WHERE inscripcion_id = ? 
         AND resultado_aprendizaje_id = ? 
         AND oportunidad = ?`,
        [inscripcion_id, resultado_aprendizaje_id, oportunidad]
      );

      const existing = rows && rows.length > 0 ? rows[0] : null;

      console.log("🔍 Registro existente:", existing);

      if (existing) {
        // ✅ Actualizar - TODOS los valores deben estar definidos
        const updateParams = [
          calificacionConvertida,
          calificacionSobre100,
          completado,
          registradoPor,
          existing.id,
        ];

        console.log("🔄 UPDATE con parámetros:", updateParams);

        // Verificar que ningún parámetro sea undefined
        const hasUndefined = updateParams.some((p) => p === undefined);
        if (hasUndefined) {
          console.error("❌ Parámetro undefined detectado:", updateParams);
          throw new Error("Parámetro undefined en UPDATE");
        }

        await connection.execute(
          `UPDATE calificaciones_modulos 
           SET calificacion = ?,
               calificacion_sobre_100 = ?,
               completado = ?,
               registrado_por = ?,
               fecha_registro = NOW()
           WHERE id = ?`,
          updateParams
        );
      } else {
        // ✅ Insertar - TODOS los valores deben estar definidos
        const insertParams = [
          inscripcion_id,
          resultado_aprendizaje_id,
          oportunidad,
          calificacionConvertida,
          calificacionSobre100,
          completado,
          registradoPor,
        ];

        console.log("➕ INSERT con parámetros:", insertParams);

        // Verificar que ningún parámetro sea undefined
        const hasUndefined = insertParams.some((p) => p === undefined);
        if (hasUndefined) {
          console.error("❌ Parámetro undefined detectado:", insertParams);
          throw new Error("Parámetro undefined en INSERT");
        }

        await connection.execute(
          `INSERT INTO calificaciones_modulos 
           (inscripcion_id, resultado_aprendizaje_id, oportunidad, calificacion, calificacion_sobre_100, completado, registrado_por, fecha_registro) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          insertParams
        );
      }
    });

    console.log("✅ Calificación guardada exitosamente");

    res.json({
      success: true,
      message: "Calificación registrada exitosamente",
      calificacion_ingresada: calificacionSobre100.toFixed(2),
      calificacion_convertida: calificacionConvertida.toFixed(2),
      porcentaje_ra: porcentajeRA,
      completado: completado === 1,
      minimo_requerido: minimoRA.toFixed(2),
    });
  } catch (error) {
    console.error("❌ Error registrando calificación de módulo:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar calificación de módulo",
      error: error.message,
    });
  }
};

// Obtener calificaciones de módulo formativo
exports.getCalificacionesModulo = async (req, res) => {
  try {
    const { inscripcionId } = req.params;

    // Obtener materia de la inscripción
    const [inscripcion] = await query(
      `SELECT materia_id FROM inscripciones WHERE id = ?`,
      [inscripcionId]
    );

    if (!inscripcion) {
      return res.status(404).json({
        success: false,
        message: "Inscripción no encontrada",
      });
    }

    // Obtener resultados de aprendizaje
    const resultados = await query(
      `SELECT id, nombre, porcentaje 
       FROM resultados_aprendizaje 
       WHERE materia_id = ? 
       ORDER BY orden, id`,
      [inscripcion.materia_id]
    );

    // Obtener calificaciones
    const calificaciones = await query(
      `SELECT 
        resultado_aprendizaje_id,
        oportunidad,
        calificacion,
        calificacion_sobre_100,
        completado,
        fecha_registro
       FROM calificaciones_modulos 
       WHERE inscripcion_id = ?
       ORDER BY resultado_aprendizaje_id, oportunidad`,
      [inscripcionId]
    );

    // Organizar datos por RA
    const resultadosConCalif = resultados.map((ra) => {
      const califsRA = calificaciones.filter(
        (c) => c.resultado_aprendizaje_id === ra.id
      );

      const oportunidades = {};
      califsRA.forEach((c) => {
        // Si existe calificacion_sobre_100, usarla; si no, calcularla
        const califSobre100 =
          c.calificacion_sobre_100 !== null
            ? parseFloat(c.calificacion_sobre_100)
            : (parseFloat(c.calificacion) / ra.porcentaje) * 100;

        oportunidades[c.oportunidad - 1] = {
          oportunidad: c.oportunidad,
          calificacion: parseFloat(c.calificacion), // Convertida (para cálculo)
          calificacion_sobre_100: parseFloat(califSobre100.toFixed(2)), // Original (para mostrar)
          completado: c.completado === 1,
          fecha: c.fecha_registro,
        };
      });

      // Buscar si alguna oportunidad completó el RA
      const completada = califsRA.find((c) => c.completado === 1);

      return {
        id: ra.id,
        nombre: ra.nombre,
        porcentaje: ra.porcentaje,
        oportunidades: oportunidades,
        completado: !!completada,
        calificacion_final: completada
          ? parseFloat(completada.calificacion)
          : 0,
      };
    });

    // Calcular calificación final del módulo
    let calificacionFinal = 0;
    let todosCompletados = true;

    resultadosConCalif.forEach((ra) => {
      if (ra.completado) {
        calificacionFinal += ra.calificacion_final;
      } else {
        todosCompletados = false;
      }
    });

    const aprobado = todosCompletados && calificacionFinal >= 70;

    res.json({
      success: true,
      resultados: resultadosConCalif,
      calificacion_final: calificacionFinal.toFixed(2),
      todos_completados: todosCompletados,
      aprobado: aprobado,
    });
  } catch (error) {
    console.error("Error obteniendo calificaciones de módulo:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener calificaciones de módulo",
      error: error.message,
    });
  }
};

exports.updateResultadoAprendizaje = async (req, res) => {
  try {
    const { materiaId, raId } = req.params;
    const { porcentaje, nombre, descripcion } = req.body;

    // Validar que el RA pertenece a la materia
    const [ra] = await query(
      `SELECT id FROM resultados_aprendizaje WHERE id = ? AND materia_id = ?`,
      [raId, materiaId]
    );

    if (!ra) {
      return res.status(404).json({
        success: false,
        message: "Resultado de Aprendizaje no encontrado",
      });
    }

    // Construir query dinámico
    const updates = [];
    const values = [];

    if (porcentaje !== undefined) {
      updates.push("porcentaje = ?");
      values.push(parseFloat(porcentaje));
    }

    if (nombre !== undefined) {
      updates.push("nombre = ?");
      values.push(nombre);
    }

    if (descripcion !== undefined) {
      updates.push("descripcion = ?");
      values.push(descripcion);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No hay datos para actualizar",
      });
    }

    values.push(raId);

    await query(
      `UPDATE resultados_aprendizaje SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: "Resultado de Aprendizaje actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error actualizando Resultado de Aprendizaje:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar Resultado de Aprendizaje",
      error: error.message,
    });
  }
};
// ==========================================
// REPORTES (VERSIÓN DEFINITIVA CON IDs CORRECTOS)
// ==========================================

// Obtener reporte completo de un estudiante
exports.getReporteEstudiante = async (req, res) => {
  try {
    const { estudianteId, periodoId } = req.params;

    // Verificar permisos
    if (req.user.rol !== "admin" && req.user.id !== parseInt(estudianteId)) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para ver este reporte",
      });
    }

    // Obtener información del estudiante
    const [estudiante] = await query(
      `
      SELECT id, nombre, email
      FROM users
      WHERE id = ? AND rol = 'student'
    `,
      [estudianteId]
    );

    if (!estudiante) {
      return res.status(404).json({
        success: false,
        message: "Estudiante no encontrado",
      });
    }

    // Obtener todas las inscripciones del estudiante
    const inscripciones = await query(
      `
      SELECT 
        i.id,
        m.id as materia_id,
        m.nombre as materia_nombre,
        m.codigo as materia_codigo,
        m.tipo_id,
        tm.tipo as tipo_categoria
      FROM inscripciones i
      INNER JOIN materias m ON i.materia_id = m.id
      INNER JOIN tipos_materia tm ON m.tipo_id = tm.id
      WHERE i.estudiante_id = ? AND i.periodo_id = ?
    `,
      [estudianteId, periodoId]
    );

    if (!inscripciones || inscripciones.length === 0) {
      return res.json({
        success: true,
        estudiante,
        reporte: [],
        estadisticas: {
          total_materias: 0,
          materias_aprobadas: 0,
          materias_reprobadas: 0,
          promedio_general: "0.00",
        },
      });
    }

    const reporte = [];
    let sumaPromedios = 0;
    let materiasAprobadas = 0;
    let materiasReprobadas = 0;

    // IDs de tipos académicos y formativos
    const ACADEMICAS = [1, 3, 4, 5];
    const FORMATIVAS = [2, 6, 7];

    for (const inscripcion of inscripciones) {
      if (ACADEMICAS.includes(inscripcion.tipo_id)) {
        // ===== MATERIA ACADÉMICA =====
        const calificaciones = await query(
          `
          SELECT 
            periodo_evaluacion,
            calificacion
          FROM calificaciones_academicas
          WHERE inscripcion_id = ?
          ORDER BY periodo_evaluacion
        `,
          [inscripcion.id]
        );

        let promedio = 0;
        if (calificaciones.length > 0) {
          const suma = calificaciones.reduce(
            (acc, c) => acc + parseFloat(c.calificacion),
            0
          );
          promedio = (suma / calificaciones.length).toFixed(2);
        }

        const aprobado = parseFloat(promedio) >= 70;

        reporte.push({
          materia_id: inscripcion.materia_id,
          materia_nombre: inscripcion.materia_nombre,
          materia_codigo: inscripcion.materia_codigo,
          tipo: "academica",
          tipo_categoria: inscripcion.tipo_categoria,
          calificaciones: calificaciones,
          promedio: promedio,
          aprobado: aprobado,
        });

        sumaPromedios += parseFloat(promedio);
        if (aprobado) materiasAprobadas++;
        else materiasReprobadas++;
      } else if (FORMATIVAS.includes(inscripcion.tipo_id)) {
        // ===== MÓDULO FORMATIVO =====
        const resultados = await query(
          `
          SELECT 
            ra.id,
            ra.nombre,
            ra.porcentaje,
            cm.oportunidad,
            cm.calificacion,
            cm.calificacion_sobre_100,
            cm.completado
          FROM resultados_aprendizaje ra
          LEFT JOIN calificaciones_modulos cm ON ra.id = cm.resultado_aprendizaje_id 
            AND cm.inscripcion_id = ?
          WHERE ra.materia_id = ?
          ORDER BY ra.orden, ra.id, cm.oportunidad
      `,
          [inscripcion.id, inscripcion.materia_id]
        );

        const rasUnicos = {};

        resultados.forEach((r) => {
          if (!rasUnicos[r.id]) {
            rasUnicos[r.id] = {
              id: r.id,
              nombre: r.nombre,
              porcentaje: r.porcentaje,
              calificaciones: [],
              completado: false,
              calificacion_final: 0,
            };
          }

          if (r.calificacion !== null) {
            rasUnicos[r.id].calificaciones.push({
              oportunidad: r.oportunidad,
              calificacion: parseFloat(r.calificacion),
              completado: r.completado === 1,
            });

            if (r.completado === 1) {
              rasUnicos[r.id].completado = true;
              rasUnicos[r.id].calificacion_final = parseFloat(r.calificacion);
            }
          }
        });

        let calificacionModulo = 0;
        let todosCompletados = true;

        Object.values(rasUnicos).forEach((ra) => {
          if (ra.completado) {
            calificacionModulo += (ra.calificacion_final * ra.porcentaje) / 100;
          } else {
            todosCompletados = false;
          }
        });

        const aprobado = todosCompletados && calificacionModulo >= 70;

        reporte.push({
          materia_id: inscripcion.materia_id,
          materia_nombre: inscripcion.materia_nombre,
          materia_codigo: inscripcion.materia_codigo,
          tipo: "formativa",
          tipo_categoria: inscripcion.tipo_categoria,
          resultados_aprendizaje: Object.values(rasUnicos),
          calificacion_final: calificacionModulo.toFixed(2),
          todos_completados: todosCompletados,
          promedio: calificacionModulo.toFixed(2),
          aprobado: aprobado,
        });

        sumaPromedios += calificacionModulo;
        if (aprobado) materiasAprobadas++;
        else materiasReprobadas++;
      }
    }

    const promedioGeneral =
      reporte.length > 0 ? (sumaPromedios / reporte.length).toFixed(2) : "0.00";

    res.json({
      success: true,
      estudiante,
      reporte,
      estadisticas: {
        total_materias: inscripciones.length,
        materias_aprobadas: materiasAprobadas,
        materias_reprobadas: materiasReprobadas,
        promedio_general: promedioGeneral,
      },
    });
  } catch (error) {
    console.error("Error obteniendo reporte del estudiante:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar el reporte del estudiante",
      error: error.message,
    });
  }
};

// Obtener listado de estudiantes con sus promedios
exports.getListadoEstudiantes = async (req, res) => {
  try {
    const { periodoId } = req.query;

    if (!periodoId) {
      return res.status(400).json({
        success: false,
        message: "El periodoId es requerido",
      });
    }

    const estudiantes = await query(
      `
      SELECT DISTINCT
        u.id,
        u.nombre,
        u.email
      FROM users u
      INNER JOIN inscripciones i ON u.id = i.estudiante_id
      WHERE i.periodo_id = ? AND u.rol = 'student'
      ORDER BY u.nombre
    `,
      [periodoId]
    );

    const estudiantesConPromedio = [];

    // IDs de tipos académicos y formativos
    const ACADEMICAS = [1, 3, 4, 5];
    const FORMATIVAS = [2, 6, 7];

    for (const estudiante of estudiantes) {
      const inscripciones = await query(
        `
        SELECT 
          i.id,
          m.tipo_id
        FROM inscripciones i
        INNER JOIN materias m ON i.materia_id = m.id
        WHERE i.estudiante_id = ? AND i.periodo_id = ?
      `,
        [estudiante.id, periodoId]
      );

      let sumaPromedios = 0;
      let materiasAprobadas = 0;
      let materiasConCalif = 0;

      for (const inscripcion of inscripciones) {
        if (ACADEMICAS.includes(inscripcion.tipo_id)) {
          // Materia académica
          const [resultado] = await query(
            `
            SELECT AVG(calificacion) as promedio
            FROM calificaciones_academicas
            WHERE inscripcion_id = ?
          `,
            [inscripcion.id]
          );

          if (resultado?.promedio !== null) {
            const promedio = parseFloat(resultado.promedio);
            sumaPromedios += promedio;
            materiasConCalif++;
            if (promedio >= 70) materiasAprobadas++;
          }
        } else if (FORMATIVAS.includes(inscripcion.tipo_id)) {
          // Módulo formativo
          const resultados = await query(
            `
            SELECT 
              ra.porcentaje,
              cm.calificacion,
              cm.completado
            FROM resultados_aprendizaje ra
            LEFT JOIN calificaciones_modulos cm ON ra.id = cm.resultado_aprendizaje_id 
              AND cm.inscripcion_id = ? AND cm.completado = 1
            WHERE ra.materia_id = (SELECT materia_id FROM inscripciones WHERE id = ?)
          `,
            [inscripcion.id, inscripcion.id]
          );

          if (resultados.length > 0) {
            let calificacionModulo = 0;
            let tieneCalif = false;

            resultados.forEach((r) => {
              if (r.completado === 1) {
                calificacionModulo +=
                  (parseFloat(r.calificacion) * r.porcentaje) / 100;
                tieneCalif = true;
              }
            });

            if (tieneCalif) {
              sumaPromedios += calificacionModulo;
              materiasConCalif++;
              if (calificacionModulo >= 70) materiasAprobadas++;
            }
          }
        }
      }

      const promedioGeneral =
        materiasConCalif > 0
          ? (sumaPromedios / materiasConCalif).toFixed(2)
          : "0.00";

      estudiantesConPromedio.push({
        ...estudiante,
        total_materias: inscripciones.length,
        materias_aprobadas: materiasAprobadas,
        promedio_general: parseFloat(promedioGeneral),
      });
    }

    res.json({
      success: true,
      estudiantes: estudiantesConPromedio,
    });
  } catch (error) {
    console.error("Error obteniendo listado de estudiantes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener listado de estudiantes",
      error: error.message,
    });
  }
};
