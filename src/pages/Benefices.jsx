import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CurrencyDollarIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Benefices() {
  // État pour le format “simple” (ton backend actuel)
  const [benefices, setBenefices] = useState({
    total_ventes: 0,
    total_achats: 0,
    benefice_brut: 0,
  });

  // État pour le format “avancé” (ton exemple)
  const [soldItems, setSoldItems] = useState([]);
  const [totalBeneficeGlobal, setTotalBeneficeGlobal] = useState(null);

  // UI states
  const [selectedDate, setSelectedDate] = useState(''); // filtre “une date” (on envoie start=end=date)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Utilitaire montant CFA
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

  // Utilitaire date affichage
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString('fr-FR', options);
    } catch {
      return 'N/A';
    }
  };

  const fetchBenefices = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');

      // URL backend : on privilégie VITE_API_URL si présent,
      // sinon fallback pratique pour le dev local.
      const API_URL =
        import.meta.env?.VITE_API_URL ||
        (import.meta.env?.PROD ? '' : 'http://localhost:3001');

      // On garde ta route /api/benefices
      // Si une date est choisie, on envoie startDate = endDate = selectedDate
      const params = new URLSearchParams();
      if (selectedDate) {
        params.set('startDate', selectedDate);
        params.set('endDate', selectedDate);
      }
      const url = `${API_URL}/api/benefices${params.toString() ? `?${params}` : ''}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data || {};

      // Reset des deux formats avant de re-remplir
      setSoldItems([]);
      setTotalBeneficeGlobal(null);
      setBenefices({ total_ventes: 0, total_achats: 0, benefice_brut: 0 });

      // Détection du format
      if (Array.isArray(data.sold_items) || Array.isArray(data.items)) {
        // Format “avancé”
        const items = data.sold_items || data.items || [];
        setSoldItems(items);
        // On préfère une somme renvoyée par l’API si dispo, sinon on recalcule vite fait
        if (typeof data.total_benefice_global === 'number') {
          setTotalBeneficeGlobal(data.total_benefice_global);
        } else {
          // Petit calcul de secours si les champs existent (prix vente - prix achat) * qté
          const total = items.reduce((acc, it) => {
            const achat = Number(it.prix_unitaire_achat ?? it.prix_unitaire_achat_au_moment_vente ?? 0);
            const vente = Number(it.prix_unitaire_vente ?? it.prix_unitaire_negocie ?? 0);
            const qte = Number(it.quantite_vendue ?? 1);
            return acc + Math.max(0, vente - achat) * qte;
          }, 0);
          setTotalBeneficeGlobal(total);
        }
      } else {
        // Format “simple”
        setBenefices({
          total_ventes: Number(data.total_ventes || 0),
          total_achats: Number(data.total_achats || 0),
          benefice_brut: Number(data.benefice_brut || 0),
        });
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des bénéfices:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Erreur lors de la récupération des bénéfices.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenefices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  return (
    <div className="p-6 sm:p-8 bg-gray-50 min-h-screen">
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900 flex items-center justify-center">
          <CurrencyDollarIcon className="h-7 w-7 text-green-600 mr-2" />
          Bénéfices
        </h1>

        {/* Filtres */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <label htmlFor="saleDate" className="text-gray-700 font-semibold">
              Filtrer par date :
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
                className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition"
                title="Effacer le filtre de date"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* États */}
        {loading && (
          <div className="text-center text-gray-600">Calcul des bénéfices en cours...</div>
        )}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-center"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Affichage format avancé : total global + tableau */}
        {!loading && !error && soldItems.length > 0 && (
          <>
            <div className="text-center mt-4 mb-8 p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 text-blue-800 rounded-xl shadow-lg">
              <p className="text-xl font-semibold">
                Bénéfice total {selectedDate ? `pour le ${formatDate(selectedDate)}` : ''} :
              </p>
              <p className="text-4xl sm:text-5xl font-extrabold mt-2 text-green-700">
                {formatCFA(totalBeneficeGlobal)}
              </p>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-700 p-4 border-b border-gray-200">
                Détail des produits vendus :
              </h3>
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-blue-50 text-blue-700">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold uppercase">Modèle</th>
                    <th className="py-3 px-4 text-left font-semibold uppercase">Stockage</th>
                    <th className="py-3 px-4 text-left font-semibold uppercase">Type</th>
                    <th className="py-3 px-4 text-left font-semibold uppercase">Type Carton</th>
                    <th className="py-3 px-4 text-left font-semibold uppercase">IMEI</th>
                    <th className="py-3 px-4 text-right font-semibold uppercase">Prix Achat</th>
                    <th className="py-3 px-4 text-right font-semibold uppercase">Prix Vente</th>
                    <th className="py-3 px-4 text-right font-semibold uppercase">Qté</th>
                    <th className="py-3 px-4 text-left font-semibold uppercase">Date Vente</th>
                    <th className="py-3 px-4 text-right font-semibold uppercase">Bénéfice Unitaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {soldItems.map((item) => (
                    <tr key={item.vente_item_id || `${item.modele}-${item.date_vente}-${Math.random()}`} className="hover:bg-blue-50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">{item.modele}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.stockage || 'N/A'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.type}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.type_carton || 'N/A'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{item.imei || '—'}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {formatCFA(item.prix_unitaire_achat ?? item.prix_unitaire_achat_au_moment_vente)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {formatCFA(item.prix_unitaire_vente ?? item.prix_unitaire_negocie)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">{item.quantite_vendue ?? 1}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{formatDate(item.date_vente)}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-medium text-green-700">
                        {formatCFA(
                          (item.prix_unitaire_vente ?? item.prix_unitaire_negocie ?? 0) -
                          (item.prix_unitaire_achat ?? item.prix_unitaire_achat_au_moment_vente ?? 0)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Affichage format simple : 3 cartes (si pas de soldItems) */}
        {!loading && !error && soldItems.length === 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-gray-50 p-6 rounded-2xl shadow-md text-center transform transition-transform duration-300 hover:scale-105">
                <span className="text-3xl sm:text-4xl font-bold text-gray-800">{formatCFA(benefices.total_ventes)}</span>
                <p className="text-sm sm:text-md text-gray-500 mt-2">Ventes totales</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl shadow-md text-center transform transition-transform duration-300 hover:scale-105">
                <span className="text-3xl sm:text-4xl font-bold text-gray-800">{formatCFA(benefices.total_achats)}</span>
                <p className="text-sm sm:text-md text-gray-500 mt-2">Coûts totaux</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl shadow-md text-center transform transition-transform duration-300 hover:scale-105">
                <span className="text-3xl sm:text-4xl font-bold text-gray-800">{formatCFA(benefices.benefice_brut)}</span>
                <p className="text-sm sm:text-md text-gray-500 mt-2">Bénéfice brut</p>
              </div>
            </div>

            {/* Message si filtre activé mais pas de “détails” */}
            {selectedDate && (
              <p className="text-center text-gray-600 mt-6">
                Aucun détail de vente disponible pour le {formatDate(selectedDate)} (affichage des totaux).
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
