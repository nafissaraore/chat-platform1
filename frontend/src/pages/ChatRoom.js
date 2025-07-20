import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, FileText, ArrowLeft, Users, Trash2, Image as ImageIcon } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import api from '../utils/api';
import socket from '../utils/socket';
import './ChatRoom.css';

function ChatRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMember, setIsMember] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [members, setMembers] = useState([]);
    const [uploadingFile, setUploadingFile] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const fetchRoomDetailsAndMessages = async () => {
            setLoading(true);
            setError('');

            try {
                const roomResponse = await api.get(`/rooms/${roomId}`);
                setRoom(roomResponse.data);

                const membershipResponse = await api.get(`/rooms/${roomId}/membership`);
                const isMemberNow = membershipResponse.data?.isMember || false;
                setIsMember(isMemberNow);

                if (isMemberNow) {
                    const messagesResponse = await api.get(`/messages/room/${roomId}`);
                    setMessages(messagesResponse.data);
                    socket.emit('joinRoom', roomResponse.data.name);

                    const membersResponse = await api.get(`/rooms/${roomId}/members`);
                    setMembers(membersResponse.data);
                } else {
                    setMembers([]);
                }
            } catch (err) {
                console.error('Erreur lors du chargement de la salle:', err);
                setError(err.response?.data?.message || 'Erreur lors du chargement de la salle.');
                if (err.response && (err.response.status === 404 || err.response.status === 401)) {
                    navigate('/dashboard');
                }
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && user && roomId) {
            fetchRoomDetailsAndMessages();
        }
    }, [authLoading, user, roomId, navigate]);

    useEffect(() => {
        const handleMessage = (message) => {
            if (message.room_id === parseInt(roomId, 10)) {
                setMessages((prev) => [...prev, message]);
            }
        };

        const handleRoomError = (errMsg) => {
            setError(errMsg);
        };

        socket.on('message', handleMessage);
        socket.on('roomError', handleRoomError);

        return () => {
            if (room?.name) {
                socket.emit('leaveRoom', room.name);
            }
            socket.off('message', handleMessage);
            socket.off('roomError', handleRoomError);
        };
    }, [room, roomId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || !room || !isMember) return;

        const messageData = {
            roomId: room.id,
            userId: user.id,
            username: user.username,
            content: newMessage.trim(),
            messageType: 'text',
            roomName: room.name
        };

        socket.emit('chatMessage', messageData);
        setNewMessage('');
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingFile(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadResponse = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const fileUrl = uploadResponse.data.fileUrl;
            const messageType = file.type.startsWith('image/') ? 'image' : 'file';

            const messageData = {
                roomId: room.id,
                userId: user.id,
                username: user.username,
                content: fileUrl,
                messageType,
                roomName: room.name
            };

            socket.emit('chatMessage', messageData);
            e.target.value = null;
        } catch (err) {
            console.error("Erreur upload:", err);
            setError("Impossible d'envoyer le fichier.");
        } finally {
            setUploadingFile(false);
        }
    };

    const handleJoinRoom = async () => {
        try {
            const payload = room.is_private ? { password: passwordInput } : {};
            await api.post(`/rooms/${roomId}/join`, payload);
            setIsMember(true);

            const messagesResponse = await api.get(`/messages/room/${roomId}`);
            setMessages(messagesResponse.data);
            socket.emit('joinRoom', room.name);

            const membersResponse = await api.get(`/rooms/${roomId}/members`);
            setMembers(membersResponse.data);

            setPasswordInput('');
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || "Impossible de rejoindre la salle.");
        }
    };

    const handleLeaveRoom = async () => {
        const confirmLeave = window.confirm("Voulez-vous vraiment quitter cette salle ?");
        if (!confirmLeave) return;
        try {
            await api.post(`/rooms/${roomId}/leave`);
            socket.emit('leaveRoom', room.name);
            navigate('/dashboard');
        } catch (err) {
            alert("Erreur lors de la sortie.");
        }
    };

    const handleDeleteRoom = async () => {
        const confirmDelete = window.confirm("Supprimer cette salle ?");
        if (!confirmDelete) return;
        try {
            await api.delete(`/rooms/${roomId}`);
            navigate('/dashboard');
        } catch (err) {
            alert("Erreur lors de la suppression.");
        }
    };

    if (authLoading || loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Chargement de la salle...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p>{error}</p>
                <button onClick={() => navigate('/dashboard')} className="error-button">
                    Retour au tableau de bord
                </button>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="error-container">
                <p>Salle introuvable.</p>
                <button onClick={() => navigate('/dashboard')} className="error-button">
                    Retour au tableau de bord
                </button>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <div className="chat-sidebar-left">
                <button onClick={() => navigate('/dashboard')} className="back-to-dashboard-button">
                    <ArrowLeft size={20} /> Retour
                </button>
                <div className="sidebar-room-info">
                    <div className="sidebar-room-avatar">{room.name?.charAt(0).toUpperCase()}</div>
                    <h3>{room.name}</h3>
                    <p>{room.description}</p>
                    {isMember && (
                        <div className="sidebar-room-members">
                            <Users size={16} /> Membres : {members.length}
                            <ul className="member-list">
                                {members.map((member) => (
                                    <li key={member.id}>{member.username}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {parseInt(room.created_by) === parseInt(user.id) && (
                        <button onClick={handleDeleteRoom} className="delete-room-button" disabled={uploadingFile}>
                            <Trash2 size={16} /> Supprimer la salle
                        </button>
                    )}
                    {isMember && parseInt(room.created_by) !== parseInt(user.id) && (
                        <button onClick={handleLeaveRoom} className="leave-room-button" disabled={uploadingFile}>
                            Quitter la salle
                        </button>
                    )}
                </div>
            </div>

            <div className="chat-room-main">
                <div className="chat-header">
                    <div className="chat-header-avatar">{room.name?.charAt(0).toUpperCase()}</div>
                    <div className="chat-header-info">
                        <h3>{room.name}</h3>
                        <p>{room.description || 'Salle publique'}</p>
                    </div>
                </div>

                {!isMember ? (
                    <div className="join-room-info">
                        <p>Vous n'êtes pas encore membre de cette salle.</p>
                        {room.is_private && (
                            <input
                                type="password"
                                placeholder="Mot de passe requis"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="join-room-password-input"
                                disabled={uploadingFile}
                            />
                        )}
                        <button onClick={handleJoinRoom} className="join-room-button" disabled={uploadingFile}>
                            Rejoindre la salle
                        </button>
                        {error && <p className="join-room-error-message">{error}</p>}
                    </div>
                ) : (
                    <>
                        <div className="chat-messages">
                            {messages.map((msg, index) => (
                                <div key={msg.id || index} className={`chat-message ${msg.user_id === user.id ? 'own' : 'other'}`}>
                                    <div className="chat-message-avatar">
                                        {msg.username?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="chat-message-info">
                                        <div className="chat-message-username">
                                            {msg.username || 'Utilisateur'}
                                            <span className="chat-message-time">
                                                {msg.created_at && new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="chat-message-bubble">
                                            {msg.message_type === 'text' && <p>{msg.content}</p>}
                                            {msg.message_type === 'image' && (
                                                <img src={msg.content} alt="Image" className="message-image" />
                                            )}
                                            {msg.message_type === 'file' && (
                                                <a href={msg.content} target="_blank" rel="noopener noreferrer">
                                                    <FileText /> Fichier
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="chat-input-area">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Écrire un message..."
                                className="chat-input"
                                disabled={!user || !room || uploadingFile}
                            />
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                disabled={!user || !room || uploadingFile}
                            />
                            <button
                                type="button"
                                className="chat-attach-button"
                                onClick={() => fileInputRef.current.click()}
                                disabled={uploadingFile}
                            >
                                {uploadingFile ? <div className="loading-spinner-small" /> : <ImageIcon size={20} />}
                            </button>
                            <button type="submit" className="chat-send-button" disabled={!newMessage.trim() || uploadingFile}>
                                <Send size={20} /> Envoyer
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default ChatRoom;
