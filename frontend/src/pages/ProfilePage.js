// pages/ProfilePage.js (version stylisée)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuth from '../hooks/useAuth';
import './ProfileEditPage.css';

function ProfilePage({ onProfileUpdated }) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
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

  useEffect(() => {
    if (!authLoading && user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        age: user.age || '',
        gender: user.gender || '',
        interests: user.interests || '',
        intention: user.intention || '',
        photo_url: user.photo_url || '',
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
      setSelectedFile(file);
      // Créer une URL de prévisualisation
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

      // 1. Uploader la nouvelle photo si elle a été sélectionnée
      if (selectedFile) {
        console.log('Upload de la photo en cours...');
        const formData = new FormData();
        formData.append('profileImage', selectedFile);

        const uploadResponse = await api.post('/upload/profile', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
        });

        console.log('Réponse upload:', uploadResponse);

        if (uploadResponse.status === 200 && uploadResponse.data.fileUrl) {
          finalPhotoUrl = uploadResponse.data.fileUrl;
          console.log('Photo uploadée avec succès:', finalPhotoUrl);
        } else {
          throw new Error(uploadResponse.data?.message || 'Échec de l\'upload de la photo.');
        }
      }

      // 2. Mettre à jour le profil avec les données du formulaire et la nouvelle URL de photo
      console.log('Mise à jour du profil avec:', {
        ...profileData,
        photo_url: finalPhotoUrl
      });

      const updateResponse = await api.put(`/profile/${user.id}`, {
        ...profileData,
        photo_url: finalPhotoUrl
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Réponse mise à jour profil:', updateResponse);

      if (updateResponse.status === 200) {
        setSuccessMessage('Profil mis à jour avec succès !');
        
        // Mettre à jour l'état local avec la nouvelle URL
        setProfileData(prevData => ({
          ...prevData,
          photo_url: finalPhotoUrl
        }));

        // Nettoyer la prévisualisation
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setSelectedFile(null);

        // Appeler la fonction de rafraîchissement
        if (onProfileUpdated) {
          console.log('Appel de onProfileUpdated...');
          await onProfileUpdated();
        }

        // Optionnel: rediriger après un délai pour voir le message de succès
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } else {
        throw new Error(updateResponse.data?.message || 'Échec de la mise à jour du profil.');
      }

    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      
      if (err.response) {
        console.error('Réponse d\'erreur:', err.response.data);
        setError(err.response.data?.message || err.message || 'Une erreur est survenue.');
      } else {
        setError(err.message || 'Une erreur inattendue est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Nettoyer les URLs de prévisualisation
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
          
          {/* Photo de profil en premier */}
          <div className="form-group">
            <label htmlFor="profileImage">Photo de profil</label>
            <input
              type="file"
              id="profileImage"
              name="profileImage"
              accept="image/*"
              onChange={handleFileChange}
            />
            
            {/* Aperçu de la photo actuelle */}
            {profileData.photo_url && !previewUrl && (
              <div className="image-preview-container">
                <p>Photo actuelle</p>
                <img 
                  src={profileData.photo_url} 
                  alt="Photo de profil actuelle" 
                  className="profile-image-preview"
                />
              </div>
            )}
            
            {/* Aperçu de la nouvelle photo */}
            {previewUrl && (
              <div className="image-preview-container">
                <p>Nouvelle photo sélectionnée</p>
                <img 
                  src={previewUrl} 
                  alt="profile" 
                  className="profile-image-preview"
                />
              </div>
            )}
          </div>

          {/* Informations de base */}
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