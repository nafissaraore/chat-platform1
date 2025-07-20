// frontend/src/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Lottie from 'lottie-react';
import chatAnimationData from '../assets/chat-animation.json';
import './HomePage.css'; // Importe le fichier CSS

function HomePage() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="homepage-container">
            {/* Logo ou titre "Simpion Chat" */}
            <h1 className="homepage-title">
                 Chat
            </h1>

            {/* Titre principal */}
            <h2 className="homepage-subtitle">
                Discutez, Partagez, Connectez-vous.
            </h2>

            {/* Description */}
            <p className="homepage-description">
                Chat est votre plateforme intuitive et sécurisée pour des conversations
                instantanées. Que ce soit en groupe ou en privé, restez toujours en contact.
            </p>

            {/* Animation Lottie */}
            {chatAnimationData && (
                <Lottie
                    animationData={chatAnimationData}
                    loop={true}
                    autoplay={true}
                    className="homepage-animation"
                />
            )}

            {/* Bouton d'appel à l'action */}
            {isAuthenticated ? (
                <Link to="/dashboard" className="homepage-cta-button">
                    Accéder à mes messages
                </Link>
            ) : (
                <Link to="/login" className="homepage-cta-button">
                    Se connecter pour commencer
                </Link>
            )}
        </div>
    );
}

export default HomePage;
