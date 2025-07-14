const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
require('dotenv').config(); // Load env vars from .env

const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'beichten.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database at', dbPath);
        initializeDatabase();
    }
});

async function initializeDatabase() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS beichten (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                age INTEGER CHECK(age >= 0 AND age <= 150),
                gender TEXT CHECK(gender IN ('male', 'female', 'diverse', 'other')),
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                approved BOOLEAN DEFAULT 0
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('root', 'moderator')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        db.get("SELECT COUNT(*) as count FROM users WHERE role = 'root'", async (err, row) => {
            if (err) {
                console.error('Error checking for root user:', err);
                return;
            }

            if (row.count === 0) {
                try {
                    const saltRounds = 12;
                    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
                    if (!defaultPassword) {
                        console.error('❌ DEFAULT_ADMIN_PASSWORD not set in .env file');
                        return;
                    }

                    const hash = await bcrypt.hash(defaultPassword, saltRounds);

                    db.run(
                        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                        ['root', hash, 'root'],
                        (err) => {
                            if (err) {
                                console.error('Error creating root user:', err);
                            } else {
                                console.log('✅ Root user created with default password (check .env)');
                            }
                        }
                    );
                } catch (error) {
                    console.error('Error hashing password:', error);
                }
            }
        });

        db.get("SELECT COUNT(*) as count FROM beichten", (err, row) => {
            if (err) {
                console.error('Error checking beichten count:', err);
                return;
            }

            if (row.count === 0) {
                const sampleData = [
                    { text: "Ich habe einmal eine Pflanze vergessen zu gießen.", approved: 1 },
                    { text: "Ich habe bei einem Test geschummelt.", approved: 0 }
                ];

                const stmt = db.prepare("INSERT INTO beichten (text, approved) VALUES (?, ?)");
                sampleData.forEach(item => {
                    stmt.run(item.text, item.approved);
                });
                stmt.finalize();
            }
        });
    });
}

// Utility: input sanitization (optional, for frontend/backend middleware)
// Consider adding input validation libraries like zod, joi, express-validator for API routes

function getAllUsers() {
    return new Promise((resolve, reject) => {
        db.all("SELECT id, username, role, created_at FROM users ORDER BY created_at DESC", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function deleteUser(id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM users WHERE id = ?", [id], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
}

function updateBeichte(id, text, age, gender) {
    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE beichten SET text = ?, age = ?, gender = ? WHERE id = ?",
            [text, age, gender, id],
            function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            }
        );
    });
}

function getBeichte(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM beichten WHERE id = ?", [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

module.exports = {
    db,
    getAllUsers,
    deleteUser,
    updateBeichte,
    getBeichte
};
