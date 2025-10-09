// ==============================
// STUDENT CONTROLLER - Funciones de Estudiante
// ==============================

const { query, transaction } = require("../config/database");

// ==============================
// DASHBOARD Y PERFIL
// ==============================

// Obtener información del dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener información del estudiante
    const user = await query(
      "SELECT nombre, email, balance, tareas_completadas FROM users WHERE id = ?",
      [userId]
    );

    // Obtener tareas pendientes
    const tareasPendientes = await query(
      `
            SELECT COUNT(*) as count 
            FROM student_tasks 
            WHERE user_id = ? AND completado = FALSE
        `,
      [userId]
    );

    // Obtener posición en ranking de monedas
    const rankingMonedas = await query(
      `
            SELECT COUNT(*) + 1 as posicion 
            FROM users 
            WHERE rol = 'student' AND balance > (SELECT balance FROM users WHERE id = ?)
        `,
      [userId]
    );

    // Obtener posición en ranking de tareas
    const rankingTareas = await query(
      `
            SELECT COUNT(*) + 1 as posicion 
            FROM users 
            WHERE rol = 'student' AND tareas_completadas > (SELECT tareas_completadas FROM users WHERE id = ?)
        `,
      [userId]
    );

    res.json({
      success: true,
      dashboard: {
        usuario: {
          ...user[0],
          balance: parseFloat(user[0].balance),
        },
        estadisticas: {
          tareas_pendientes: tareasPendientes[0].count,
          posicion_ranking_monedas: rankingMonedas[0].posicion,
          posicion_ranking_tareas: rankingTareas[0].posicion,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener dashboard:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener dashboard" });
  }
};

// ==============================
// GESTIÓN DE TAREAS
// ==============================

// Obtener tareas asignadas al estudiante
exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { estado } = req.query; // 'pendientes' o 'completadas'

    let whereClause = "WHERE st.user_id = ?";
    if (estado === "pendientes") {
      whereClause += " AND st.completado = FALSE";
    } else if (estado === "completadas") {
      whereClause += " AND st.completado = TRUE";
    }

    const tasks = await query(
      `
            SELECT 
                t.id, t.titulo, t.descripcion, t.recompensa, 
                t.fecha_limite, t.dificultad, t.estado,
                st.completado, st.fecha_asignada, st.fecha_completada,
                st.calificacion, st.comentarios
            FROM tasks t
            INNER JOIN student_tasks st ON t.id = st.task_id
            ${whereClause}
            ORDER BY st.completado ASC, t.fecha_limite ASC
        `,
      [userId]
    );

    res.json({
      success: true,
      count: tasks.length,
      tasks: tasks.map((t) => ({
        ...t,
        recompensa: parseFloat(t.recompensa),
        calificacion: t.calificacion ? parseFloat(t.calificacion) : null,
      })),
    });
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener tareas" });
  }
};

// Obtener tareas disponibles (no asignadas)
exports.getAvailableTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await query(
      `
            SELECT 
                t.id, t.titulo, t.descripcion, t.recompensa, 
                t.fecha_limite, t.dificultad
            FROM tasks t
            WHERE t.estado = 'activa' 
            AND t.id NOT IN (
                SELECT task_id FROM student_tasks WHERE user_id = ?
            )
            ORDER BY t.fecha_creacion DESC
        `,
      [userId]
    );

    res.json({
      success: true,
      count: tasks.length,
      tasks: tasks.map((t) => ({
        ...t,
        recompensa: parseFloat(t.recompensa),
      })),
    });
  } catch (error) {
    console.error("Error al obtener tareas disponibles:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener tareas" });
  }
};

