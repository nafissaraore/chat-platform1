import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import './Auth.css';

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validation côté client
        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        if (formData.username.length === 0) {
            setError('Le nom d\'utilisateur est requis');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await api.post('/auth/register', {
                username: formData.username,
                email: formData.email,
                password: formData.password
            });
            
            // Connexion automatique après inscription
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 500);
        } catch (err) {
            console.error('Erreur d\'inscription:', err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.status === 400) {
                setError('Données invalides. Vérifiez vos informations.');
            } else {
                setError('Échec de l\'inscription. Veuillez réessayer.');
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
                            name="username"
                            className="auth-input"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="jeandupont123"
                            minLength={1}
                            maxLength={255}
                            required
                        />
                    </div>
                    
                    <div className="auth-form-group">
                        <label htmlFor="email" className="auth-label">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="auth-input"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="jean.dupont@email.com"
                            required
                        />
                    </div>
                    
                    <div className="auth-form-group">
                        <label htmlFor="password" className="auth-label">Mot de passe</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="auth-input"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            minLength={6}
                            required
                        />
                    </div>
                    
                    <div className="auth-form-group">
                        <label htmlFor="confirmPassword" className="auth-label">Confirmer le mot de passe</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className="auth-input"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            minLength={6}
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