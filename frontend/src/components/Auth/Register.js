import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import './Auth.css';

function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const validateForm = () => {
        if (username.length < 3) {
            setError('Le nom d\'utilisateur doit contenir au moins 3 caractères');
            return false;
        }
        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Veuillez entrer une adresse email valide');
            return false;
        }
        return true;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        
        try {
            await api.post('/auth/register', { username, email, password });
            setSuccess(true);
            
            // Petit délai pour l'UX
            setTimeout(() => {
                navigate('/login', { 
                    state: { 
                        message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.' 
                    } 
                });
            }, 1000);
        } catch (err) {
            console.error('Erreur d\'inscription:', err);
            
            if (err.response) {
                // Erreur de réponse du serveur
                const status = err.response.status;
                const message = err.response.data?.message;
                
                switch (status) {
                    case 400:
                        setError(message || 'Données invalides. Vérifiez vos informations.');
                        break;
                    case 409:
                        setError('Cet email ou nom d\'utilisateur existe déjà.');
                        break;
                    case 500:
                        setError('Erreur serveur. Veuillez réessayer plus tard.');
                        break;
                    default:
                        setError(message || 'Erreur inattendue. Veuillez réessayer.');
                }
            } else if (err.request) {
                // Erreur réseau
                setError('Problème de connexion. Vérifiez votre réseau.');
            } else {
                setError('Erreur inattendue. Veuillez réessayer.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Inscription</h2>
                <form onSubmit={handleRegister}>
                    <div className="auth-form-group">
                        <label htmlFor="username" className="auth-label">Nom d'utilisateur</label>
                        <input
                            type="text"
                            id="username"
                            className="auth-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Votre nom d'utilisateur"
                            required
                            minLength="3"
                        />
                    </div>
                    
                    <div className="auth-form-group">
                        <label htmlFor="email" className="auth-label">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="auth-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="votre@email.com"
                            required
                        />
                    </div>
                    
                    <div className="auth-form-group">
                        <label htmlFor="password" className="auth-label">Mot de passe</label>
                        <input
                            type="password"
                            id="password"
                            className="auth-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength="6"
                        />
                    </div>
                    
                    {error && <p className="auth-error-message">{error}</p>}
                    {success && <p className="auth-success-message">Inscription réussie ! Redirection...</p>}
                    
                    <button 
                        type="submit" 
                        className={`auth-button ${loading ? 'loading' : ''} ${success ? 'success' : ''}`}
                        disabled={loading || success}
                    >
                        {loading ? 'Inscription en cours...' : success ? 'Inscription réussie ✓' : 'S\'inscrire'}
                    </button>
                </form>
                
                <p className="auth-link-text">
                    Déjà un compte ? <Link to="/login" className="auth-link">Se connecter</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;