// ProfilePage.js - Version corrigée
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
      // Charger les données du profil depuis la base de données
      loadProfileData();
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token || !user?.id) {
        setError('Utilisateur non authentifié');
        return;
      }

      // Récupérer les données du profil depuis l'API
      const response = await api.get(`/profile/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data) {
        const profile = response.data;
        setProfileData({
          username: profile.username || user.username || '',
          email: profile.email || user.email || '',
          age: profile.age || '',
          gender: profile.gender || '',
          interests: profile.interests || '',
          intention: profile.intention || '',
          photo_url: profile.photo_url || profile.profileImage || user.photo_url || user.profileImage || '',
          location: profile.location || '',
        });
      } else {
        // Si pas de profil existant, utiliser les données de l'utilisateur
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
      }
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
      // En cas d'erreur, utiliser les données de l'utilisateur connecté
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
    } finally {
      setLoading(false);
    }
  };

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
      
      // Créer l'aperçu
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      console.log('Fichier sélectionné:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
  };

  const uploadImage = async (file, token) => {
    try {
      console.log('Tentative d\'upload multipart...');
      
      // Méthode 1: Upload multipart
      const formData = new FormData();
      formData.append('profileImage', file);
      formData.append('userId', user.id.toString());

      const uploadResponse = await api.post('/upload/profile', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Ne pas définir Content-Type pour FormData, le navigateur le fera automatiquement
        },
        timeout: 30000, // 30 secondes
      });

      if (uploadResponse.data?.fileUrl || uploadResponse.data?.url) {
        const imageUrl = uploadResponse.data.fileUrl || uploadResponse.data.url;
        console.log('Upload multipart réussi:', imageUrl);
        return imageUrl;
      } else {
        throw new Error('Aucune URL retournée par le serveur');
      }
    } catch (uploadError) {
      console.log('Upload multipart échoué:', uploadError.message);
      
      try {
        console.log('Tentative d\'upload en base64...');
        
        // Méthode 2: Upload en base64
        const base64Data = await fileToBase64(file);
        
        const base64Response = await api.post('/upload/profile-base64', {
          imageData: base64Data,
          userId: user.id,
          filename: file.name,
          mimeType: file.type
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000,
        });

        if (base64Response.data?.fileUrl || base64Response.data?.url) {
          const imageUrl = base64Response.data.fileUrl || base64Response.data.url;
          console.log('Upload base64 réussi:', imageUrl);
          return imageUrl;
        } else {
          // Méthode 3: Utiliser directement le base64
          console.log('Utilisation du base64 directement');
          return base64Data;
        }
      } catch (base64Error) {
        console.error('Upload base64 échoué:', base64Error);
        throw new Error(`Échec de l'upload: ${uploadError.response?.data?.message || uploadError.message}`);
      }
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

      // 1. Upload de la nouvelle photo si sélectionnée
      if (selectedFile) {
        console.log('Traitement de la nouvelle photo...');
        finalPhotoUrl = await uploadImage(selectedFile, token);
      }

      // 2. Préparer les données de mise à jour
      const updateData = {
        username: profileData.username,
        email: profileData.email,
        age: profileData.age ? parseInt(profileData.age, 10) : null,
        gender: profileData.gender,
        interests: profileData.interests,
        intention: profileData.intention,
        photo_url: finalPhotoUrl,
        location: profileData.location,
      };

      console.log('Données à envoyer:', updateData);

      // 3. Mettre à jour le profil
      const updateResponse = await api.put(`/profile/${user.id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000,
      });

      if (updateResponse.status === 200 || updateResponse.status === 201) {
        console.log('Profil mis à jour avec succès');
        setSuccessMessage('Profil mis à jour avec succès !');
        
        // Mettre à jour les données locales
        setProfileData(prevData => ({
          ...prevData,
          photo_url: finalPhotoUrl
        }));

        // Nettoyer les fichiers temporaires
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setSelectedFile(null);

        // Rafraîchir les données utilisateur
        if (refreshUser) {
          try {
            await refreshUser();
          } catch (refreshError) {
            console.warn('Erreur lors du rafraîchissement:', refreshError);
          }
        }

        if (onProfileUpdated) {
          try {
            await onProfileUpdated();
          } catch (callbackError) {
            console.warn('Erreur callback:', callbackError);
          }
        }

        // Redirection après succès
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } else {
        throw new Error(`Erreur du serveur: ${updateResponse.status}`);
      }

    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      
      let errorMessage = 'Une erreur est survenue lors de la mise à jour.';
      
      if (err.response) {
        // Erreur de réponse du serveur
        errorMessage = err.response.data?.message || `Erreur ${err.response.status}: ${err.response.statusText}`;
      } else if (err.request) {
        // Erreur de réseau
        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet.';
      } else {
        // Autre erreur
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Nettoyage des URLs temporaires
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (loading || authLoading) {
    return (
      <div className="profile-edit-container loading">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p>Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-edit-container">
      <div className="profile-edit-card">
        <h2>Modifier le profil</h2>
        
        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="success-message" style={{ marginBottom: '20px' }}>
            {successMessage}
          </div>
        )}

        <form className="profile-edit-form" onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label htmlFor="profileImage">Photo de profil</label>
            <input
              type="file"
              id="profileImage"
              name="profileImage"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              disabled={loading}
            />
            
            {/* Photo actuelle */}
            {profileData.photo_url && !previewUrl && (
              <div className="image-preview-container" style={{ marginTop: '10px' }}>
                <p><strong>Photo actuelle :</strong></p>
                <img 
                  src={profileData.photo_url} 
                  alt="Photo de profil actuelle" 
                  className="profile-image-preview"
                  style={{ 
                    maxWidth: '150px', 
                    maxHeight: '150px', 
                    borderRadius: '8px',
                    border: '2px solid #ddd',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    console.error('Erreur de chargement de l\'image actuelle');
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Aperçu de la nouvelle photo */}
            {previewUrl && (
              <div className="image-preview-container" style={{ marginTop: '10px' }}>
                <p><strong>Nouvelle photo sélectionnée :</strong></p>
                <img 
                  src={previewUrl} 
                  alt="Aperçu" 
                  className="profile-image-preview"
                  style={{ 
                    maxWidth: '150px', 
                    maxHeight: '150px', 
                    borderRadius: '8px',
                    border: '2px solid #4CAF50',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ marginTop: '5px' }}>
                  <small>Fichier: {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)</small>
                </div>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={profileData.username}
                onChange={handleChange}
                placeholder="Votre nom d'utilisateur"
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleChange}
                placeholder="votre@email.com"
                required
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
              rows={4}
            />
          </div>

          <button 
            type="submit" 
            className={`save-profile-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Enregistrement en cours...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;