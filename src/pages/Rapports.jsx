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

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Récupérer le stock actuel
      const stockResponse = await axios.get('http://localhost:3000/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Récupérer les mouvements de stock journaliers
      const mouvementsResponse = await axios.get(`http://localhost:3000/api/rapports/daily?date=${selectedDate}`, {
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
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Section Rapports</h1>

        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
        
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Stock du jour : {formatDate(selectedDate)}</h2>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Rechercher par marque, modèle, stockage..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border rounded-xl"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
                Imprimer le rapport
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
          ) : (
            <>
              {/* Tableau de stock */}
              <div className="overflow-x-auto mb-8">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marque</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modèle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stockage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qté Totale en Stock</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStock.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.marque}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.modele}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stockage}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.type_carton}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.quantite_en_stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mouvements de Stock Journaliers */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Mouvements de Stock Journaliers ({formatDate(selectedDate)})</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Carte pour les cartons */}
                  <div key="cartons" className="bg-gray-50 p-6 rounded-2xl shadow-md">
                    <h3 className="text-lg font-bold mb-2 text-blue-600">Mobiles en Carton</h3>
                    <p className="text-sm">Stock d'hier: {reportData.mouvements.cartons?.stockHier || 0}</p>
                    <p className="text-sm text-green-600">Ajouté aujourd'hui: +{reportData.mouvements.cartons?.ajoutToday || 0}</p>
                    <p className="text-sm text-red-600">Vendu aujourd'hui: -{reportData.mouvements.cartons?.venduToday || 0}</p>
                    <p className="text-sm text-yellow-600">Retourné aujourd'hui: -{reportData.mouvements.cartons?.retourneToday || 0}</p>
                  </div>
                  {/* Carte pour les arrivages */}
                  <div key="arrivages" className="bg-gray-50 p-6 rounded-2xl shadow-md">
                    <h3 className="text-lg font-bold mb-2 text-green-600">Mobiles en Arrivage</h3>
                    <p className="text-sm">Stock d'hier: {reportData.mouvements.arrivages?.stockHier || 0}</p>
                    <p className="text-sm text-green-600">Ajouté aujourd'hui: +{reportData.mouvements.arrivages?.ajoutToday || 0}</p>
                    <p className="text-sm text-red-600">Vendu aujourd'hui: -{reportData.mouvements.arrivages?.venduToday || 0}</p>
                    <p className="text-sm text-yellow-600">Retourné aujourd'hui: -{reportData.mouvements.arrivages?.retourneToday || 0}</p>
                  </div>
                  {/* Carte pour les accessoires */}
                  <div key="accessoires" className="bg-gray-50 p-6 rounded-2xl shadow-md">
                    <h3 className="text-lg font-bold mb-2 text-purple-600">Accessoires</h3>
                    <p className="text-sm">Stock d'hier: {reportData.mouvements.accessoires?.stockHier || 0}</p>
                    <p className="text-sm text-green-600">Ajouté aujourd'hui: +{reportData.mouvements.accessoires?.ajoutToday || 0}</p>
                    <p className="text-sm text-red-600">Vendu aujourd'hui: -{reportData.mouvements.accessoires?.venduToday || 0}</p>
                    <p className="text-sm text-yellow-600">Retourné aujourd'hui: -{reportData.mouvements.accessoires?.retourneToday || 0}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rapports;
