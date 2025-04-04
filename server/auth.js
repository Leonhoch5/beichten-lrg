const bcrypt = require('bcrypt');
const db = require('./database');

const auth = {
    authenticate: async (username, password) => {
        return new Promise((resolve, reject) => {
            db.db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
                if (err) return reject(err);
                if (!user) return resolve(null);
                
                try {
                    const match = await bcrypt.compare(password, user.password_hash);
                    resolve(match ? user : null);
                } catch (error) {
                    reject(error);
                }
            });
        });
    },
    
    requireAuth: (requiredRole) => {
        return (req, res, next) => {
           
            
            if (requiredRole && req.session.user.role !== requiredRole) {
                return res.status(403).json({ error: 'Unzureichende Berechtigungen' });
            }
            
            next();
        };
    }
};

module.exports = auth;