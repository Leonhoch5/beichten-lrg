const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'beichten.db');

// Initialize database
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
        // Create beichten table
        db.run(`
            CREATE TABLE IF NOT EXISTS beichten (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                age INTEGER,
                gender TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                approved BOOLEAN DEFAULT 0
            )
        `);
        
        // Create users table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,  -- 'root' or 'moderator'
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create root user if not exists
        db.get("SELECT COUNT(*) as count FROM users WHERE role = 'root'", async (err, row) => {
            if (err) {
                console.error('Error checking for root user:', err);
                return;
            }
            
            if (row.count === 0) {
                try {
                    const saltRounds = 10;
                    const defaultPassword = 'admin123'; // CHANGE THIS IN PRODUCTION!
                    const hash = await bcrypt.hash(defaultPassword, saltRounds);
                    
                    db.run(
                        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                        ['root', hash, 'root'],
                        (err) => {
                            if (err) {
                                console.error('Error creating root user:', err);
                            } else {
                                console.log('Root user created with default password "admin123"');
                            }
                        }
                    );
                } catch (error) {
                    console.error('Error hashing password:', error);
                }
            }
        });
        
        // Insert sample beichten if empty
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

// Database helper functions
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