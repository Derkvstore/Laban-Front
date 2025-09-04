import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaDownload, FaPrint, FaMoneyBillWave, FaTimes } from 'react-icons/fa';

// Spinner Icon pour le chargement (un simple SVG pour ne pas ajouter de dépendance)
const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);


const argent = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(Number(n || 0));

export default function Factures() {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [factures, setFactures] = useState([]);

  const [chargement, setChargement] = useState(false);
  const [chargementPDF, setChargementPDF] = useState(null); // AJOUT: État pour le chargement du PDF (par ID)
  const [message, setMessage] = useState({ type: '', texte: '' });

  // création facture
  const [clientId, setClientId] = useState('');
  const [recherche, setRecherche] = useState('');
  const [lignes, setLignes] = useState([]); // [{product, quantite, prix}]
  const total = useMemo(() => lignes.reduce((s, l) => s + Number(l.prix) * Number(l.quantite), 0), [lignes]);
  const [factureCree, setFactureCree] = useState(null);

  // gestion paiement par ligne de la liste
  const [editionPaiementId, setEditionPaiementId] = useState(null);
  const [montantPaiement, setMontantPaiement] = useState('');

  // ---- chargements init ----
  const headers = { Authorization: `Bearer ${token}` };

  const chargerRef = async () => {
    setChargement(true);
    setMessage({ type: '', texte: '' });
    try {
      const [c, p] = await Promise.all([
        axios.get(`${API_URL}/api/clients`, { headers }),
        axios.get(`${API_URL}/api/products`, { headers }),
      ]);
      setClients(Array.isArray(c.data) ? c.data : []);
      setProduits(Array.isArray(p.data) ? p.data : []);
    } catch (e) {
      console.error(e);
      setMessage({ type: 'erreur', texte: "Impossible de charger clients/produits." });
    } finally {
      setChargement(false);
    }
  };

  const chargerFactures = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/factures`, { headers });
      setFactures(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setMessage({ type: 'erreur', texte: "Impossible de charger les factures." });
    }
  };

  useEffect(() => {
    chargerRef();
    chargerFactures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- recherche produit ----
  const produitsFiltres = useMemo(() => {
    const s = (recherche || '').toLowerCase();
    return produits
      .filter((pr) => {
        const ident = `${pr.marque} ${pr.modele} ${pr.stockage || ''} ${pr.type} ${pr.type_carton || ''}`.toLowerCase();
        return s ? ident.includes(s) : true;
      })
      .slice(0, 30);
  }, [produits, recherche]);

  // ---- gestion lignes ----
  const ajouterProduit = (p) => {
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
        { product: p, quantite: 1, prix: Number(p.prix_vente_suggere || 0) },
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

  // ---- création facture ----
  const erreursCreation = useMemo(() => {
    const out = [];
    if (!clientId) out.push('Sélectionnez un client.');
    if (lignes.length === 0) out.push('Ajoutez au moins un produit.');
    lignes.forEach((l) => {
      if (l.quantite > l.product.quantite_en_stock)
        out.push(`Stock insuffisant pour ${l.product.marque} ${l.product.modele}.`);
      if (l.prix < 0) out.push(`Prix invalide pour ${l.product.marque} ${l.product.modele}.`);
    });
    return out;
  }, [clientId, lignes]);

  const creerFacture = async () => {
    setMessage({ type: '', texte: '' });
    if (erreursCreation.length) {
      setMessage({ type: 'erreur', texte: erreursCreation[0] });
      return;
    }
    try {
      setChargement(true);
      const corps = {
        client_id: Number(clientId),
        articles: lignes.map((l) => ({
          product_id: l.product.id,
          quantite: Number(l.quantite),
          prix_unitaire_negocie: Number(l.prix),
        })),
        is_gros_sale: false,
      };
      const { data } = await axios.post(`${API_URL}/api/factures/creer`, corps, { headers });
      setFactureCree(data.facture);
      setMessage({ type: 'succes', texte: `Facture créée (${data.facture.numero_facture}).` });
      setLignes([]);
      setRecherche('');
      await chargerFactures();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'erreur', texte: e?.response?.data?.message || 'Échec de la création de la facture.' });
    } finally {
      setChargement(false);
    }
  };

  // ---- actions liste : imprimer / payer / annuler ----
// ====================== MODIFICATION POUR SAFARI ======================
  const imprimerFacture = async (facture) => {
    setChargementPDF(facture.id);
    setMessage({ type: '', texte: '' });
    try {
      const url = `${API_URL}/api/factures/${facture.id}/pdf`;
      const res = await axios.get(url, { headers, responseType: 'blob' });
      
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(blob);

      // Créer une ancre invisible pour déclencher l'ouverture
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.target = '_blank'; // Important: Indique d'ouvrir dans un nouvel onglet
      a.style.display = 'none'; // Rendre l'élément invisible

      document.body.appendChild(a); // L'ajouter au corps du document pour que le clic fonctionne
      a.click(); // Simuler le clic
      document.body.removeChild(a); // Nettoyer en le retirant du document

      // Pas besoin de révoquer l'URL immédiatement pour laisser le temps au nouvel onglet de charger
      // URL.revokeObjectURL(pdfUrl);

    } catch (e) {
      console.error(e);
      setMessage({ type: 'erreur', texte: "Impossible de générer le PDF." });
    } finally {
      setChargementPDF(null);
    }
  };
  // ==================== FIN DE LA MODIFICATION ====================

  const ouvrirPaiement = (factureId) => {
    setEditionPaiementId(factureId);
    setMontantPaiement('');
    setMessage({ type: '', texte: '' });
  };

  const validerPaiement = async (facture) => {
    const val = Number(montantPaiement);
    if (!(val > 0)) {
      setMessage({ type: 'erreur', texte: 'Montant invalide.' });
      return;
    }
    try {
      await axios.put(`${API_URL}/api/factures/${facture.id}/paiement`, { montant: val }, { headers });
      setMessage({ type: 'succes', texte: 'Paiement enregistré.' });
      setEditionPaiementId(null);
      setMontantPaiement('');
      await chargerFactures();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'erreur', texte: e?.response?.data?.message || 'Échec du paiement.' });
    }
  };

  const annulerFacture = async (facture) => {
    // Remplacer window.confirm par une modale "Apple-like" serait idéal ici.
    // Pour l'instant, on garde la logique de confirmation.
    const ok = window.confirm(`Annuler la facture ${facture.numero_facture} ?\nTous les mobiles seront remis en stock.`);
    if (!ok) return;
    try {
      await axios.put(`${API_URL}/api/factures/${facture.id}/annuler`, { raison_annulation: 'Annulation facture' }, { headers });
      setMessage({ type: 'succes', texte: 'Facture annulée et stocks rétablis.' });
      await chargerFactures();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'erreur', texte: e?.response?.data?.message || "Échec de l'annulation." });
    }
  };

  // ---- rendu ----
  return (
    <div className="space-y-8">
      <h2 className="text-2xl sm:text-3xl font-bold">Factures</h2>

      {/* messages inline */}
      {message.texte && (
        <div className={[
          'rounded-lg border px-3 py-2',
          message.type === 'erreur' ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-green-200 bg-green-50 text-green-700'
        ].join(' ')}>
          {message.texte}
        </div>
      )}

      {/* ===== Création de facture ===== */}
      <section className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
        <h3 className="font-semibold text-lg">Créer une facture</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Sélectionner…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
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

        {recherche && (
          <div className="max-h-64 overflow-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600"><tr>
                <th className="px-3 py-2 text-left">Produit</th>
                <th className="px-3 py-2 text-center">Stock</th>
                <th className="px-3 py-2 text-right">Prix suggéré</th>
                <th className="px-3 py-2"></th>
              </tr></thead>
              <tbody>
                {produitsFiltres.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-3 text-center text-gray-500">Aucun produit.</td></tr>
                ) : produitsFiltres.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-medium">{p.marque} {p.modele}</div>
                      <div className="text-xs text-gray-500">{p.stockage || ''} {p.type} {p.type_carton || ''}</div>
                    </td>
                    <td className="px-3 py-2 text-center">{p.quantite_en_stock}</td>
                    <td className="px-3 py-2 text-right">{argent(p.prix_vente_suggere)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => ajouterProduit(p)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        disabled={p.quantite_en_stock <= 0}
                        title={p.quantite_en_stock <= 0 ? 'Rupture' : 'Ajouter'}
                      >
                        <FaPlus /><span className="hidden sm:inline">Ajouter</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-white rounded-lg border">
          <div className="p-3 font-semibold">Lignes</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600"><tr>
                <th className="px-3 py-2 text-left">Produit</th>
                <th className="px-3 py-2 text-center">Qté</th>
                <th className="px-3 py-2 text-right">Prix Unitaire</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2"></th>
              </tr></thead>
              <tbody>
                {lignes.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">Ajoutez des produits.</td></tr>
                ) : lignes.map((l) => {
                  const t = Number(l.prix) * Number(l.quantite);
                  return (
                    <tr key={l.product.id} className="border-t align-middle">
                      <td className="px-3 py-2">
                        <div className="font-medium">{l.product.marque} {l.product.modele}</div>
                        <div className="text-xs text-gray-500">{l.product.stockage || ''} {l.product.type} {l.product.type_carton || ''} · <span className="text-amber-600">Stock {l.product.quantite_en_stock}</span></div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="number" min="1" max={l.product.quantite_en_stock}
                          value={l.quantite}
                          onChange={(e) => changerQuantite(l.product.id, e.target.value)}
                          className="w-20 text-center px-2 py-1 border rounded-lg" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input type="number" step="1" min="0"
                          value={l.prix}
                          onChange={(e) => changerPrix(l.product.id, e.target.value)}
                          className="w-32 text-right px-2 py-1 border rounded-lg" />
                      </td>
                      <td className="px-3 py-2 text-right font-medium">{argent(t)}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => supprimerLigne(l.product.id)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {lignes.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-3 py-3 text-right font-semibold">Total</td>
                    <td className="px-3 py-3 text-right font-bold">{argent(total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="p-4 flex flex-col sm:flex-row gap-3 justify-between">
            <div className="text-sm text-gray-500">
              {erreursCreation.length > 0 ? erreursCreation[0] : 'Prêt à créer la facture.'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={creerFacture}
                disabled={chargement || erreursCreation.length > 0 || lignes.length === 0 || !clientId}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 inline-flex items-center"
              >
                {chargement && <Spinner />}
                {chargement ? 'Création…' : 'Créer la facture'}
              </button>
              {factureCree && (
                <button
                  onClick={() => imprimerFacture(factureCree)}
                  disabled={chargementPDF === factureCree.id}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900 inline-flex items-center disabled:opacity-60"
                >
                  {chargementPDF === factureCree.id ? <Spinner/> : <FaDownload />} 
                  <span className="ml-2">PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Liste des factures ===== */}
      <section className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 font-semibold">Toutes les factures</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">N°</th>
                <th className="px-3 py-2 text-left">Client</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-right">Montant</th>
                <th className="px-3 py-2 text-right">Payé</th>
                <th className="px-3 py-2 text-right">Dû</th>
                <th className="px-3 py-2 text-left">Statut</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {factures.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-gray-500">Aucune facture.</td>
                </tr>
              ) : factures.map((f) => (
                <React.Fragment key={f.id}>
                  <tr className="border-t">
                    <td className="px-3 py-2 font-mono">{f.numero_facture}</td>
                    <td className="px-3 py-2">{f.client_nom}</td>
                    <td className="px-3 py-2">
                      {f.date_facture ? new Date(f.date_facture).toLocaleString('fr-FR', { hour12: false }) : ''}
                    </td>
                    <td className="px-3 py-2 text-right">{argent(f.montant_original_facture)}</td>
                    <td className="px-3 py-2 text-right">{argent(f.montant_paye_facture || 0)}</td>
                    <td className="px-3 py-2 text-right">{argent(f.montant_actuel_du || 0)}</td>
                    <td className="px-3 py-2">
                      <span className={[
                        'px-2 py-1 rounded-full text-xs font-semibold',
                        f.statut_facture === 'payee' ? 'bg-green-100 text-green-800'
                          : f.statut_facture === 'partielle' ? 'bg-yellow-100 text-yellow-800'
                          : f.statut_facture === 'annulee' ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      ].join(' ')}>
                        {f.statut_facture}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => imprimerFacture(f)} 
                          className="px-3 py-1.5 rounded-lg bg-gray-700 text-white hover:bg-gray-800 inline-flex items-center disabled:opacity-60" 
                          title="Imprimer"
                          disabled={chargementPDF === f.id}
                        >
                          {chargementPDF === f.id ? <Spinner/> : <FaPrint />}
                        </button>
                        {f.statut_facture !== 'annulee' && (
                          <button onClick={() => ouvrirPaiement(f.id)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700" title="Gérer le paiement">
                            <FaMoneyBillWave />
                          </button>
                        )}
                        {f.statut_facture !== 'annulee' && (
                          <button onClick={() => annulerFacture(f)} className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700" title="Annuler la facture">
                            <FaTimes />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {editionPaiementId === f.id && (
                    <tr>
                      <td colSpan={8} className="px-3 py-3 bg-gray-50">
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <div className="text-sm text-gray-600 flex-1">
                            Reste dû : <strong>{argent(f.montant_actuel_du || 0)}</strong>
                          </div>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={montantPaiement}
                            onChange={(e) => setMontantPaiement(e.target.value)}
                            placeholder="Montant à encaisser"
                            className="w-full sm:w-64 px-3 py-2 border rounded-lg"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => validerPaiement(f)}
                              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => { setEditionPaiementId(null); setMontantPaiement(''); }}
                              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                            >
                              Fermer
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}