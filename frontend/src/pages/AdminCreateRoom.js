// frontend/src/pages/AdminCreateRoom.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../utils/api';
import './AdminCreateRoom.css'; // Importe le fichier CSS

function AdminCreateRoom() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'admin') {
                navigate('/dashboard');
            }
        }
    }, [user, authLoading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (isPrivate && !password) {
            setError('Veuillez définir un mot de passe pour une salle privée.');
            return;
        }

        try {
            const roomData = {
                name,
                description,
                isPrivate,
                password: isPrivate ? password : undefined
            };

            const response = await api.post('/rooms', roomData);
            
            setMessage(response.data.message || 'Salle créée avec succès !');
            setName('');
            setDescription('');
            setIsPrivate(false);
            setPassword('');
        } catch (err) {
            console.error('Erreur réseau ou du serveur:', err);
            setError(err.response?.data?.message || 'Impossible de se connecter au serveur pour créer la salle.');
        }
    };

    if (authLoading) {
        return <div className="admin-room-loading-message">Vérification des permissions...</div>;
    }

    return (
        <div className="admin-room-container">
            <h2 className="admin-room-title">Créer une Nouvelle Salle (Admin)</h2>
            {error && <p className="admin-room-error">{error}</p>}
            {message && <p className="admin-room-success">{message}</p>}
            <form onSubmit={handleSubmit} className="admin-room-form">
                <div className="form-group">
                    <label htmlFor="name" className="form-label">Nom de la salle:</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description" className="form-label">Description:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        className="form-textarea"
                    />
                </div>
                <div className="form-group-checkbox">
                    <input
                        type="checkbox"
                        id="isPrivate"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="form-checkbox"
                    />
                    <label htmlFor="isPrivate" className="form-label-checkbox">Salle privée ?</label>
                </div>
                {isPrivate && (
                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Mot de passe de la salle:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required={isPrivate}
                            className="form-input"
                        />
                    </div>
                )}
                <button type="submit" className="form-submit-button">Créer la salle</button>
            </form>
            <p className="admin-room-footer-link">
                <Link to="/dashboard" className="admin-room-link">Retour au tableau de bord</Link>
            </p>
        </div>
    );
}

export default AdminCreateRoom;
