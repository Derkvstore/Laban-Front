import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaCalendarAlt, FaClock } from 'react-icons/fa';

// Liste des quartiers pour l'autocomplétion de l'adresse
const QUARTIERS_BAMAKO = [
  "ACI 2000", "Badalabougou", "Banankabougou", "Cité du Niger", "Djelibougou", 
  "Kalaban Coura", "Magnambougou", "Niamakoro", "Sébénicoro", "Sikasso",
  "Faladiè", "N'Tomikorobougou", "Yirimadio", "Gana", "Boulkassoumbougou",
  "Halle de Bamako", "Malitelda", "Suguba"
];

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    adresse: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingClient, setEditingClient] = useState(null);

  // Utilisation de la variable d'environnement VITE_API_URL
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setClients(response.data);
    } catch (err) {
      setError('Erreur lors de la récupération des clients.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Nouvelle fonction pour formater le numéro de téléphone en temps réel
  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    // Supprime tous les caractères non numériques
    let rawValue = value.replace(/\D/g, '');
    // Limite la longueur à 10 chiffres pour le Mali
    rawValue = rawValue.substring(0, 10);
    // Insère un espace tous les 2 chiffres
    const formattedValue = rawValue.replace(/(\d{2})(?=\d)/g, '$1 ');

    setFormData({
      ...formData,
      [name]: formattedValue,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsFormLoading(true);
    setError('');
    setSuccess('');

    const url = editingClient 
      ? `${API_URL}/api/clients/${editingClient.id}`
      : `${API_URL}/api/clients`;
    const method = editingClient ? 'put' : 'post';
    
    // Nettoie le numéro de téléphone avant de l'envoyer à l'API
    const cleanedFormData = {
      ...formData,
      telephone: formData.telephone.replace(/\s/g, ''),
    };

    try {
      const token = localStorage.getItem('token');
      await axios({
        method,
        url,
        data: cleanedFormData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchClients();
      setSuccess(`Client ${editingClient ? 'modifié' : 'ajouté'} avec succès !`);
      setFormData({ nom: '', telephone: '', adresse: '' });
      setEditingClient(null);
    } catch (err) {
      setError('Erreur lors de l\'enregistrement du client.');
      console.error(err);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    // Lors de l'édition, reformate le numéro de téléphone si nécessaire
    const formattedTelephone = client.telephone.replace(/(\d{2})(?=\d)/g, '$1 ');
    setFormData({
      nom: client.nom,
      telephone: formattedTelephone,
      adresse: client.adresse,
    });
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/clients/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchClients();
      setSuccess('Client supprimé avec succès !');
    } catch (err) {
      setError('Erreur lors de la suppression du client.');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const options = { hour: '2-digit', minute: '2-digit' , second : 'numeric'};
    return date.toLocaleTimeString('fr-FR', options);
  };
  
  // Nouvelle fonction pour formater le numéro de téléphone pour l'affichage
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    const cleaned = phoneNumber.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
    }
    return phoneNumber;
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Gestion des Clients</h1>

        {/* Formulaire d'ajout/édition */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">{editingClient ? 'Modifier un client' : 'Ajouter un nouveau client'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                name="nom"
                placeholder="Nom du client"
                value={formData.nom}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                required
              />
              <input
                type="text"
                name="telephone"
                placeholder="Numéro de téléphone (ex: 90 90 90 90)"
                value={formData.telephone}
                onChange={handlePhoneChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              />
              <input
                type="text"
                name="adresse"
                list="quartiers-bamako"
                placeholder="Adresse du client"
                value={formData.adresse}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              />
              <datalist id="quartiers-bamako">
                {QUARTIERS_BAMAKO.map((quartier) => (
                  <option key={quartier} value={quartier} />
                ))}
              </datalist>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
            <div className="flex items-center">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                disabled={isFormLoading}
              >
                {isFormLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaPlus className="mr-2" />}
                {editingClient ? 'Modifier le client' : 'Ajouter le client'}
              </button>
              {editingClient && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingClient(null);
                    setFormData({ nom: '', telephone: '', adresse: '' });
                  }}
                  className="ml-4 px-6 py-3 bg-gray-400 text-white font-semibold rounded-xl hover:bg-gray-500 transition duration-200"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tableau d'affichage des clients */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Liste des Clients</h2>
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
                      Nom
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adresse
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <FaCalendarAlt className="inline-block mr-1" /> Date
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <FaClock className="inline-block mr-1" /> Heure
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.nom}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPhoneNumber(client.telephone)}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.adresse}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(client.created_at)}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTime(client.created_at)}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="ml-4 text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          <FaTrash />
                        </button>
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

export default Clients;
