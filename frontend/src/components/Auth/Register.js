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
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            await api.post('/auth/register', { username, email, password });
            
            // Petit délai pour l'UX
            setTimeout(() => {
                navigate('/login', { 
                    state: { 
                        message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.' 
                    } 
                });
            }, 500);
        } catch (err) {
            console.error('Erreur d\'inscription:', err);
            setError(err.response?.data?.message || 'Échec de l\'inscription. Veuillez réessayer.');
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
                        />
                    </div>
                    
                    {error && <p className="auth-error-message">{error}</p>}
                    
                    <button 
                        type="submit" 
                        className={`auth-button ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Inscription en cours...' : 'S\'inscrire'}
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