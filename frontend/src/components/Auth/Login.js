import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import useAuth from '../../hooks/useAuth'; // ✅ importer le hook
import './Auth.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { refreshUser } = useAuth(); // ✅ récupérer la fonction

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            
            // ✅ Stocker le token
            localStorage.setItem('token', response.data.token);

            // 🔄 Important : recharger le user dans le contexte global
            await refreshUser();

            console.log("✅ Connexion réussie pour:", response.data.user.username);

            // 🚀 Redirection seulement après le refresh
            navigate('/dashboard', { replace: true });
            
        } catch (err) {
            console.error('❌ Erreur de connexion:', err);
            setError(err.response?.data?.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Connexion</h2>
                <form onSubmit={handleLogin}>
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
                        {loading ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                </form>

                <p className="auth-link-text">
                    Pas encore de compte ? <Link to="/register" className="auth-link">S'inscrire</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
