// frontend/src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🆕 Fonction pour vérifier et charger l'état d'authentification
    const checkAuthState = useCallback(() => {
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
                logout();
            }
        }
    };

    // 🆕 Fonction de déconnexion
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        // Émettre un événement personnalisé pour notifier les autres composants
        window.dispatchEvent(new Event('auth-logout'));
    }, []);

    // 🆕 Fonction de connexion (à appeler depuis Login)
    const login = useCallback((userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsAuthenticated(true);
        setUser(userData);
        // Émettre un événement personnalisé pour notifier les autres composants
        window.dispatchEvent(new Event('auth-login'));
    }, []);

    // ✅ Chargement initial
    useEffect(() => {
        checkAuthState();
    }, [checkAuthState]);

    // 🆕 Écouter les changements du localStorage (pour la synchronisation entre onglets)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'token' || e.key === 'user') {
                console.log('Changement détecté dans le localStorage:', e.key);
                checkAuthState();
            }
        };

        // Écouter les événements personnalisés d'authentification
        const handleAuthLogin = () => {
            console.log('Événement de connexion détecté');
            checkAuthState();
        };

        const handleAuthLogout = () => {
            console.log('Événement de déconnexion détecté');
            setIsAuthenticated(false);
            setUser(null);
        };

        // Ajouter les écouteurs d'événements
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('auth-login', handleAuthLogin);
        window.addEventListener('auth-logout', handleAuthLogout);

        // Nettoyage
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('auth-login', handleAuthLogin);
            window.removeEventListener('auth-logout', handleAuthLogout);
        };
    }, [checkAuthState]);

    return { 
        isAuthenticated, 
        user, 
        loading, 
        refreshUser, 
        login, 
        logout,
        checkAuthState 
    };
};

export default useAuth;