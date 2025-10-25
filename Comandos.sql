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


-- ========================================
-- TABLA: Módulos Formativos
-- ========================================
CREATE TABLE IF NOT EXISTS modulos_formativos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    codigo VARCHAR(50) UNIQUE, -- Código único del módulo (ej: INF-401)
    grado VARCHAR(50),
    area VARCHAR(100),
    creditos INT DEFAULT 0, -- Créditos académicos del módulo
    docente_id INT, -- Referencia a users donde rol='admin'
    ano_escolar VARCHAR(20),
    fecha_inicio DATE,
    fecha_fin DATE,
    
    -- Recompensas al completar el módulo
    recompensa_completado DECIMAL(10,2) DEFAULT 100.00, -- Monedas STHELA al aprobar
    recompensa_excelencia DECIMAL(10,2) DEFAULT 200.00, -- Bonus si saca >90
    
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (docente_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_docente (docente_id),
    INDEX idx_activo (activo),
    INDEX idx_codigo (codigo)
) ENGINE=InnoDB;

-- ========================================
-- TABLA: Resultados de Aprendizaje (RA)
-- ========================================
CREATE TABLE IF NOT EXISTS resultados_aprendizaje (
    id INT AUTO_INCREMENT PRIMARY KEY,
    modulo_id INT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    porcentaje DECIMAL(5,2) NOT NULL, -- Debe sumar 100% por módulo
    orden INT NOT NULL,
    
    -- Recompensas por completar este RA
    recompensa_completado DECIMAL(10,2) DEFAULT 10.00, -- Monedas STHELA
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (modulo_id) REFERENCES modulos_formativos(id) ON DELETE CASCADE,
    INDEX idx_modulo (modulo_id),
    CHECK (porcentaje > 0 AND porcentaje <= 100)
) ENGINE=InnoDB;

-- ========================================
-- TABLA: Calificaciones por RA
-- Sistema de 3 oportunidades + evaluación especial
-- ========================================
CREATE TABLE IF NOT EXISTS calificaciones_ra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL, -- Referencia a users donde rol='student'
    ra_id INT NOT NULL,
    modulo_id INT NOT NULL,
    
    -- Las 3 oportunidades iniciales
    oportunidad_1 VARCHAR(10), -- Puede ser número o "NC"
    fecha_oportunidad_1 DATE,
    
    oportunidad_2 VARCHAR(10),
    fecha_oportunidad_2 DATE,
    
    oportunidad_3 VARCHAR(10),
    fecha_oportunidad_3 DATE,
    
    -- Evaluación especial (final del año)
    evaluacion_especial VARCHAR(10),
    fecha_evaluacion_especial DATE,
    
    -- Calificación final del RA
    calificacion_final DECIMAL(5,2),
    completado BOOLEAN DEFAULT FALSE,
    
    -- Integración con sistema de recuperación
    recuperacion_premium BOOLEAN DEFAULT FALSE, -- Si usó monedas para recuperación express
    monedas_gastadas_recuperacion DECIMAL(10,2) DEFAULT 0.00,
    
    -- Recompensa otorgada
    recompensa_recibida BOOLEAN DEFAULT FALSE,
    
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (estudiante_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ra_id) REFERENCES resultados_aprendizaje(id) ON DELETE CASCADE,
    FOREIGN KEY (modulo_id) REFERENCES modulos_formativos(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_estudiante_ra (estudiante_id, ra_id),
    INDEX idx_estudiante (estudiante_id),
    INDEX idx_ra (ra_id),
    INDEX idx_modulo (modulo_id)
) ENGINE=InnoDB;

