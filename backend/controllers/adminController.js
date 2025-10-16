// ==============================
// ADMIN CONTROLLER - Funciones de Administrador
// ==============================

const bcrypt = require("bcryptjs");
const { query, transaction } = require("../config/database");
const crypto = require("crypto");

// ==============================
// GESTIÓN DE ESTUDIANTES
// ==============================

// Obtener todos los estudiantes
exports.getAllStudents = async (req, res) => {
  try {
    const students = await query(`
            SELECT id as id_estudiante, nombre, email, balance, tareas_completadas, 
                   fecha_registro, ultima_actualizacion
            FROM users 
            WHERE rol = 'student'
            ORDER BY tareas_completadas DESC, balance DESC
        `);

    res.json({
      success: true,
      count: students.length,
      students: students.map((s) => ({
        ...s,
        balance: parseFloat(s.balance),
      })),
    });
  } catch (error) {
    console.error("Error al obtener estudiantes:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener estudiantes" });
  }
};

// Obtener un estudiante específico
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const students = await query(
      `
            SELECT id as id_estudiante, nombre, email, balance, tareas_completadas, 
                   fecha_registro, ultima_actualizacion
            FROM users 
            WHERE id = ? AND rol = 'student'
        `,
      [id]
    );

    if (students.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Estudiante no encontrado" });
    }

    res.json({
      success: true,
      student: { ...students[0], balance: parseFloat(students[0].balance) },
    });
  } catch (error) {
    console.error("Error al obtener estudiante:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener estudiante" });
  }
};

// Crear estudiante (sin código de registro)
exports.createStudent = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nombre, email y contraseña son obligatorios",
      });
    }

    // Verificar email duplicado
    const existing = await query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "El email ya existe" });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      "INSERT INTO users (nombre, email, password, rol) VALUES (?, ?, ?, ?)",
      [nombre, email, hashedPassword, "student"]
    );

    res.status(201).json({
      success: true,
      message: "Estudiante creado exitosamente",
      student: {
        id: result.insertId,
        nombre,
        email,
        balance: 0,
        tareas_completadas: 0,
      },
    });
  } catch (error) {
    console.error("Error al crear estudiante:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al crear estudiante" });
  }
};

// Actualizar estudiante
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, balance } = req.body;

    // Verificar que el estudiante existe
    const students = await query(
      'SELECT id FROM users WHERE id = ? AND rol = "student"',
      [id]
    );

    if (students.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Estudiante no encontrado" });
    }

    // Verificar si el email ya existe (excepto el del estudiante actual)
    if (email) {
      const existingEmail = await query(
        'SELECT id FROM users WHERE email = ? AND id != ? AND rol = "student"',
        [email, id]
      );

      if (existingEmail.length > 0) {
        return res.status(400).json({
          success: false,
          message: "El email ya está siendo usado por otro estudiante",
        });
      }
    }

    let updates = [];
    let values = [];

    if (nombre) {
      updates.push("nombre = ?");
      values.push(nombre);
    }

    if (email) {
      updates.push("email = ?");
      values.push(email);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push("password = ?");
      values.push(hashedPassword);
    }

    // ⭐ AGREGAR BALANCE
    if (balance !== undefined && balance !== null) {
      updates.push("balance = ?");
      values.push(parseFloat(balance));
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No hay datos para actualizar" });
    }

    values.push(id);

    await query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    res.json({ success: true, message: "Estudiante actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar estudiante:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al actualizar estudiante" });
  }
};

// Eliminar estudiante
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM users WHERE id = ? AND rol = "student"',
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Estudiante no encontrado" });
    }

    res.json({ success: true, message: "Estudiante eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar estudiante:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al eliminar estudiante" });
  }
};

// ==============================
// GESTIÓN DE CÓDIGOS DE REGISTRO
// ==============================

