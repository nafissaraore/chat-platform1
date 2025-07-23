import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../utils/api';
import './Auth.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    // ✅ Utiliser les fonctions du hook useAuth
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const response = await api.post('/auth/login', { email, password });
            
            // ✅ Utiliser la fonction login du hook au lieu de manipuler localStorage directement
            login(response.data.user, response.data.token);
            
            console.log('✅ Connexion réussie:', response.data.user);
            
            // ✅ Navigation immédiate, le hook s'occupera de la synchronisation
            navigate('/dashboard');
            
        } catch (err) {
            console.error('Erreur de connexion:', err);
            setError(err.response?.data?.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-wrapper">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2 className="auth-title">Connexion</h2>
                    </div>
                    
                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="votre@email.com"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                id="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        
                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}
                        
                        <button 
                            type="submit" 
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading ? 'Connexion en cours...' : 'Se connecter'}
                        </button>
                    </form>
                    
                    <div className="auth-footer">
                        <p className="auth-link-text">
                            Pas encore de compte ?{' '}
                            <Link to="/register" className="auth-link">
                                S'inscrire
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;