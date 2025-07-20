// frontend/src/components/DebugPanel.js
import React from 'react';
import './DebugPanel.css'; // Créez ce fichier CSS si vous voulez styliser le panneau

function DebugPanel({ user, onlineUsers, allUsers, rooms }) {
    return (
        <div className="debug-panel">
            <h4 className="debug-panel-title">Panneau de Débogage</h4>
            <div className="debug-section">
                <h5>Utilisateur Actuel:</h5>
                <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>
            <div className="debug-section">
                <h5>Utilisateurs en Ligne (via Socket.IO):</h5>
                <pre>{JSON.stringify(onlineUsers, null, 2)}</pre>
            </div>
            <div className="debug-section">
                <h5>Tous les Utilisateurs (via API REST):</h5>
                <pre>{JSON.stringify(allUsers, null, 2)}</pre>
            </div>
            <div className="debug-section">
                <h5>Salles de Discussion:</h5>
                <pre>{JSON.stringify(rooms, null, 2)}</pre>
            </div>
        </div>
    );
}

export default DebugPanel;
