import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaApple, FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa'; // Import des icônes

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Nouvel état pour afficher/masquer le mot de passe
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // Utilisez l'URL de votre backend Railway ici
      // La variable d'environnement sera automatiquement injectée par Vercel
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError('Nom d\'utilisateur ou mot de passe incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans antialiased text-gray-900">
      <div className="w-full max-w-lg p-10 bg-white rounded-xl shadow-2xl">
        <div className="flex flex-col items-center">
          <FaApple className="text-5xl text-gray-900 mb-4" />
          <h1 className="text-4xl font-semibold mb-2 text-gray-900">Wassolo Service</h1>
          <p className="text-xl text-gray-500">Connectez-vous à votre compte</p>
        </div>
        <form onSubmit={handleLogin} className="mt-10">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-lg"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-8 relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-lg pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <FaEyeSlash className="h-6 w-6" />
              ) : (
                <FaEye className="h-6 w-6" />
              )}
            </button>
          </div>
          {error && (
            <div className="mb-6 text-red-500 text-sm text-center">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full px-5 py-4 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition duration-200 flex items-center justify-center text-xl"
            disabled={isLoading}
          >
            {isLoading ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              'Connexion'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
