import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FaSpinner, FaCalendarAlt, FaClock } from 'react-icons/fa';

const Retours = () => {
  // états existants
  const [retours, setRetours] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // sélection + recherche/filtre
  const [selection, setSelection] = useState(new Set());
  const [recherche, setRecherche] = useState('');
  const [clientFiltre, setClientFiltre] = useState('');

  // états déjà présents (non affichés)
  const [dateEnvoi] = useState(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [numeroDossier] = useState('');
  const [observation] = useState('');
  const [messageSucces, setMessageSucces] = useState('');

  // API
  const API_URL = import.meta.env.VITE_API_URL;

  // -------- utilitaires --------
  const formatDate = (v) => (v ? new Date(v).toLocaleDateString('fr-FR') : '');
  const formatHeure = (v) => (v ? new Date(v).toLocaleTimeString('fr-FR', { hour12: false }) : '');

  // Essaie une liste de chemins jusqu’à succès (2xx). Ignore 404, remonte les autres erreurs.
  const getAvecFallback = async (chemins) => {
    const token = localStorage.getItem('token');
    let derniereErreur = null;
    for (const path of chemins) {
      try {
        const res = await axios.get(`${API_URL}${path}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
      } catch (e) {
        if (e?.response?.status === 404) {
          derniereErreur = e;
          continue; // on essaie le chemin suivant
        }
        // autre erreur (401, 500, réseau...) => on remonte tout de suite
        throw e;
      }
    }
    // si on arrive ici : tous les chemins ont fait 404
    throw derniereErreur || new Error('Ressource introuvable');
  };

  // POST vers fournisseur avec 2 alias possibles
  const posterVersFournisseur = async (corps) => {
    const token = localStorage.getItem('token');
    try {
      return await axios.post(`${API_URL}/api/retours-fournisseurs`, corps, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      if (e?.response?.status === 404) {
        return await axios.post(`${API_URL}/api/retours_fournisseurs`, corps, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      throw e;
    }
  };

  // -------- chargements --------
  const fetchRetours = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Liste d’URL possibles selon ce que ton backend expose en prod
      const donnees = await getAvecFallback([
        '/api/returns',               // ton écran appelait celui-ci (404 en prod)
        '/api/defective-returns',     // variante tiret
        '/api/defective_returns',     // variante underscore
        '/api/retours',               // variante FR
        '/api/defectiveReturns'       // variante camelCase
      ]);
      setRetours(Array.isArray(donnees) ? donnees : []);
    } catch (e) {
      console.error(e);
      const cheminsTestes = [
        '/api/returns',
        '/api/defective-returns',
        '/api/defective_returns',
        '/api/retours',
        '/api/defectiveReturns'
      ].join(', ');
      setError(`Erreur lors du chargement des retours (routes testées: ${cheminsTestes}).`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      // non bloquant
    }
  };

  useEffect(() => {
    fetchRetours();
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- filtrage local --------
  const retoursFiltres = useMemo(() => {
    const s = (recherche || '').toLowerCase();
    return retours.filter((r) => {
      const okClient = clientFiltre ? String(r.client_id) === String(clientFiltre) : true;
      const ident = `${r.client_nom || ''} ${r.marque || ''} ${r.modele || ''} ${r.stockage || ''} ${r.type || ''}`.toLowerCase();
      const okSearch = s ? ident.includes(s) : true;
      return okClient && okSearch;
    });
  }, [retours, clientFiltre, recherche]);

  // -------- sélection --------
  const basculerSelection = (id) => {
    setSelection((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const toutSelectionner = () => setSelection(new Set(retoursFiltres.map((r) => r.id)));
  const toutDeselectionner = () => setSelection(new Set());

  // -------- envoi fournisseur (seulement les IDs) --------
  const envoyerAuFournisseur = async () => {
    setError('');
    setMessageSucces('');

    if (selection.size === 0) {
      setError('Veuillez sélectionner au moins un retour.');
      return;
    }

    const items = Array.from(selection).map((retour_id) => ({ retour_id }));

    const corps = { items }; // rien d’autre, on n’ajoute pas de champs UI

    try {
      await posterVersFournisseur(corps);
      setMessageSucces('Retours envoyés au fournisseur avec succès.');
      await fetchRetours();
      toutDeselectionner();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Échec de l’envoi au fournisseur.';
      setError(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">Section Retours Mobiles</h2>
      </div>

      {/* Barre d’actions */}
      <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2">
            {error}
          </div>
        )}
        {messageSucces && (
          <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-3 py-2">
            {messageSucces}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-3 items-stretch">
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher (client, marque, modèle)…"
            className="flex-1 px-3 py-2 border rounded-lg"
          />

          <select
            value={clientFiltre}
            onChange={(e) => setClientFiltre(e.target.value)}
            className="w-full lg:w-56 px-3 py-2 border rounded-lg"
          >
            <option value="">Tous les clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <button onClick={toutSelectionner} className="px-3 py-2 rounded-lg border hover:bg-gray-100">
              Tout sélectionner
            </button>
            <button onClick={toutDeselectionner} className="px-3 py-2 rounded-lg border hover:bg-gray-100">
              Tout désélectionner
            </button>
          </div>

          <button
            onClick={envoyerAuFournisseur}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={selection.size === 0}
          >
            Envoyer au fournisseur
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 font-semibold">Liste des Retours</div>

        {isLoading ? (
          <div className="p-6 text-gray-500 flex items-center gap-2">
            <FaSpinner className="animate-spin" /> Chargement…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selection.size > 0 &&
                        retoursFiltres.length > 0 &&
                        retoursFiltres.every((r) => selection.has(r.id))
                      }
                      onChange={(e) => (e.target.checked ? toutSelectionner() : toutDeselectionner())}
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">Client</th>
                  <th className="px-3 py-2 text-left font-semibold">Marque</th>
                  <th className="px-3 py-2 text-left font-semibold">Modèle</th>
                  <th className="px-3 py-2 text-left font-semibold">Stockage</th>
                  <th className="px-3 py-2 text-left font-semibold">Type</th>
                  <th className="px-3 py-2 text-center font-semibold">Quantité</th>
                  <th className="px-3 py-2 text-left font-semibold">Défaut</th>
                  <th className="px-3 py-2 text-left font-semibold">
                    <FaCalendarAlt className="inline mr-1" /> Date
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    <FaClock className="inline mr-1" /> Heure
                  </th>
                </tr>
              </thead>
              <tbody>
                {retoursFiltres.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-gray-500">
                      Aucun retour à afficher.
                    </td>
                  </tr>
                ) : (
                  retoursFiltres.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selection.has(r.id)}
                          onChange={() => basculerSelection(r.id)}
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.client_nom || 'N/A'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.marque}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.modele}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.stockage || ''}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.type}</td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">{r.quantite_retournee}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.reason || r.defaut || ''}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDate(r.return_date)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatHeure(r.return_date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Retours;
