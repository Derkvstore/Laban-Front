import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaSpinner, FaMoneyBillWave, FaSyncAlt, FaTimes, FaPrint } from 'react-icons/fa';

const RAISONS_ANNULATION = [
  "Le client a changé d'avis",
  "Problème de disponibilité chez le fournisseur",
  "Article non conforme ou défectueux",
  "Erreur de commande",
  "Autre"
];

const RAISONS_REMPLACEMENT = [
  "Ecran",
  "Micro",
  "Wifi",
  "Emei",
  "Resaux",
  "Vibreur",
  "OFF",
  "Bluetooth",
  "Selfie",
  "Face OFF",
  "Mobile casser par le clients il doit faire un rajout",
  "Affichage Ordinateur",
  "Flash",
  "Batterie",
  "SIM",
  "Camera Avant",
  "0%",
  "Panic Full",
  "Turbo SIM",
  "Capteur",
  "Température",
  "Arrière Vitre",
  "Volume +/-",
  "Boutons Allumage",
  "Error 4013",
  "Charge Problème",
  "Piece inconnue",
  "Piece d'origin",
  "Article ne correspondant pas à la description",
  "Erreur de commande du fournisseur",
  "Autre"
];

const Sorties = () => {
  const [ventes, setVentes] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  // Modales
  const [afficherPaiement, setAfficherPaiement] = useState(false);
  const [afficherAnnulation, setAfficherAnnulation] = useState(false);
  const [afficherRetour, setAfficherRetour] = useState(false);
  const [venteIdSelectionnee, setVenteIdSelectionnee] = useState(null);
  const [venteItemIdSelectionne, setVenteItemIdSelectionne] = useState(null);
  const [montantPaiement, setMontantPaiement] = useState('');
  const [raisonAnnulation, setRaisonAnnulation] = useState(RAISONS_ANNULATION[0]);
  const [raisonRetour, setRaisonRetour] = useState(RAISONS_REMPLACEMENT[0]);
  const [quantiteRetour, setQuantiteRetour] = useState(1);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [ventePourPaiement, setVentePourPaiement] = useState(null);

  // Réf pour impression ciblée
  const tableRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const recupererVentes = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [ventesRes, clientsRes] = await Promise.all([
        axios.get(`${API_URL}/api/ventes`, { headers }),
        axios.get(`${API_URL}/api/clients`, { headers }),
      ]);
      setClients(clientsRes.data);

      const ventesAvecItems = await Promise.all(
        (ventesRes.data || []).map(async (vente) => {
          const itemsRes = await axios.get(`${API_URL}/api/vente_items/vente/${vente.id}`, { headers });
          return { ...vente, vente_items: itemsRes.data || [] };
        })
      );

      setVentes(ventesAvecItems);
    } catch (err) {
      console.error(err);
      setErreur("Erreur lors de la récupération des ventes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    recupererVentes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Date avec heure:minute:seconde
  const formaterDate = (dateString) => {
    const d = new Date(dateString);
    return isNaN(d.getTime())
      ? '—'
      : d.toLocaleString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
  };

  const formaterPrix = (valeur) => {
    if (valeur === null || valeur === undefined) return '';
    const n = Number(valeur);
    if (Number.isNaN(n)) return '';
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' FCFA';
  };

  const nomClient = (clientId) => {
    const c = clients.find((x) => x.id === clientId);
    return c ? c.nom : 'N/A';
  };

  // --- Logique d'affichage (statut vente) ---
  const tousArticlesClotures = (vente) =>
    (vente.vente_items || []).length > 0 &&
    vente.vente_items.every(it => it.statut_vente_item === 'annulé' || it.statut_vente_item === 'retourné');

  const deriverStatutVente = (vente) => {
    const total = Number(vente.montant_total) || 0;
    const paye  = Number(vente.montant_paye) || 0;
    const reste = Math.max(total - paye, 0);

    if (tousArticlesClotures(vente) || total === 0) return 'annulé';
    if (total > 0 && reste === 0) return 'payé';
    if (paye > 0 && paye < total) return 'paiement_partiel';
    return 'en_attente';
  };

  const couleurStatutVente = (statut) => {
    switch (statut) {
      case 'payé': return 'bg-green-100 text-green-800';
      case 'paiement_partiel': return 'bg-yellow-100 text-yellow-800';
      case 'en_attente': return 'bg-blue-100 text-blue-800';
      case 'annulé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const libelleStatutVente = (statut) => {
    switch (statut) {
      case 'payé': return 'Vendu';
      case 'paiement_partiel': return 'Partiel';
      case 'en_attente': return 'En Cours';
      case 'annulé': return 'Annulé';
      default: return statut || '—';
    }
  };

  const couleurStatutArticle = (statut) => {
    switch (statut) {
      case 'vendu': return 'bg-green-100 text-green-800';
      case 'actif': return 'bg-blue-100 text-blue-800';
      case 'annulé': return 'bg-gray-300 text-gray-800';
      case 'retourné': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const libelleStatutArticle = (statut) => {
    switch (statut) {
      case 'vendu': return 'Vendu';
      case 'actif': return 'En Cours';
      case 'annulé': return 'Annulé';
      case 'retourné': return 'Remplacé'; // affichage demandé
      default: return statut || '—';
    }
  };

  // --- Actions / Modales ---
  const ouvrirPaiement = (vente) => {
    setVenteIdSelectionnee(vente.id);
    setVentePourPaiement(vente);
    setAfficherPaiement(true);
  };

  const soumettrePaiement = async () => {
    const val = parseFloat(montantPaiement);
    if (isNaN(val) || val <= 0) {
      setErreur('Montant invalide.');
      return;
    }
    try {
      setEnvoiEnCours(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/ventes/payment`,
        { vente_id: venteIdSelectionnee, montant_paye: val },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await recupererVentes();
      setAfficherPaiement(false);
      setMontantPaiement('');
      setSucces('Paiement enregistré avec succès !');
      setErreur('');
    } catch (err) {
      console.error(err);
      setErreur(err?.response?.data?.message || "Erreur lors de l'enregistrement du paiement.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const ouvrirAnnulation = (venteItemId) => {
    setVenteItemIdSelectionne(venteItemId);
    setAfficherAnnulation(true);
  };

  const soumettreAnnulation = async () => {
    try {
      setEnvoiEnCours(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/ventes/cancel-item`,
        {
          vente_item_id: venteItemIdSelectionne,
          cancellation_reason: raisonAnnulation || 'Retour non confirmé par le client',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await recupererVentes();
      setAfficherAnnulation(false);
      setSucces('Produit annulé avec succès !');
      setErreur('');
    } catch (err) {
      console.error(err);
      setErreur(err?.response?.data?.message || "Erreur lors de l'annulation du produit.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const ouvrirRetour = (venteItemId) => {
    setVenteItemIdSelectionne(venteItemId);
    setAfficherRetour(true);
  };

  const soumettreRetour = async () => {
    const q = parseInt(quantiteRetour, 10);
    if (!raisonRetour || !q || q <= 0) {
      setErreur('Veuillez remplir tous les champs de retour.');
      return;
    }
    try {
      setEnvoiEnCours(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/ventes/return-defective`,
        { vente_item_id: venteItemIdSelectionnee, reason: raisonRetour, quantite_retournee: q },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await recupererVentes();
      setAfficherRetour(false);
      setQuantiteRetour(1);
      setSucces('Retour enregistré avec succès !');
      setErreur('');
    } catch (err) {
      console.error(err);
      // Afficher le vrai message backend si présent (utile pour ton 500)
      setErreur(err?.response?.data?.message || "Erreur lors de l'enregistrement du retour.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  // Impression : n’imprimer que la table
  const imprimerListe = () => {
    if (!tableRef.current) {
      window.print();
      return;
    }
    const contenu = tableRef.current.innerHTML;
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) { window.print(); return; }
    w.document.open();
    w.document.write(`
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Liste des Ventes</title>
          <style>
            * { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
            h1 { font-size: 18px; margin: 0 0 12px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
            th { background: #f9fafb; text-align: left; }
            .right { text-align: right; }
            @page { margin: 14mm; }
          </style>
        </head>
        <body>
          <h1>Liste des Ventes</h1>
          <div>${contenu}</div>
          <script>
            window.onload = function(){ window.print(); window.onafterprint = () => window.close(); };
          </script>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-[1400px] mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-900">Section Sorties</h1>

        {/* Messages d'interface */}
        {succes && (
          <div className="mb-4 p-3 md:p-4 rounded-xl border border-green-200 bg-green-50 text-green-800 flex items-start justify-between">
            <span className="text-sm md:text-base font-medium">{succes}</span>
            <button onClick={() => setSucces('')} className="ml-4 p-1 rounded hover:bg-green-100 text-green-700" aria-label="Fermer le message de succès">
              <FaTimes />
            </button>
          </div>
        )}
        {erreur && (
          <div className="mb-4 p-3 md:p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 flex items-start justify-between">
            <span className="text-sm md:text-base font-medium">{erreur}</span>
            <button onClick={() => setErreur('')} className="ml-4 p-1 rounded hover:bg-red-100 text-red-700" aria-label="Fermer le message d'erreur">
              <FaTimes />
            </button>
          </div>
        )}

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg">
          {/* Barre d’outils (hors conteneur scrollable) */}
          <div className="w-full flex items-center gap-3 justify-between mb-4 flex-wrap">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">Liste des Ventes</h2>
            <button
              onClick={imprimerListe}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
              aria-label="Imprimer la liste"
            >
              <FaPrint />
              <span>Imprimer la liste</span>
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
          ) : (
            <>
              {/* Version pour grands écrans (table) */}
              <div className="hidden md:block relative overflow-x-auto rounded-xl border border-gray-100">
                <div ref={tableRef}>
                  <table className="min-w-[1200px] w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marque</th>
                        <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modèle</th>
                        <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacité</th>
                        <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                        <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix Unitaire</th>
                        <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Vente</th>
                        <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant Payé</th>
                        <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reste à Payer</th>
                        <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut vente</th>
                        <th className="px-3 md:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[170px] sticky right-0 bg-gray-50 z-20">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ventes.map((vente) => (
                        <React.Fragment key={vente.id}>
                          {vente.vente_items.map((item, index) => {
                            const total = Number(vente.montant_total) || 0;
                            const paye = Number(vente.montant_paye) || 0;
                            const reste = Math.max(total - paye, 0);
                            const statutVenteAffiche = deriverStatutVente(vente);
                            const estActifOuVendu = item.statut_vente_item === 'actif' || item.statut_vente_item === 'vendu';

                            return (
                              <tr key={item.id} className={!estActifOuVendu ? 'bg-gray-100 text-gray-500' : ''}>
                                {index === 0 && (
                                  <>
                                    <td rowSpan={vente.vente_items.length} className="px-3 md:px-4 py-4 whitespace-nowrap text-sm text-gray-700 border-r border-gray-200">
                                      {formaterDate(vente.date_vente)}
                                    </td>
                                    <td rowSpan={vente.vente_items.length} className="px-3 md:px-4 py-4 whitespace-nowrap text-sm text-gray-700 border-r border-gray-200">
                                      {nomClient(vente.client_id)}
                                    </td>
                                  </>
                                )}
                                <td className="px-3 md:px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.marque}</td>
                                <td className="px-3 md:px-4 py-4 whitespace-nowrap text-sm text-gray-700">{item.modele}</td>
                                <td className="px-3 md:px-4 py-4 whitespace-nowrap text-sm text-gray-700">{item.stockage}</td>
                                <td className="px-3 md:px-4 py-4 whitespace-nowrap text-sm text-gray-700">{item.type}</td>
                                <td className="px-3 md:px-4 py-4 whitespace-nowrap text-sm text-gray-700">{item.quantite_vendue}</td>
                                <td className="px-3 md:px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formaterPrix(item.prix_unitaire_negocie)}</td>
                                {index === 0 && (
                                  <>
                                    <td rowSpan={vente.vente_items.length} className="px-3 md:px-4 py-4 whitespace-nowrap text-sm text-gray-700 border-r border-gray-200">
                                      {formaterPrix(total)}
                                    </td>
                                    <td rowSpan={vente.vente_items.length} className="px-3 md:px-4 py-4 whitespace-nowrap text-sm text-gray-700 border-r border-gray-200">
                                      {formaterPrix(paye)}
                                    </td>
                                    <td rowSpan={vente.vente_items.length} className="px-3 md:px-4 py-4 whitespace-nowrap text-sm font-semibold text-red-500 border-r border-gray-200">
                                      {formaterPrix(reste)}
                                    </td>
                                    <td rowSpan={vente.vente_items.length} className="px-3 md:px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${couleurStatutVente(statutVenteAffiche)}`}>
                                        {libelleStatutVente(statutVenteAffiche)}
                                      </span>
                                    </td>
                                  </>
                                )}
                                <td className="px-2 md:px-3 py-3 whitespace-nowrap text-center text-lg font-medium sticky right-0 bg-white z-10">
                                  {index === 0 && Math.max(total - paye, 0) > 0 && (
                                    <button
                                      onClick={() => ouvrirPaiement(vente)}
                                      className="text-green-600 hover:bg-gray-100 p-2.5 rounded-full transition-colors duration-200 mr-1.5 md:mr-2"
                                      title="Gérer le paiement"
                                      aria-label="Gérer le paiement"
                                    >
                                      <FaMoneyBillWave />
                                    </button>
                                  )}
                                  {item.statut_vente_item === 'annulé' ? (
                                    <span className={`px-2 py-1 text-xs rounded-full ${couleurStatutArticle('annulé')}`}>{libelleStatutArticle('annulé')}</span>
                                  ) : item.statut_vente_item === 'retourné' ? (
                                    <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Remplacé</span>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => ouvrirAnnulation(item.id)}
                                        className="text-red-600 hover:bg-gray-100 p-2.5 rounded-full transition-colors duration-200 mr-1.5 md:mr-2"
                                        title="Annuler le produit"
                                        aria-label="Annuler le produit"
                                      >
                                        <FaTimes />
                                      </button>
                                      <button
                                        onClick={() => ouvrirRetour(item.id)}
                                        className="text-yellow-600 hover:bg-gray-100 p-2.5 rounded-full transition-colors duration-200"
                                        title="Retourner le produit"
                                        aria-label="Retourner le produit"
                                      >
                                        <FaSyncAlt />
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Version pour petits écrans (liste de cartes) */}
              <div className="md:hidden space-y-4">
                {ventes.map((vente) => (
                  <div key={vente.id} className="bg-white rounded-2xl shadow-md p-4 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900">{nomClient(vente.client_id)}</h4>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${couleurStatutVente(deriverStatutVente(vente))}`}>
                        {libelleStatutVente(deriverStatutVente(vente))}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {vente.vente_items.map((item) => {
                        const estActifOuVendu = item.statut_vente_item === 'actif' || item.statut_vente_item === 'vendu';
                        return (
                          <div key={item.id} className={`p-3 rounded-lg ${!estActifOuVendu ? 'bg-gray-50' : ''} border border-gray-100`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${couleurStatutArticle(item.statut_vente_item)}`}>
                                {libelleStatutArticle(item.statut_vente_item)}
                              </span>
                              <div className="flex items-center space-x-2 text-xl">
                                {item.statut_vente_item !== 'annulé' && item.statut_vente_item !== 'retourné' && (
                                  <>
                                    <button
                                      onClick={() => ouvrirAnnulation(item.id)}
                                      className="text-red-600 hover:text-red-800 p-1"
                                      title="Annuler le produit"
                                      aria-label="Annuler le produit"
                                    >
                                      <FaTimes />
                                    </button>
                                    <button
                                      onClick={() => ouvrirRetour(item.id)}
                                      className="text-yellow-600 hover:text-yellow-800 p-1"
                                      title="Retourner le produit"
                                      aria-label="Retourner le produit"
                                    >
                                      <FaSyncAlt />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 grid grid-cols-2 gap-2">
                              <div><span className="font-semibold">Article :</span> {item.marque} {item.modele}</div>
                              <div><span className="font-semibold">Capacité :</span> {item.stockage}</div>
                              <div><span className="font-semibold">Quantité :</span> {item.quantite_vendue}</div>
                              <div><span className="font-semibold">Prix :</span> {formaterPrix(item.prix_unitaire_negocie)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-sm pt-2 border-t border-gray-200">
                      <p>Date : {formaterDate(vente.date_vente)}</p>
                      <p>Total : {formaterPrix(Number(vente.montant_total) || 0)}</p>
                      <p>Payé : {formaterPrix(Number(vente.montant_paye) || 0)}</p>
                      <p>Reste : <span className="text-red-500 font-semibold">{formaterPrix(Math.max(Number(vente.montant_total) - Number(vente.montant_paye), 0))}</span></p>
                    </div>

                    {Math.max(Number(vente.montant_total) - Number(vente.montant_paye), 0) > 0 && (
                      <button
                        onClick={() => ouvrirPaiement(vente)}
                        className="w-full mt-3 bg-green-600 text-white font-semibold py-2 rounded-xl hover:bg-green-700 flex items-center justify-center"
                        title="Gérer le paiement"
                        aria-label="Gérer le paiement"
                      >
                        <FaMoneyBillWave className="mr-2" />
                        <span>Payer</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Modale Paiement */}
        {afficherPaiement && ventePourPaiement && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-4 md:p-8 rounded-xl shadow-lg w-full max-w-sm mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Gérer le Paiement</h3>
                <button onClick={() => setAfficherPaiement(false)} className="text-gray-500 hover:text-gray-800"><FaTimes /></button>
              </div>
              <div className="text-sm font-semibold text-gray-700 mb-3">
                <p>Total : <span className="font-bold">{formaterPrix(ventePourPaiement.montant_total)}</span></p>
                <p>Payé : <span className="font-bold">{formaterPrix(ventePourPaiement.montant_paye)}</span></p>
                <p>Reste : <span className="font-bold text-red-500">
                  {formaterPrix((Number(ventePourPaiement.montant_total) || 0) - (Number(ventePourPaiement.montant_paye) || 0))}
                </span></p>
                <p>Statut : <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${couleurStatutVente(deriverStatutVente(ventePourPaiement))}`}>
                  {libelleStatutVente(deriverStatutVente(ventePourPaiement))}
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
                onClick={soumettrePaiement}
                className="w-full bg-green-500 text-white font-semibold py-2 rounded-xl hover:bg-green-600 flex items-center justify-center"
                disabled={envoiEnCours}
              >
                {envoiEnCours ? <FaSpinner className="animate-spin mr-2" /> : 'Confirmer le paiement'}
              </button>
            </div>
          </div>
        )}

        {/* Modale Annulation */}
        {afficherAnnulation && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-4 md:p-8 rounded-xl shadow-lg w-full max-w-sm mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Annuler le produit</h3>
                <button onClick={() => setAfficherAnnulation(false)} className="text-gray-500 hover:text-gray-800"><FaTimes /></button>
              </div>
              <label className="block text-sm text-gray-700 mb-2">Raison</label>
              <select
                value={raisonAnnulation}
                onChange={(e) => setRaisonAnnulation(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl mb-4 bg-white"
              >
                {RAISONS_ANNULATION.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <button
                onClick={soumettreAnnulation}
                className="w-full bg-red-500 text-white font-semibold py-2 rounded-xl hover:bg-red-600 flex items-center justify-center"
                disabled={envoiEnCours}
              >
                {envoiEnCours ? <FaSpinner className="animate-spin mr-2" /> : 'Confirmer l’annulation'}
              </button>
            </div>
          </div>
        )}

        {/* Modale Retour */}
        {afficherRetour && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-4 md:p-8 rounded-xl shadow-lg w-full max-w-sm mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Retour défectueux</h3>
                <button onClick={() => setAfficherRetour(false)} className="text-gray-500 hover:text-gray-800"><FaTimes /></button>
              </div>
              <label className="block text-sm text-gray-700 mb-1">Raison</label>
              <select
                value={raisonRetour}
                onChange={(e) => setRaisonRetour(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl mb-3 bg-white"
              >
                {RAISONS_REMPLACEMENT.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <label className="block text-sm text-gray-700 mb-1">Quantité retournée</label>
              <input
                type="number"
                min="1"
                value={quantiteRetour}
                onChange={(e) => setQuantiteRetour(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl mb-4"
                placeholder="Quantité"
              />
              <button
                onClick={soumettreRetour}
                className="w-full bg-yellow-500 text-white font-semibold py-2 rounded-xl hover:bg-yellow-600 flex items-center justify-center"
                disabled={envoiEnCours}
              >
                {envoiEnCours ? <FaSpinner className="animate-spin mr-2" /> : 'Confirmer le retour'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sorties;