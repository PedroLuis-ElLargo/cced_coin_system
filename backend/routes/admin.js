// ==============================
// ADMIN ROUTES - Rutas de Administrador
// ==============================

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// Aplicar middleware de autenticación y verificación de admin a todas las rutas
router.use(verifyToken);
router.use(verifyAdmin);

// ==============================
// GESTIÓN DE ESTUDIANTES
// ==============================

// GET /api/admin/students - Obtener todos los estudiantes
router.get("/students", adminController.getAllStudents);

// GET /api/admin/students/:id - Obtener un estudiante específico
router.get("/students/:id", adminController.getStudentById);

// POST /api/admin/students - Crear nuevo estudiante
router.post("/students", adminController.createStudent);

// PUT /api/admin/students/:id - Actualizar estudiante
router.put("/students/:id", adminController.updateStudent);

// DELETE /api/admin/students/:id - Eliminar estudiante
router.delete("/students/:id", adminController.deleteStudent);

// ==============================
// CÓDIGOS DE REGISTRO
// ==============================

// POST /api/admin/codes/generate - Generar código de registro
router.post("/codes/generate", adminController.generateRegistrationCode);

// GET /api/admin/codes - Obtener todos los códigos
router.get("/codes", adminController.getAllCodes);

// ==============================
// GESTIÓN DE TAREAS
// ==============================

// GET /api/admin/tasks - Obtener todas las tareas
router.get("/tasks", adminController.getAllTasks);

// POST /api/admin/tasks - Crear nueva tarea
router.post("/tasks", adminController.createTask);

// GET /api/admin/tasks/:id - Obtener tarea específica
router.get("/tasks/:id", adminController.getTaskById);

// PUT /api/admin/tasks/:id - Actualizar tarea
router.put("/tasks/:id", adminController.updateTask);

// DELETE /api/admin/tasks/:id - Eliminar tarea
router.delete("/tasks/:id", adminController.deleteTask);

// POST /api/admin/tasks/assign - Asignar tarea a estudiante(s)
router.post("/tasks/assign", adminController.assignTask);

// ==============================
// GESTIÓN DE EXÁMENES
// ==============================

// POST /api/admin/exams - Crear nuevo examen
router.post("/exams", adminController.createExam);

// POST /api/admin/exams/scores - Registrar calificaciones
router.post("/exams/scores", adminController.registerExamScores);

// ==============================
// ESTADÍSTICAS
// ==============================

// GET /api/admin/statistics - Obtener estadísticas generales
router.get("/statistics", adminController.getStatistics);

// ==========================================
// GESTIÓN DE MONEDAS
// ==========================================

router.post("/coins/add", (req, res, next) => {
  adminController.addCoins(req, res, next);
});

router.post("/coins/remove", (req, res, next) => {
  adminController.removeCoins(req, res, next);
});

router.post("/coins/transfer", adminController.transferCoins);
router.post("/coins/adjust", adminController.adjustBalance);
router.get("/coins/summary", adminController.getSummary);
router.get("/transactions", adminController.getTransactions);

module.exports = router;