// Generar código de registro
exports.generateRegistrationCode = async (req, res) => {
  try {
    const { dias_validos } = req.body;

    // Generar código único
    const code = `CCED-${new Date().getFullYear()}-${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    let expiracion = null;
    if (dias_validos && dias_validos > 0) {
      expiracion = new Date();
      expiracion.setDate(expiracion.getDate() + parseInt(dias_validos));
    }

    await query(
      "INSERT INTO registration_codes (code, creado_por, fecha_expiracion) VALUES (?, ?, ?)",
      [code, req.user.id, expiracion]
    );

    res.status(201).json({
      success: true,
      message: "Código generado exitosamente",
      code,
      expiracion,
    });
  } catch (error) {
    console.error("Error al generar código:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al generar código" });
  }
};

// Obtener todos los códigos
exports.getAllCodes = async (req, res) => {
  try {
    const codes = await query(`
      SELECT 
        rc.id, 
        rc.code as codigo,
        rc.usado,
        rc.fecha_creacion,
        rc.fecha_expiracion,
        rc.usado_por,
        rc.creado_por,
        u.nombre as usado_por_nombre,
        admin.nombre as creado_por_nombre
      FROM registration_codes rc
      LEFT JOIN users u ON rc.usado_por = u.id
      LEFT JOIN users admin ON rc.creado_por = admin.id
      ORDER BY rc.fecha_creacion DESC
    `);

    // Mapear para agregar estado
    const codesWithStatus = codes.map((code) => {
      let estado = "activo";

      // Si ya fue usado
      if (code.usado === 1) {
        estado = "usado";
      }
      // Si tiene fecha de expiración y ya expiró
      else if (
        code.fecha_expiracion &&
        new Date(code.fecha_expiracion) < new Date()
      ) {
        estado = "expirado";
      }

      return {
        ...code,
        estado,
        usado: code.usado === 1,
      };
    });

    res.json({
      success: true,
      codes: codesWithStatus,
      total: codesWithStatus.length,
    });
  } catch (error) {
    console.error("Error al obtener códigos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener códigos",
      error: error.message,
    });
  }
};

// ==============================
// GESTIÓN DE TAREAS
// ==============================

// Crear tarea
exports.createTask = async (req, res) => {
  try {
    const { titulo, descripcion, recompensa, fecha_limite, dificultad } =
      req.body;

    if (!titulo || !recompensa) {
      return res.status(400).json({
        success: false,
        message: "Título y recompensa son obligatorios",
      });
    }

    const result = await query(
      `
            INSERT INTO tasks (titulo, descripcion, recompensa, fecha_limite, dificultad, creado_por)
            VALUES (?, ?, ?, ?, ?, ?)
        `,
      [
        titulo,
        descripcion,
        recompensa,
        fecha_limite,
        dificultad || "media",
        req.user.id,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Tarea creada exitosamente",
      task: {
        id: result.insertId,
        titulo,
        descripcion,
        recompensa: parseFloat(recompensa),
        fecha_limite,
        dificultad: dificultad || "media",
      },
    });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    res.status(500).json({ success: false, message: "Error al crear tarea" });
  }
};

// Obtener todas las tareas
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await query(`
      SELECT 
        t.id,
        t.titulo,
        t.descripcion,
        t.recompensa,
        t.dificultad,
        t.estado,
        t.fecha_creacion,
        t.fecha_limite,
        COUNT(DISTINCT st.user_id) as estudiantes_asignados,
        SUM(CASE WHEN st.completado = 1 THEN 1 ELSE 0 END) as completadas,
        SUM(CASE WHEN st.completado = 0 OR st.completado IS NULL THEN 1 ELSE 0 END) as pendientes
      FROM tasks t
      LEFT JOIN student_tasks st ON t.id = st.task_id
      GROUP BY t.id, t.titulo, t.descripcion, t.recompensa, t.dificultad, 
               t.estado, t.fecha_creacion, t.fecha_limite
      ORDER BY t.fecha_creacion DESC
    `);

    res.json({
      success: true,
      tasks: tasks.map((task) => ({
        ...task,
        recompensa: parseFloat(task.recompensa),
        estudiantes_asignados: parseInt(task.estudiantes_asignados) || 0,
        completadas: parseInt(task.completadas) || 0,
        pendientes: parseInt(task.pendientes) || 0,
      })),
      total: tasks.length,
    });
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las tareas",
      error: error.message,
    });
  }
};

// Obtener tarea específica por ID
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener información de la tarea
    const tasks = await query(
      `
      SELECT 
        t.id,
        t.titulo,
        t.descripcion,
        t.recompensa,
        t.dificultad,
        t.estado,
        t.fecha_creacion,
        t.fecha_limite,
        t.creado_por,
        u.nombre as creador_nombre
      FROM tasks t
      LEFT JOIN users u ON t.creado_por = u.id
      WHERE t.id = ?
    `,
      [id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tarea no encontrada",
      });
    }

    // Obtener estudiantes asignados a esta tarea
    const estudiantes = await query(
      `
      SELECT 
        u.id,
        u.nombre,
        u.email,
        st.completado,
        st.fecha_asignada,
        st.fecha_completada,
        st.calificacion,
        st.comentarios
      FROM student_tasks st
      INNER JOIN users u ON st.user_id = u.id
      WHERE st.task_id = ?
      ORDER BY st.fecha_asignada DESC
    `,
      [id]
    );

    // Calcular estadísticas
    const totalAsignados = estudiantes.length;
    const completadas = estudiantes.filter((e) => e.completado === 1).length;
    const pendientes = estudiantes.filter(
      (e) => e.completado === 0 || e.completado === null
    ).length;

    res.json({
      success: true,
      task: {
        ...tasks[0],
        recompensa: parseFloat(tasks[0].recompensa),
        estudiantes_asignados: totalAsignados,
        completadas: completadas,
        pendientes: pendientes,
        estudiantes: estudiantes.map((e) => ({
          ...e,
          completado: e.completado === 1,
          calificacion: e.calificacion ? parseFloat(e.calificacion) : null,
        })),
      },
    });
  } catch (error) {
    console.error("Error al obtener tarea:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la tarea",
      error: error.message,
    });
  }
};

// Actualizar tarea
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      recompensa,
      fecha_limite,
      dificultad,
      estado,
    } = req.body;

    // Verificar que la tarea existe
    const existingTask = await query("SELECT id FROM tasks WHERE id = ?", [id]);

    if (existingTask.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tarea no encontrada",
      });
    }

    let updates = [];
    let values = [];

    if (titulo) {
      updates.push("titulo = ?");
      values.push(titulo);
    }
    if (descripcion !== undefined) {
      updates.push("descripcion = ?");
      values.push(descripcion);
    }
    if (recompensa !== undefined) {
      updates.push("recompensa = ?");
      values.push(parseFloat(recompensa));
    }
    if (fecha_limite !== undefined) {
      updates.push("fecha_limite = ?");
      values.push(fecha_limite);
    }
    if (dificultad) {
      updates.push("dificultad = ?");
      values.push(dificultad);
    }
    if (estado) {
      updates.push("estado = ?");
      values.push(estado);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No hay datos para actualizar",
      });
    }

    values.push(id);

    await query(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`, values);

    res.json({
      success: true,
      message: "Tarea actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error al actualizar tarea:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar tarea",
    });
  }
};

