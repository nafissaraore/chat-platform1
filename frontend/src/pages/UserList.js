// frontend/src/pages/UserList.js
import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import './UserList.css'; // Importe le fichier CSS

function UserList() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            navigate('/login');
            return;
        }

        const fetchUsers = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await api.get('/users');
                setUsers(response.data.filter(u => u.id !== user.id));
            } catch (err) {
                console.error('Erreur lors de la récupération des utilisateurs:', err);
                setError(err.response?.data?.message || 'Impossible de charger la liste des utilisateurs.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [user, authLoading, navigate]);

    if (authLoading || loading) {
        return <div className="user-list-loading-message">Chargement des utilisateurs...</div>;
    }

    if (error) {
        return <div className="user-list-error-message">{error}</div>;
    }

    return (
        <div className="user-list-container">
            <h2 className="user-list-title">Tous les Utilisateurs</h2>
            {users.length === 0 ? (
                <p className="user-list-no-users-text">Aucun autre utilisateur trouvé.</p>
            ) : (
                <div className="user-grid">
                    {users.map(u => (
                        <div key={u.id} className="user-card">
                            <img src="https://placehold.co/60x60/cccccc/ffffff?text=U" alt="Avatar de l'utilisateur" className="user-card-avatar" />
                            <h3 className="user-card-username">{u.username}</h3>
                            
                            <Link
                                to={`/private-chat/${u.id}`}
                                className="user-card-message-button"
                            >
                                Message privé
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default UserList;
