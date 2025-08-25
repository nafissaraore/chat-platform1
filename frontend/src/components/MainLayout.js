import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, MessageCircle, Users, LogOut, Search, Plus, ArrowUp } from 'lucide-react';
import './LeftSidebar.css';

function LeftSidebar({
  user,
  onlineUsers = [],
  allUsers = [],
  handleLogout,
  rooms = [],
  searchTerm,
  setSearchTerm,
  setActiveRoom,
  activeRoom,
  recentPrivateConversations = [],
  unreadMessages = {},
  onOpenCreateRoom,
}) {
  const location = useLocation();
  const allUsersSectionRef = useRef(null);
  const messagesSectionRef = useRef(null);
  const onlineUsersSectionRef = useRef(null);
  const roomsSectionRef = useRef(null);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now - messageDate) / (1000 * 60 * 60);
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const filteredOnlineUsers = onlineUsers.filter(onlineUser => onlineUser.id !== user?.id);
  const filteredAllUsers = allUsers.filter(allUser => allUser.id !== user?.id);
  const filteredRecentPrivateConversations = recentPrivateConversations.filter(conv => conv.contact_id !== user?.id);

  useEffect(() => {
    const handleScroll = (sectionRef, buttonId) => {
      const section = sectionRef.current;
      const scrollToTopBtn = document.getElementById(buttonId);
      if (section && scrollToTopBtn) {
        scrollToTopBtn.style.display = section.scrollTop > 200 ? 'block' : 'none';
      }
    };

    const currentAllUsersSection = allUsersSectionRef.current;
    const currentMessagesSection = messagesSectionRef.current;
    const currentOnlineUsersSection = onlineUsersSectionRef.current;
    const currentRoomsSection = roomsSectionRef.current;

    const handleScrollAllUsers = () => handleScroll(allUsersSectionRef, 'scrollToTopAllUsersBtn');
    const handleScrollMessages = () => handleScroll(messagesSectionRef, 'scrollToTopMessagesBtn');
    const handleScrollOnlineUsers = () => handleScroll(onlineUsersSectionRef, 'scrollToTopOnlineUsersBtn');
    const handleScrollRooms = () => handleScroll(roomsSectionRef, 'scrollToTopRoomsBtn');

    if (currentAllUsersSection) currentAllUsersSection.addEventListener('scroll', handleScrollAllUsers);
    if (currentMessagesSection) currentMessagesSection.addEventListener('scroll', handleScrollMessages);
    if (currentOnlineUsersSection) currentOnlineUsersSection.addEventListener('scroll', handleScrollOnlineUsers);
    if (currentRoomsSection) currentRoomsSection.addEventListener('scroll', handleScrollRooms);

    return () => {
      if (currentAllUsersSection) currentAllUsersSection.removeEventListener('scroll', handleScrollAllUsers);
      if (currentMessagesSection) currentMessagesSection.removeEventListener('scroll', handleScrollMessages);
      if (currentOnlineUsersSection) currentOnlineUsersSection.removeEventListener('scroll', handleScrollOnlineUsers);
      if (currentRoomsSection) currentRoomsSection.removeEventListener('scroll', handleScrollRooms);
    };
  }, []);

  const scrollToTop = (sectionRef) => {
    if (sectionRef.current) {
      sectionRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="left-sidebar">
      {/* Profil utilisateur */}
      <div className="sidebar-header">
        <div className="user-profile">
          <div className="user-info">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profil" className="avatar-circle" />
            ) : (
              <div className="avatar-circle">{user?.username?.[0]?.toUpperCase()}</div>
            )}
            <div>
              <h3 className="username">{user?.username}</h3>
              <p className="online-status">En ligne</p>
            </div>
          </div>
          <div className="icon-buttons">
            <Link to="/profile" className="icon-button" title="Profil">
              <Settings className="icon" />
            </Link>
            <button onClick={handleLogout} className="icon-button" title="Déconnexion">
              <LogOut className="icon" />
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher une salle..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Utilisateurs en ligne */}
      <div className="online-users-section sidebar-section" ref={onlineUsersSectionRef}>
        <h4 className="section-title">En ligne ({filteredOnlineUsers.length})</h4>
        <div className="online-users-list">
          {filteredOnlineUsers.length === 0 ? (
            <p className="no-users-message">Aucun autre utilisateur en ligne.</p>
          ) : (
            filteredOnlineUsers.map((onlineUser) => (
              <Link to={`/private-chat/${onlineUser.id}`} key={onlineUser.id} className="online-user-item">
                <div className="online-user-avatar">
                  {onlineUser.profileImage ? (
                    <img src={onlineUser.profileImage} alt="avatar" className="online-avatar" />
                  ) : (
                    <div className="online-avatar-initial">{onlineUser.username?.[0]?.toUpperCase()}</div>
                  )}
                  <span className="online-indicator"></span>
                </div>
                <span className="online-username">{onlineUser.username}</span>
              </Link>
            ))
          )}
        </div>
        <button
          id="scrollToTopOnlineUsersBtn"
          className="scroll-to-top-btn"
          onClick={() => scrollToTop(onlineUsersSectionRef)}
          title="Retour en haut"
        >
          <ArrowUp className="lucide-arrow-up" />
        </button>
      </div>

      {/* Messages récents */}
      <div className="sidebar-section" ref={messagesSectionRef}>
        <h4 className="section-title">Messages</h4>
        {filteredRecentPrivateConversations.length === 0 ? (
          <p className="no-users-message">Aucune conversation récente.</p>
        ) : (
          <ul className="sidebar-messages">
            {filteredRecentPrivateConversations.map((conv, index) => {
              const contactId = conv?.contact_id || `unknown-${index}`;
              const contactName = conv?.contact_username || 'Utilisateur inconnu';
              const lastMessage = conv?.content || conv?.last_message || '';
              const messageTime = conv?.created_at || conv?.timestamp || conv?.last_message_time;
              const isUnread = unreadMessages[contactId] > 0;
              const unreadCount = unreadMessages[contactId] || 0;
              const safeKey = `conv-${contactId}-${index}`;

              return (
                <li key={safeKey} className={`message-item ${isUnread ? 'unread' : ''}`}>
                  <Link to={`/private-chat/${contactId}`} className="message-link">
                    <div className="message-avatar">
                      {conv?.profile_image ? (
                        <img src={conv.profile_image} alt="avatar" className="avatar-img" />
                      ) : (
                        <div className="avatar-initial">
                          {contactName?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <strong className="contact-name">{contactName}</strong>
                        <span className="message-time">{formatMessageTime(messageTime)}</span>
                      </div>
                      <div className="message-footer">
                        <p className="last-message">
                          {lastMessage?.startsWith('http') ? (
                            lastMessage.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img
                                src={lastMessage}
                                alt="Image"
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '4px',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <>
                                📎{' '}
                                <a href={lastMessage} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
                                  Voir le fichier
                                </a>
                              </>
                            )
                          ) : (
                            lastMessage.length > 30
                              ? lastMessage.slice(0, 30) + '...'
                              : lastMessage || 'Aucun message'
                          )}
                        </p>
                        {isUnread && <span className="unread-badge">{unreadCount}</span>}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <button
          id="scrollToTopMessagesBtn"
          className="scroll-to-top-btn"
          onClick={() => scrollToTop(messagesSectionRef)}
          title="Retour en haut"
        >
          <ArrowUp className="lucide-arrow-up" />
        </button>
      </div>

      {/* Tous les utilisateurs */}
      <div className="all-users-section sidebar-section" ref={allUsersSectionRef}>
        <h4 className="section-title">Tous les utilisateurs ({filteredAllUsers.length})</h4>
        <div className="all-users-list">
          {filteredAllUsers.length === 0 ? (
            <p className="no-users-message">Aucun autre utilisateur enregistré.</p>
          ) : (
            filteredAllUsers.map((allUser) => (
              <Link to={`/private-chat/${allUser.id}`} key={allUser.id} className="all-user-item">
                <div className="all-user-avatar">{allUser.username?.[0]?.toUpperCase()}</div>
                <div className="all-user-info">
                  <h5 className="all-user-name">{allUser.username}</h5>
                </div>
              </Link>
            ))
          )}
        </div>
        <button
          id="scrollToTopAllUsersBtn"
          className="scroll-to-top-btn"
          onClick={() => scrollToTop(allUsersSectionRef)}
          title="Retour en haut"
        >
          <ArrowUp className="lucide-arrow-up" />
        </button>
      </div>

      {/* Liste des salles */}
      <div className="rooms-list-section sidebar-section" ref={roomsSectionRef}>
        <div className="rooms-list-content">
          <h4 className="section-title">
            Salles de discussion
            <button
              onClick={onOpenCreateRoom}
              className="create-room-button"
              title="Créer une nouvelle salle"
              style={{
                marginLeft: '10px',
                padding: '2px 8px',
                fontSize: '14px',
                cursor: 'pointer',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#4CAF50',
                color: 'white',
                verticalAlign: 'middle',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={16} />
            </button>
          </h4>
          <div className="rooms-list-scrollable">
            {rooms.length === 0 ? (
              <p className="no-rooms-message">Aucune salle trouvée.</p>
            ) : (
              rooms.map((room) => (
                <Link
                  to={`/chat/${room.id}`}
                  key={room.id}
                  onClick={() => setActiveRoom?.(room)}
                  className={`room-item ${activeRoom?.id === room.id ? 'active' : ''}`}
                >
                  <div className="room-avatar">{room.name?.[0]?.toUpperCase()}</div>
                  <div className="room-info">
                    <div className="room-name-container">
                      <h5 className="room-name">{room.name}</h5>
                      {room.is_private && <span className="room-private-icon">🔒</span>}
                    </div>
                    <p className="room-description">{room.description || 'Pas de description.'}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
        <button
          id="scrollToTopRoomsBtn"
          className="scroll-to-top-btn"
          onClick={() => scrollToTop(roomsSectionRef)}
          title="Retour en haut"
        >
          <ArrowUp className="lucide-arrow-up" />
        </button>
      </div>

      {/* Navigation bas */}
      <div className="sidebar-nav-icons">
        <Link to="/dashboard" className={`nav-icon-link ${isActive('/dashboard') ? 'active' : ''}`} title="Tableau de bord">
          <MessageCircle className="icon" />
        </Link>
        <Link to="/users" className={`nav-icon-link ${isActive('/users') ? 'active' : ''}`} title="Utilisateurs">
          <Users className="icon" />
        </Link>
      </div>
    </div>
  );
}

export default LeftSidebar;