// Eliminar tarea
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM tasks WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Tarea no encontrada" });
    }

    res.json({ success: true, message: "Tarea eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al eliminar tarea" });
  }
};

// Asignar tarea a estudiante(s)
exports.assignTask = async (req, res) => {
  try {
    const { task_id, student_ids } = req.body;

    if (!task_id || !student_ids || !Array.isArray(student_ids)) {
      return res.status(400).json({
        success: false,
        message: "task_id y student_ids (array) son obligatorios",
      });
    }

    // Verificar que la tarea existe
    const task = await query("SELECT id FROM tasks WHERE id = ?", [task_id]);
    if (task.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tarea no encontrada",
      });
    }

    // Insertar asignaciones una por una
    let assigned = 0;
    let alreadyAssigned = 0;

    for (const student_id of student_ids) {
      try {
        await query(
          "INSERT INTO student_tasks (user_id, task_id) VALUES (?, ?)",
          [student_id, task_id]
        );
        assigned++;
      } catch (err) {
        // Si el error es por duplicado (código 1062), ignorar
        if (err.code === "ER_DUP_ENTRY") {
          alreadyAssigned++;
        } else {
          throw err; // Re-lanzar otros errores
        }
      }
    }

    res.json({
      success: true,
      message: `Tarea asignada correctamente`,
      details: {
        total: student_ids.length,
        asignadas: assigned,
        ya_asignadas: alreadyAssigned,
      },
    });
  } catch (error) {
    console.error("Error al asignar tarea:", error);
    res.status(500).json({ success: false, message: "Error al asignar tarea" });
  }
};

// ==============================
// GESTIÓN DE EXÁMENES
// ==============================

