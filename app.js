const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { pool, initializeDatabase } = require('./database');
const auth = require('./auth');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Проверяем, существует ли пользователь
        const existingUser = await auth.findUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const user = await auth.createUser(username, password);
        res.status(201).json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Добавляем маршруты для страниц входа и регистрации
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});
// Middleware для проверки аутентификации
async function authenticate(req, res, next) {
    const token = req.cookies?.session_token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await auth.findSessionByToken(token);
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = { id: session.user_id, role: session.role };
    next();
}

// Middleware для проверки роли администратора
function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
}

// Добавляем cookie-parser
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Маршруты аутентификации
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await auth.findUserByUsername(username);
        if (!user || !(await auth.verifyPassword(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const session = await auth.createSession(user.id);

        res.cookie('session_token', session.token, {
            httpOnly: true,
            expires: session.expires_at,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/logout', async (req, res) => {
    const token = req.cookies?.session_token;

    if (token) {
        await auth.deleteSession(token);
    }

    res.clearCookie('session_token');
    res.json({ message: 'Logged out successfully' });
});

app.get('/api/me', authenticate, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, username, role FROM users WHERE id = $1', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Обновляем маршруты для заявок с учетом аутентификации
app.post('/api/requests', authenticate, async (req, res) => {
    const {
        machine_name,
        serial_number,
        issue_description,
        urgency_level,
        contact_name,
        contact_phone,
        contact_email
    } = req.body;

    try {
        const { rows } = await pool.query(
            `INSERT INTO repair_requests (
        user_id, machine_name, serial_number, issue_description, 
        urgency_level, contact_name, contact_phone, contact_email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                req.user.id,
                machine_name,
                serial_number,
                issue_description,
                urgency_level,
                contact_name,
                contact_phone,
                contact_email || null
            ]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Защищаем маршруты администратора
app.get('/api/admin/requests', authenticate, requireAdmin, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM repair_requests ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Обновляем HTML маршруты
app.get('/dashboard', authenticate, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});
// Инициализация базы данных
initializeDatabase();

// Маршруты API
app.get('/api/requests', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM repair_requests ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/requests', async (req, res) => {
    const {
        machine_name,
        serial_number,
        issue_description,
        urgency_level,
        contact_name,
        contact_phone,
        contact_email
    } = req.body;

    try {
        const { rows } = await pool.query(
            `INSERT INTO repair_requests (
        machine_name, serial_number, issue_description, 
        urgency_level, contact_name, contact_phone, contact_email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                machine_name,
                serial_number,
                issue_description,
                urgency_level,
                contact_name,
                contact_phone,
                contact_email || null
            ]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/requests/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const { rows } = await pool.query(
            'UPDATE repair_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Получение деталей конкретной заявки
app.get('/api/requests/:id', authenticate, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT r.*, u.username 
             FROM repair_requests r
             LEFT JOIN users u ON r.user_id = u.id
             WHERE r.id = $1`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }

        // Проверяем права (админ или владелец заявки)
        if (req.user.role !== 'admin' && req.user.id !== rows[0].user_id) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching request details:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление статуса заявки
app.put('/api/requests/:id/status', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Недопустимый статус' });
    }

    try {
        const { rows } = await pool.query(
            `UPDATE repair_requests 
             SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 
             RETURNING *`,
            [status, id]
        );

        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Ошибка обновления статуса' });
    }
});
// HTML маршруты
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/request/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'request-details.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});