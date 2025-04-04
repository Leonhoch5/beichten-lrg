const express = require('express');
const router = express.Router();
const db = require('./database');
const bcrypt = require('bcrypt');
const auth = require('./auth');
const path = require('path');

// Authentication routes
router.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await auth.authenticate(username, password);
        
        if (user) {
            req.session.user = {
                id: user.id,
                username: user.username,
                role: user.role
            };
            res.json({ success: true, user: req.session.user });
        } else {
            res.status(401).json({ error: 'Ungültige Anmeldedaten' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login fehlgeschlagen' });
    }
});

router.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout fehlgeschlagen' });
        }
        res.json({ success: true });
    });
});

router.get('/api/session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// User management routes
router.get('/api/users', auth.requireAuth('root'), async (req, res) => {
    try {
        const users = await db.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Benutzer konnten nicht geladen werden' });
    }
});

router.post('/api/users', auth.requireAuth('root'), async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        if (!['root', 'moderator'].includes(role)) {
            return res.status(400).json({ error: 'Ungültige Rolle' });
        }
        
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);
        
        db.db.run(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            [username, hash, role],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Benutzername existiert bereits' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                res.json({ id: this.lastID });
            }
        );
    } catch (error) {
        console.error('User creation error:', error);
        res.status(500).json({ error: 'Benutzererstellung fehlgeschlagen' });
    }
});

router.put('/api/users/password', auth.requireAuth(), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = req.session.user;
        
        // Verify current password
        const valid = await auth.authenticate(user.username, currentPassword);
        if (!valid) {
            return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
        }
        
        // Update password
        const saltRounds = 10;
        const hash = await bcrypt.hash(newPassword, saltRounds);
        
        db.db.run(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            [hash, user.id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true });
            }
        );
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Passwortänderung fehlgeschlagen' });
    }
});

router.delete('/api/users/:id', auth.requireAuth('root'), async (req, res) => {
    try {
        // Prevent root from deleting themselves
        if (req.session.user.id === parseInt(req.params.id)) {
            return res.status(400).json({ error: 'Sie können Ihr eigenes Konto nicht löschen' });
        }
        
        const changes = await db.deleteUser(req.params.id);
        if (changes > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Benutzer konnte nicht gelöscht werden' });
    }
});

router.get('/api/beichten', (req, res) => {
    db.db.all("SELECT * FROM beichten WHERE approved = 1 ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

router.get('/api/beichten/pending', auth.requireAuth(), (req, res) => {
    db.db.all("SELECT * FROM beichten WHERE approved = 0 ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

router.get('/api/beichten/approved', auth.requireAuth(), (req, res) => {
    db.db.all("SELECT * FROM beichten WHERE approved = 1 ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

router.get('/api/beichten/:id', auth.requireAuth(), async (req, res) => {
    try {
        const beichte = await db.getBeichte(req.params.id);
        if (beichte) {
            res.json(beichte);
        } else {
            res.status(404).json({ error: 'Beichte nicht gefunden' });
        }
    } catch (error) {
        console.error('Error fetching beichte:', error);
        res.status(500).json({ error: 'Beichte konnte nicht geladen werden' });
    }
});

router.post('/api/beichten', (req, res) => {
    const { text, age, gender } = req.body;
    db.db.run(
        "INSERT INTO beichten (text, age, gender) VALUES (?, ?, ?)",
        [text, age, gender],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        }
    );
});

router.put('/api/beichten/:id', auth.requireAuth(), async (req, res) => {
    const { text, age, gender } = req.body;
    try {
        const changes = await db.updateBeichte(req.params.id, text, age, gender);
        if (changes > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Beichte nicht gefunden' });
        }
    } catch (error) {
        console.error('Error updating beichte:', error);
        res.status(500).json({ error: 'Beichte konnte nicht aktualisiert werden' });
    }
});

router.put('/api/beichten/:id/approve', auth.requireAuth(), (req, res) => {
    db.db.run(
        "UPDATE beichten SET approved = 1 WHERE id = ?",
        [req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ changes: this.changes });
        }
    );
});

router.delete('/api/beichten/:id', auth.requireAuth(), (req, res) => {
    db.db.run(
        "DELETE FROM beichten WHERE id = ?",
        [req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ changes: this.changes });
        }
    );
});

// Serve HTML pages
router.get('/', (req, res) => {
    res.sendFile('index.html', { root: path.join(__dirname, '../public') });
});

router.get('/blog', (req, res) => {
    res.sendFile('blog.html', { root: path.join(__dirname, '../public') });
});

router.get('/admin', (req, res) => {
    res.sendFile('admin.html', { root: path.join(__dirname, '../public') });
});

module.exports = router;