import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaCalendarAlt, FaClock } from 'react-icons/fa';

const Fournisseurs = () => {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    adresse: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingFournisseur, setEditingFournisseur] = useState(null);

  const fetchFournisseurs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/fournisseurs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFournisseurs(response.data);
    } catch (err) {
      setError('Erreur lors de la récupération des fournisseurs.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFournisseurs();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    let rawValue = value.replace(/\D/g, '');
    rawValue = rawValue.substring(0, 10);
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

    const url = editingFournisseur 
      ? `http://localhost:3000/api/fournisseurs/${editingFournisseur.id}` 
      : 'http://localhost:3000/api/fournisseurs';
    const method = editingFournisseur ? 'put' : 'post';
    
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
      fetchFournisseurs();
      setSuccess(`Fournisseur ${editingFournisseur ? 'modifié' : 'ajouté'} avec succès !`);
      setFormData({ nom: '', telephone: '', adresse: '' });
      setEditingFournisseur(null);
    } catch (err) {
      setError('Erreur lors de l\'enregistrement du fournisseur.');
      console.error(err);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleEdit = (fournisseur) => {
    setEditingFournisseur(fournisseur);
    const formattedTelephone = formatPhoneNumber(fournisseur.telephone);
    setFormData({
      nom: fournisseur.nom,
      telephone: formattedTelephone,
      adresse: fournisseur.adresse,
    });
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/fournisseurs/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchFournisseurs();
      setSuccess('Fournisseur supprimé avec succès !');
    } catch (err) {
      setError('Erreur lors de la suppression du fournisseur.');
      console.error(err);
    }
  };
  
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    const cleaned = phoneNumber.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
    }
    return phoneNumber;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const options = { hour: '2-digit', minute: '2-digit', second: 'numeric' };
    return date.toLocaleTimeString('fr-FR', options);
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Gestion des Fournisseurs</h1>

        {/* Formulaire d'ajout/édition */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">{editingFournisseur ? 'Modifier un fournisseur' : 'Ajouter un nouveau fournisseur'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                name="nom"
                placeholder="Nom du fournisseur"
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
                placeholder="Adresse du fournisseur"
                value={formData.adresse}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition duration-200 flex items-center justify-center"
              disabled={isFormLoading}
            >
              {isFormLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaPlus className="mr-2" />}
              {editingFournisseur ? 'Modifier le fournisseur' : 'Ajouter le fournisseur'}
            </button>
            {editingFournisseur && (
              <button
                type="button"
                onClick={() => {
                  setEditingFournisseur(null);
                  setFormData({ nom: '', telephone: '', adresse: '' });
                }}
                className="ml-4 px-6 py-3 bg-gray-400 text-white font-semibold rounded-xl hover:bg-gray-500 transition duration-200"
              >
                Annuler
              </button>
            )}
          </form>
        </div>

        {/* Tableau d'affichage des fournisseurs */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Liste des Fournisseurs</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adresse
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <FaCalendarAlt className="inline-block mr-1" /> Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <FaClock className="inline-block mr-1" /> Heure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fournisseurs.map((fournisseur) => (
                    <tr key={fournisseur.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fournisseur.nom}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPhoneNumber(fournisseur.telephone)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fournisseur.adresse}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(fournisseur.date_ajout)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTime(fournisseur.date_ajout)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(fournisseur)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(fournisseur.id)}
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

export default Fournisseurs;
