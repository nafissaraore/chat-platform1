// frontend/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import api from '../utils/api';

const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🆕 Rafraîchir les données utilisateur depuis le backend
    const refreshUser = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            
            if (!token || !userData) {
                console.warn("❌ Pas de token ou d'utilisateur disponible pour rafraîchir");
                return;
            }

            const currentUser = JSON.parse(userData);
            
            // Utiliser la route de profil existante au lieu de /auth/me
            const response = await api.get(`/profile/${currentUser.id}`);
            const updatedUser = response.data;
            
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            console.log("✅ Utilisateur rafraîchi:", updatedUser);
        } catch (error) {
            console.error("❌ Échec du rafraîchissement de l'utilisateur :", error);
            
            // Si l'erreur est due à un token invalide, déconnecter l'utilisateur
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsAuthenticated(false);
                setUser(null);
            }
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setIsAuthenticated(true);
                setUser(parsedUser);
                console.log("******************************************************************");
                console.log("DEBUG useAuth: Utilisateur chargé depuis localStorage:", parsedUser);
                console.log("DEBUG useAuth: ID de l'utilisateur chargé:", parsedUser.id);
                console.log("DEBUG useAuth: Type de l'ID de l'utilisateur chargé:", typeof parsedUser.id);
                console.log("******************************************************************");
            } catch (e) {
                console.error("Erreur lors du parsing des données utilisateur du localStorage", e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsAuthenticated(false);
                setUser(null);
            }
        } else {
            setIsAuthenticated(false);
            setUser(null);
        }

        setLoading(false);
    }, []);

    return { isAuthenticated, user, loading, refreshUser };
};

export default useAuth;