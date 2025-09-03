// src/pages/Factures.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaDownload } from 'react-icons/fa';

const money = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(Number(n || 0));

export default function Factures() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(false);

  // sélection + saisie
  const [clientId, setClientId] = useState('');
  const [recherche, setRecherche] = useState('');
  const [lignes, setLignes] = useState([]); // [{product, quantite, prix}]
  const [message, setMessage] = useState({ type: '', text: '' });

  // après création
  const [factureCree, setFactureCree] = useState(null); // { id, numero_facture, vente_id, montant_actuel_du, ... }

  // --- chargements init ---
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [c, p] = await Promise.all([
          axios.get(`${API_URL}/api/clients`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/products`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setClients(Array.isArray(c.data) ? c.data : []);
        setProduits(Array.isArray(p.data) ? p.data : []);
      } catch (e) {
        console.error(e);
        setMessage({ type: 'error', text: "Impossible de charger clients/produits." });
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL, token]);

  // --- recherche produits ---
  const produitsFiltres = useMemo(() => {
    const s = (recherche || '').toLowerCase();
    return produits
      .filter((pr) => {
        const ident = `${pr.marque} ${pr.modele} ${pr.stockage || ''} ${pr.type} ${pr.type_carton || ''}`.toLowerCase();
        return s ? ident.includes(s) : true;
      })
      .slice(0, 30); // évite d’afficher une liste énorme
  }, [produits, recherche]);

  // --- gestion lignes ---
  const ajouterProduit = (p) => {
    // si déjà dans le panier -> +1
    setLignes((prev) => {
      const exist = prev.find((l) => l.product.id === p.id);
      if (exist) {
        return prev.map((l) =>
          l.product.id === p.id
            ? { ...l, quantite: Math.min(l.quantite + 1, p.quantite_en_stock) }
            : l
        );
      }
      return [
        ...prev,
        {
          product: p,
          quantite: 1,
          prix: Number(p.prix_vente_suggere || 0),
        },
      ];
    });
  };

  const changerQuantite = (productId, q) => {
    setLignes((prev) =>
      prev.map((l) =>
        l.product.id === productId
          ? { ...l, quantite: Math.max(1, Math.min(Number(q || 0), l.product.quantite_en_stock)) }
          : l
      )
    );
  };

  const changerPrix = (productId, prix) => {
    setLignes((prev) =>
      prev.map((l) => (l.product.id === productId ? { ...l, prix: Number(prix || 0) } : l))
    );
  };

  const supprimerLigne = (productId) => {
    setLignes((prev) => prev.filter((l) => l.product.id !== productId));
  };

  // --- totaux ---
  const total = useMemo(
    () => lignes.reduce((s, l) => s + Number(l.prix) * Number(l.quantite), 0),
    [lignes]
  );

  // --- validation simple ---
  const erreurs = useMemo(() => {
    const out = [];
    if (!clientId) out.push('Veuillez sélectionner un client.');
    if (lignes.length === 0) out.push('Veuillez ajouter au moins un produit.');
    lignes.forEach((l) => {
      if (l.quantite > l.product.quantite_en_stock)
        out.push(
          `Stock insuffisant pour ${l.product.marque} ${l.product.modele} (max ${l.product.quantite_en_stock}).`
        );
      if (l.prix < 0) out.push(`Prix invalide pour ${l.product.marque} ${l.product.modele}.`);
    });
    return out;
  }, [clientId, lignes]);

  // --- submit ---
  const creerFacture = async () => {
    setMessage({ type: '', text: '' });
    if (erreurs.length) {
      setMessage({ type: 'error', text: erreurs[0] });
      return;
    }
    try {
      setLoading(true);
      const payload = {
        client_id: Number(clientId),
        articles: lignes.map((l) => ({
          product_id: l.product.id,
          quantite: Number(l.quantite),
          prix_unitaire_negocie: Number(l.prix),
        })),
        is_gros_sale: false,
      };
      const { data } = await axios.post(`${API_URL}/api/factures/creer`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFactureCree(data.facture);
      setMessage({ type: 'success', text: `Facture créée (${data.facture.numero_facture}).` });
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Échec de la création de la facture.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // --- téléchargement PDF avec Authorization header ---
  const telechargerPDF = async () => {
    if (!factureCree?.id) return;
    try {
      const url = `${API_URL}/api/factures/${factureCree.id}/pdf`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `facture-${factureCree.numero_facture}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Impossible de générer le PDF.' });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold">Créer une facture</h2>

      {/* Messages inline (pas de modales) */}
      {message.text && (
        <div
          className={[
            'rounded-lg border px-3 py-2',
            message.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-green-200 bg-green-50 text-green-700',
          ].join(' ')}
        >
          {message.text}
        </div>
      )}

      {/* Sélection client + recherche produit */}
      <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Sélectionner un client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Rechercher un produit</label>
            <input
              placeholder="iPhone 12 128 Go CARTON…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* résultats produits (compact) */}
        {recherche && (
          <div className="max-h-64 overflow-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">Produit</th>
                  <th className="px-3 py-2 text-center">Stock</th>
                  <th className="px-3 py-2 text-right">Prix suggéré</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {produitsFiltres.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-3 text-center text-gray-500">
                      Aucun produit.
                    </td>
                  </tr>
                ) : (
                  produitsFiltres.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2">
                        <div className="font-medium">
                          {p.marque} {p.modele}
                        </div>
                        <div className="text-xs text-gray-500">
                          {p.stockage || ''} {p.type} {p.type_carton || ''}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">{p.quantite_en_stock}</td>
                      <td className="px-3 py-2 text-right">{money(p.prix_vente_suggere)}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => ajouterProduit(p)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                          disabled={p.quantite_en_stock <= 0}
                          title={p.quantite_en_stock <= 0 ? 'Rupture de stock' : 'Ajouter'}
                        >
                          <FaPlus />
                          <span className="hidden sm:inline">Ajouter</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Panier / lignes sélectionnées */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 font-semibold">Lignes de facture</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Produit</th>
                <th className="px-3 py-2 text-center">Qté</th>
                <th className="px-3 py-2 text-right">Prix (unitaire)</th>
                <th className="px-3 py-2 text-right">Total ligne</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {lignes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Ajoutez des produits pour constituer la facture.
                  </td>
                </tr>
              ) : (
                lignes.map((l) => {
                  const t = Number(l.prix) * Number(l.quantite);
                  return (
                    <tr key={l.product.id} className="border-t align-middle">
                      <td className="px-3 py-2">
                        <div className="font-medium">
                          {l.product.marque} {l.product.modele}
                        </div>
                        <div className="text-xs text-gray-500">
                          {l.product.stockage || ''} {l.product.type} {l.product.type_carton || ''} ·{' '}
                          <span className="text-amber-600">Stock: {l.product.quantite_en_stock}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min="1"
                          max={l.product.quantite_en_stock}
                          value={l.quantite}
                          onChange={(e) => changerQuantite(l.product.id, e.target.value)}
                          className="w-20 text-center px-2 py-1 border rounded-lg"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={l.prix}
                          onChange={(e) => changerPrix(l.product.id, e.target.value)}
                          className="w-32 text-right px-2 py-1 border rounded-lg"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium">{money(t)}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => supprimerLigne(l.product.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
                          title="Supprimer"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {lignes.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-3 py-3 text-right font-semibold">
                    Total
                  </td>
                  <td className="px-3 py-3 text-right font-bold">{money(total)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="p-4 flex flex-col sm:flex-row gap-3 justify-between">
          <div className="text-sm text-gray-500">
            {erreurs.length > 0 ? erreurs[0] : 'Prêt à créer la facture.'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={creerFacture}
              disabled={loading || erreurs.length > 0 || lignes.length === 0 || !clientId}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Création…' : 'Créer la facture'}
            </button>

            <button
              onClick={telechargerPDF}
              disabled={!factureCree?.id}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-60 inline-flex items-center gap-2"
              title="Télécharger le PDF"
            >
              <FaDownload /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Info facture créée */}
      {factureCree && (
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="font-semibold mb-1">Facture créée</div>
          <div className="text-sm text-gray-700">
            Numéro : <span className="font-mono">{factureCree.numero_facture}</span>
          </div>
          <div className="text-sm text-gray-700">
            Montant dû : <span className="font-semibold">{money(factureCree.montant_actuel_du)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
