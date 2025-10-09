-- ==============================
-- BASE DE DATOS: CCED COIN SYSTEM
-- ==============================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS cced_coin_system 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;

USE cced_coin_system;

-- ==============================
-- TABLA: Usuarios
-- ==============================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, 
    rol ENUM('student','admin') DEFAULT 'student',
    balance DECIMAL(10,2) DEFAULT 0.00,
    tareas_completadas INT DEFAULT 0, 
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_rol (rol),
    INDEX idx_balance (balance DESC),
    INDEX idx_tareas (tareas_completadas DESC)
) ENGINE=InnoDB;

-- ==============================
-- TABLA: Códigos de Registro
-- ==============================
CREATE TABLE registration_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    usado_por INT NULL,
    creado_por INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NULL,
    
    FOREIGN KEY (creado_por) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (usado_por) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_usado (usado),
    INDEX idx_code (code)
) ENGINE=InnoDB;

-- ==============================
-- TABLA: Tareas
-- ==============================
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    estado ENUM('activa','completada','vencida') DEFAULT 'activa',
    recompensa DECIMAL(10,2) NOT NULL,
    fecha_limite DATE NULL,
    dificultad ENUM('facil','media','dificil') DEFAULT 'media',
    creado_por INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (creado_por) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_estado (estado),
    INDEX idx_fecha_limite (fecha_limite)
) ENGINE=InnoDB;

-- ==============================
-- TABLA: Exámenes
-- ==============================
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    fecha DATE NOT NULL,
    nota_minima DECIMAL(4,2) DEFAULT 8.00,
    nota_maxima DECIMAL(4,2) DEFAULT 10.00,
    precio_por_punto DECIMAL(10,2) DEFAULT 2.00, 
    creado_por INT,
    activo BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (creado_por) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_fecha (fecha),
    INDEX idx_activo (activo)
) ENGINE=InnoDB;

-- ==============================
-- TABLA: Transacciones (movimientos de monedas)
-- ==============================
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tipo ENUM('ganado_tarea','compra_puntos','pago_admin','ajuste') NOT NULL, 
    cantidad DECIMAL(10,2) NOT NULL,
    descripcion VARCHAR(255),
    task_id INT NULL,
    exam_id INT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE SET NULL,
    
    INDEX idx_user (user_id),
    INDEX idx_tipo (tipo),
    INDEX idx_fecha (fecha DESC)
) ENGINE=InnoDB;

-- ==============================
-- TABLA: Relación Estudiante - Tareas
-- ==============================
CREATE TABLE student_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NOT NULL,
    completado BOOLEAN DEFAULT FALSE,
    fecha_asignada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_completada TIMESTAMP NULL,
    calificacion DECIMAL(4,2) NULL,
    comentarios TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_student_task (user_id, task_id),
    
    INDEX idx_user (user_id),
    INDEX idx_task (task_id),
    INDEX idx_completado (completado)
) ENGINE=InnoDB;

-- ==============================
-- TABLA: Resultados de Exámenes
-- ==============================
CREATE TABLE exam_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    exam_id INT NOT NULL,
    nota_obtenida DECIMAL(4,2) NOT NULL,
    puntos_comprados INT DEFAULT 0,
    monedas_gastadas DECIMAL(10,2) DEFAULT 0.00,
    nota_final DECIMAL(4,2) GENERATED ALWAYS AS (
        LEAST(nota_obtenida + puntos_comprados, 10.00)
    ) STORED, 
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_student_exam (user_id, exam_id),
    
    INDEX idx_user (user_id),
    INDEX idx_exam (exam_id)
) ENGINE=InnoDB;

-- ==============================
-- TRIGGERS para mantener consistencia
-- ==============================

DELIMITER $$

CREATE TRIGGER after_task_completed
AFTER UPDATE ON student_tasks
FOR EACH ROW
BEGIN
    DECLARE tarea_recompensa DECIMAL(10,2);
    DECLARE tarea_titulo VARCHAR(150);

    IF NEW.completado = TRUE AND OLD.completado = FALSE THEN
        SELECT recompensa, titulo
        INTO tarea_recompensa, tarea_titulo
        FROM tasks
        WHERE id = NEW.task_id;

        UPDATE users 
        SET balance = balance + tarea_recompensa,
            tareas_completadas = tareas_completadas + 1
        WHERE id = NEW.user_id;

        INSERT INTO transactions (user_id, tipo, cantidad, task_id, descripcion)
        VALUES (NEW.user_id, 'ganado_tarea', tarea_recompensa, NEW.task_id,
                CONCAT('Tarea completada: ', tarea_titulo));
    END IF;
