import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSpinner, FaCalendarAlt, FaTruck, FaUndoAlt, FaFileInvoiceDollar, FaHeadphones } from 'react-icons/fa';

const Rapports = () => {
  const [reportData, setReportData] = useState({
    stock: [],
    mouvements: {
      cartons: {},
      arrivages: {},
      accessoires: {},
    },
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Utilisation de la variable d'environnement VITE_API_URL
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Récupérer le stock actuel
      const stockResponse = await axios.get(`${API_URL}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Récupérer les mouvements de stock journaliers
      const mouvementsResponse = await axios.get(`${API_URL}/api/rapports/daily?date=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setReportData({
        stock: stockResponse.data,
        mouvements: mouvementsResponse.data,
      });

    } catch (err) {
      setError('Erreur lors de la récupération des données du rapport.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedDate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };
  
  const filteredStock = reportData.stock.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (product.marque && product.marque.toLowerCase().includes(searchLower)) ||
      (product.modele && product.modele.toLowerCase().includes(searchLower)) ||
      (product.stockage && product.stockage.toLowerCase().includes(searchLower)) ||
      (product.type && product.type.toLowerCase().includes(searchLower))
    );
  });
  
  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Section Rapports</h1>

        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
        
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0 text-gray-800">Rapport du jour: {formatDate(selectedDate)}</h2>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-start sm:items-center">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              />
              <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center justify-center">
                <FaFileInvoiceDollar className="mr-2" />
                Imprimer
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
          ) : (
            <>
              {/* Mouvements de Stock Journaliers */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Mouvements de Stock Journaliers ({formatDate(selectedDate)})</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Carte pour les cartons */}
                  <div key="cartons" className="bg-gray-50 p-6 rounded-2xl shadow-md">
                    <h3 className="text-lg font-bold mb-2 text-blue-600 flex items-center"><FaTruck className="mr-2" /> Mobiles en Carton</h3>
                    <p className="text-sm">Stock d'hier: <span className="font-semibold">{reportData.mouvements.cartons?.stockHier || 0}</span></p>
                    <p className="text-sm text-green-600">Ajouté aujourd'hui: +<span className="font-semibold">{reportData.mouvements.cartons?.ajouteToday || 0}</span></p>
                    <p className="text-sm text-red-600">Vendu aujourd'hui: -<span className="font-semibold">{reportData.mouvements.cartons?.venduToday || 0}</span></p>
                    <p className="text-sm text-yellow-600">Retourné aujourd'hui: -<span className="font-semibold">{reportData.mouvements.cartons?.retourneToday || 0}</span></p>
                  </div>
                  {/* Carte pour les arrivages */}
                  <div key="arrivages" className="bg-gray-50 p-6 rounded-2xl shadow-md">
                    <h3 className="text-lg font-bold mb-2 text-green-600 flex items-center"><FaUndoAlt className="mr-2" /> Mobiles en Arrivage</h3>
                    <p className="text-sm">Stock d'hier: <span className="font-semibold">{reportData.mouvements.arrivages?.stockHier || 0}</span></p>
                    <p className="text-sm text-green-600">Ajouté aujourd'hui: +<span className="font-semibold">{reportData.mouvements.arrivages?.ajouteToday || 0}</span></p>
                    <p className="text-sm text-red-600">Vendu aujourd'hui: -<span className="font-semibold">{reportData.mouvements.arrivages?.venduToday || 0}</span></p>
                    <p className="text-sm text-yellow-600">Retourné aujourd'hui: -<span className="font-semibold">{reportData.mouvements.arrivages?.retourneToday || 0}</span></p>
                  </div>
                  {/* Carte pour les accessoires */}
                  <div key="accessoires" className="bg-gray-50 p-6 rounded-2xl shadow-md">
                    <h3 className="text-lg font-bold mb-2 text-purple-600 flex items-center"><FaHeadphones className="mr-2" /> Accessoires</h3>
                    <p className="text-sm">Stock d'hier: <span className="font-semibold">{reportData.mouvements.accessoires?.stockHier || 0}</span></p>
                    <p className="text-sm text-green-600">Ajouté aujourd'hui: +<span className="font-semibold">{reportData.mouvements.accessoires?.ajouteToday || 0}</span></p>
                    <p className="text-sm text-red-600">Vendu aujourd'hui: -<span className="font-semibold">{reportData.mouvements.accessoires?.venduToday || 0}</span></p>
                    <p className="text-sm text-yellow-600">Retourné aujourd'hui: -<span className="font-semibold">{reportData.mouvements.accessoires?.retourneToday || 0}</span></p>
                  </div>
                </div>
              </div>

              {/* Tableau de stock */}
              <div className="overflow-x-auto">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Inventaire Actuel</h2>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marque</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modèle</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stockage</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qté en Stock</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStock.map((product) => (
                      <tr key={product.id}>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.marque}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.modele}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stockage}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.type}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.quantite_en_stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rapports;
