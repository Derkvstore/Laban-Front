import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSpinner, FaCalendarAlt, FaClock } from 'react-icons/fa';

const Retours = () => {
  const [retours, setRetours] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Utilisation de la variable d'environnement VITE_API_URL
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchRetours = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token non trouvé. Veuillez vous reconnecter.");
      }
      const response = await axios.get(`${API_URL}/api/defective_returns`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const clientsResponse = await axios.get(`${API_URL}/api/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setClients(clientsResponse.data);

      setRetours(response.data);
    } catch (err) {
      setError('Erreur lors de la récupération des retours.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRetours();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const options = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString('fr-FR', options);
  };
  
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.nom : 'N/A';
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Section Retours Mobiles</h1>
        
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Liste des Retours</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marque
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modèle
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stockage
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité 
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Defaut
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <FaCalendarAlt className="inline-block mr-1" /> Date 
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {retours.map((retour) => (
                    <tr key={retour.id}>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getClientName(retour.client_id)}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{retour.marque}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{retour.modele}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{retour.stockage}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{retour.type}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{retour.quantite_retournee}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{retour.reason}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(retour.return_date)}<br />{formatTime(retour.return_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Retours;
