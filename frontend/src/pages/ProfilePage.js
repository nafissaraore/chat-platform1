// ProfilePage.js - Version avec support Base64
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuth from '../hooks/useAuth';
import './ProfileEditPage.css';

function ProfilePage({ onProfileUpdated }) {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    age: '',
    gender: '',
    interests: '',
    intention: '',
    photo_url: '',
    location: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fonction pour convertir un fichier en base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  useEffect(() => {
    if (!authLoading && user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        age: user.age || '',
        gender: user.gender || '',
        interests: user.interests || '',
        intention: user.intention || '',
        photo_url: user.photo_url || user.profileImage || '',
        location: user.location || '',
      });
      setLoading(false);
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifications
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      if (file.size > maxSize) {
        setError('La taille du fichier ne doit pas dépasser 5MB.');
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        setError('Format de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP.');
        return;
      }
      
      setError(null);
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const token = localStorage.getItem('token');
    if (!token || !user?.id) {
      setError('Utilisateur non authentifié ou ID manquant.');
      setLoading(false);
      return;
    }

    try {
      let finalPhotoUrl = profileData.photo_url;

      // 1. Gérer l'upload de la nouvelle photo
      if (selectedFile) {
        console.log('Traitement de la photo...');
        
        try {
          // Méthode 1: Essayer l'upload multipart
          const formData = new FormData();
          formData.append('profileImage', selectedFile);
          formData.append('userId', user.id.toString());

          const uploadResponse = await api.post('/upload/profile', formData, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (uploadResponse.data.fileUrl || uploadResponse.data.url) {
            finalPhotoUrl = uploadResponse.data.fileUrl || uploadResponse.data.url;
            console.log('Photo uploadée (multipart):', finalPhotoUrl);
          } else {
            throw new Error('Pas d\'URL retournée');
          }
        } catch (uploadError) {
          console.log('Upload multipart échoué, essai en base64...');
          
          try {
            // Méthode 2: Convertir en base64 et envoyer via JSON
            const base64Data = await fileToBase64(selectedFile);
            
            const base64Response = await api.post('/upload/profile-base64', {
              imageData: base64Data,
              userId: user.id,
              filename: selectedFile.name,
              mimeType: selectedFile.type
            }, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (base64Response.data.fileUrl || base64Response.data.url) {
              finalPhotoUrl = base64Response.data.fileUrl || base64Response.data.url;
              console.log('Photo uploadée (base64):', finalPhotoUrl);
            } else {
              // Méthode 3: Utiliser directement le base64
              finalPhotoUrl = base64Data;
              console.log('Utilisation du base64 directement');
            }
          } catch (base64Error) {
            console.error('Erreur base64:', base64Error);
            throw new Error(`Échec de l'upload de l'image: ${uploadError.response?.data?.message || uploadError.message}`);
          }
        }
      }

      // 2. Mettre à jour le profil
      const updateData = {
        ...profileData,
        photo_url: finalPhotoUrl,
        profileImage: finalPhotoUrl
      };

      console.log('Mise à jour du profil...');

      const updateResponse = await api.put(`/profile/${user.id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (updateResponse.status === 200) {
        setSuccessMessage('Profil mis à jour avec succès !');
        
        setProfileData(prevData => ({
          ...prevData,
          photo_url: finalPhotoUrl
        }));

        // Nettoyer
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setSelectedFile(null);

        // Rafraîchir les données utilisateur
        if (refreshUser) {
          await refreshUser();
        }

        if (onProfileUpdated) {
          await onProfileUpdated();
        }

        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } else {
        throw new Error('Échec de la mise à jour du profil.');
      }

    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (loading || authLoading) {
    return <div className="profile-edit-container loading">Chargement du profil...</div>;
  }

  if (error && !profileData.username) {
    return <div className="profile-edit-container error">Erreur: {error}</div>;
  }

  return (
    <div className="profile-edit-container">
      <div className="profile-edit-card">
        <h2>Modifier le profil</h2>
        <form className="profile-edit-form" onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label htmlFor="profileImage">Photo de profil</label>
            <input
              type="file"
              id="profileImage"
              name="profileImage"
              accept="image/*"
              onChange={handleFileChange}
            />
            
            {profileData.photo_url && !previewUrl && (
              <div className="image-preview-container">
                <p>Photo actuelle</p>
                <img 
                  src={profileData.photo_url} 
                  alt="Photo de profil actuelle" 
                  className="profile-image-preview"
                  style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px' }}
                />
              </div>
            )}
            
            {previewUrl && (
              <div className="image-preview-container">
                <p>Nouvelle photo sélectionnée</p>
                <img 
                  src={previewUrl} 
                  alt="profile" 
                  className="profile-image-preview"
                  style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px' }}
                />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input
                type="text"
                id="username"
                name="username"
                value={profileData.username}
                onChange={handleChange}
                placeholder="Votre nom d'utilisateur"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleChange}
                placeholder="votre@email.com"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="age">Âge</label>
              <input
                type="number"
                id="age"
                name="age"
                value={profileData.age}
                onChange={handleChange}
                placeholder="25"
                min="18"
                max="100"
              />
            </div>
            <div className="form-group">
              <label htmlFor="gender">Genre</label>
              <input
                type="text"
                id="gender"
                name="gender"
                value={profileData.gender}
                onChange={handleChange}
                placeholder="Homme, Femme, Autre..."
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Localisation</label>
            <input
              type="text"
              id="location"
              name="location"
              value={profileData.location}
              onChange={handleChange}
              placeholder="Paris, France"
            />
          </div>

          <div className="form-group">
            <label htmlFor="intention">Intention</label>
            <input
              type="text"
              id="intention"
              name="intention"
              value={profileData.intention}
              onChange={handleChange}
              placeholder="Relation sérieuse, Amitié, Casual..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="interests">Intérêts</label>
            <textarea
              id="interests"
              name="interests"
              value={profileData.interests}
              onChange={handleChange}
              placeholder="Parlez-nous de vos passions, hobbies, centres d'intérêt..."
            />
          </div>

          <button 
            type="submit" 
            className={`save-profile-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
          
          {successMessage && <div className="success-message">{successMessage}</div>}
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;