// Crear examen
exports.createExam = async (req, res) => {
  try {
    const { nombre, fecha, nota_minima, precio_por_punto } = req.body;

    if (!nombre || !fecha) {
      return res.status(400).json({
        success: false,
        message: "Nombre y fecha son obligatorios",
      });
    }

    const result = await query(
      `
            INSERT INTO exams (nombre, fecha, nota_minima, precio_por_punto, creado_por)
            VALUES (?, ?, ?, ?, ?)
        `,
      [nombre, fecha, nota_minima || 8, precio_por_punto || 2, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: "Examen creado exitosamente",
      exam: {
        id: result.insertId,
        nombre,
        fecha,
        nota_minima: nota_minima || 8,
      },
    });
  } catch (error) {
    console.error("Error al crear examen:", error);
    res.status(500).json({ success: false, message: "Error al crear examen" });
  }
};

// Registrar calificaciones de examen
exports.registerExamScores = async (req, res) => {
  try {
    const { exam_id, calificaciones } = req.body;
    // calificaciones = [{ user_id: 1, nota_obtenida: 7.5 }, ...]

    if (!exam_id || !Array.isArray(calificaciones)) {
      return res.status(400).json({
        success: false,
        message: "exam_id y calificaciones (array) son obligatorios",
      });
    }

    // Verificar que el examen existe
    const exam = await query("SELECT id FROM exams WHERE id = ?", [exam_id]);
    if (exam.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Examen no encontrado",
      });
    }

    // Registrar calificaciones una por una
    let registradas = 0;
    let actualizadas = 0;

    for (const calificacion of calificaciones) {
      const { user_id, nota_obtenida } = calificacion;

      // Verificar si ya existe una calificación
      const existing = await query(
        "SELECT id FROM exam_results WHERE user_id = ? AND exam_id = ?",
        [user_id, exam_id]
      );

      if (existing.length > 0) {
        // Actualizar calificación existente
        await query(
          "UPDATE exam_results SET nota_obtenida = ? WHERE user_id = ? AND exam_id = ?",
          [nota_obtenida, user_id, exam_id]
        );
        actualizadas++;
      } else {
        // Insertar nueva calificación
        await query(
          "INSERT INTO exam_results (user_id, exam_id, nota_obtenida) VALUES (?, ?, ?)",
          [user_id, exam_id, nota_obtenida]
        );
        registradas++;
      }
    }

    res.json({
      success: true,
      message: `Calificaciones procesadas correctamente`,
      details: {
        total: calificaciones.length,
        registradas: registradas,
        actualizadas: actualizadas,
      },
    });
  } catch (error) {
    console.error("Error al registrar calificaciones:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al registrar calificaciones" });
  }
};

// ==============================
// ESTADÍSTICAS Y RANKINGS
// ==============================

// Obtener estadísticas generales
exports.getStatistics = async (req, res) => {
  try {
    const stats = await query("SELECT * FROM v_estadisticas_generales");
    res.json({ success: true, statistics: stats[0] });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener estadísticas" });
  }
};

// ==========================================
// Agregar Monedas a Estudiante
// ==========================================
exports.addCoins = async (req, res) => {
  try {
    const { student_id, amount, reason } = req.body;

    // Validaciones
    if (!student_id || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos. Verifica el estudiante y la cantidad",
      });
    }

    // Verificar que el estudiante existe
    const student = await query(
      "SELECT id, nombre, balance FROM users WHERE id = ? AND rol = 'student'",
      [student_id]
    );

    if (!student || student.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Estudiante no encontrado",
      });
    }

    // Actualizar balance del estudiante
    await query("UPDATE users SET balance = balance + ? WHERE id = ?", [
      amount,
      student_id,
    ]);

    // Registrar transacción
    await query(
      `INSERT INTO transactions (user_id, tipo, cantidad, descripcion, fecha) 
       VALUES (?, 'pago_admin', ?, ?, NOW())`,
      [student_id, amount, reason || "Monedas agregadas por administrador"]
    );

    // Obtener nuevo balance
    const updatedStudent = await query(
      "SELECT balance FROM users WHERE id = ?",
      [student_id]
    );

    const response = {
      success: true,
      message: `Se agregaron ${amount} CCED Coins a ${student[0].nombre}`,
      new_balance: parseFloat(updatedStudent[0].balance),
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al agregar monedas",
      error: error.message,
    });
  }
};