// Marcar tarea como completada
exports.completeTask = async (req, res) => {
  try {
    const { task_id } = req.body;
    const userId = req.user.id;

    if (!task_id) {
      return res.status(400).json({
        success: false,
        message: "task_id es obligatorio",
      });
    }

    // Verificar que la tarea está asignada al estudiante
    const assignment = await query(
      `
            SELECT id, completado FROM student_tasks 
            WHERE user_id = ? AND task_id = ?
        `,
      [userId, task_id]
    );

    if (assignment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Esta tarea no está asignada a ti",
      });
    }

    if (assignment[0].completado) {
      return res.status(400).json({
        success: false,
        message: "Ya completaste esta tarea anteriormente",
      });
    }

    // Marcar como completada (el trigger se encarga del resto)
    await query(
      `
            UPDATE student_tasks 
            SET completado = TRUE, fecha_completada = NOW() 
            WHERE user_id = ? AND task_id = ?
        `,
      [userId, task_id]
    );

    // Obtener el nuevo balance
    const user = await query("SELECT balance FROM users WHERE id = ?", [
      userId,
    ]);

    res.json({
      success: true,
      message: "¡Tarea completada exitosamente! Monedas recibidas.",
      newBalance: parseFloat(user[0].balance),
    });
  } catch (error) {
    console.error("Error al completar tarea:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al completar tarea" });
  }
};

// ==============================
// RANKINGS
// ==============================

// Obtener ranking de monedas
exports.getRankingMonedas = async (req, res) => {
  try {
    // Validar y sanitizar el límite
    let limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit < 1) {
      limit = 10;
    }
    if (limit > 100) {
      limit = 100; // Máximo 100 resultados
    }

    // Usar query directa sin parámetros preparados para LIMIT
    const ranking = await query(
      `SELECT * FROM v_ranking_monedas LIMIT ${limit}`
    );

    res.json({
      success: true,
      count: ranking.length,
      ranking: ranking.map((r) => ({
        ...r,
        balance: parseFloat(r.balance),
      })),
    });
  } catch (error) {
    console.error("Error al obtener ranking:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener ranking" });
  }
};

// Obtener ranking de tareas
exports.getRankingTareas = async (req, res) => {
  try {
    // Validar y sanitizar el límite
    let limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit < 1) {
      limit = 10;
    }
    if (limit > 100) {
      limit = 100; // Máximo 100 resultados
    }

    // Usar query directa sin parámetros preparados para LIMIT
    const ranking = await query(
      `SELECT * FROM v_ranking_tareas LIMIT ${limit}`
    );

    res.json({
      success: true,
      count: ranking.length,
      ranking: ranking.map((r) => ({
        ...r,
        balance: parseFloat(r.balance),
      })),
    });
  } catch (error) {
    console.error("Error al obtener ranking:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener ranking" });
  }
};

// ==============================
// EXÁMENES
// ==============================

// Obtener exámenes disponibles
exports.getExams = async (req, res) => {
  try {
    const userId = req.user.id;

    const exams = await query(
      `
            SELECT 
                e.id, e.nombre, e.fecha, e.nota_minima, 
                e.nota_maxima, e.precio_por_punto,
                er.nota_obtenida, er.puntos_comprados, er.nota_final
            FROM exams e
            LEFT JOIN exam_results er ON e.id = er.exam_id AND er.user_id = ?
            WHERE e.activo = TRUE
            ORDER BY e.fecha DESC
        `,
      [userId]
    );

    res.json({
      success: true,
      exams: exams.map((e) => ({
        ...e,
        nota_minima: parseFloat(e.nota_minima),
        nota_maxima: parseFloat(e.nota_maxima),
        precio_por_punto: parseFloat(e.precio_por_punto),
        nota_obtenida: e.nota_obtenida ? parseFloat(e.nota_obtenida) : null,
        nota_final: e.nota_final ? parseFloat(e.nota_final) : null,
      })),
    });
  } catch (error) {
    console.error("Error al obtener exámenes:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener exámenes" });
  }
};

