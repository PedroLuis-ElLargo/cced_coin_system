// ==============================
// AUTH ROUTES - Rutas de Autenticación
// ==============================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// ==============================
// RUTAS PÚBLICAS
// ==============================

// POST /api/auth/register - Registrar nuevo estudiante
router.post('/register', authController.register);

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// ==============================
// RUTAS PROTEGIDAS
// ==============================

// GET /api/auth/verify - Verificar token y obtener info del usuario
router.get('/verify', verifyToken, authController.verifyToken);

module.exports = router;