// ==============================
// STUDENT ROUTES - Rutas de Estudiante
// ==============================

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, verifyStudent } = require('../middleware/auth');

// Aplicar middleware de autenticación y verificación de estudiante a todas las rutas
router.use(verifyToken);
router.use(verifyStudent);

// ==============================
// DASHBOARD
// ==============================

// GET /api/student/dashboard - Obtener información del dashboard
router.get('/dashboard', studentController.getDashboard);

// ==============================
// TAREAS
// ==============================

// GET /api/student/tasks - Obtener tareas asignadas
// Query params: ?estado=pendientes|completadas
router.get('/tasks', studentController.getMyTasks);

// GET /api/student/tasks/available - Obtener tareas disponibles (no asignadas)
router.get('/tasks/available', studentController.getAvailableTasks);

// POST /api/student/tasks/complete - Marcar tarea como completada
router.post('/tasks/complete', studentController.completeTask);

// ==============================
// RANKINGS
// ==============================

// GET /api/student/ranking/monedas - Obtener ranking por monedas
// Query params: ?limit=10
router.get('/ranking/monedas', studentController.getRankingMonedas);

// GET /api/student/ranking/tareas - Obtener ranking por tareas completadas
// Query params: ?limit=10
router.get('/ranking/tareas', studentController.getRankingTareas);

// ==============================
// EXÁMENES
// ==============================

// GET /api/student/exams - Obtener exámenes disponibles
router.get('/exams', studentController.getExams);

// POST /api/student/exams/buy-points - Comprar puntos para examen
router.post('/exams/buy-points', studentController.buyExamPoints);

// ==============================
// HISTORIAL
// ==============================

// GET /api/student/transactions - Obtener historial de transacciones
// Query params: ?limit=50
router.get('/transactions', studentController.getTransactionHistory);

module.exports = router;