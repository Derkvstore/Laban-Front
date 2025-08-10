import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaRegCalendarAlt, FaRegClock, FaBoxOpen, FaTruck, FaUndoAlt, FaMobileAlt, FaSpinner, FaHeadphones } from 'react-icons/fa';

// Hook personnalisé pour l'animation de comptage
const useCountUp = (endValue, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef(0);

  const startCount = () => {
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      ref.current = percentage * endValue;
      setCount(Math.round(ref.current));
      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  };
  
  useEffect(() => {
    startCount();
  }, [endValue, duration]);

  return count;
};


const Accueil = ({ user, currentTime }) => {
  const [dashboardData, setDashboardData] = useState({
    cartons: 0,
    arrivages: 0,
    retours: 0,
    mobilesVendus: 0,
    accessoires: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Utilisation de la variable d'environnement VITE_API_URL
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${API_URL}/api/rapports/totals`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setDashboardData(response.data);
    } catch (err) {
      setError("Erreur lors de la récupération des données du tableau de bord.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getDayAndDate = () => {
    return currentTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const getHour = () => {
    return currentTime.toLocaleTimeString('fr-FR');
  };

  // Utilisation du hook d'animation pour chaque valeur
  const animatedCartons = useCountUp(dashboardData.cartons);
  const animatedArrivages = useCountUp(dashboardData.arrivages);
  const animatedRetours = useCountUp(dashboardData.retours);
  const animatedMobilesVendus = useCountUp(dashboardData.mobilesVendus);
  const animatedAccessoires = useCountUp(dashboardData.accessoires);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg transition-all duration-300">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <h2 className="text-3xl font-semibold">{getGreeting()}, {user.fullName || user.username} !</h2>
          <span className="ml-2 text-3xl">👋</span>
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center px-4 py-2 bg-gray-100 rounded-xl">
            <FaRegCalendarAlt className="mr-2 text-blue-500" />
            <span className="text-md font-medium">{getDayAndDate()}</span>
          </div>
          <div className="flex items-center px-4 py-2 bg-gray-100 rounded-xl">
            <FaRegClock className="mr-2 text-blue-500" />
            <span className="text-md font-medium">{getHour()}</span>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <FaSpinner className="animate-spin text-4xl text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-gray-50 p-6 rounded-2xl shadow-md flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105">
            <FaBoxOpen className="text-4xl text-blue-500 mb-2" />
            <span className="text-5xl font-bold text-gray-800">{animatedCartons}</span>
            <p className="text-md text-gray-500 mt-2">Cartons</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl shadow-md flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105">
            <FaTruck className="text-4xl text-green-500 mb-2" />
            <span className="text-5xl font-bold text-gray-800">{animatedArrivages}</span>
            <p className="text-md text-gray-500 mt-2">Arrivages</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl shadow-md flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105">
            <FaUndoAlt className="text-4xl text-red-500 mb-2" />
            <span className="text-5xl font-bold text-gray-800">{animatedRetours}</span>
            <p className="text-md text-gray-500 mt-2">Retours</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl shadow-md flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105">
            <FaMobileAlt className="text-4xl text-purple-500 mb-2" />
            <span className="text-5xl font-bold text-gray-800">{animatedMobilesVendus}</span>
            <p className="text-md text-gray-500 mt-2">Mobiles Vendus</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl shadow-md flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105">
            <FaHeadphones className="text-4xl text-yellow-500 mb-2" />
            <span className="text-5xl font-bold text-gray-800">{animatedAccessoires}</span>
            <p className="text-md text-gray-500 mt-2">Accessoires</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accueil;
