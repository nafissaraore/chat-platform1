import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import './Dashboard.css';

function Dashboard({ rooms = [], allUsers = [], onlineUsers = [], loading = false }) {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // ✅ Utiliser les données passées par MainLayout plutôt que de les recharger
    const [localLoading, setLocalLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    // ✅ Affichage de loading uniquement pour l'authentification
    if (authLoading) {
        return (
            <div className="dashboard-loading-container">
                <div className="text-center">
                    <div className="dashboard-loading-spinner"></div>
                    <p className="dashboard-loading-text">Authentification en cours...</p>
                </div>
            </div>
        );
    }

    // ✅ Si les données sont en cours de chargement, afficher quand même le dashboard avec un indicateur subtil
    return (
        <div className="dashboard-container">
            <div className="dashboard-chat-central-area">
                <div className="dashboard-chat-placeholder">
                    <MessageCircle className="dashboard-chat-icon" />
                    <h3 className="dashboard-chat-title">
                        Bienvenue sur votre Dashboard {user?.username && `, ${user.username}`}
                    </h3>
                    <p className="dashboard-chat-subtitle">
                        Sélectionnez une salle ou un utilisateur pour commencer la conversation
                    </p>
                    
                    {loading && (
                        <div className="dashboard-loading-indicator">
                            <small>Chargement des données en cours...</small>
                        </div>
                    )}

                    {/* ✅ Statistiques en temps réel */}
                    <div className="dashboard-stats">
                        <div className="dashboard-stat-item">
                            <span className="dashboard-stat-number">{rooms.length}</span>
                            <span className="dashboard-stat-label">Salles disponibles</span>
                        </div>
                        <div className="dashboard-stat-item">
                            <span className="dashboard-stat-number">{onlineUsers.length}</span>
                            <span className="dashboard-stat-label">Utilisateurs en ligne</span>
                        </div>
                        <div className="dashboard-stat-item">
                            <span className="dashboard-stat-number">{allUsers.length}</span>
                            <span className="dashboard-stat-label">Utilisateurs total</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
