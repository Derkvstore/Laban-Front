import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Vérifie si un token d'authentification existe dans le localStorage
  const token = localStorage.getItem('token');

  // Si le token n'existe pas, l'utilisateur est redirigé vers la page de connexion
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si le token existe, le composant enfant (Dashboard) est rendu
  return children;
};

export default ProtectedRoute;