END$$

DELIMITER ;

-- ==============================
-- DATOS INICIALES
-- ==============================

-- Insertar usuario administrador por defecto
INSERT INTO users (nombre, email, password, rol, balance) VALUES
('Administrador', 'admin@cced.edu', '$2a$10$UDSDTdhCqWfjLN0LjIXw0e8goXenv3Sodpyk0BMfDrnTD4uj9XGYO', 'admin', 0.00);

-- Generar algunos códigos de registro iniciales
INSERT INTO registration_codes (code, creado_por, fecha_expiracion) VALUES
('CCED-2025-001', 1, DATE_ADD(NOW(), INTERVAL 1 YEAR)),
('CCED-2025-002', 1, DATE_ADD(NOW(), INTERVAL 1 YEAR)),
('CCED-2025-003', 1, DATE_ADD(NOW(), INTERVAL 1 YEAR));

-- ==============================
-- VISTAS ÚTILES
-- ==============================

-- Vista: Ranking de estudiantes por monedas
CREATE VIEW v_ranking_monedas AS
SELECT 
    u.id,
    u.nombre,
    u.balance,
    u.tareas_completadas,
    RANK() OVER (ORDER BY u.balance DESC) as posicion
FROM users u
WHERE u.rol = 'student'
ORDER BY u.balance DESC;

-- Vista: Ranking de estudiantes por tareas completadas
CREATE VIEW v_ranking_tareas AS
SELECT 
    u.id,
    u.nombre,
    u.tareas_completadas,
    u.balance,
    RANK() OVER (ORDER BY u.tareas_completadas DESC) as posicion
FROM users u
WHERE u.rol = 'student'
ORDER BY u.tareas_completadas DESC;

-- Vista: Estadísticas generales del sistema
CREATE VIEW v_estadisticas_generales AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE rol = 'student') as total_estudiantes,
    (SELECT COUNT(*) FROM tasks) as total_tareas,
    (SELECT COUNT(*) FROM tasks WHERE estado = 'activa') as tareas_activas,
    (SELECT COUNT(*) FROM student_tasks WHERE completado = TRUE) as tareas_completadas_total,
    (SELECT SUM(balance) FROM users WHERE rol = 'student') as monedas_circulacion,
    (SELECT AVG(balance) FROM users WHERE rol = 'student') as promedio_monedas_estudiante;

-- Vista: Historial detallado de transacciones
CREATE VIEW v_historial_transacciones AS
SELECT 
    t.id,
    u.nombre as estudiante,
    t.tipo,
    t.cantidad,
    t.descripcion,
    tk.titulo as tarea,
    e.nombre as examen,
    t.fecha
FROM transactions t
JOIN users u ON t.user_id = u.id
LEFT JOIN tasks tk ON t.task_id = tk.id
LEFT JOIN exams e ON t.exam_id = e.id
ORDER BY t.fecha DESC;

-- ==============================
-- DATOS DE PRUEBA
-- ==============================

-- Insertar estudiantes de prueba
-- Insertar con contraseñas HASHEADAS
INSERT INTO users (nombre, email, password, rol, balance, tareas_completadas) VALUES
('María González', 'maria@cced.edu', '$2a$10$YaMy9DrR3ERcmC6Odce62OZmO8J4.TO30Ky4Y4ciH8cSNxSFk5eoS', 'student', 150.00, 5),
('Carlos Rodríguez', 'carlos@cced.edu', '$2a$10$YaMy9DrR3ERcmC6Odce62OZmO8J4.TO30Ky4Y4ciH8cSNxSFk5eoS', 'student', 80.00, 3),
('Ana López', 'ana@cced.edu', '$2a$10$YaMy9DrR3ERcmC6Odce62OZmO8J4.TO30Ky4Y4ciH8cSNxSFk5eoS', 'student', 200.00, 8),
('Pedro Martínez', 'pedro@cced.edu', '$2a$10$YaMy9DrR3ERcmC6Odce62OZmO8J4.TO30Ky4Y4ciH8cSNxSFk5eoS', 'student', 50.00, 2),
('Laura Hernández', 'laura@cced.edu', '$2a$10$YaMy9DrR3ERcmC6Odce62OZmO8J4.TO30Ky4Y4ciH8cSNxSFk5eoS', 'student', 120.00, 4);




