import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrash, FaSpinner, FaMoneyBillWave, FaSyncAlt, FaTimes } from 'react-icons/fa';

const Sorties = () => {
  const [ventes, setVentes] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Modales
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedVenteId, setSelectedVenteId] = useState(null);
  const [selectedVenteItemId, setSelectedVenteItemId] = useState(null);
  const [montantPaiement, setMontantPaiement] = useState('');
  const [raisonAnnulation, setRaisonAnnulation] = useState('Retour non confirmé par le client');
  const [raisonRetour, setRaisonRetour] = useState('');
  const [quantiteRetour, setQuantiteRetour] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [venteForPayment, setVenteForPayment] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchVentes = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [ventesRes, clientsRes] = await Promise.all([
        axios.get(`${API_URL}/api/ventes`, { headers }),
        axios.get(`${API_URL}/api/clients`, { headers }),
      ]);
      setClients(clientsRes.data);

      const ventesWithItems = await Promise.all(
        (ventesRes.data || []).map(async (vente) => {
          const itemsRes = await axios.get(`${API_URL}/api/vente_items/vente/${vente.id}`, { headers });
          return { ...vente, vente_items: itemsRes.data || [] };
        })
      );

      setVentes(ventesWithItems);
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la récupération des ventes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVentes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatPrice = (value) => {
    if (value === null || value === undefined) return '';
    const n = Number(value);
    if (Number.isNaN(n)) return '';
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' FCFA';
  };

  const getClientName = (clientId) => {
    const c = clients.find((x) => x.id === clientId);
    return c ? c.nom : 'N/A';
  };

  // Couleurs badge – statut de VENTE (payé / partiel / en cours / annulé)
  const getSaleStatusColor = (status) => {
    switch (status) {
      case 'payé':
        return 'bg-green-100 text-green-800';
      case 'paiement_partiel':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_attente': // “en cours”
        return 'bg-blue-100 text-blue-800';
      case 'annulé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Libellé lisible – statut de VENTE
  const getSaleStatusLabel = (status) => {
    switch (status) {
      case 'payé':
        return 'Payé';
      case 'paiement_partiel':
        return 'Partiel';
      case 'en_attente':
        return 'En cours';
      case 'annulé':
        return 'Annulé';
      default:
        return status || '—';
    }
  };

  // Couleurs badge – statut d’ARTICLE (actif / vendu / annulé / retourné)
  const getItemStatusColor = (status) => {
    switch (status) {
      case 'vendu':
        return 'bg-green-100 text-green-800';
      case 'actif':
        return 'bg-blue-100 text-blue-800';
      case 'annulé':
        return 'bg-gray-300 text-gray-800';
      case 'retourné':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Libellé lisible – statut d’ARTICLE
  const getItemStatusLabel = (status) => {
    switch (status) {
      case 'vendu':
        return 'Vendu';
      case 'actif':
        return 'Actif';
      case 'annulé':
        return 'Annulé';
      case 'retourné':
        return 'Retour';
      default:
        return status || '—';
    }
  };

  // Modales – actions
  const handlePaiementClick = (vente) => {
    setSelectedVenteId(vente.id);
    setVenteForPayment(vente);
    setShowPaymentModal(true);
  };

  const handlePaiementSubmit = async () => {
    const val = parseFloat(montantPaiement);
    if (isNaN(val) || val <= 0) {
      alert('Montant invalide.');
      return;
    }
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/ventes/payment`,
        { vente_id: selectedVenteId, montant_paye: val },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchVentes();
      setShowPaymentModal(false);
      setMontantPaiement('');
      alert('Paiement enregistré avec succès !');
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement du paiement.");
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
      await axios.put(
        `${API_URL}/api/ventes/cancel-item`,
        {
          vente_item_id: selectedVenteItemId,
          cancellation_reason: raisonAnnulation || 'Retour non confirmé par le client',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchVentes();
      setShowCancelModal(false);
      setRaisonAnnulation('');
      alert('Produit annulé avec succès !');
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'annulation du produit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetourClick = (venteItemId) => {
    setSelectedVenteItemId(venteItemId);
    setShowReturnModal(true);
  };

  const handleRetourSubmit = async () => {
    const q = parseInt(quantiteRetour, 10);
    if (!raisonRetour || !q || q <= 0) {
      alert('Veuillez remplir tous les champs.');
      return;
    }
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/ventes/return-defective`,
        { vente_item_id: selectedVenteItemId, reason: raisonRetour, quantite_retournee: q },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchVentes();
      setShowReturnModal(false);
      setRaisonRetour('');
      setQuantiteRetour(1);
      alert('Retour enregistré avec succès !');
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement du retour.");
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
                    {/* <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Vente</th> */}
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
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut vente</th>
                    {/* <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut article</th> */}
                    <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {ventes.map((vente) => (
                    <React.Fragment key={vente.id}>
                      {vente.vente_items.map((item, index) => {
                        const reste = Number(vente.montant_total) - Number(vente.montant_paye);
                        return (
                          <tr
                            key={item.id}
                            className={item.statut_vente_item !== 'actif' && item.statut_vente_item !== 'vendu' ? 'bg-gray-100 text-gray-500' : ''}
                          >
                            {/* Id / Date / Client */}
                            {index === 0 && (
                              <>
                                <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                                  {vente.id}
                                </td>
                                <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                                  {formatDate(vente.date_vente)}
                                </td>
                                <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                                  {getClientName(vente.client_id)}
                                </td>
                                {/* Statut de la VENTE (une seule fois, rowSpan) */}
                                <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSaleStatusColor(vente.statut_paiement)}`}>
                                    {getSaleStatusLabel(vente.statut_paiement)}
                                  </span>
                                </td>
                              </>
                            )}

                            {/* Détails de l'article */}
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.marque}</td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.modele}</td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.stockage}</td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantite_vendue}</td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(item.prix_unitaire_negocie)}</td>

                            {/* Totaux de la vente (une fois) */}
                            {index === 0 && (
                              <>
                                <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                                  {formatPrice(vente.montant_total)}
                                </td>
                                <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                                  {formatPrice(vente.montant_paye)}
                                </td>
                                <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-500 border-r border-gray-200">
                                  {formatPrice(reste)}
                                </td>
                              </>
                            )}

                            {/* Statut de l'ARTICLE (une par ligne, PAS de rowSpan) */}
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getItemStatusColor(item.statut_vente_item)}`}>
                                {getItemStatusLabel(item.statut_vente_item)}
                              </span>
                            </td>

                            {/* Actions (une seule fois par vente) */}
                            {index === 0 && (
                              <td rowSpan={vente.vente_items.length} className="px-3 sm:px-6 py-4 whitespace-nowrap text-center text-lg font-medium">
                                <button
                                  onClick={() => handlePaiementClick(vente)}
                                  className="text-green-600 hover:bg-gray-100 p-2 rounded-full transition-colors duration-200"
                                  title="Gérer le paiement"
                                >
                                  <FaMoneyBillWave />
                                </button>
                                {/* Pour annuler/retourner, actions sur article => boutons par ligne plus haut si tu préfères */}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modale Paiement */}
        {showPaymentModal && venteForPayment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg w-full max-w-sm mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Gérer le Paiement</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-800">
                  <FaTimes />
                </button>
              </div>
              <div className="text-sm font-semibold text-gray-700 mb-3">
                <p>Total : <span className="font-bold">{formatPrice(venteForPayment.montant_total)}</span></p>
                <p>Payé : <span className="font-bold">{formatPrice(venteForPayment.montant_paye)}</span></p>
                <p>Reste : <span className="font-bold text-red-500">{formatPrice(venteForPayment.montant_total - venteForPayment.montant_paye)}</span></p>
                <p>Statut : <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSaleStatusColor(venteForPayment.statut_paiement)}`}>
                  {getSaleStatusLabel(venteForPayment.statut_paiement)}
                </span></p>
              </div>
              <input
                type="number"
                value={montantPaiement}
                onChange={(e) => setMontantPaiement(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl mb-4"
                placeholder="Montant payé"
              />
              <button
                onClick={handlePaiementSubmit}
                className="w-full bg-green-500 text-white font-semibold py-2 rounded-xl hover:bg-green-600 flex items-center justify-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? <FaSpinner className="animate-spin mr-2" /> : 'Confirmer le paiement'}
              </button>
            </div>
          </div>
        )}

        {/* Modale Annulation */}
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
              <button
                onClick={handleAnnulationSubmit}
                className="w-full bg-red-500 text-white font-semibold py-2 rounded-xl hover:bg-red-600 flex items-center justify-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? <FaSpinner className="animate-spin mr-2" /> : "Confirmer l'annulation"}
              </button>
            </div>
          </div>
        )}

        {/* Modale Retour */}
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
              <button
                onClick={handleRetourSubmit}
                className="w-full bg-yellow-500 text-white font-semibold py-2 rounded-xl hover:bg-yellow-600 flex items-center justify-center"
                disabled={isSubmitting}
              >
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
