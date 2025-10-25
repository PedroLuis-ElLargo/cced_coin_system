// ==============================
// SERVER.JS
// ==============================

const express = require("express");
const cors = require("cors");
const multer = require("multer"); // AGREGAR
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Crear carpetas uploads si no existen
const uploadsDirs = [
  path.join(__dirname, "uploads/exams"),
  path.join(__dirname, "uploads/tasks"),
];

uploadsDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Carpeta ${dir} creada`);
  }
});

const app = express();
const publicRoutes = require("./routes/public");

// ==============================
// MIDDLEWARES GLOBALES
// ==============================
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de uploads (para downloads)
app.use("/uploads", express.static("uploads"));

// Logging de peticiones en desarrollo
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ==============================
// RUTAS
// ==============================
// Rutas públicas (sin autenticación)
app.use("/api/public", publicRoutes);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/student", require("./routes/student"));

// Ruta de prueba
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "STHELA Coin System API funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

// ==============================
// MANEJO DE ERRORES 404
// ==============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
  });
});

// ==============================
// MANEJO DE ERRORES GLOBALES (INCLUYE MULTER)
// ==============================
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Manejo específico de errores de Multer
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "El archivo es demasiado grande. Máximo 10MB por archivo.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Demasiados archivos. Máximo 10 archivos a la vez.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Campo de archivo inesperado.",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Error al subir archivo: ${err.message}`,
    });
  }

  // Error de validación de tipo de archivo
  if (err.message && err.message.includes("Solo se permiten archivos")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Otros errores
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ==============================
// INICIAR SERVIDOR
// ==============================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log("╔════════════════════════════════════════╗");
  console.log("║   🚀 STHELA COIN SYSTEM API              ║");
  console.log("╠════════════════════════════════════════╣");
  console.log(`║   Servidor: http://localhost:${PORT}     ║`);
  console.log(
    `║   Entorno: ${process.env.NODE_ENV || "development"}                 ║`
  );
  console.log("║   Estado: ✅ Activo                     ║");
  console.log("╚════════════════════════════════════════╝");
});

// Manejo de cierre graceful
process.on("SIGTERM", () => {
  console.log("🔴 SIGTERM recibido, cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🔴 SIGINT recibido, cerrando servidor...");
  process.exit(0);
});
