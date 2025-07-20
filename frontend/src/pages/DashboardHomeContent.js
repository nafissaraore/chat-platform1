// frontend/src/pages/DashboardHomeContent.js
import React from 'react';
import styles from './Dashboard.module.css'; // Réutilise les styles du Dashboard pour le message de bienvenue

function DashboardHomeContent() {
    return (
        <div className={styles.chatArea}> {/* Utilise la classe chatArea définie dans Dashboard.module.css */}
            <div className={styles.welcomeMessageContainer}>
                <span className={styles.welcomeIcon}>👋</span>
                <h3 className={styles.welcomeTitle}>Bienvenue sur Simpion Chat !</h3>
                <p className={styles.welcomeText}>Sélectionnez une conversation pour commencer à discuter.</p>
            </div>
        </div>
    );
}

export default DashboardHomeContent;
