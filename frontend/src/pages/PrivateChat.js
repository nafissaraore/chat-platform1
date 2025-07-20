import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import socket from '../utils/socket';
import useAuth from '../hooks/useAuth';
import api from '../utils/api';
import './PrivateChat.css';

function PrivateChat() {
    const { userId: receiverId } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const messagesEndRef = useRef(null);

    const [receiverDetails, setReceiverDetails] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [chatLoading, setChatLoading] = useState(true);
    const [chatError, setChatError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) return navigate('/login');

        if (parseInt(receiverId) === user.id) {
            setChatError("⚠️ Vous ne pouvez pas démarrer une conversation privée avec vous-même.");
            setChatLoading(false);
            return;
        }

        const fetchReceiverAndMessages = async () => {
            try {
                const receiverRes = await api.get(`/users/${receiverId}`);
                setReceiverDetails(receiverRes.data);

                const messagesRes = await api.get(`/private-messages/${receiverId}`);
                setMessages(messagesRes.data);

                const room = [user.id, parseInt(receiverId)].sort().join('-');
                socket.emit('joinPrivateRoom', room);

                socket.off('privateMessage');
                socket.on('privateMessage', (msg) => {
                    setMessages((prev) => [...prev, msg]);
                });
            } catch (err) {
                console.error("Erreur chargement:", err);
                setChatError("Erreur lors du chargement de la conversation.");
            } finally {
                setChatLoading(false);
            }
        };

        fetchReceiverAndMessages();

        return () => {
            if (user && parseInt(receiverId) !== user.id) {
                const room = [user.id, parseInt(receiverId)].sort().join('-');
                socket.emit('leavePrivateRoom', room);
            }
            socket.off('privateMessage');
        };
    }, [receiverId, user, authLoading, navigate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!user || !receiverDetails || parseInt(receiverId) === user.id) return;

        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('senderId', user.id);
            formData.append('receiverId', receiverDetails.id);
            formData.append('senderUsername', user.username);
            formData.append('messageType', 'image');

            try {
                const response = await api.post('/upload', formData);
                const imageUrl = response.data.fileUrl;

                socket.emit('privateMessage', {
                    senderId: user.id,
                    receiverId: receiverDetails.id,
                    content: imageUrl,
                    senderUsername: user.username,
                    messageType: 'image',
                    created_at: new Date().toISOString()
                });

                setSelectedFile(null);
                setMessageInput('');
            } catch (error) {
                console.error('Erreur upload image :', error);
                setChatError("Erreur lors de l'envoi de l'image.");
            }
        } else if (messageInput.trim()) {
            socket.emit('privateMessage', {
                senderId: user.id,
                receiverId: receiverDetails.id,
                content: messageInput,
                senderUsername: user.username,
                messageType: 'text',
                created_at: new Date().toISOString()
            });
            setMessageInput('');
        }
    };

    const handleEmojiClick = (emojiData) => {
        setMessageInput((prev) => prev + emojiData.emoji);
    };

    const renderMessageContent = (msg) =>
        msg.message_type === 'image'
            ? <img src={msg.content} alt="Fichier" className="private-message-image" />
            : msg.content;

    const groupMessagesByDate = () => {
        const groups = {};
        messages.forEach((msg) => {
            const date = new Date(msg.created_at).toLocaleDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(msg);
        });
        return groups;
    };

    if (authLoading || chatLoading)
        return <div className="private-chat-loading-message">Chargement...</div>;

    if (chatError)
        return (
            <div className="private-chat-error-message">
                {chatError} <br />
                <Link to="/users" className="private-chat-error-link">← Retour aux utilisateurs</Link>
            </div>
        );

    const groupedMessages = groupMessagesByDate();

    return (
        <div className="private-chat-container">
            <div className="private-chat-header">
                <div className="private-chat-header-info">
                    <div className="private-chat-header-avatar">{receiverDetails?.username[0]?.toUpperCase()}</div>
                    <h2 className="private-chat-name">Discussion avec {receiverDetails?.username}</h2>
                </div>
               
            </div>

            <div className="private-chat-messages-area">
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                        <div className="private-date-wrapper">
                            <div className="private-date-separator">{date}</div>
                        </div>
                        {msgs.map((msg, i) => (
                            <div
                                key={msg.id || `${msg.sender_id}-${msg.created_at}-${i}`}
                                className={`private-message-bubble-wrapper ${msg.sender_id === user.id ? 'sent' : 'received'}`}>
                                <div className="private-message-bubble">
                                    <strong className="private-message-sender">
                                        {msg.sender_id === user.id ? 'Vous' : msg.sender_username}
                                    </strong>
                                    {renderMessageContent(msg)}
                                    <span className="private-message-time-stamp">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {showEmojiPicker && (
                <div style={{ position: 'absolute', bottom: '80px', left: '60px', zIndex: 999 }}>
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
            )}

            <form onSubmit={handleSendMessage} className="private-message-input-form">
                <input
                    type="file"
                    accept="image/*"
                    id="file-input-private"
                    className="private-hidden-file-input"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                <label htmlFor="file-input-private" className={`private-input-icon-button ${selectedFile ? 'private-file-selected' : ''}`}>📎</label>
                <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="private-input-icon-button"
                    title="Émojis">😊
                </button>
                <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={selectedFile ? selectedFile.name : "Tapez un message..."}
                    disabled={!!selectedFile}
                    className="private-message-input"
                />
                <button type="submit" className="private-send-message-button">➤</button>
            </form>

            <div className="private-chat-footer-link">
                <Link to="/users" className="private-chat-error-link">← Retour aux utilisateurs</Link>
            </div>
        </div>
    );
}

export default PrivateChat;
