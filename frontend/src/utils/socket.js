// frontend/src/utils/socket.js
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000';

const socket = io(SOCKET_SERVER_URL, {
    transports: ['websocket', 'polling']
});

socket.on('connect', () => {
    console.log('Connecté au serveur Socket.IO ! ID:', socket.id);
});

socket.on('disconnect', (reason) => {
    console.log('Déconnecté du serveur Socket.IO. Raison:', reason);
});

socket.on('connect_error', (err) => {
    console.error('Erreur de connexion Socket.IO:', err.message);
});

export default socket;
