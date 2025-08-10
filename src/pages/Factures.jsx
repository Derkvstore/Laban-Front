import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEye, FaPrint, FaSpinner, FaFileInvoiceDollar } from 'react-icons/fa';

const Factures = () => {
  const [factures, setFactures] = useState([]);
  const [ventes, setVentes] = useState([]); // Liste des ventes pour créer des factures
  const [isLoading, setIsLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedVente, setSelectedVente] = useState(null);

  const fetchFactures = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/factures', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFactures(response.data);
    } catch (err) {
      setError('Erreur lors de la récupération des factures.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVentesForFacture = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/ventes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Filtrer les ventes qui ne sont pas encore des factures
      const ventesSansFacture = response.data.filter(v => v.is_gros_sale);
      setVentes(ventesSansFacture);
    } catch (err) {
      console.error('Erreur lors de la récupération des ventes:', err);
    }
  };

  useEffect(() => {
    fetchFactures();
    fetchVentesForFacture();
  }, []);

  const handleCreateFacture = async (e) => {
    e.preventDefault();
    setIsFormLoading(true);
    setError('');

    if (!selectedVente) {
      setError('Veuillez sélectionner une vente.');
      setIsFormLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/factures', {
        vente_id: selectedVente.id,
        numero_facture: `FACT-${Date.now()}` // Génère un numéro de facture unique
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchFactures();
      fetchVentesForFacture();
      setSelectedVente(null);
    } catch (err) {
      setError('Erreur lors de la création de la facture.');
      console.error(err);
    } finally {
      setIsFormLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };

  const formatPrice = (value) => {
    if (!value) return '';
    return parseFloat(value).toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + " FCFA";
  };
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Gestion des Factures</h1>

        {/* Formulaire de création de facture */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Créer une nouvelle facture</h2>
          <form onSubmit={handleCreateFacture}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <select
                onChange={(e) => setSelectedVente(ventes.find(v => v.id === parseInt(e.target.value)))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                required
              >
                <option value="">Sélectionner une vente en gros</option>
                {ventes.map(vente => (
                  <option key={vente.id} value={vente.id}>Vente #{vente.id} - Total: {formatPrice(vente.montant_total)}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition duration-200 flex items-center justify-center"
              disabled={isFormLoading}
            >
              {isFormLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaFileInvoiceDollar className="mr-2" />}
              Créer la facture
            </button>
          </form>
        </div>

        {/* Tableau des factures */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Liste des Factures</h2>
            <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center">
              <FaPrint className="mr-2" /> Imprimer la liste
            </button>
          </div>
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
                      Numéro de facture
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vente ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date de facture
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant original
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant payé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {factures.map((facture) => (
                    <tr key={facture.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{facture.numero_facture}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{facture.vente_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(facture.date_facture)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(facture.montant_original_facture)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(facture.montant_paye_facture)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{facture.statut_facture}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-medium">
                        {/* Ajoutez les boutons d'action ici */}
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

export default Factures;
