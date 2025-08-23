import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FaSpinner } from 'react-icons/fa';

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
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export default function ListeProduits() {
  const [clients, setClients] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [items, setItems] = useState([]);

  const [startDate, setStartDate] = useState(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState('');     // YYYY-MM-DD

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL;

  // Charge toutes les données une fois (clients, ventes, items)
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
        setError("Impossible de charger les données. Vérifiez l'API et le token.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Construit les lignes (jointure côté front) + filtre par date/statut
  const rows = useMemo(() => {
    if (!clients.length || !ventes.length || !items.length) return [];

    const clientById = new Map(clients.map(c => [c.id, c]));
    const venteById = new Map(ventes.map(v => [v.id, v]));

    // bornes de dates
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;

    // On garde les items non annulés/retournés (actif, vendu)
    const keptStatuses = new Set(['actif', 'vendu']);

    const list = [];

    for (const it of items) {
      if (it?.statut_vente_item && !keptStatuses.has(it.statut_vente_item)) continue;

      const v = venteById.get(it.vente_id);
      if (!v) continue;

      // Filtrage par date sur la date_vente de la vente
      const dv = v.date_vente ? new Date(v.date_vente) : null;
      if (start && dv && dv < start) continue;
      if (end && dv && dv > end) continue;

      const cli = clientById.get(v.client_id);
      const clientNom = cli?.nom || '—';

      const produit =
        [it.marque, it.modele, it.stockage].filter(Boolean).join(' ')
        || `${it.type || 'Produit'}`;

      const prixAchat = Number(it.prix_unitaire_achat_au_moment_vente ?? 0);
      const prixVente = Number(it.prix_unitaire_negocie ?? 0);
      const qte = Number(it.quantite_vendue ?? 1);

      const benefUnitaire = prixVente - prixAchat;
      const benefTotal = benefUnitaire * qte;

      list.push({
        id: it.id,
        client: clientNom,
        produit,
        prixAchat,
        prixVente,
        benef: benefTotal, // bénéfice par ligne (quantité comprise)
        date: v.date_vente,
        quantite: qte,
      });
    }

    // tri par date vente desc
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  }, [clients, ventes, items, startDate, endDate]);

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">
          Produits vendus (détails)
        </h1>

        {/* Filtres de date */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition self-end"
              >
                Réinitialiser
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
          <div className="mb-4 text-red-500 text-center">{error}</div>
        )}

        {/* Tableau */}
        {!loading && !error && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider">Client</th>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider">Produit</th>
                  <th className="px-3 sm:px-6 py-3 text-right font-semibold text-gray-700 uppercase tracking-wider">Prix d'achat</th>
                  <th className="px-3 sm:px-6 py-3 text-right font-semibold text-gray-700 uppercase tracking-wider">Prix de vente</th>
                  <th className="px-3 sm:px-6 py-3 text-right font-semibold text-gray-700 uppercase tracking-wider">Bénéfice (ligne)</th>
                  <th className="px-3 sm:px-6 py-3 text-right font-semibold text-gray-700 uppercase tracking-wider">Qté</th>
                  <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-6 text-center text-gray-500">
                      Aucun produit trouvé pour les critères sélectionnés.
                    </td>
                  </tr>
                ) : rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap">{r.client}</td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap">{r.produit}</td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-right">{formatCFA(r.prixAchat)}</td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-right">{formatCFA(r.prixVente)}</td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-right font-semibold text-green-700">{formatCFA(r.benef)}</td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-right">{r.quantite}</td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap">{formatDateTime(r.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
