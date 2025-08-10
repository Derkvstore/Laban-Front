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
      const response = await axios.get(`http://localhost:3000/api/benefices?startDate=${startDate}&endDate=${endDate}`, {
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
    if (!value) return '';
    return parseFloat(value).toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + " FCFA";
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Section Bénéfices</h1>

        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
        
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Calcul des bénéfices</h2>
            <div className="flex space-x-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border rounded-xl"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border rounded-xl"
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-6 rounded-2xl shadow-md flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105">
                <FaChartBar className="text-4xl text-blue-500 mb-2" />
                <span className="text-5xl font-bold text-gray-800">{formatPrice(benefices.total_ventes)}</span>
                <p className="text-md text-gray-500 mt-2">Ventes totales</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl shadow-md flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105">
                <FaChartBar className="text-4xl text-red-500 mb-2" />
                <span className="text-5xl font-bold text-gray-800">{formatPrice(benefices.total_achats)}</span>
                <p className="text-md text-gray-500 mt-2">Coûts totaux</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl shadow-md flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105">
                <FaChartBar className="text-4xl text-green-500 mb-2" />
                <span className="text-5xl font-bold text-gray-800">{formatPrice(benefices.benefice_brut)}</span>
                <p className="text-md text-gray-500 mt-2">Bénéfice brut</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Benefices;
