// backend/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || '91.204.209.25', // ✅ IP cPanel
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'pgroupeb_traorenafissa',
    password: process.env.DB_PASSWORD || 'Miss@traore',
    database: process.env.DB_NAME || 'pgroupeb_chat_platform',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // ❌ Supprimer ou commenter la ligne suivante si ton serveur ne supporte pas SSL :
    // ssl: { rejectUnauthorized: false }
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connexion à la base de données réussie !');
        connection.release();
    } catch (error) {
        console.error('❌ Erreur de connexion à la base de données :', error.message);
    }
}

if (process.env.NODE_ENV !== 'production') {
    testConnection();
}

module.exports = pool;
