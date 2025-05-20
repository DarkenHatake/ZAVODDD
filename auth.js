const bcrypt = require('bcrypt');
const { pool } = require('./database');
const crypto = require('crypto');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRATION_DAYS = 7;

async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

async function createUser(username, password, role = 'client') {
    const passwordHash = await hashPassword(password);
    const { rows } = await pool.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
        [username, passwordHash, role]
    );
    return rows[0];
}

async function findUserByUsername(username) {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return rows[0];
}

async function createSession(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRATION_DAYS);

    const { rows } = await pool.query(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
        [userId, token, expiresAt]
    );
    return rows[0];
}

async function findSessionByToken(token) {
    const { rows } = await pool.query(
        'SELECT s.*, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1 AND s.expires_at > NOW()',
        [token]
    );
    return rows[0];
}

async function deleteSession(token) {
    await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
}

module.exports = {
    hashPassword,
    verifyPassword,
    createUser,
    findUserByUsername,
    createSession,
    findSessionByToken,
    deleteSession
};