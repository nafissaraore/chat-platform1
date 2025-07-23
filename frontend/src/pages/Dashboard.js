import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../utils/api';
import socket from '../utils/socket';
import './Dashboard.css';

function Dashboard() {
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [rooms, setRooms] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [roomsLoading, setRoomsLoading] = useState(true);
    const [onlineUsersLoading, setOnlineUsersLoading] = useState(true);
    const [allUsersLoading, setAllUsersLoading] = useState(true);
    const [roomsError, setRoomsError] = useState('');
    const [onlineUsersError, setOnlineUsersError] = useState('');
    const [allUsersError, setAllUsersError] = useState('');
    const [socketConnected, setSocketConnected] = useState(false);
    
    // ✅ Nouvel état pour forcer le rendu des sidebars
    const [dataReady, setDataReady] = useState(false);

    // ✅ Redirection si pas authentifié
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            console.log('❌ Utilisateur non authentifié, redirection vers login');
            navigate('/login');
        }
    }, [isAuthenticated, authLoading, navigate]);

    // ✅ Fonction pour vérifier si toutes les données sont prêtes
    useEffect(() => {
        if (!authLoading && isAuthenticated && user && !roomsLoading && !allUsersLoading && !onlineUsersLoading) {
            setDataReady(true);
            console.log('✅ Toutes les données du dashboard sont prêtes');
        }
    }, [authLoading, isAuthenticated, user, roomsLoading, allUsersLoading, onlineUsersLoading]);

    useEffect(() => {
        const fetchRooms = async () => {
            if (!user?.id) return; // ✅ Vérification plus stricte
            
            setRoomsLoading(true);
            setRoomsError('');
            try {
                const response = await api.get('/rooms');
                if (Array.isArray(response.data)) {
                    setRooms(response.data);
                } else if (response.data && Array.isArray(response.data.rooms)) {
                    setRooms(response.data.rooms);
                } else if (response.data?.message) {
                    setRoomsError(`Salles: ${response.data.message}`);
                    setRooms([]);
                } else {
                    setRoomsError('Salles: Format de données inattendu.');
                    setRooms([]);
                }
            } catch (err) {
                console.error('Erreur chargement salles:', err);
                setRoomsError(err.response?.data?.message || 'Salles: Impossible de charger.');
                setRooms([]);
            } finally {
                setRoomsLoading(false);
            }
        };

        // ✅ Attendre que l'utilisateur soit complètement chargé
        if (!authLoading && user?.id) {
            fetchRooms();
        }
    }, [authLoading, user?.id]); // ✅ Dépendance plus spécifique

    useEffect(() => {
        const fetchAllUsers = async () => {
            if (!user?.id) return; // ✅ Vérification plus stricte

            setAllUsersLoading(true);
            setAllUsersError('');
            try {
                const response = await api.get('/users');
                if (Array.isArray(response.data)) {
                    const filteredUsers = response.data
                        .filter(u => u && u.id && parseInt(u.id, 10) !== parseInt(user.id, 10))
                        .map(u => ({ ...u, id: parseInt(u.id, 10) }));
                    setAllUsers(filteredUsers);
                } else {
                    setAllUsersError('Utilisateurs: Format de données inattendu.');
                    setAllUsers([]);
                }
            } catch (err) {
                console.error('Erreur chargement utilisateurs:', err);
                setAllUsersError(err.response?.data?.message || 'Utilisateurs: Impossible de charger la liste.');
                setAllUsers([]);
            } finally {
                setAllUsersLoading(false);
            }
        };

        // ✅ Attendre que l'utilisateur soit complètement chargé
        if (!authLoading && user?.id) {
            fetchAllUsers();
        }
    }, [authLoading, user?.id]); // ✅ Dépendance plus spécifique

    useEffect(() => {
        if (!authLoading && user?.id) {
            const userId = parseInt(user.id, 10);
            if (isNaN(userId)) {
                setOnlineUsersError('Utilisateurs en ligne: ID utilisateur invalide.');
                setOnlineUsersLoading(false);
                return;
            }

            const handleOnlineUsers = (usersList) => {
                console.log('Utilisateurs en ligne reçus:', usersList); // ✅ Debug
                if (Array.isArray(usersList)) {
                    const filtered = usersList
                        .filter(u => u && u.id && parseInt(u.id, 10) !== userId)
                        .map(u => ({ ...u, id: parseInt(u.id, 10) }));
                    setOnlineUsers(filtered);
                    setOnlineUsersError('');
                } else {
                    setOnlineUsers([]);
                    setOnlineUsersError('Utilisateurs en ligne: Format de données inattendu.');
                }
                setOnlineUsersLoading(false);
            };

            const handleConnect = () => {
                console.log('Socket connecté'); // ✅ Debug
                setSocketConnected(true);
                setOnlineUsersError('');
                socket.emit('userOnline', userId);
            };

            const handleDisconnect = () => {
                console.log('Socket déconnecté'); // ✅ Debug
                setSocketConnected(false);
                setOnlineUsers([]);
            };

            const handleConnectError = (error) => {
                console.error('Erreur connexion socket:', error); // ✅ Debug
                setSocketConnected(false);
                setOnlineUsersError('Utilisateurs en ligne: Erreur de connexion.');
                setOnlineUsersLoading(false);
            };

            socket.on('onlineUsers', handleOnlineUsers);
            socket.on('connect', handleConnect);
            socket.on('disconnect', handleDisconnect);
            socket.on('connect_error', handleConnectError);

            // ✅ Initialisation immédiate si socket déjà connecté
            if (socket.connected) {
                handleConnect();
            } else {
                // ✅ Forcer la connexion si pas encore connecté
                socket.connect();
            }

            return () => {
                socket.emit('userOffline', userId);
                socket.off('onlineUsers', handleOnlineUsers);
                socket.off('connect', handleConnect);
                socket.off('disconnect', handleDisconnect);
                socket.off('connect_error', handleConnectError);
            };
        } else {
            setOnlineUsersLoading(false);
        }
    }, [authLoading, user?.id]); // ✅ Dépendance plus spécifique

    // ✅ Attendre que l'authentification soit terminée
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

    // ✅ Attendre que toutes les données soient chargées
    if (!dataReady || roomsLoading || allUsersLoading || onlineUsersLoading) {
        return (
            <div className="dashboard-loading-container">
                <div className="text-center">
                    <div className="dashboard-loading-spinner"></div>
                    <p className="dashboard-loading-text">
                        Chargement des données...
                        {roomsLoading && ' (Salles)'}
                        {allUsersLoading && ' (Utilisateurs)'}
                        {onlineUsersLoading && ' (En ligne)'}
                    </p>
                </div>
            </div>
        );
    }

    // ✅ Gestion des erreurs non bloquantes
    const hasErrors = roomsError || allUsersError || onlineUsersError;
    
    return (
        <div className="dashboard-container">
            {/* ✅ Afficher les erreurs mais ne pas bloquer l'affichage */}
            {hasErrors && (
                <div className="dashboard-errors-banner">
                    {roomsError && <div className="error-item">⚠️ {roomsError}</div>}
                    {allUsersError && <div className="error-item">⚠️ {allUsersError}</div>}
                    {onlineUsersError && <div className="error-item">⚠️ {onlineUsersError}</div>}
                </div>
            )}

            <div className="dashboard-chat-central-area">
                <div className="dashboard-chat-placeholder">
                    <MessageCircle className="dashboard-chat-icon" />
                    <h3 className="dashboard-chat-title">Bienvenue sur votre Dashboard</h3>
                    <p className="dashboard-chat-subtitle">
                        Sélectionnez une salle ou un utilisateur pour commencer la conversation
                    </p>
                    
                    {/* ✅ Informations de debug (à retirer en production) */}
                    <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                        <p>Utilisateur connecté: {user?.username}</p>
                        <p>Salles chargées: {rooms.length}</p>
                        <p>Utilisateurs totaux: {allUsers.length}</p>
                        <p>Utilisateurs en ligne: {onlineUsers.length}</p>
                        <p>Socket connecté: {socketConnected ? '✅' : '❌'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;