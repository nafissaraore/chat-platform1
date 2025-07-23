const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    // ✅ Version flexible qui accepte soit un objet, soit des paramètres individuels
    static async create(usernameOrData, email = null, password = null, role = 'user') {
        let username, finalEmail, finalPassword, finalRole;
        
        // Si le premier paramètre est un objet
        if (typeof usernameOrData === 'object' && usernameOrData !== null) {
            const data = usernameOrData;
            username = data.username;
            finalEmail = data.email;
            finalPassword = data.password;
            finalRole = data.role || 'user';
        } else {
            // Si ce sont des paramètres individuels
            username = usernameOrData;
            finalEmail = email;
            finalPassword = password;
            finalRole = role;
        }
        
        // Validation des données
        if (!username || !finalEmail || !finalPassword) {
            throw new Error('Username, email et password sont requis');
        }
        
        try {
            const [result] = await db.execute(
                'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                [username, finalEmail, finalPassword, finalRole]
            );
            return result.insertId;
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            throw error;
        }
    }

    static async findByEmail(email) {
        if (!email) {
            throw new Error('Email requis pour la recherche');
        }
        
        try {
            const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
            return rows[0];
        } catch (error) {
            console.error('Erreur lors de la recherche par email:', error);
            throw error;
        }
    }

    static async findById(id) {
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId)) {
            console.error(`[User.findById] ID non valide fourni: ${id}`);
            return null;
        }
        try {
            const [rows] = await db.execute('SELECT id, username, email, role FROM users WHERE id = ?', [parsedId]);
            return rows[0];
        } catch (error) {
            console.error(`[User.findById] Erreur lors de la recherche de l'utilisateur par ID ${parsedId}:`, error);
            return null;
        }
    }

    static async findAll() {
        try {
            const [rows] = await db.execute('SELECT id, username, email, role, created_at FROM users ORDER BY username ASC');
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération de tous les utilisateurs:', error);
            throw error;
        }
    }

    static async updateRole(userId, role) {
        try {
            const [result] = await db.execute(
                'UPDATE users SET role = ? WHERE id = ?',
                [role, userId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du rôle:', error);
            throw error;
        }
    }

    static async searchUsers(searchTerm) {
        if (!searchTerm) {
            return [];
        }
        
        try {
            const [rows] = await db.execute(
                `SELECT u.id, u.username, u.email, u.role, p.photo_url, p.intention 
                 FROM users u
                 LEFT JOIN profiles p ON u.id = p.user_id
                 WHERE u.username LIKE ? OR u.email LIKE ?`,
                [`%${searchTerm}%`, `%${searchTerm}%`]
            );
            return rows;
        } catch (error) {
            console.error('Erreur lors de la recherche d\'utilisateurs:', error);
            throw error;
        }
    }
}

module.exports = User;