import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../utils/api';
import socket from '../utils/socket';
import './Dashboard.css';

function Dashboard() {
    const { user, loading: authLoading } = useAuth();
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

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const fetchRooms = async () => {
            if (!user) return;
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
                setRoomsError(err.response?.data?.message || 'Salles: Impossible de charger.');
                setRooms([]);
            } finally {
                setRoomsLoading(false);
            }
        };

        if (!authLoading && user) {
            fetchRooms();
        }
    }, [authLoading, user]);

    useEffect(() => {
        const fetchAllUsers = async () => {
            if (!user) return;

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
                setAllUsersError(err.response?.data?.message || 'Utilisateurs: Impossible de charger la liste.');
                setAllUsers([]);
            } finally {
                setAllUsersLoading(false);
            }
        };

        if (!authLoading && user) {
            fetchAllUsers();
        }
    }, [authLoading, user]);

    useEffect(() => {
        if (!authLoading && user?.id) {
            const userId = parseInt(user.id, 10);
            if (isNaN(userId)) {
                setOnlineUsersError('Utilisateurs en ligne: ID utilisateur invalide.');
                setOnlineUsersLoading(false);
                return;
            }

            const handleOnlineUsers = (usersList) => {
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
                setSocketConnected(true);
                setOnlineUsersError('');
                socket.emit('userOnline', userId);
            };

            const handleDisconnect = () => {
                setSocketConnected(false);
                setOnlineUsers([]);
            };

            const handleConnectError = () => {
                setSocketConnected(false);
                setOnlineUsersError('Utilisateurs en ligne: Erreur de connexion.');
                setOnlineUsersLoading(false);
            };

            socket.on('onlineUsers', handleOnlineUsers);
            socket.on('connect', handleConnect);
            socket.on('disconnect', handleDisconnect);
            socket.on('connect_error', handleConnectError);

            if (socket.connected) {
                socket.emit('userOnline', userId);
                setSocketConnected(true);
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
    }, [authLoading, user]);

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

    if (roomsLoading || allUsersLoading || onlineUsersLoading) {
        return (
            <div className="dashboard-loading-container">
                <div className="text-center">
                    <div className="dashboard-loading-spinner"></div>
                    <p className="dashboard-loading-text">Chargement des données...</p>
                </div>
            </div>
        );
    }

    if (roomsError || allUsersError || onlineUsersError) {
        return (
            <div className="dashboard-error-container">
                <h3>Erreur de chargement</h3>
                {roomsError && <p>{roomsError}</p>}
                {allUsersError && <p>{allUsersError}</p>}
                {onlineUsersError && <p>{onlineUsersError}</p>}
                <button onClick={() => window.location.reload()} className="dashboard-reload-button">
                    Recharger la page
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-chat-central-area">
                <div className="dashboard-chat-placeholder">
                    <MessageCircle className="dashboard-chat-icon" />
                    <h3 className="dashboard-chat-title">Bienvenue sur votre Dashboard</h3>
                    <p className="dashboard-chat-subtitle">Sélectionnez une salle ou un utilisateur pour commencer la conversation</p>
                    {/* Informations techniques supprimées comme demandé */}

                </div>
            </div>
        </div>
    );
}

export default Dashboard;
