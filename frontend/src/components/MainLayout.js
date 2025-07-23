import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightInfoPanel from './RightInfoPanel';
import ProtectedRoute from './ProtectedRoute';

import Dashboard from '../pages/Dashboard';
import ChatRoom from '../pages/ChatRoom';
import HomePage from '../pages/HomePage';
import AdminCreateRoom from '../pages/AdminCreateRoom';
import ProfilePage from '../pages/ProfilePage';
import UserList from '../pages/UserList';
import PrivateChat from '../pages/PrivateChat';

import Login from './Auth/Login';
import Register from './Auth/Register';

import useAuth from '../hooks/useAuth';
import api from '../utils/api';
import socket from '../utils/socket';

import './MainLayout.css';
import CreateRoomModal from './CreateRoomModal';

function MainLayout() {
  const { isAuthenticated, user, loading: authLoading, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [recentPrivateConversations, setRecentPrivateConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  
  // ✅ États séparés pour un meilleur contrôle
  const [dataLoaded, setDataLoaded] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleRoomCreated = (newRoom) => {
    setRooms(prev => [...prev, newRoom]);
    setActiveRoom(newRoom);
    setShowCreateRoomModal(false);
    navigate(`/chat/${newRoom.id}`);
  };

  const handleProfileUpdated = async () => {
    console.log("Profil mis à jour, rafraîchissement des données utilisateur...");
    await refreshUser?.();
  };

  // ✅ Fonction pour charger les données de base
  const fetchInitialData = async () => {
    if (!isAuthenticated || !user?.id) return;
    
    setLoadingData(true);
    try {
      console.log("🔄 Chargement des données initiales...");
      
      const [usersRes, roomsRes, conversationsRes] = await Promise.all([
        api.get('/users').catch(err => {
          console.error("Erreur chargement users:", err);
          return { data: [] };
        }),
        api.get('/rooms').catch(err => {
          console.error("Erreur chargement rooms:", err);
          return { data: [] };
        }),
        api.get(`/private-messages/conversations/${user.id}`).catch(err => {
          console.error("Erreur chargement conversations:", err);
          return { data: [] };
        })
      ]);

      setAllUsers(usersRes.data || []);
      setRooms(roomsRes.data || []);
      setRecentPrivateConversations(conversationsRes.data || []);
      setDataLoaded(true);
      
      console.log("✅ Données initiales chargées avec succès");
    } catch (error) {
      console.error("❌ Erreur lors du chargement des données :", error);
      if (error.response?.status === 401) {
        handleLogout();
        return;
      }
      // Même en cas d'erreur, on affiche les sidebars
      setDataLoaded(true);
    } finally {
      setLoadingData(false);
    }
  };

  // ✅ Effet pour charger les données dès que l'utilisateur est authentifié
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.id && !dataLoaded) {
      fetchInitialData();
    }
  }, [authLoading, isAuthenticated, user?.id, dataLoaded]);

  // ✅ Configuration des sockets une fois les données de base chargées
  useEffect(() => {
    if (!user?.id || !dataLoaded) return;

    console.log("🔌 Configuration des sockets pour user:", user.id);
    socket.emit('userOnline', user.id);

    const handleOnlineUsers = (users) => {
      const filtered = users.filter(u => u.id !== user.id);
      setOnlineUsers(filtered);
      console.log("👥 Utilisateurs en ligne mis à jour:", filtered.length);
    };

    const handleUnreadCount = ({ senderId, count }) => {
      setUnreadMessages(prev => ({ ...prev, [senderId]: count }));
    };

    const handleNewPrivateMessage = (message) => {
      setRecentPrivateConversations(prev => {
        const updated = prev.filter(
          conv => conv.contact_id !== message.sender_id && conv.contact_id !== message.receiver_id
        );

        const contactId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const contactUser = allUsers.find(u => u.id === contactId);

        const newConv = {
          contact_id: contactId,
          contact_username: contactUser?.username || message.sender_username,
          profile_image: contactUser?.profile_image || message.sender_profile_image,
          content: message.content,
          message_type: message.message_type,
          created_at: message.created_at,
        };

        return [newConv, ...updated];
      });

      const currentChatId = location.pathname.startsWith('/private-chat/')
        ? parseInt(location.pathname.split('/').pop(), 10)
        : null;

      if (message.receiver_id === user.id && currentChatId !== message.sender_id) {
        setUnreadMessages(prev => ({
          ...prev,
          [message.sender_id]: (prev[message.sender_id] || 0) + 1
        }));
      }
    };

    socket.on('onlineUsers', handleOnlineUsers);
    socket.on('unreadCount', handleUnreadCount);
    socket.on('privateMessage', handleNewPrivateMessage);

    return () => {
      socket.off('onlineUsers', handleOnlineUsers);
      socket.off('unreadCount', handleUnreadCount);
      socket.off('privateMessage', handleNewPrivateMessage);
    };
  }, [user?.id, dataLoaded, location.pathname, allUsers]);

  const filteredRooms = rooms.filter(room =>
    room.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOnlineUsers = onlineUsers.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllUsers = allUsers.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showFullChatLayout = isAuthenticated && (
    location.pathname.startsWith('/chat/') ||
    location.pathname.startsWith('/private-chat/') ||
    location.pathname === '/dashboard' ||
    location.pathname === '/users' ||
    location.pathname === '/profile' ||
    location.pathname === '/admin/create-room'
  );

  // ✅ Loading uniquement pour l'auth, pas pour les données
  if (authLoading) {
    return (
      <div className="main-layout-loading-container">
        <div className="main-layout-loading-spinner"></div>
        <p>Authentification en cours...</p>
      </div>
    );
  }

  return (
    <div className="main-layout-container">
      {/* ✅ Afficher les sidebars dès que l'utilisateur est authentifié */}
      {showFullChatLayout && (
        <LeftSidebar
          user={user}
          handleLogout={handleLogout}
          allUsers={filteredAllUsers}
          onlineUsers={filteredOnlineUsers}
          recentPrivateConversations={recentPrivateConversations}
          unreadMessages={unreadMessages}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          rooms={filteredRooms}
          activeRoom={activeRoom}
          setActiveRoom={setActiveRoom}
          onOpenCreateRoom={() => setShowCreateRoomModal(true)}
          loading={loadingData} // ✅ Passer l'état de loading aux sidebars
        />
      )}

      <div className="main-content-area">
        {!isAuthenticated && (
          <nav className="auth-nav">
            <Link to="/" className="auth-nav-link">Accueil</Link>
            <Link to="/register" className="auth-nav-link">S'inscrire</Link>
            <Link to="/login" className="auth-nav-link">Se connecter</Link>
          </nav>
        )}

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard 
                rooms={rooms} 
                allUsers={allUsers} 
                onlineUsers={onlineUsers}
                loading={loadingData}
              />
            </ProtectedRoute>
          } />
          <Route path="/chat/:roomId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage onProfileUpdated={handleProfileUpdated} /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
          <Route path="/private-chat/:userId" element={<ProtectedRoute><PrivateChat /></ProtectedRoute>} />
          <Route path="/admin/create-room" element={<ProtectedRoute requiredRole="admin"><AdminCreateRoom /></ProtectedRoute>} />
          <Route path="*" element={isAuthenticated ? <ProtectedRoute><Dashboard /></ProtectedRoute> : <HomePage />} />
        </Routes>
      </div>

      {/* ✅ Afficher le panneau droit dès que l'utilisateur est authentifié */}
      {showFullChatLayout && (
        <RightInfoPanel 
          user={user}
          allUsers={allUsers}
          rooms={rooms}
          activeRoom={activeRoom}
          loading={loadingData} // ✅ Passer l'état de loading
        />
      )}

      {showCreateRoomModal && (
        <CreateRoomModal
          onClose={() => setShowCreateRoomModal(false)}
          onRoomCreated={handleRoomCreated}
        />
      )}
    </div>
  );
}

export default MainLayout;