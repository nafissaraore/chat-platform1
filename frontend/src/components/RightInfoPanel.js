import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Phone, Video, MoreHorizontal, User, Users, Clock, MapPin, Heart, MessageCircle, Image, File, Settings } from 'lucide-react';
import api from '../utils/api';
import './RightInfoPanel.css';

function RightInfoPanel({ user, allUsers, rooms, activeRoom }) {
  const { userId, roomId } = useParams();
  const location = useLocation();
  const [currentContact, setCurrentContact] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isPrivateChat, setIsPrivateChat] = useState(false);
  const [sharedMedia, setSharedMedia] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Déterminer si on est dans un chat privé ou une salle
  useEffect(() => {
    if (location.pathname.startsWith('/private-chat/')) {
      setIsPrivateChat(true);
      const contactId = parseInt(userId, 10);
      const contact = allUsers.find(u => u.id === contactId);
      setCurrentContact(contact);
      setCurrentRoom(null);
      
      // Charger les médias partagés pour le chat privé
      if (contactId) {
        loadSharedMedia(contactId, 'private');
      }
    } else if (location.pathname.startsWith('/chat/')) {
      setIsPrivateChat(false);
      const roomIdInt = parseInt(roomId, 10);
      const room = rooms.find(r => r.id === roomIdInt) || activeRoom;
      setCurrentRoom(room);
      setCurrentContact(null);
      
      // Charger les médias partagés pour la salle
      if (roomIdInt) {
        loadSharedMedia(roomIdInt, 'room');
      }
    }
  }, [location.pathname, userId, roomId, allUsers, rooms, activeRoom]);

  const loadSharedMedia = async (id, type) => {
    setLoadingMedia(true);
    try {
      const endpoint = type === 'private' 
        ? `/private-messages/media/${user.id}/${id}`
        : `/messages/media/${id}`;
      
      const response = await api.get(endpoint);
      const media = response.data || [];
      
      setSharedMedia(media.filter(item => 
        item.message_type === 'image' || 
        (item.content && item.content.match(/\.(jpg|jpeg|png|gif|webp)$/i))
      ));
      
      setSharedFiles(media.filter(item => 
        item.message_type === 'file' || 
        (item.content && !item.content.match(/\.(jpg|jpeg|png|gif|webp)$/i) && item.content.startsWith('http'))
      ));
    } catch (error) {
      console.error('Erreur lors du chargement des médias:', error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Jamais vu';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'En ligne';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    return date.toLocaleDateString('fr-FR');
  };

  const formatRoomCreatedDate = (timestamp) => {
    if (!timestamp) return 'Date inconnue';
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Rendu pour le chat privé
  if (isPrivateChat && currentContact) {
    return (
      <div className="right-info-panel">
        {/* Header avec actions */}
        <div className="panel-header">
          <div className="contact-actions">
            <button className="action-btn" title="Appel audio">
              <Phone size={20} />
            </button>
            <button className="action-btn" title="Appel vidéo">
              <Video size={20} />
            </button>
            <button className="action-btn" title="Plus d'options">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* Profil du contact */}
        <div className="contact-profile">
          <div className="profile-avatar-large">
            {currentContact.profileImage ? (
              <img src={currentContact.profileImage} alt={currentContact.username} />
            ) : (
              <div className="avatar-initial-large">
                {currentContact.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <h2 className="contact-name">{currentContact.username}</h2>
          <p className="contact-status">{formatLastSeen(currentContact.last_active)}</p>
        </div>

        {/* Informations du profil */}
        <div className="profile-info">
          <div className="info-section">
            <h3 className="section-title">
              <User size={16} />
              Informations
            </h3>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{currentContact.email || 'Non renseigné'}</span>
            </div>
            {currentContact.age && (
              <div className="info-item">
                <span className="info-label">Âge:</span>
                <span className="info-value">{currentContact.age} ans</span>
              </div>
            )}
            {currentContact.gender && (
              <div className="info-item">
                <span className="info-label">Genre:</span>
                <span className="info-value">{currentContact.gender}</span>
              </div>
            )}
            {currentContact.location && (
              <div className="info-item">
                <MapPin size={14} />
                <span className="info-value">{currentContact.location}</span>
              </div>
            )}
          </div>

          {currentContact.interests && (
            <div className="info-section">
              <h3 className="section-title">
                <Heart size={16} />
                Centres d'intérêt
              </h3>
              <p className="interests-text">{currentContact.interests}</p>
            </div>
          )}

          {currentContact.intention && (
            <div className="info-section">
              <h3 className="section-title">
                <MessageCircle size={16} />
                Intention
              </h3>
              <p className="intention-text">{currentContact.intention}</p>
            </div>
          )}
        </div>

        {/* Médias partagés */}
        <div className="shared-media-section">
          <h3 className="section-title">
            <Image size={16} />
            Médias partagés ({sharedMedia.length})
          </h3>
          {loadingMedia ? (
            <div className="loading-media">Chargement...</div>
          ) : (
            <div className="media-grid">
              {sharedMedia.slice(0, 6).map((media, index) => (
                <div key={index} className="media-item">
                  <img 
                    src={media.content} 
                    alt="Média partagé" 
                    className="media-thumbnail"
                  />
                </div>
              ))}
              {sharedMedia.length > 6 && (
                <div className="media-item more-media">
                  +{sharedMedia.length - 6}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fichiers partagés */}
        {sharedFiles.length > 0 && (
          <div className="shared-files-section">
            <h3 className="section-title">
              <File size={16} />
               ({sharedFiles.length})
            </h3>
            <div className="files-list">
              {sharedFiles.slice(0, 3).map((file, index) => (
                <div key={index} className="file-item">
                  <File size={14} />
                  <span className="file-name">
                    {file.content.split('/').pop() || 'Fichier'}
                  </span>
                </div>
              ))}
              {sharedFiles.length > 3 && (
                <div className="file-item more-files">
                  +{sharedFiles.length - 3} autres fichiers
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Rendu pour les salles de discussion
  if (!isPrivateChat && currentRoom) {
    return (
      <div className="right-info-panel">
        {/* Header avec actions */}
        <div className="panel-header">
          <div className="room-actions">
            <button className="action-btn" title="Paramètres de la salle">
              <Settings size={20} />
            </button>
            <button className="action-btn" title="Plus d'options">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* Informations de la salle */}
        <div className="room-profile">
          <div className="room-avatar-large">
            {currentRoom.name?.[0]?.toUpperCase()}
          </div>
          <h2 className="room-name">
            {currentRoom.name}
            {currentRoom.is_private && <span className="private-badge">🔒</span>}
          </h2>
          <p className="room-description">{currentRoom.description || 'Aucune description'}</p>
        </div>

        {/* Informations de la salle */}
        <div className="room-info">
          <div className="info-section">
            <h3 className="section-title">
              <Users size={16} />
              Informations de la salle
            </h3>
            <div className="info-item">
              <Clock size={14} />
              <span className="info-label">Créée le:</span>
              <span className="info-value">{formatRoomCreatedDate(currentRoom.created_at)}</span>
            </div>
            <div className="info-item">
              <User size={14} />
              <span className="info-label">Créateur:</span>
              <span className="info-value">
                {allUsers.find(u => u.id === currentRoom.creator_id)?.username || 'Inconnu'}
              </span>
            </div>
          </div>
        </div>

        {/* Médias partagés dans la salle */}
        <div className="shared-media-section">
          <h3 className="section-title">
            <Image size={16} />
            Médias partagés ({sharedMedia.length})
          </h3>
          {loadingMedia ? (
            <div className="loading-media">Chargement...</div>
          ) : (
            <div className="media-grid">
              {sharedMedia.slice(0, 6).map((media, index) => (
                <div key={index} className="media-item">
                  <img 
                    src={media.content} 
                    alt="Média partagé" 
                    className="media-thumbnail"
                  />
                </div>
              ))}
              {sharedMedia.length > 6 && (
                <div className="media-item more-media">
                  +{sharedMedia.length - 6}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fichiers partagés dans la salle */}
        {sharedFiles.length > 0 && (
          <div className="shared-files-section">
            <h3 className="section-title">
              <File size={16} />
              Fichiers partagés ({sharedFiles.length})
            </h3>
            <div className="files-list">
              {sharedFiles.slice(0, 3).map((file, index) => (
                <div key={index} className="file-item">
                  <File size={14} />
                  <span className="file-name">
                    {file.content.split('/').pop() || 'Fichier'}
                  </span>
                </div>
              ))}
              {sharedFiles.length > 3 && (
                <div className="file-item more-files">
                  +{sharedFiles.length - 3} autres fichiers
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Rendu par défaut (dashboard ou autres pages)
  return (
    <div className="right-info-panel">
      <div className="panel-header">
        <h3>Informations</h3>
      </div>
      <div className="default-content">
        <div className="empty-state">
          <MessageCircle size={48} />
          <p>Sélectionnez une conversation pour voir les informations</p>
        </div>
      </div>
    </div>
  );
}

export default RightInfoPanel;