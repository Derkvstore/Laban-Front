// frontend/src/pages/Retours.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { FaSpinner, FaCalendarAlt, FaClock } from 'react-icons/fa';
import api from '../api/api'; // ⬅️ instance axios centralisée

const Retours = () => {
  const [retours, setRetours] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [selection, setSelection] = useState(new Set());
  const [recherche, setRecherche] = useState('');
  const [clientFiltre, setClientFiltre] = useState('');
  const [dateEnvoi, setDateEnvoi] = useState(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [numeroDossier, setNumeroDossier] = useState('');
  const [observation, setObservation] = useState('');
  const [messageSucces, setMessageSucces] = useState('');

  const API_URL = import.meta.env.VITE_API_URL;

  const formatDate = (v) => (v ? new Date(v).toLocaleDateString('fr-FR') : '');
  const formatHeure = (v) => (v ? new Date(v).toLocaleTimeString('fr-FR', { hour12: false }) : '');

  const fetchRetours = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/api/returns`);
      setRetours(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("Erreur lors du chargement des retours.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data } = await api.get(`/api/clients`);
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRetours();
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retoursFiltres = useMemo(() => {
    const s = (recherche || '').toLowerCase();
    return retours.filter((r) => {
      const okClient = clientFiltre ? String(r.client_id) === String(clientFiltre) : true;
      const ident = `${r.client_nom || ''} ${r.marque || ''} ${r.modele || ''} ${r.stockage || ''} ${r.type || ''}`.toLowerCase();
      const okSearch = s ? ident.includes(s) : true;
      return okClient && okSearch;
    });
  }, [retours, clientFiltre, recherche]);

  const basculerSelection = (id) => {
    setSelection((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const toutSelectionner = () => setSelection(new Set(retoursFiltres.map((r) => r.id)));
  const toutDeselectionner = () => setSelection(new Set());

  const posterVersFournisseur = async (corps) => {
    // on tente d’abord /retours-fournisseurs puis fallback /retours_fournisseurs si besoin
    try {
      return await api.post(`/api/retours-fournisseurs`, corps);
    } catch (e) {
      if (e?.response?.status === 404) {
        return await api.post(`/api/retours_fournisseurs`, corps);
      }
      throw e;
    }
  };

  const envoyerAuFournisseur = async () => {
    setError('');
    setMessageSucces('');

    if (selection.size === 0) {
      setError('Veuillez sélectionner au moins un retour.');
      return;
    }

    const items = Array.from(selection).map((retour_id) => ({ retour_id }));

    const corps = {
      items,
      numero_dossier: numeroDossier || null,
      date_envoi: dateEnvoi ? new Date(dateEnvoi).toISOString() : null,
      observation: observation || null,
    };

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
      <div><h2 className="text-2xl sm:text-3xl font-bold">Section Retours Mobiles</h2></div>

      <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2">{error}</div>}
        {messageSucces && <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-3 py-2">{messageSucces}</div>}

        <div className="flex flex-col lg:flex-row gap-3 items-stretch">
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher (client, marque, modèle)…" className="flex-1 px-3 py-2 border rounded-lg" />
          <select value={clientFiltre} onChange={(e) => setClientFiltre(e.target.value)} className="w-full lg:w-56 px-3 py-2 border rounded-lg">
            <option value="">Tous les clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <input value={numeroDossier} onChange={(e) => setNumeroDossier(e.target.value)} placeholder="N° dossier (ex: RMA-2025-001)" className="w-full lg:w-56 px-3 py-2 border rounded-lg" />
          <input type="datetime-local" value={dateEnvoi} onChange={(e) => setDateEnvoi(e.target.value)} className="w-full lg:w-56 px-3 py-2 border rounded-lg" />
          <input value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Observation (optionnel)" className="flex-1 px-3 py-2 border rounded-lg" />
          <button onClick={envoyerAuFournisseur} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" disabled={selection.size === 0}>
            Envoyer au fournisseur
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 font-semibold">Liste des Retours</div>

        {isLoading ? (
          <div className="p-6 text-gray-500 flex items-center gap-2"><FaSpinner className="animate-spin" /> Chargement…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selection.size > 0 && retoursFiltres.every((r) => selection.has(r.id))}
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
                  <th className="px-3 py-2 text-left font-semibold"><FaCalendarAlt className="inline mr-1" /> Date</th>
                  <th className="px-3 py-2 text-left font-semibold"><FaClock className="inline mr-1" /> Heure</th>
                </tr>
              </thead>
              <tbody>
                {retoursFiltres.length === 0 ? (
                  <tr><td colSpan={10} className="px-3 py-6 text-center text-gray-500">Aucun retour à afficher.</td></tr>
                ) : (
                  retoursFiltres.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={selection.has(r.id)} onChange={() => basculerSelection(r.id)} />
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
