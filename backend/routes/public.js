// ==========================================
// PUBLIC.JS - Rutas Públicas (Usando Vistas)
// ==========================================

const express = require("express");
const router = express.Router();
const { query } = require("../config/database");

// GET - Estadísticas públicas generales
router.get("/statistics", async (req, res) => {
  try {
    // Usar la vista v_estadisticas_generales
    const stats = await query("SELECT * FROM v_estadisticas_generales LIMIT 1");

    if (stats && stats.length > 0) {
      const data = stats[0];

      res.json({
        success: true,
        statistics: {
          total_estudiantes: parseInt(data.total_estudiantes) || 0,
          total_tareas: parseInt(data.total_tareas) || 0,
          tareas_activas: parseInt(data.tareas_activas) || 0,
          tareas_completadas_total:
            parseInt(data.tareas_completadas_total) || 0,
          monedas_circulacion: parseFloat(data.monedas_circulacion) || 0,
          promedio_monedas: parseFloat(data.promedio_monedas_estudiante) || 0,
        },
      });
    } else {
      // Si no hay datos, devolver ceros
      res.json({
        success: true,
        statistics: {
          total_estudiantes: 0,
          total_tareas: 0,
          tareas_activas: 0,
          tareas_completadas_total: 0,
          monedas_circulacion: 0,
          promedio_monedas: 0,
        },
      });
    }
  } catch (error) {
    console.error("Error obteniendo estadísticas públicas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: error.message,
    });
  }
});

// GET - Ranking público de estudiantes (Top 10)
router.get("/ranking", async (req, res) => {
  try {
    // Obtener límite y validar estrictamente
    let limit = parseInt(req.query.limit, 10);

    // Validación exhaustiva
    if (isNaN(limit) || limit < 1) {
      limit = 10;
    }

    // Limitar máximo
    limit = Math.min(limit, 50);

    // SOLUCIÓN: Usar interpolación segura en lugar de prepared statement
    // (el límite ya está validado como número entero)
    const ranking = await query(
      `SELECT nombre, balance, tareas_completadas, posicion 
       FROM v_ranking_monedas 
       LIMIT ${limit}`
    );

    res.json({
      success: true,
      ranking: ranking.map((student) => ({
        nombre: student.nombre,
        balance: parseFloat(student.balance) || 0,
        tareas_completadas: parseInt(student.tareas_completadas) || 0,
        posicion: parseInt(student.posicion),
      })),
    });
  } catch (error) {
    console.error("Error obteniendo ranking:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener ranking",
      ranking: [],
    });
  }
});

// GET - Ranking por tareas
router.get("/ranking/tareas", async (req, res) => {
  try {
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1) limit = 10;
    limit = Math.min(limit, 50);

    // Usar la vista v_ranking_tareas si existe
    let ranking;
    try {
      ranking = await query(`SELECT * FROM v_ranking_tareas LIMIT ${limit}`);
    } catch (err) {
      // Si no existe la vista, crear query manual
      ranking = await query(
        `SELECT 
          nombre,
          tareas_completadas,
          balance,
          ROW_NUMBER() OVER (ORDER BY tareas_completadas DESC, balance DESC) as posicion
        FROM users 
        WHERE role = "student"
        ORDER BY tareas_completadas DESC, balance DESC
        LIMIT ${limit}`
      );
    }

    res.json({
      success: true,
      ranking: ranking.map((student) => ({
        nombre: student.nombre,
        tareas_completadas: parseInt(student.tareas_completadas) || 0,
        balance: parseFloat(student.balance) || 0,
        posicion: parseInt(student.posicion),
      })),
    });
  } catch (error) {
    console.error("Error obteniendo ranking por tareas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener ranking",
      ranking: [],
    });
  }
});

// GET - Estadísticas detalladas (para gráficos)
router.get("/statistics/detailed", async (req, res) => {
  try {
    // Distribución de tareas por estado
    const tasksByStatus = await query(`
      SELECT 
        estado,
        COUNT(*) as cantidad,
        SUM(recompensa) as recompensa_total
      FROM tasks
      GROUP BY estado
    `);

    // Top 5 estudiantes
    const topStudents = await query(`
      SELECT nombre, balance, tareas_completadas 
      FROM v_ranking_monedas 
      LIMIT 5
    `);

    // Últimas transacciones (si la tabla existe)
    let recentTransactions = [];
    try {
      recentTransactions = await query(`
        SELECT 
          tipo,
          monto,
          fecha
        FROM transactions
        ORDER BY fecha DESC
        LIMIT 10
      `);
    } catch (err) {
      console.error(
        "❌ Error en la base de datos al buscar transacciones:",
        err
      );
      throw new Error("Fallo al consultar transacciones recientes en la DB.");
    }

    res.json({
      success: true,
      data: {
        tasks_by_status: tasksByStatus.map((task) => ({
          estado: task.estado,
          cantidad: parseInt(task.cantidad),
          recompensa_total: parseFloat(task.recompensa_total) || 0,
        })),
        top_students: topStudents.map((student) => ({
          nombre: student.nombre,
          balance: parseFloat(student.balance) || 0,
          tareas_completadas: parseInt(student.tareas_completadas) || 0,
        })),
        recent_transactions: recentTransactions,
      },
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas detalladas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas detalladas",
    });
  }
});

module.exports = router;