// ==========================================
// Retirar Monedas de Estudiante
// ==========================================
exports.removeCoins = async (req, res) => {
  try {
    const { student_id, amount, reason } = req.body;

    // Validaciones
    if (!student_id || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos. Verifica el estudiante y la cantidad",
      });
    }

    // Verificar que el estudiante existe y tiene suficientes monedas
    const student = await query(
      "SELECT id, nombre, balance FROM users WHERE id = ? AND rol = 'student'",
      [student_id]
    );

    if (!student || student.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Estudiante no encontrado",
      });
    }

    const currentBalance = parseFloat(student[0].balance);

    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `El estudiante solo tiene ${currentBalance.toFixed(
          0
        )} CCED Coins disponibles`,
      });
    }

    // Actualizar balance del estudiante
    await query("UPDATE users SET balance = balance - ? WHERE id = ?", [
      amount,
      student_id,
    ]);

    // Registrar transacción con cantidad negativa para indicar retiro
    await query(
      `INSERT INTO transactions (user_id, tipo, cantidad, descripcion, fecha) 
       VALUES (?, 'pago_admin', ?, ?, NOW())`,
      [student_id, -amount, reason || "Monedas retiradas por administrador"]
    );

    // Obtener nuevo balance
    const updatedStudent = await query(
      "SELECT balance FROM users WHERE id = ?",
      [student_id]
    );

    res.json({
      success: true,
      message: `Se retiraron ${amount} CCED Coins de ${student[0].nombre}`,
      new_balance: parseFloat(updatedStudent[0].balance),
    });
  } catch (error) {
    console.error("❌ Error retirando monedas:", error);
    res.status(500).json({
      success: false,
      message: "Error al retirar monedas",
      error: error.message,
    });
  }
};

// ==========================================
// Obtener Historial de Transacciones
// ==========================================
exports.getTransactions = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const studentId = req.query.student_id;

    // Usar la vista v_historial_transacciones que ya tiene los joins
    let sql = `SELECT * FROM v_historial_transacciones`;
    const params = [];

    // Filtrar por estudiante si se proporciona
    if (studentId) {
      sql += " WHERE id IN (SELECT id FROM transactions WHERE user_id = ?)";
      params.push(studentId);
    }

    sql += ` ORDER BY fecha DESC LIMIT ${limit}`;

    const transactions = await query(sql, params);

    res.json({
      success: true,
      transactions: transactions.map((t) => ({
        id: t.id,
        estudiante_nombre: t.estudiante,
        tipo: t.tipo,
        monto: parseFloat(t.cantidad) || 0, // Frontend espera 'monto'
        motivo: t.descripcion, // Frontend espera 'motivo'
        tarea: t.tarea,
        examen: t.examen,
        fecha: t.fecha,
      })),
    });
  } catch (error) {
    console.error("❌ Error obteniendo transacciones:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener historial de transacciones",
      transactions: [],
    });
  }
};

