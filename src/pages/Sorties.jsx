import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEye, FaTrash, FaSpinner, FaCheckCircle, FaMoneyBillWave, FaSyncAlt, FaTimes } from 'react-icons/fa';

const Sorties = () => {
  const [ventes, setVentes] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // États pour les modales
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedVenteId, setSelectedVenteId] = useState(null);
  const [selectedVenteItemId, setSelectedVenteItemId] = useState(null);
  const [montantPaiement, setMontantPaiement] = useState('');
  const [raisonAnnulation, setRaisonAnnulation] = useState('Retour non confirmé par le client'); // Raison par défaut
  const [raisonRetour, setRaisonRetour] = useState('');
  const [quantiteRetour, setQuantiteRetour] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false); // État de chargement pour les modales
  const [venteForPayment, setVenteForPayment] = useState(null); // Pour stocker les détails de la vente pour la modale de paiement

  // Utilisation de la variable d'environnement VITE_API_URL
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchVentes = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/ventes`, {
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
      
      const ventesWithItems = await Promise.all(response.data.map(async (vente) => {
          const itemsResponse = await axios.get(`${API_URL}/api/vente_items/vente/${vente.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          return { ...vente, vente_items: itemsResponse.data };
      }));
      
      setVentes(ventesWithItems);

    } catch (err) {
      setError('Erreur lors de la récupération des ventes.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVentes();
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

  const formatPrice = (value) => {
    if (!value) return '';
    return parseFloat(value).toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + " FCFA";
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.nom : 'N/A';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'payé':
        return 'bg-green-100 text-green-800';
      case 'paiement_partiel':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_attente':
        return 'bg-red-100 text-red-800';
      case 'annulé':
      case 'retourné':
        return 'bg-red-700 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemStatusColor = (status) => {
    switch (status) {
      case 'actif':
        return 'bg-blue-100 text-blue-800';
      case 'annulé':
        return 'bg-gray-400 text-white';
      case 'retourné':
        return 'bg-orange-100 text-orange-800';
      case 'vendu':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  // Logique de gestion des modales et des actions
  const handlePaiementClick = (vente) => {
    setSelectedVenteId(vente.id);
    setVenteForPayment(vente);
    setShowPaymentModal(true);
  };

  const handlePaiementSubmit = async () => {
    if (isNaN(parseFloat(montantPaiement)) || parseFloat(montantPaiement) <= 0) {
      alert('Montant invalide.');
      return;
    }
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/ventes/payment`, { vente_id: selectedVenteId, montant_paye: montantPaiement }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchVentes();
      setShowPaymentModal(false);
      setMontantPaiement('');
      alert('Paiement enregistré avec succès !');
    } catch (err) {
      setError('Erreur lors de l\'enregistrement du paiement.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAnnulationClick = (venteItemId) => {
    setSelectedVenteItemId(venteItemId);
    setShowCancelModal(true);
  };

  const handleAnnulationSubmit = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/ventes/cancel-item`, { vente_item_id: selectedVenteItemId, cancellation_reason: raisonAnnulation || 'Retour non confirmé par le client' }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchVentes();
      setShowCancelModal(false);
      setRaisonAnnulation('');
      alert('Produit annulé avec succès !');
    } catch (err) {
      setError('Erreur lors de l\'annulation du produit.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRetourClick = (venteItemId) => {
    setSelectedVenteItemId(venteItemId);
    setShowReturnModal(true);
  };
  
  const handleRetourSubmit = async () => {
    if (!raisonRetour || quantiteRetour <= 0) {
      alert('Veuillez remplir tous les champs.');
      return;
    }
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/ventes/return-defective`, { vente_item_id: selectedVenteItemId, reason: raisonRetour, quantite_retournee: quantiteRetour }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchVentes();
      setShowReturnModal(false);
      setRaisonRetour('');
      setQuantiteRetour(1);
      alert('Retour enregistré avec succès !');
    } catch (err) {
      setError('Erreur lors de l\'enregistrement du retour.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Section Sorties</h1>

        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
        
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0 text-gray-800">Liste des Ventes</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
              Imprimer la liste
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
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Vente</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marque</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modèle</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stockage</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix Unitaire</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Vente</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant Payé</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reste à Payer</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut Article</th>
                    <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ventes.map((vente) => (
                    <React.Fragment key={vente.id}>
                      {vente.vente_items.map((item, index) => (
                        <tr key={item.id} className={item.statut_vente_item !== 'actif' && item.statut_vente_item !== 'vendu' ? 'bg-gray-100 text-gray-500' : ''}>
                          {index === 0 && (
                            <>
                              <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">{vente.id}</td>
                              <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">{formatDate(vente.date_vente)}</td>
                              <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">{getClientName(vente.client_id)}</td>
                            </>
                          )}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.marque}</td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.modele}</td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.stockage}</td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantite_vendue}</td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(item.prix_unitaire_negocie)}</td>
                          {index === 0 && (
                            <>
                              <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">{formatPrice(vente.montant_total)}</td>
                              <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">{formatPrice(vente.montant_paye)}</td>
                              <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-500 border-r border-gray-200">
                                {formatPrice(vente.montant_total - vente.montant_paye)}
                              </td>
                              <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getItemStatusColor(item.statut_vente_item)}`}>
                                  {item.statut_vente_item}
                                </span>
                              </td>
                              <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap text-center text-lg font-medium">
                                {(item.statut_vente_item === 'actif' || item.statut_vente_item === 'vendu') && (
                                  <>
                                    <button
                                      onClick={() => handlePaiementClick(vente)}
                                      className="text-green-600 hover:bg-gray-100 p-2 rounded-full transition-colors duration-200"
                                      title="Gérer le paiement"
                                    >
                                      <FaMoneyBillWave />
                                    </button>
                                    <button
                                      onClick={() => handleAnnulationClick(item.id)}
                                      className="text-red-600 hover:bg-gray-100 p-2 rounded-full transition-colors duration-200"
                                      title="Annuler le produit"
                                    >
                                      <FaTrash />
                                    </button>
                                    <button
                                      onClick={() => handleRetourClick(item.id)}
                                      className="text-yellow-600 hover:bg-gray-100 p-2 rounded-full transition-colors duration-200"
                                      title="Retourner le mobile défectueux"
                                    >
                                      <FaSyncAlt />
                                    </button>
                                  </>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Modales */}
        {showPaymentModal && venteForPayment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg w-full max-w-sm mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Gérer le Paiement</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-800">
                  <FaTimes />
                </button>
              </div>
              <p className="mb-4">Entrez le montant payé pour la vente #{venteForPayment.id}.</p>
              <div className="text-sm font-semibold text-gray-700 mb-2">
                <p>Total à payer : <span className="font-bold">{formatPrice(venteForPayment.montant_total)}</span></p>
                <p>Déjà payé : <span className="font-bold">{formatPrice(venteForPayment.montant_paye)}</span></p>
                <p>Reste à payer : <span className="font-bold text-red-500">{formatPrice(venteForPayment.montant_total - venteForPayment.montant_paye)}</span></p>
              </div>
              <input
                type="number"
                value={montantPaiement}
                onChange={(e) => setMontantPaiement(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl mb-4"
                placeholder="Montant payé"
              />
              <button onClick={handlePaiementSubmit} className="w-full bg-green-500 text-white font-semibold py-2 rounded-xl hover:bg-green-600 flex items-center justify-center" disabled={isSubmitting}>
                {isSubmitting ? <FaSpinner className="animate-spin mr-2" /> : 'Confirmer le paiement'}
              </button>
            </div>
          </div>
        )}
        
        {showCancelModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg w-full max-w-sm mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Annuler un Produit</h3>
                <button onClick={() => setShowCancelModal(false)} className="text-gray-500 hover:text-gray-800">
                  <FaTimes />
                </button>
              </div>
              <p className="mb-4">Êtes-vous sûr de vouloir annuler ce produit de la vente ?</p>
              <textarea
                value={raisonAnnulation}
                onChange={(e) => setRaisonAnnulation(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl mb-4"
                placeholder="Raison de l'annulation"
              />
              <button onClick={handleAnnulationSubmit} className="w-full bg-red-500 text-white font-semibold py-2 rounded-xl hover:bg-red-600 flex items-center justify-center" disabled={isSubmitting}>
                {isSubmitting ? <FaSpinner className="animate-spin mr-2" /> : 'Confirmer l\'annulation'}
              </button>
            </div>
          </div>
        )}
        
        {showReturnModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg w-full max-w-sm mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Retourner un Mobile</h3>
                <button onClick={() => setShowReturnModal(false)} className="text-gray-500 hover:text-gray-800">
                  <FaTimes />
                </button>
              </div>
              <p className="mb-4">Renseignez les informations pour le retour.</p>
              <input
                type="text"
                value={raisonRetour}
                onChange={(e) => setRaisonRetour(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl mb-4"
                placeholder="Raison du retour"
              />
              <input
                type="number"
                value={quantiteRetour}
                onChange={(e) => setQuantiteRetour(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl mb-4"
                placeholder="Quantité retournée"
                min="1"
              />
              <button onClick={handleRetourSubmit} className="w-full bg-yellow-500 text-white font-semibold py-2 rounded-xl hover:bg-yellow-600 flex items-center justify-center" disabled={isSubmitting}>
                {isSubmitting ? <FaSpinner className="animate-spin mr-2" /> : 'Confirmer le retour'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sorties;
