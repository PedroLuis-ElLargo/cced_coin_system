// ==============================
// AUTH MIDDLEWARE - Verificación JWT
// ==============================

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware para verificar token JWT
const verifyToken = async (req, res, next) => {
    try {
        // Obtener token del header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Acceso denegado. No se proporcionó token.' 
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar que el usuario aún existe en la BD
        const user = await query(
            'SELECT id, nombre, email, rol, balance FROM users WHERE id = ?',
            [decoded.id]
        );

        if (!user || user.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }

        // Agregar información del usuario al request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            rol: decoded.rol,
            nombre: user[0].nombre,
            balance: user[0].balance
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expirado' 
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token inválido' 
            });
        }
        return res.status(500).json({ 
            success: false, 
            message: 'Error al verificar token' 
        });
    }
};

// Middleware para verificar rol de administrador
const verifyAdmin = (req, res, next) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acceso denegado. Se requieren permisos de administrador.' 
        });
    }
    next();
};

// Middleware para verificar rol de estudiante
const verifyStudent = (req, res, next) => {
    if (req.user.rol !== 'student') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acceso denegado. Ruta solo para estudiantes.' 
        });
    }
    next();
};

module.exports = {
    verifyToken,
    verifyAdmin,
    verifyStudent
};