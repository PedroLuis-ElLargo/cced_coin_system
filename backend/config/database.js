// ==============================
// DATABASE.JS - Configuración MySQL
// ==============================

const mysql = require("mysql2/promise");
require("dotenv").config();

// Crear pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "cced_coin_system",
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Verificar conexión al iniciar
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conexión exitosa a MySQL");

    // Verificar que las tablas existan
    const [tables] = await connection.execute(
      `
            SELECT TABLE_NAME 
            FROM information_schema.tables 
            WHERE TABLE_SCHEMA = ?
        `,
      [process.env.DB_NAME || "cced_coin_system"]
    );

    console.log(`📊 Base de datos cargada con ${tables.length} tablas`);
    connection.release();
    return true;
  } catch (err) {
    console.error("❌ Error al conectar a MySQL:", err.message);
    process.exit(1);
  }
};

// Función helper para ejecutar queries con manejo de errores
const query = async (sql, params) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("Error en query:", error);
    throw error;
  }
};

// Función helper para transacciones
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  initializeDatabase,
};
