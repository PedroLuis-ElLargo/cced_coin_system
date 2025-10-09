// ==============================
// AUTH CONTROLLER - Login y Registro
// ==============================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// ==============================
// REGISTRO DE ESTUDIANTE
// ==============================
exports.register = async (req, res) => {
    try {
        const { nombre, email, password, registrationCode } = req.body;

        // Validaciones
        if (!nombre || !email || !password || !registrationCode) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son obligatorios' 
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Formato de email inválido' 
            });
        }

        // Validar longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'La contraseña debe tener al menos 6 caracteres' 
            });
        }

        // Verificar si el email ya existe
        const existingUser = await query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'El email ya está registrado' 
            });
        }

        // Verificar código de registro
        const codeResult = await query(
            'SELECT id, usado, fecha_expiracion FROM registration_codes WHERE code = ?',
            [registrationCode]
        );

        if (codeResult.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Código de registro inválido' 
            });
        }

        const code = codeResult[0];

        if (code.usado) {
            return res.status(400).json({ 
                success: false, 
                message: 'Este código ya ha sido utilizado' 
            });
        }

        if (code.fecha_expiracion && new Date(code.fecha_expiracion) < new Date()) {
            return res.status(400).json({ 
                success: false, 
                message: 'El código de registro ha expirado' 
            });
        }

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear usuario
        const result = await query(
            'INSERT INTO users (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
            [nombre, email, hashedPassword, 'student']
        );

        const userId = result.insertId;

        // Marcar código como usado
        await query(
            'UPDATE registration_codes SET usado = TRUE, usado_por = ? WHERE code = ?',
            [userId, registrationCode]
        );

        // Generar token JWT
        const token = jwt.sign(
            { id: userId, email, rol: 'student' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: '¡Registro exitoso! Bienvenido a CCED Coin System',
            token,
            user: {
                id: userId,
                nombre,
                email,
                rol: 'student',
                balance: 0
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al registrar usuario' 
        });
    }
};

// ==============================
// LOGIN
// ==============================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validaciones
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email y contraseña son obligatorios' 
            });
        }

        // Buscar usuario
        const users = await query(
            'SELECT id, nombre, email, password, rol, balance, tareas_completadas FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciales incorrectas' 
            });
        }

        const user = users[0];

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciales incorrectas' 
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: `¡Bienvenido ${user.nombre}!`,
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                balance: parseFloat(user.balance),
                tareas_completadas: user.tareas_completadas
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al iniciar sesión' 
        });
    }
};

// ==============================
// VERIFICAR TOKEN (Get user info)
// ==============================
exports.verifyToken = async (req, res) => {
    try {
        const users = await query(
            'SELECT id, nombre, email, rol, balance, tareas_completadas FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }

        const user = users[0];

        res.json({
            success: true,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                balance: parseFloat(user.balance),
                tareas_completadas: user.tareas_completadas
            }
        });

    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al verificar token' 
        });
    }
};