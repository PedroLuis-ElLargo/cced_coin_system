// ==============================
// SERVER.JS - Servidor Principal
// ==============================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ==============================
// MIDDLEWARES GLOBALES
// ==============================
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de peticiones en desarrollo
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
        next();
    });
}

// ==============================
// RUTAS
// ==============================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/student', require('./routes/student'));

// Ruta de prueba
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'CCED Coin System API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// ==============================
// MANEJO DE ERRORES 404
// ==============================
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Ruta no encontrada' 
    });
});

// ==============================
// MANEJO DE ERRORES GLOBALES
// ==============================
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ==============================
// INICIAR SERVIDOR
// ==============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   🚀 CCED COIN SYSTEM API              ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║   Servidor: http://localhost:${PORT}     ║`);
    console.log(`║   Entorno: ${process.env.NODE_ENV || 'development'}                 ║`);
    console.log('║   Estado: ✅ Activo                     ║');
    console.log('╚════════════════════════════════════════╝');
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('⚠️  SIGTERM recibido, cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('⚠️  SIGINT recibido, cerrando servidor...');
    process.exit(0);
});