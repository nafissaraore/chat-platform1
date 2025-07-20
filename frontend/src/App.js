import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import useAuth from './hooks/useAuth';
import './App.css';

function App() {
    const { isAuthenticated, user, loading: authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Chargement de l'application...</p>
            </div>
        );
    }

    return (
        <Router>
            <MainLayout isAuthenticated={isAuthenticated} user={user} />
        </Router>
    );
}

export default App;
