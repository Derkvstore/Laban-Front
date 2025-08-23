import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSpinner, FaCalendarAlt, FaChartBar } from 'react-icons/fa';

const Benefices = () => {
  const [benefices, setBenefices] = useState({
    total_ventes: 0,
    total_achats: 0,
    benefice_brut: 0,
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBenefices = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Utilisation de la variable d'environnement VITE_API_URL
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${API_URL}/api/benefices?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setBenefices(response.data);
    } catch (err) {
      setError('Erreur lors de la récupération des bénéfices.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBenefices();
  }, [startDate, endDate]);

  const formatPrice = (value) => {
    if (!value) return '0 FCFA';
    return parseFloat(value).toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + " FCFA";
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Section Bénéfices</h1>

        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
        
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0 text-gray-800">Calcul des bénéfices</h2>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center">
                <FaCalendarAlt className="text-blue-500 mr-2" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                />
              </div>
              <div className="flex items-center">
                <FaCalendarAlt className="text-blue-500 mr-2" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                />
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-gray-50 p-6 rounded-2xl shadow-md flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105">
                <FaChartBar className="text-4xl text-blue-500 mb-2" />
                <span className="text-4xl sm:text-5xl font-bold text-gray-800">{formatPrice(benefices.total_ventes)}</span>
                <p className="text-sm sm:text-md text-gray-500 mt-2">Ventes totales</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl shadow-md flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105">
                <FaChartBar className="text-4xl text-red-500 mb-2" />
                <span className="text-4xl sm:text-5xl font-bold text-gray-800">{formatPrice(benefices.total_achats)}</span>
                <p className="text-sm sm:text-md text-gray-500 mt-2">Coûts totaux</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl shadow-md flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105">
                <FaChartBar className="text-4xl text-green-500 mb-2" />
                <span className="text-4xl sm:text-5xl font-bold text-gray-800">{formatPrice(benefices.benefice_brut)}</span>
                <p className="text-sm sm:text-md text-gray-500 mt-2">Bénéfice brut</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Benefices;
