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

CREATE TABLE exam_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tipo_archivo VARCHAR(100),
    tamanio INT,
    subido_por INT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (subido_por) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_exam (exam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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


-- ==========================================
-- TABLAS PARA SISTEMA DE CALIFICACIONES
-- ==========================================

-- Tabla: Periodos Escolares
CREATE TABLE periodos_escolares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_activo (activo),
    INDEX idx_year (year)
) ENGINE=InnoDB;

-- Tabla: Tipos de Materia
CREATE TABLE tipos_materia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    
    -- 'academica' o 'formativa'
    tipo ENUM('academica', 'formativa') NOT NULL
) ENGINE=InnoDB;

-- Insertar tipos por defecto
INSERT INTO tipos_materia (nombre, tipo, descripcion) VALUES
('Académica', 'academica', 'Materias académicas básicas (Matemáticas, Español, etc.)'),
('Módulo Formativo', 'formativa', 'Módulos formativos con Resultados de Aprendizaje');

-- Tabla: Materias/Módulos
CREATE TABLE materias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    descripcion TEXT,
    tipo_id INT NOT NULL,
    creditos INT DEFAULT 1,
    grado INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tipo_id) REFERENCES tipos_materia(id),
    INDEX idx_grado (grado),
    INDEX idx_activo (activo)
) ENGINE=InnoDB;

-- Tabla: Resultados de Aprendizaje (solo para módulos formativos)
CREATE TABLE resultados_aprendizaje (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    porcentaje DECIMAL(5,2) NOT NULL, -- % del módulo (ej: 15.00)
    orden INT NOT NULL,
    
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    INDEX idx_materia (materia_id),
    
    -- Validar que el porcentaje esté entre 0 y 100
    CHECK (porcentaje >= 0 AND porcentaje <= 100)
) ENGINE=InnoDB;

-- Tabla: Asignación Docente-Materia-Periodo
CREATE TABLE asignaciones_docentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    docente_id INT NOT NULL,
    materia_id INT NOT NULL,
    periodo_id INT NOT NULL,
    seccion VARCHAR(10),
    
    FOREIGN KEY (docente_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    FOREIGN KEY (periodo_id) REFERENCES periodos_escolares(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_assignment (docente_id, materia_id, periodo_id, seccion),
    INDEX idx_docente (docente_id),
    INDEX idx_materia (materia_id),
    INDEX idx_periodo (periodo_id)
) ENGINE=InnoDB;

-- Tabla: Inscripciones (Estudiante-Materia-Periodo)
CREATE TABLE inscripciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    materia_id INT NOT NULL,
    periodo_id INT NOT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (estudiante_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    FOREIGN KEY (periodo_id) REFERENCES periodos_escolares(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_inscription (estudiante_id, materia_id, periodo_id),
    INDEX idx_estudiante (estudiante_id),
    INDEX idx_materia (materia_id),
    INDEX idx_periodo (periodo_id)
) ENGINE=InnoDB;

-- Tabla: Calificaciones Académicas (materias básicas)
CREATE TABLE calificaciones_academicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inscripcion_id INT NOT NULL,
    periodo_evaluacion INT NOT NULL, -- 1, 2, 3, 4 (trimestres)
    calificacion DECIMAL(5,2) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registrado_por INT NOT NULL,
    
    FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES users(id),
    
    UNIQUE KEY unique_academic_grade (inscripcion_id, periodo_evaluacion),
    INDEX idx_inscripcion (inscripcion_id),
    
    CHECK (calificacion >= 0 AND calificacion <= 100)
) ENGINE=InnoDB;

-- Tabla: Calificaciones Módulos Formativos (con RA)
CREATE TABLE calificaciones_modulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inscripcion_id INT NOT NULL,
    resultado_aprendizaje_id INT NOT NULL,
    oportunidad INT NOT NULL, -- 1, 2, 3, o 4 (evaluación especial)
    calificacion DECIMAL(5,2), -- NULL = NC (No Completado)
    completado BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registrado_por INT NOT NULL,
    
    FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id) ON DELETE CASCADE,
    FOREIGN KEY (resultado_aprendizaje_id) REFERENCES resultados_aprendizaje(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES users(id),
    
    UNIQUE KEY unique_module_grade (inscripcion_id, resultado_aprendizaje_id, oportunidad),
    INDEX idx_inscripcion (inscripcion_id),
    INDEX idx_ra (resultado_aprendizaje_id),
    
    CHECK (oportunidad BETWEEN 1 AND 4),
    CHECK (calificacion IS NULL OR (calificacion >= 0 AND calificacion <= 100))
) ENGINE=InnoDB;

-- Tabla: Situación Final del Estudiante
CREATE TABLE situacion_final (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    periodo_id INT NOT NULL,
    materia_id INT NOT NULL,
    calificacion_final DECIMAL(5,2),
    situacion ENUM('aprobado', 'reprobado', 'pendiente') DEFAULT 'pendiente',
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (estudiante_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (periodo_id) REFERENCES periodos_escolares(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_final_grade (estudiante_id, periodo_id, materia_id),
    INDEX idx_estudiante (estudiante_id),
    INDEX idx_periodo (periodo_id),
    INDEX idx_situacion (situacion)
) ENGINE=InnoDB;

-- Tabla: Historial de Cambios (Auditoría)
CREATE TABLE historial_calificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_calificacion ENUM('academica', 'modulo') NOT NULL,
    calificacion_id INT NOT NULL,
    campo_modificado VARCHAR(50),
    valor_anterior VARCHAR(100),
    valor_nuevo VARCHAR(100),
    modificado_por INT NOT NULL,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT,
    
    FOREIGN KEY (modificado_por) REFERENCES users(id),
    INDEX idx_tipo (tipo_calificacion),
    INDEX idx_calificacion (calificacion_id),
    INDEX idx_fecha (fecha_modificacion)
) ENGINE=InnoDB;