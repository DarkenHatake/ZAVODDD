const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Создание таблиц при запуске
async function initializeDatabase() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'client',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS repair_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        machine_name VARCHAR(255) NOT NULL,
        serial_number VARCHAR(100),
        issue_description TEXT NOT NULL,
        urgency_level VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        contact_name VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(50) NOT NULL,
        contact_email VARCHAR(255)
      );
    `);

        // Создаем администратора по умолчанию
        await pool.query(`
      INSERT INTO users (username, password_hash, role)
      SELECT 'admin', '$2a$10$xn3LI0jF3H7rOVvOWQ2T9.7Dpz3Z/NRlR4UoL7J9zL3sYF5sJQ5O', 'admin'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin')
    `);

        console.log('Database tables initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

module.exports = { pool, initializeDatabase };