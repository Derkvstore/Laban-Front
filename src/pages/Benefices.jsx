import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { 
  FaSpinner, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaTimesCircle 

} from 'react-icons/fa';

const formatCFA = (amount) => {
  const n = Number(amount);
  if (Number.isNaN(n)) return 'N/A';
  return n.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Benefices() {
  const [clients, setClients] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [items, setItems] = useState([]);

  const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Base URL backend : privilégie VITE_API_URL
  const API_URL =
    import.meta.env?.VITE_API_URL ||
    (import.meta.env?.PROD ? '' : 'http://localhost:3001');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [cliRes, venRes, itRes] = await Promise.all([
          axios.get(`${API_URL}/api/clients`, { headers }),
          axios.get(`${API_URL}/api/ventes`, { headers }),
          axios.get(`${API_URL}/api/vente_items`, { headers }),
        ]);

        setClients(cliRes.data || []);
        setVentes(venRes.data || []);
        setItems(itRes.data || []);
      } catch (err) {
        console.error('Erreur chargement données:', err);
        const msg =
          err?.response?.status === 401
            ? 'Non autorisé (401). Reconnectez-vous pour obtenir un nouveau jeton.'
            : "Impossible de charger les données. Vérifiez l'API et le token.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map rapides
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const venteById = useMemo(() => new Map(ventes.map((v) => [v.id, v])), [ventes]);

  // Lignes : uniquement les items VENDUS (exclut actif/retourné/annulé), avec filtre par date si renseigné
  const rows = useMemo(() => {
    if (!items.length) return [];
    const list = [];

    for (const it of items) {
      if (it?.statut_vente_item !== 'vendu') continue; // <= uniquement vendu

      const v = venteById.get(it.vente_id);
      if (!v) continue;

      if (selectedDate) {
        const d = new Date(v.date_vente);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const onlyDate = `${y}-${m}-${day}`;
        if (onlyDate !== selectedDate) continue;
      }

      const cli = clientById.get(v.client_id);
      const clientNom = cli?.nom || '—';

      const produit =
        [it.marque, it.modele, it.stockage].filter(Boolean).join(' ') ||
        it.type ||
        'Produit';

      const prixAchat = Number(it.prix_unitaire_achat_au_moment_vente ?? 0);
      const prixVente = Number(it.prix_unitaire_negocie ?? 0);
      const quantite = Number(it.quantite_vendue ?? 1);

      const prixTotal = prixVente * quantite;
      const benefLigne = (prixVente - prixAchat) * quantite;

      list.push({
        id: it.id,
        client: clientNom,
        produit,
        prixAchat,
        prixVente,
        quantite,
        prixTotal,
        benefLigne,
        dateVente: v.date_vente,
      });
    }

    list.sort((a, b) => new Date(b.dateVente) - new Date(a.dateVente));
    return list;
  }, [items, venteById, clientById, selectedDate]);

  // Bénéfice global (sur les lignes affichées)
  const beneficeGlobal = useMemo(
    () => rows.reduce((acc, r) => acc + Number(r.benefLigne || 0), 0),
    [rows]
  );

  return (
    <div className="p-6 sm:p-8 bg-gray-50 min-h-screen">
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">
          Bénéfices
        </h1>

        {/* Filtre par date */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-start gap-3">
            <label htmlFor="saleDate" className="text-gray-700 font-semibold flex items-center">
              <FaCalendarAlt className="text-blue-500 mr-2" /> Filtrer par date :
            </label>
            <input
              type="date"
              id="saleDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-blue-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-200 shadow-sm bg-white hover:border-blue-300"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition flex items-center"
                title="Effacer le filtre de date"
              >
                <FaTimesCircle className="mr-1" /> Effacer
              </button>
            )}
          </div>
        </div>

        {/* États */}
        {loading && (
          <div className="flex justify-center items-center h-40">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
          </div>
        )}
        {error && !loading && (
          <div className="mb-4 text-red-600 text-center">{error}</div>
        )}

        {/* Carte unique : Bénéfice global */}
        {!loading && !error && (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-8">
            <div className="bg-white p-5 rounded-2xl shadow-md text-center">
              <FaMoneyBillWave className="mx-auto text-green-600 mb-2" />
              <div className="text-sm text-gray-500">Bénéfice global</div>
              <div className="text-3xl sm:text-4xl font-extrabold text-green-700">
                {formatCFA(beneficeGlobal)}
              </div>
            </div>
          </div>
        )}

        {/* Tableau des lignes (uniquement VENDU) */}
        {!loading && !error && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider">Client</th>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider">Produit</th>
                  <th className="px-3 sm:px-6 py-3 text-right font-semibold text-gray-700 uppercase tracking-wider">Prix d'achat</th>
                  <th className="px-3 sm:px-6 py-3 text-right font-semibold text-gray-700 uppercase tracking-wider">Prix de vente</th>
                  <th className="px-3 sm:px-6 py-3 text-right font-semibold text-gray-700 uppercase tracking-wider">Qté</th>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider">Date de vente</th>
                  <th className="px-3 sm:px-6 py-3 text-right font-semibold text-gray-700 uppercase tracking-wider">Prix total</th>
                  <th className="px-3 sm:px-6 py-3 text-right font-semibold text-gray-700 uppercase tracking-wider">Bénéfice (ligne)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-6 text-center text-gray-500">
                      Aucune vente {selectedDate ? `pour la date sélectionnée.` : `à afficher.`}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap">{r.client}</td>
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap">{r.produit}</td>
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-right">{formatCFA(r.prixAchat)}</td>
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-right">{formatCFA(r.prixVente)}</td>
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-right">{r.quantite}</td>
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap">{formatDateTime(r.dateVente)}</td>
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-right">{formatCFA(r.prixTotal)}</td>
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-right font-semibold text-green-700">{formatCFA(r.benefLigne)}</td>
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
}
