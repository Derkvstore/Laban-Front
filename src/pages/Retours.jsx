import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FaSpinner, FaCalendarAlt, FaClock, FaSearch, FaBuilding, FaPaperPlane, FaCheckSquare, FaSquare } from 'react-icons/fa';

const Retours = () => {
  const [retours, setRetours] = useState([]);
  const [clients, setClients] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [succes, setSucces] = useState('');

  const [termeRecherche, setTermeRecherche] = useState('');
  const [idsSelectionnes, setIdsSelectionnes] = useState(new Set());

  // Formulaire d’envoi fournisseur
  const [fournisseur_id, setFournisseurId] = useState('');
  const [numero_dossier, setNumeroDossier] = useState('');
  const [date_envoi, setDateEnvoi] = useState('');
  const [observation, setObservation] = useState('');

  // Utilisation de la variable d'environnement VITE_API_URL
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchRetours = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token non trouvé. Veuillez vous reconnecter.");
      }
      // Retours défectueux (liste)
      const response = await axios.get(`${API_URL}/api/defective_returns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Clients (pour afficher le nom)
      const clientsResponse = await axios.get(`${API_URL}/api/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Fournisseurs (pour le formulaire d’envoi)
      const fournisseursResponse = await axios.get(`${API_URL}/api/fournisseurs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setClients(clientsResponse.data || []);
      setFournisseurs(fournisseursResponse.data || []);
      setRetours(response.data || []);
    } catch (err) {
      setError('Erreur lors de la récupération des retours.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRetours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrage simple par recherche (marque / modèle / client)
  const retoursFiltres = useMemo(() => {
    const s = (termeRecherche || '').toLowerCase().trim();
    if (!s) return retours;
    return (retours || []).filter(r => {
      const produit = `${r.marque || ''} ${r.modele || ''} ${r.stockage || ''} ${r.type || ''}`.toLowerCase();
      const clientNom = getClientName(r.client_id).toLowerCase();
      return produit.includes(s) || clientNom.includes(s);
    });
  }, [retours, termeRecherche]);

  // Gestion sélection
  const basculerSelection = (id) => {
    setIdsSelectionnes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toutSelectionner = () => {
    // Sélectionner uniquement les retours affichés (après recherche)
    setIdsSelectionnes(new Set(retoursFiltres.map(r => r.id)));
  };

  const toutDeselectionner = () => {
    setIdsSelectionnes(new Set());
  };

  // Envoi au fournisseur
  const envoyerAuFournisseur = async () => {
    setError('');
    setSucces('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Token manquant.");

      const selection = retours.filter(r => idsSelectionnes.has(r.id));
      if (selection.length === 0) {
        setError("Veuillez sélectionner au moins un mobile à envoyer au fournisseur.");
        return;
      }

      // Construit les lignes à partir des retours défectueux sélectionnés
      const lignes = selection.map(r => ({
        product_id: r.product_id,
        quantite_retournee: r.quantite_retournee,
        raison: r.reason,
        defective_return_id: r.id
      }));

      const corps = {
        fournisseur_id: fournisseur_id || null,
        numero_dossier: numero_dossier || null,
        observation: observation || null,
        date_envoi: date_envoi ? new Date(date_envoi).toISOString() : null,
        lignes
      };

      const res = await axios.post(`${API_URL}/api/retours-fournisseurs`, corps, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res || res.status < 200 || res.status >= 300) {
        throw new Error("Échec de l’envoi au fournisseur.");
      }

      setSucces('Envoi au fournisseur effectué avec succès.');
      // Reset simple
      setIdsSelectionnes(new Set());
      // On garde fournisseur/numéro_dossier si tu enchaînes plusieurs envois
      setObservation('');
      setDateEnvoi('');

      // Optionnel : on recharge la liste (si tu veux masquer ceux déjà traités côté UI après envoi)
      // fetchRetours();

    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || e.message || "Erreur réseau");
    }
  };

  // Formatage
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return date.toLocaleTimeString('fr-FR', options);
  };
  
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.nom : 'N/A';
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Section Retours Mobiles</h1>
        
        {/* Barre d’actions et de filtrage */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-lg mb-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Recherche */}
            <div className="flex items-center gap-2">
              <FaSearch className="text-gray-500" />
              <input
                type="text"
                value={termeRecherche}
                onChange={(e) => setTermeRecherche(e.target.value)}
                placeholder="Rechercher (client, marque, modèle)"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sélection */}
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={toutSelectionner} className="px-3 py-2 rounded-lg border hover:bg-gray-50">
                Tout sélectionner
              </button>
              <button onClick={toutDeselectionner} className="px-3 py-2 rounded-lg border hover:bg-gray-50">
                Tout désélectionner
              </button>
              <span className="text-sm text-gray-600">
                {idsSelectionnes.size} sélectionné(s)
              </span>
            </div>

            {/* Envoi fournisseur (bouton principal) */}
            <div className="flex items-center justify-start lg:justify-end">
              <button
                onClick={envoyerAuFournisseur}
                disabled={idsSelectionnes.size === 0 || isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <FaPaperPlane />
                Envoyer au fournisseur
              </button>
            </div>
          </div>

          {/* Formulaire Envoi Fournisseur */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <FaBuilding className="text-gray-500" />
              <select
                value={fournisseur_id}
                onChange={(e) => setFournisseurId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">— Fournisseur (optionnel) —</option>
                {(fournisseurs || []).map(f => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
            </div>
            <input
              value={numero_dossier}
              onChange={(e) => setNumeroDossier(e.target.value)}
              placeholder="N° dossier (ex: RMA-2025-0007)"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              type="datetime-local"
              value={date_envoi}
              onChange={(e) => setDateEnvoi(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Observation (optionnel)"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Messages inline */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2">
            {error}
          </div>
        )}
        {succes && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 text-green-700 px-3 py-2">
            {succes}
          </div>
        )}

        <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-lg">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 text-gray-800">Liste des Retours</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left font-semibold text-gray-600">
                      <span className="sr-only">Sélection</span>
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left font-semibold text-gray-600">Client</th>
                    <th className="px-3 sm:px-4 py-3 text-left font-semibold text-gray-600">Marque</th>
                    <th className="px-3 sm:px-4 py-3 text-left font-semibold text-gray-600">Modèle</th>
                    <th className="px-3 sm:px-4 py-3 text-left font-semibold text-gray-600">Stockage</th>
                    <th className="px-3 sm:px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                    <th className="px-3 sm:px-4 py-3 text-left font-semibold text-gray-600">Quantité</th>
                    <th className="px-3 sm:px-4 py-3 text-left font-semibold text-gray-600">Défaut</th>
                    <th className="px-3 sm:px-4 py-3 text-left font-semibold text-gray-600">
                      <FaCalendarAlt className="inline-block mr-1" /> Date
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left font-semibold text-gray-600">
                      <FaClock className="inline-block mr-1" /> Heure
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(retoursFiltres || []).map((retour) => {
                    const estSelectionne = idsSelectionnes.has(retour.id);
                    return (
                      <tr key={retour.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => basculerSelection(retour.id)}
                            className="text-lg"
                            aria-label={estSelectionne ? 'Désélectionner' : 'Sélectionner'}
                          >
                            {estSelectionne ? <FaCheckSquare className="text-blue-600" /> : <FaSquare className="text-gray-400" />}
                          </button>
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                          {getClientName(retour.client_id)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                          {retour.marque}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-700">{retour.modele}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-700">{retour.stockage || '—'}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-700">{retour.type}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-700">{retour.quantite_retournee}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-700">{retour.reason}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-700">{formatDate(retour.return_date)}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-gray-700">{formatTime(retour.return_date)}</td>
                      </tr>
                    );
                  })}
                  {(!retoursFiltres || retoursFiltres.length === 0) && (
                    <tr>
                      <td colSpan="10" className="px-3 sm:px-4 py-8 text-center text-gray-500">
                        Aucun retour trouvé.
                      </td>
                    </tr>
                  )}
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