-- ========================================
-- TABLA: Calificaciones Finales por Módulo
-- ========================================
CREATE TABLE IF NOT EXISTS calificaciones_modulo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    modulo_id INT NOT NULL,
    
    calificacion_final DECIMAL(5,2), -- Suma de todos los RA
    todos_ra_completados BOOLEAN DEFAULT FALSE,
    aprobado BOOLEAN DEFAULT FALSE, -- TRUE si calificación >= 70 y todos RA completados
    nivel_desempeno ENUM('deficiente','aceptable','bueno','muy_bueno','excelente') NULL,
    
    -- Recompensas
    recompensa_recibida BOOLEAN DEFAULT FALSE,
    monedas_ganadas DECIMAL(10,2) DEFAULT 0.00,
    
    fecha_finalizacion DATE,
    ano_escolar VARCHAR(20),
    
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (estudiante_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (modulo_id) REFERENCES modulos_formativos(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_estudiante_modulo (estudiante_id, modulo_id),
    INDEX idx_estudiante (estudiante_id),
    INDEX idx_modulo (modulo_id),
    INDEX idx_aprobado (aprobado)
) ENGINE=InnoDB;

-- ========================================
-- TABLA: Actividades de Recuperación
-- ========================================
CREATE TABLE IF NOT EXISTS actividades_recuperacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    ra_id INT NOT NULL,
    oportunidad INT NOT NULL, -- 1, 2, 3, o 4 (especial)
    
    tipo ENUM('normal','premium') DEFAULT 'normal', -- premium = pagada con monedas
    costo_monedas DECIMAL(10,2) DEFAULT 0.00,
    
    descripcion TEXT,
    archivo_actividad VARCHAR(500), -- Ruta al archivo de la actividad
    archivo_respuesta VARCHAR(500), -- Ruta a la respuesta del estudiante
    
    fecha_asignacion DATE,
    fecha_entrega DATE,
    fecha_limite DATE,
    
    estado ENUM('pendiente','en_revision','completada','rechazada') DEFAULT 'pendiente',
    calificacion DECIMAL(5,2),
    retroalimentacion TEXT,
    
    completada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (estudiante_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ra_id) REFERENCES resultados_aprendizaje(id) ON DELETE CASCADE,
    
    INDEX idx_estudiante (estudiante_id),
    INDEX idx_ra (ra_id),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- ========================================
-- TABLA: Inscripciones a Módulos
-- Para controlar qué estudiantes están en qué módulos
-- ========================================
CREATE TABLE IF NOT EXISTS inscripciones_modulo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    modulo_id INT NOT NULL,
    
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activo','completado','retirado','reprobado') DEFAULT 'activo',
    
    FOREIGN KEY (estudiante_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (modulo_id) REFERENCES modulos_formativos(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_inscripcion (estudiante_id, modulo_id),
    INDEX idx_estudiante (estudiante_id),
    INDEX idx_modulo (modulo_id)
) ENGINE=InnoDB;

-- ========================================
-- AMPLIAR TABLA TRANSACTIONS
-- Agregar nuevos tipos de transacción
-- ========================================
ALTER TABLE transactions 
MODIFY COLUMN tipo ENUM(
    'ganado_tarea',
    'compra_puntos',
    'pago_admin',
    'ajuste',
    'completado_ra',           -- ✨ NUEVO: Ganado por completar RA
    'completado_modulo',        -- ✨ NUEVO: Ganado por aprobar módulo completo
    'bonus_excelencia',         -- ✨ NUEVO: Bonus por calificación >90
    'recuperacion_premium',     -- ✨ NUEVO: Pago por recuperación express
    'reembolso'                 -- ✨ NUEVO: Reembolso por error
) NOT NULL;

-- Agregar columnas para referencias
ALTER TABLE transactions 
ADD COLUMN modulo_id INT NULL AFTER exam_id,
ADD COLUMN ra_id INT NULL AFTER modulo_id,
ADD FOREIGN KEY (modulo_id) REFERENCES modulos_formativos(id) ON DELETE SET NULL,
ADD FOREIGN KEY (ra_id) REFERENCES resultados_aprendizaje(id) ON DELETE SET NULL;

-- ========================================
-- STORED PROCEDURES
-- ========================================

-- Procedimiento para calcular calificación final del módulo
DELIMITER //

DROP PROCEDURE IF EXISTS calcular_calificacion_modulo//

CREATE PROCEDURE calcular_calificacion_modulo(
    IN p_estudiante_id INT,
    IN p_modulo_id INT
)
BEGIN
    DECLARE v_suma_calificaciones DECIMAL(5,2);
    DECLARE v_todos_completados BOOLEAN;
    DECLARE v_total_ra INT;
    DECLARE v_ra_completados INT;
    DECLARE v_nivel_desempeno VARCHAR(20);
    DECLARE v_recompensa DECIMAL(10,2);
    DECLARE v_recompensa_otorgada BOOLEAN;
    
    -- Contar total de RA del módulo
    SELECT COUNT(*) INTO v_total_ra
    FROM resultados_aprendizaje
    WHERE modulo_id = p_modulo_id;
    
    -- Sumar calificaciones de RA completados
    SELECT 
        COALESCE(SUM(calificacion_final), 0),
        COUNT(CASE WHEN completado = TRUE THEN 1 END)
    INTO v_suma_calificaciones, v_ra_completados
    FROM calificaciones_ra
    WHERE estudiante_id = p_estudiante_id 
    AND modulo_id = p_modulo_id;
    
    -- Verificar si todos los RA están completados
    SET v_todos_completados = (v_ra_completados = v_total_ra);
    
    -- Determinar nivel de desempeño
    IF v_suma_calificaciones >= 90 THEN
        SET v_nivel_desempeno = 'excelente';
    ELSEIF v_suma_calificaciones >= 80 THEN
        SET v_nivel_desempeno = 'muy_bueno';
    ELSEIF v_suma_calificaciones >= 70 THEN
        SET v_nivel_desempeno = 'bueno';
    ELSEIF v_suma_calificaciones >= 60 THEN
        SET v_nivel_desempeno = 'aceptable';
    ELSE
        SET v_nivel_desempeno = 'deficiente';
    END IF;
    
    -- Obtener recompensa del módulo
    SELECT 
        CASE 
            WHEN v_suma_calificaciones >= 90 THEN recompensa_excelencia
            ELSE recompensa_completado
        END
    INTO v_recompensa
    FROM modulos_formativos
    WHERE id = p_modulo_id;
    
    -- Verificar si ya se otorgó recompensa
    SELECT recompensa_recibida INTO v_recompensa_otorgada
    FROM calificaciones_modulo
    WHERE estudiante_id = p_estudiante_id AND modulo_id = p_modulo_id;
    
    -- Actualizar o insertar en calificaciones_modulo
    INSERT INTO calificaciones_modulo 
        (estudiante_id, modulo_id, calificacion_final, todos_ra_completados, 
         aprobado, nivel_desempeno, monedas_ganadas, recompensa_recibida)
    VALUES 
        (p_estudiante_id, p_modulo_id, v_suma_calificaciones, v_todos_completados,
         (v_todos_completados AND v_suma_calificaciones >= 70), 
         v_nivel_desempeno, 
         CASE WHEN v_todos_completados AND v_suma_calificaciones >= 70 AND (v_recompensa_otorgada IS NULL OR v_recompensa_otorgada = FALSE) 
              THEN v_recompensa ELSE 0 END,
         CASE WHEN v_todos_completados AND v_suma_calificaciones >= 70 
              THEN TRUE ELSE FALSE END)
    ON DUPLICATE KEY UPDATE
        calificacion_final = v_suma_calificaciones,
        todos_ra_completados = v_todos_completados,
        aprobado = (v_todos_completados AND v_suma_calificaciones >= 70),
        nivel_desempeno = v_nivel_desempeno,
        monedas_ganadas = CASE 
            WHEN v_todos_completados AND v_suma_calificaciones >= 70 AND recompensa_recibida = FALSE 
            THEN v_recompensa 
            ELSE monedas_ganadas 
        END,
        recompensa_recibida = CASE 
            WHEN v_todos_completados AND v_suma_calificaciones >= 70 
            THEN TRUE 
            ELSE recompensa_recibida 
        END,
        updated_at = CURRENT_TIMESTAMP;
        
    -- Otorgar monedas si aprobó y no se había otorgado antes
    IF v_todos_completados AND v_suma_calificaciones >= 70 AND (v_recompensa_otorgada IS NULL OR v_recompensa_otorgada = FALSE) THEN
        -- Actualizar balance del estudiante
        UPDATE users 
        SET balance = balance + v_recompensa
        WHERE id = p_estudiante_id;
        
        -- Registrar transacción
        INSERT INTO transactions (user_id, tipo, cantidad, descripcion, modulo_id)
        VALUES (
            p_estudiante_id, 
            CASE WHEN v_suma_calificaciones >= 90 THEN 'bonus_excelencia' ELSE 'completado_modulo' END,
            v_recompensa,
            CONCAT('Módulo completado: ', (SELECT nombre FROM modulos_formativos WHERE id = p_modulo_id)),
            p_modulo_id
        );
    END IF;
END//

DELIMITER ;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger: Otorgar recompensa al completar RA
DELIMITER //

DROP TRIGGER IF EXISTS after_ra_completado//

CREATE TRIGGER after_ra_completado
AFTER UPDATE ON calificaciones_ra
FOR EACH ROW
BEGIN
    DECLARE v_recompensa DECIMAL(10,2);
    DECLARE v_ra_nombre VARCHAR(200);
    
    -- Si el RA se acaba de completar y no se había otorgado recompensa
    IF NEW.completado = TRUE AND OLD.completado = FALSE AND NEW.recompensa_recibida = FALSE THEN
        
        -- Obtener recompensa y nombre del RA
        SELECT recompensa_completado, nombre 
        INTO v_recompensa, v_ra_nombre
        FROM resultados_aprendizaje
        WHERE id = NEW.ra_id;
        
        -- Actualizar balance del estudiante
        UPDATE users 
        SET balance = balance + v_recompensa
        WHERE id = NEW.estudiante_id;
        
        -- Registrar transacción
        INSERT INTO transactions (user_id, tipo, cantidad, descripcion, modulo_id, ra_id)
        VALUES (
            NEW.estudiante_id,
            'completado_ra',
            v_recompensa,
            CONCAT('RA completado: ', v_ra_nombre),
            NEW.modulo_id,
            NEW.ra_id
        );
        
        -- Marcar recompensa como recibida
        UPDATE calificaciones_ra
        SET recompensa_recibida = TRUE
        WHERE id = NEW.id;
        
        -- Recalcular calificación del módulo
        CALL calcular_calificacion_modulo(NEW.estudiante_id, NEW.modulo_id);
    END IF;
END//

DELIMITER ;

-- Trigger: Recalcular al insertar nueva calificación
DELIMITER //

DROP TRIGGER IF EXISTS after_calificacion_ra_insert//

CREATE TRIGGER after_calificacion_ra_insert
AFTER INSERT ON calificaciones_ra
FOR EACH ROW
BEGIN
    CALL calcular_calificacion_modulo(NEW.estudiante_id, NEW.modulo_id);
END//

DELIMITER ;

-- ========================================
-- VISTAS ÚTILES
-- ========================================

-- Vista: Progreso de estudiantes por módulo
CREATE OR REPLACE VIEW v_progreso_estudiantes_modulos AS
SELECT 
    cm.estudiante_id,
    u.nombre as estudiante_nombre,
    u.email,
    cm.modulo_id,
    mf.nombre as modulo_nombre,
    mf.codigo as modulo_codigo,
    COUNT(DISTINCT ra.id) as total_ra,
    SUM(CASE WHEN cr.completado = TRUE THEN 1 ELSE 0 END) as ra_completados,
    ROUND((SUM(CASE WHEN cr.completado = TRUE THEN 1 ELSE 0 END) / COUNT(DISTINCT ra.id)) * 100, 2) as porcentaje_avance,
    cm.calificacion_final,
    cm.nivel_desempeno,
    cm.aprobado,
    cm.monedas_ganadas
FROM calificaciones_modulo cm
JOIN users u ON cm.estudiante_id = u.id
JOIN modulos_formativos mf ON cm.modulo_id = mf.id
LEFT JOIN resultados_aprendizaje ra ON mf.id = ra.modulo_id
LEFT JOIN calificaciones_ra cr ON cm.estudiante_id = cr.estudiante_id AND ra.id = cr.ra_id
WHERE u.rol = 'student'
GROUP BY cm.estudiante_id, cm.modulo_id;

-- Vista: Estadísticas por módulo
CREATE OR REPLACE VIEW v_estadisticas_modulo AS
SELECT 
    mf.id as modulo_id,
    mf.nombre as modulo_nombre,
    mf.codigo,
    COUNT(DISTINCT im.estudiante_id) as total_inscritos,
    COUNT(DISTINCT CASE WHEN cm.aprobado = TRUE THEN cm.estudiante_id END) as estudiantes_aprobados,
    COUNT(DISTINCT CASE WHEN cm.aprobado = FALSE THEN cm.estudiante_id END) as estudiantes_reprobados,
    ROUND(AVG(cm.calificacion_final), 2) as promedio_modulo,
    ROUND((COUNT(DISTINCT CASE WHEN cm.aprobado = TRUE THEN cm.estudiante_id END) / 
           NULLIF(COUNT(DISTINCT im.estudiante_id), 0)) * 100, 2) as porcentaje_aprobados,
    SUM(CASE WHEN cm.recompensa_recibida = TRUE THEN cm.monedas_ganadas ELSE 0 END) as monedas_distribuidas
FROM modulos_formativos mf
LEFT JOIN inscripciones_modulo im ON mf.id = im.modulo_id
LEFT JOIN calificaciones_modulo cm ON mf.id = cm.modulo_id AND im.estudiante_id = cm.estudiante_id
WHERE mf.activo = TRUE
GROUP BY mf.id;

-- Vista: Dashboard integrado del estudiante
CREATE OR REPLACE VIEW v_dashboard_estudiante AS
SELECT 
    u.id as estudiante_id,
    u.nombre,
    u.email,
    u.balance as monedas_disponibles,
    u.tareas_completadas,
    COUNT(DISTINCT st.id) as tareas_activas,
    COUNT(DISTINCT im.modulo_id) as modulos_inscritos,
    COUNT(DISTINCT CASE WHEN cm.aprobado = TRUE THEN cm.modulo_id END) as modulos_aprobados,
    COUNT(DISTINCT er.exam_id) as examenes_realizados,
    ROUND(AVG(CASE WHEN cm.calificacion_final IS NOT NULL THEN cm.calificacion_final END), 2) as promedio_modulos,
    ROUND(AVG(er.nota_final), 2) as promedio_examenes
FROM users u
LEFT JOIN student_tasks st ON u.id = st.user_id AND st.completado = FALSE
LEFT JOIN inscripciones_modulo im ON u.id = im.estudiante_id AND im.estado = 'activo'
LEFT JOIN calificaciones_modulo cm ON u.id = cm.estudiante_id
LEFT JOIN exam_results er ON u.id = er.user_id
WHERE u.rol = 'student'
GROUP BY u.id;