-- Insertar tareas de prueba
INSERT INTO tasks (titulo, descripcion, estado, recompensa, fecha_limite, dificultad, creado_por) VALUES
('Tarea Matemáticas - Álgebra', 'Resolver ejercicios de álgebra página 45', 'activa', 25.00, '2024-12-15', 'media', 1),
('Proyecto Ciencias - Ecosistema', 'Investigar ecosistema local - informe 3 páginas', 'activa', 50.00, '2024-12-20', 'dificil', 1),
('Ejercicios Inglés - Verbos', 'Completar tabla verbos irregulares y 10 oraciones', 'activa', 15.00, '2024-12-10', 'facil', 1),
('Ensayo Historia - Revolución Industrial', 'Ensayo de 5 páginas sobre revolución industrial', 'activa', 35.00, '2024-12-18', 'media', 1),
('Problemas Física - Cinemática', 'Resolver 10 problemas de cinemática', 'activa', 30.00, '2024-12-12', 'media', 1),
('Análisis Literario - Don Quijote', 'Analizar capítulo 1 de Don Quijote', 'activa', 20.00, '2024-12-14', 'facil', 1);

-- Insertar exámenes de prueba
INSERT INTO exams (nombre, fecha, nota_minima, nota_maxima, precio_por_punto, creado_por, activo) VALUES
('Examen Final Matemáticas', '2024-12-20', 8.00, 10.00, 10.00, 1, TRUE),
('Examen Parcial Ciencias', '2024-12-15', 7.50, 10.00, 8.00, 1, TRUE),
('Quiz Inglés Avanzado', '2024-12-12', 8.50, 10.00, 12.00, 1, TRUE),
('Evaluación Historia Universal', '2024-12-22', 7.00, 10.00, 15.00, 1, TRUE),
('Examen Física - Mecánica', '2024-12-18', 8.00, 10.00, 9.00, 1, TRUE);

-- Asignar tareas completadas
INSERT INTO student_tasks (user_id, task_id, completado, fecha_completada, calificacion, comentarios) VALUES
(2, 1, TRUE, '2024-12-05 10:00:00', 9.0, 'Excelente trabajo'),
(3, 2, TRUE, '2024-12-06 14:30:00', 8.5, 'Buena investigación'),
(4, 3, TRUE, '2024-12-07 09:15:00', 7.5, 'Algunos errores en verbos'),
(5, 4, TRUE, '2024-12-08 16:45:00', 9.5, 'Ensayo excepcional');

-- Asignar tareas pendientes
INSERT INTO student_tasks (user_id, task_id, completado) VALUES
(2, 3, FALSE),
(2, 5, FALSE),
(3, 1, FALSE),
(3, 6, FALSE),
(4, 2, FALSE),
(5, 1, FALSE),
(6, 1, FALSE),
(6, 3, FALSE);

-- Insertar resultados de exámenes
INSERT INTO exam_results (user_id, exam_id, nota_obtenida, puntos_comprados, monedas_gastadas) VALUES
(2, 1, 7.50, 1, 10.00),
(3, 1, 8.80, 0, 0.00),
(4, 2, 6.00, 2, 16.00),
(5, 1, 7.00, 3, 30.00),
(6, 3, 8.00, 0, 0.00),
(2, 3, 8.20, 0, 0.00),
(3, 2, 7.80, 1, 8.00);

-- Insertar transacciones de ejemplo
INSERT INTO transactions (user_id, tipo, cantidad, descripcion, task_id, exam_id) VALUES
(2, 'ganado_tarea', 25.00, 'Tarea completada: Tarea Matemáticas - Álgebra', 1, NULL),
(3, 'ganado_tarea', 50.00, 'Tarea completada: Proyecto Ciencias - Ecosistema', 2, NULL),
(4, 'ganado_tarea', 15.00, 'Tarea completada: Ejercicios Inglés - Verbos', 3, NULL),
(5, 'ganado_tarea', 35.00, 'Tarea completada: Ensayo Historia - Revolución Industrial', 4, NULL),
(2, 'compra_puntos', -10.00, 'Compra de 1 punto para examen: Examen Final Matemáticas', NULL, 1),
(4, 'compra_puntos', -16.00, 'Compra de 2 puntos para examen: Examen Parcial Ciencias', NULL, 2),
(5, 'compra_puntos', -30.00, 'Compra de 3 puntos para examen: Examen Final Matemáticas', NULL, 1),
(3, 'compra_puntos', -8.00, 'Compra de 1 punto para examen: Examen Parcial Ciencias', NULL, 2);

-- ==============================
-- VERIFICACIÓN FINAL
-- ==============================

SELECT '✅ Base de datos creada exitosamente' as Estado;

-- Mostrar resumen de datos insertados
SELECT * FROM registration_codes;
select * from users;
select * from tasks;

SELECT * FROM student_tasks;
select * from exams;
select * from exams_results;