// ==========================================
// Obtener Resumen de Monedas
// ==========================================
exports.getSummary = async (req, res) => {
  try {
    // Usar la vista de estadísticas generales que ya existe
    const stats = await query("SELECT * FROM v_estadisticas_generales");

    if (!stats || stats.length === 0) {
      return res.json({
        success: true,
        summary: {
          total_circulation: 0,
          total_students: 0,
          average_coins: 0,
          today_transactions: 0,
          week_transactions: 0,
          top_students: [],
        },
      });
    }

    const generalStats = stats[0];

    // Transacciones del día
    const todayTransactions = await query(
      `SELECT COUNT(*) as count 
       FROM transactions 
       WHERE DATE(fecha) = CURDATE()`
    );

    // Transacciones de la semana
    const weekTransactions = await query(
      `SELECT COUNT(*) as count 
       FROM transactions 
       WHERE fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    // Top 5 estudiantes con más monedas (usar la vista de ranking)
    const topStudents = await query(
      `SELECT nombre, balance, tareas_completadas 
       FROM v_ranking_monedas 
       LIMIT 5`
    );

    const totalStudents = parseInt(generalStats.total_estudiantes) || 1;
    const totalCirculation = parseFloat(generalStats.monedas_circulacion) || 0;
    const averageCoins =
      parseFloat(generalStats.promedio_monedas_estudiante) || 0;

    res.json({
      success: true,
      summary: {
        total_circulation: totalCirculation,
        total_students: totalStudents,
        average_coins: averageCoins,
        today_transactions: parseInt(todayTransactions[0].count) || 0,
        week_transactions: parseInt(weekTransactions[0].count) || 0,
        top_students: topStudents.map((s) => ({
          nombre: s.nombre,
          balance: parseFloat(s.balance) || 0,
          tareas_completadas: parseInt(s.tareas_completadas) || 0,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Error obteniendo resumen de monedas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener resumen",
    });
  }
};

// ==========================================
// Transferir Monedas Entre Estudiantes (BONUS)
// ==========================================
exports.transferCoins = async (req, res) => {
  try {
    const { from_student_id, to_student_id, amount, reason } = req.body;

    // Validaciones
    if (
      !from_student_id ||
      !to_student_id ||
      !amount ||
      amount <= 0 ||
      from_student_id === to_student_id
    ) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos para la transferencia",
      });
    }

    // Verificar ambos estudiantes
    const fromStudent = await query(
      "SELECT id, nombre, balance FROM users WHERE id = ? AND rol = 'student'",
      [from_student_id]
    );

    const toStudent = await query(
      "SELECT id, nombre, balance FROM users WHERE id = ? AND rol = 'student'",
      [to_student_id]
    );

    if (!fromStudent.length || !toStudent.length) {
      return res.status(404).json({
        success: false,
        message: "Uno o ambos estudiantes no encontrados",
      });
    }

    if (parseFloat(fromStudent[0].balance) < amount) {
      return res.status(400).json({
        success: false,
        message: "Balance insuficiente para la transferencia",
      });
    }

    // Realizar transferencia
    await query("UPDATE users SET balance = balance - ? WHERE id = ?", [
      amount,
      from_student_id,
    ]);

    await query("UPDATE users SET balance = balance + ? WHERE id = ?", [
      amount,
      to_student_id,
    ]);

    // Registrar transacciones
    const transferReason =
      reason ||
      `Transferencia de ${fromStudent[0].nombre} a ${toStudent[0].nombre}`;

    // Débito para quien envía (cantidad negativa)
    await query(
      `INSERT INTO transactions (user_id, tipo, cantidad, descripcion, fecha) 
       VALUES (?, 'pago_admin', ?, ?, NOW())`,
      [from_student_id, -amount, `${transferReason} (enviado)`]
    );

    // Crédito para quien recibe (cantidad positiva)
    await query(
      `INSERT INTO transactions (user_id, tipo, cantidad, descripcion, fecha) 
       VALUES (?, 'pago_admin', ?, ?, NOW())`,
      [to_student_id, amount, `${transferReason} (recibido)`]
    );

    res.json({
      success: true,
      message: `Transferencia completada: ${amount} CCED Coins de ${fromStudent[0].nombre} a ${toStudent[0].nombre}`,
    });
  } catch (error) {
    console.error("❌ Error en transferencia:", error);
    res.status(500).json({
      success: false,
      message: "Error al realizar la transferencia",
    });
  }
};

// ==========================================
// Ajustar Balance (Corrección Manual)
// ==========================================
exports.adjustBalance = async (req, res) => {
  try {
    const { student_id, new_balance, reason } = req.body;

    if (!student_id || new_balance < 0) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
      });
    }

    const student = await query(
      "SELECT id, nombre, balance FROM users WHERE id = ? AND rol = 'student'",
      [student_id]
    );

    if (!student.length) {
      return res.status(404).json({
        success: false,
        message: "Estudiante no encontrado",
      });
    }

    const oldBalance = parseFloat(student[0].balance);
    const difference = new_balance - oldBalance;

    // Actualizar balance
    await query("UPDATE users SET balance = ? WHERE id = ?", [
      new_balance,
      student_id,
    ]);

    // Registrar ajuste (tipo='ajuste')
    await query(
      `INSERT INTO transactions (user_id, tipo, cantidad, descripcion, fecha) 
       VALUES (?, 'ajuste', ?, ?, NOW())`,
      [
        student_id,
        difference,
        reason || `Ajuste manual de balance (${oldBalance} → ${new_balance})`,
      ]
    );

    res.json({
      success: true,
      message: `Balance ajustado correctamente`,
      old_balance: oldBalance,
      new_balance: new_balance,
      difference: difference,
    });
  } catch (error) {
    console.error("❌ Error ajustando balance:", error);
    res.status(500).json({
      success: false,
      message: "Error al ajustar balance",
    });
  }
};