// Comprar puntos para examen
exports.buyExamPoints = async (req, res) => {
  try {
    const { exam_id, puntos_a_comprar } = req.body;
    const userId = req.user.id;

    if (!exam_id || !puntos_a_comprar || puntos_a_comprar <= 0) {
      return res.status(400).json({
        success: false,
        message: "exam_id y puntos_a_comprar (mayor a 0) son obligatorios",
      });
    }

    // Usar transacción para garantizar consistencia
    const result = await transaction(async (connection) => {
      // Obtener información del examen
      const [exams] = await connection.execute(
        "SELECT precio_por_punto, nota_minima, nota_maxima FROM exams WHERE id = ?",
        [exam_id]
      );

      if (exams.length === 0) {
        throw new Error("Examen no encontrado");
      }

      const exam = exams[0];
      const costoTotal = parseFloat(exam.precio_por_punto) * puntos_a_comprar;

      // Obtener resultado actual del examen
      const [results] = await connection.execute(
        "SELECT nota_obtenida, puntos_comprados FROM exam_results WHERE user_id = ? AND exam_id = ?",
        [userId, exam_id]
      );

      if (results.length === 0) {
        throw new Error("No tienes calificación registrada para este examen");
      }

      const result = results[0];
      const notaActual = parseFloat(result.nota_obtenida);
      const puntosYaComprados = result.puntos_comprados;

      // Calcular nueva nota final
      const nuevaNotaFinal = Math.min(
        notaActual + puntosYaComprados + puntos_a_comprar,
        parseFloat(exam.nota_maxima)
      );

      // Verificar si ya pasó la nota mínima
      if (notaActual + puntosYaComprados >= parseFloat(exam.nota_minima)) {
        throw new Error("Ya alcanzaste la nota mínima");
      }

      // Obtener balance actual
      const [users] = await connection.execute(
        "SELECT balance FROM users WHERE id = ?",
        [userId]
      );

      const balance = parseFloat(users[0].balance);

      if (balance < costoTotal) {
        throw new Error(
          `Saldo insuficiente. Necesitas ${costoTotal} CCED Coins`
        );
      }

      // Actualizar balance del estudiante
      await connection.execute(
        "UPDATE users SET balance = balance - ? WHERE id = ?",
        [costoTotal, userId]
      );

      // Actualizar puntos comprados en exam_results
      await connection.execute(
        "UPDATE exam_results SET puntos_comprados = puntos_comprados + ?, monedas_gastadas = monedas_gastadas + ? WHERE user_id = ? AND exam_id = ?",
        [puntos_a_comprar, costoTotal, userId, exam_id]
      );

      // Registrar transacción
      await connection.execute(
        "INSERT INTO transactions (user_id, tipo, cantidad, exam_id, descripcion) VALUES (?, ?, ?, ?, ?)",
        [
          userId,
          "compra_puntos",
          -costoTotal,
          exam_id,
          `Compra de ${puntos_a_comprar} punto(s) para examen`,
        ]
      );

      return { nuevaNotaFinal, costoTotal, nuevoBalance: balance - costoTotal };
    });

    res.json({
      success: true,
      message: `¡Compraste ${puntos_a_comprar} punto(s) exitosamente!`,
      nota_final: result.nuevaNotaFinal,
      costo: result.costoTotal,
      nuevo_balance: result.nuevoBalance,
    });
  } catch (error) {
    console.error("Error al comprar puntos:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error al comprar puntos",
    });
  }
};

// ==============================
// HISTORIAL DE TRANSACCIONES
// ==============================

// Obtener historial de transacciones del estudiante
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validar y sanitizar el límite
    let limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit < 1) {
      limit = 50;
    }
    if (limit > 500) {
      limit = 500; // Máximo 500 resultados
    }

    // Usar query directa sin parámetros preparados para LIMIT
    const transactions = await query(
      `
            SELECT 
                t.id, t.tipo, t.cantidad, t.descripcion, t.fecha,
                tk.titulo as tarea_titulo,
                e.nombre as examen_nombre
            FROM transactions t
            LEFT JOIN tasks tk ON t.task_id = tk.id
            LEFT JOIN exams e ON t.exam_id = e.id
            WHERE t.user_id = ?
            ORDER BY t.fecha DESC
            LIMIT ${limit}
        `,
      [userId]
    );

    res.json({
      success: true,
      count: transactions.length,
      transactions: transactions.map((t) => ({
        ...t,
        cantidad: parseFloat(t.cantidad),
      })),
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener historial" });
  }
};
