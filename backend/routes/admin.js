// ==============================
// ADMIN ROUTES - Rutas de Administrador
// ==============================

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const gradesController = require("../controllers/admin/gradesController.js");
const {
  verifyToken,
  verifyAdmin,
  verifyRoles,
  verifyStudentAccess,
} = require("../middleware/auth");
const ActivityLogger = require("../utils/activityLogger.js");
const multer = require("multer");
const path = require("path");

// Configuración de Multer para archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determinar carpeta según la ruta
    let uploadPath = "uploads/";

    if (req.path.includes("/exams/")) {
      uploadPath += "exams/";
    } else if (req.path.includes("/tasks/")) {
      uploadPath += "tasks/";
    } else {
      uploadPath += "general/";
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|txt|zip|jpg|jpeg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(
      new Error("Solo se permiten archivos PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP")
    );
  },
});

// Aplicar middleware de autenticación y verificación de admin a todas las rutas
router.use(verifyToken);
router.use(verifyAdmin);

// ✅ AGREGAR ESTE LOG DESPUÉS DE LOS MIDDLEWARES
router.use((req, res, next) => {
  next();
});

// ==========================================
// PERIODOS ESCOLARES
// ==========================================
router.get("/periodos", gradesController.getPeriodos);
router.get("/periodos/activo", gradesController.getPeriodoActivo);
router.post("/periodos", verifyAdmin, gradesController.createPeriodo);

// ==========================================
// MATERIAS
// ==========================================
router.get("/materias", gradesController.getMaterias);
router.post("/materias", verifyAdmin, gradesController.createMateria);

// ==========================================
// RESULTADOS DE APRENDIZAJE
// ==========================================
router.get(
  "/materias/:materiaId/resultados",
  gradesController.getResultadosAprendizaje
);
router.post(
  "/materias/:materiaId/resultados",
  verifyAdmin,
  gradesController.createResultadosAprendizaje
);
// Actualizar porcentaje de un RA
router.put(
  "/materias/:materiaId/resultados/:raId",
  gradesController.updateResultadoAprendizaje
);
// ==========================================
// INSCRIPCIONES
// ==========================================
router.post(
  "/inscripciones",
  verifyAdmin,
  gradesController.inscribirEstudiante
);

// ✅ Estudiantes pueden ver sus propias inscripciones, admin puede ver todas
router.get(
  "/inscripciones/estudiante/:estudianteId",
  verifyStudentAccess,
  gradesController.getInscripcionesEstudiante
);

// ==========================================
// CALIFICACIONES ACADÉMICAS
// ==========================================
// Solo admin puede registrar/editar calificaciones
router.post(
  "/calificaciones/academicas",
  verifyAdmin,
  gradesController.registrarCalificacionAcademica
);

// ✅ Si quieres permitir que docentes también registren calificaciones:
// router.post("/calificaciones/academicas", verifyRoles('admin', 'docente'), gradesController.registrarCalificacionAcademica);

// Cualquier usuario autenticado puede ver (se valida acceso en el controlador)
router.get(
  "/calificaciones/academicas/:inscripcionId",
  gradesController.getCalificacionesAcademicas
);

// ==========================================
// CALIFICACIONES MÓDULOS FORMATIVOS
// ==========================================
router.post(
  "/calificaciones/modulos",
  verifyAdmin,
  gradesController.registrarCalificacionModulo
);

// ✅ Si quieres permitir que docentes también registren:
// router.post("/calificaciones/modulos", verifyRoles('admin', 'docente'), gradesController.registrarCalificacionModulo);

router.get(
  "/calificaciones/modulos/:inscripcionId",
  gradesController.getCalificacionesModulo
);

// ==========================================
// REPORTES
// ==========================================
// ✅ Estudiantes pueden ver su propio reporte, admin puede ver todos
router.get(
  "/reportes/estudiante/:estudianteId/periodo/:periodoId",
  verifyStudentAccess,
  gradesController.getReporteEstudiante
);

// Solo admin puede ver listados generales
router.get(
  "/reportes/listado",
  verifyAdmin,
  gradesController.getListadoEstudiantes
);

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

// POST /api/admin/codes/generate - Generar código
router.post("/codes/generate", adminController.generateRegistrationCode);

// GET /api/admin/codes - Obtener todos los códigos
router.get("/codes", adminController.getAllCodes);

// PUT /api/admin/codes/:id/expiration - Actualizar fecha de expiración
router.put("/codes/:id/expiration", adminController.updateCodeExpiration);

// DELETE /api/admin/codes/:id - Eliminar código
router.delete("/codes/:id", adminController.deleteCode);

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
// GESTIÓN DE ARCHIVOS DE TAREAS
// ==============================

// Obtener archivos de una tarea
router.get("/tasks/:id/files", adminController.getTaskFiles);

// Subir archivos a una tarea
router.post(
  "/tasks/:id/files",
  upload.array("files", 10),
  adminController.uploadTaskFiles
);

// Descargar archivo de tarea
router.get("/tasks/files/:fileId/download", adminController.downloadTaskFile);

// Eliminar archivo de tarea
router.delete("/tasks/files/:fileId", adminController.deleteTaskFile);

// ==============================
// GESTIÓN DE EXÁMENES
// ==============================

// ===== CRUD EXÁMENES =====
router.get("/exams", adminController.getExams);
router.post("/exams", adminController.createExam);
router.get("/exams/:id", adminController.getExamById);
router.put("/exams/:id", adminController.updateExam);
router.delete("/exams/:id", adminController.deleteExam);

// ===== GESTIÓN DE ARCHIVOS =====
router.get("/exams/:id/files", adminController.getExamFiles);
router.post(
  "/exams/:id/files",
  upload.array("files", 10),
  adminController.uploadExamFiles
);
router.get("/exams/files/:fileId/download", adminController.downloadExamFile);
router.delete("/exams/files/:fileId", adminController.deleteExamFile);

// ===== CALIFICACIONES =====
router.post("/exams/scores", adminController.registerExamScores);
router.get("/exams/:id/results", adminController.getExamResults);

// ===== COMPRA DE PUNTOS (ESTUDIANTES) =====
router.post("/exams/:id/buy-points", adminController.buyExamPoints);
router.get("/my-exam-results", adminController.getMyExamResults);

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

// ==========================================
// ACTIVIDADES RECIENTES
// ==========================================

/**
 * GET /api/admin/actividades-recientes
 * Obtener lista de actividades recientes del sistema
 */
router.get("/actividades-recientes", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Validar que el límite sea razonable
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "El límite debe estar entre 1 y 100",
      });
    }

    const actividades = await ActivityLogger.getRecent(limit);
    console.log(
      `✅ Se encontraron ${actividades.length} actividades recientes`
    );

    res.json({
      success: true,
      actividades,
      total: actividades.length,
    });
  } catch (error) {
    console.error("❌ Error obteniendo actividades recientes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener actividades recientes",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/actividades-recientes/limpiar
 * Limpiar actividades antiguas (más de 30 días)
 */
router.delete("/actividades-recientes/limpiar", async (req, res) => {
  try {
    const deleted = await ActivityLogger.cleanOldActivities();

    res.json({
      success: true,
      message: `Se eliminaron ${deleted} actividades antiguas`,
      deleted,
    });
  } catch (error) {
    console.error("❌ Error limpiando actividades:", error);
    res.status(500).json({
      success: false,
      message: "Error al limpiar actividades",
      error: error.message,
    });
  }
});

module.exports = router;
