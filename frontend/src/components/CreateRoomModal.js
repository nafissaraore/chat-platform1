import React, { useState } from 'react';
import './CreateRoomModal.css';
import api from '../utils/api';

function CreateRoomModal({ onClose, onRoomCreated }) {
    const [roomName, setRoomName] = useState('');
    const [roomDescription, setRoomDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [roomPassword, setRoomPassword] = useState(''); // Ajout pour le mot de passe

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/rooms', {
                name: roomName,
                description: roomDescription,
                is_private: isPrivate,
                password: isPrivate ? roomPassword : null // Envoyer le mot de passe si privé
            });

            if (response.status === 201) {
                // Salle créée avec succès
                // MODIFIÉ ICI : Passez response.data.room au lieu de response.data
                onRoomCreated(response.data.room); // <-- C'EST LA CLÉ !
                onClose(); // Ferme la modale
            } else {
                setError(response.data.message || 'Erreur lors de la création de la salle.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur réseau ou du serveur.');
            console.error('Erreur de création de salle:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Créer une nouvelle salle</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="roomName">Nom de la salle</label>
                        <input
                            type="text"
                            id="roomName"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="roomDescription">Description (optionnel)</label>
                        <textarea
                            id="roomDescription"
                            value={roomDescription}
                            onChange={(e) => setRoomDescription(e.target.value)}
                            rows="3"
                            disabled={isLoading}
                        ></textarea>
                    </div>
                    <div className="form-group checkbox-group">
                        <input
                            type="checkbox"
                            id="isPrivate"
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            disabled={isLoading}
                        />
                        <label htmlFor="isPrivate">Salle privée</label>
                    </div>
                    {isPrivate && ( // Champ de mot de passe conditionnel
                        <div className="form-group">
                            <label htmlFor="roomPassword">Mot de passe de la salle</label>
                            <input
                                type="password"
                                id="roomPassword"
                                value={roomPassword}
                                onChange={(e) => setRoomPassword(e.target.value)}
                                required={isPrivate} // Requis si la salle est privée
                                disabled={isLoading}
                            />
                        </div>
                    )}
                    {error && <p className="error-message">{error}</p>}
                    <div className="modal-actions">
                        <button type="button" className="cancel-button" onClick={onClose} disabled={isLoading}>
                            Annuler
                        </button>
                        <button type="submit" className="create-button" disabled={isLoading}>
                            {isLoading ? 'Création...' : 'Créer la salle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateRoomModal;
