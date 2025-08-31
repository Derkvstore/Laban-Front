import React, { useEffect, useMemo, useState } from 'react';
import { PrinterIcon } from '@heroicons/react/24/outline';

export default function RetoursFournisseurs() {
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('token');

  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [retours, setRetours] = useState([]);

  const [termeRecherche, setTermeRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');

  const [modalStatutOuvert, setModalStatutOuvert] = useState(false);
  const [statutForm, setStatutForm] = useState({
    id: null,
    statut_retour_fournisseur: '',
    date_reception: '',
    reintegrer_stock: false,
    observation: ''
  });

  const STATUTS_FOURNISSEUR = [
    'en_attente_envoi',
    'envoye',
    'recu_fournisseur',
    'remplace',
    'repare',
    'avoir',
    'rejete',
    'cloture',
  ];

  const recharger = async () => {
    setErreur('');
    setSucces('');
    setChargement(true);
    try {
      const params = new URLSearchParams();
      if (filtreStatut) params.set('statut', filtreStatut);
      if (termeRecherche) params.set('q', termeRecherche);

      const rR = await fetch(`${backendUrl}/api/retours-fournisseurs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dR = await rR.json();
      if (!rR.ok) throw new Error(dR.message || 'Erreur chargement retours fournisseurs');
      setRetours(Array.isArray(dR) ? dR : []);
    } catch (e) {
      console.error(e);
      setErreur(e.message || 'Erreur réseau');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    recharger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtreStatut]);

  const imprimer = () => window.print();

  const ouvrirModalStatut = (ligne) => {
    setStatutForm({
      id: ligne.id,
      statut_retour_fournisseur: ligne.statut_retour_fournisseur || '',
      date_reception: (ligne.date_reception || '').slice(0, 16),
      reintegrer_stock: false,
      observation: ''
    });
    setModalStatutOuvert(true);
  };

  const validerStatut = async () => {
    setErreur('');
    setSucces('');
    try {
      if (!statutForm.id || !statutForm.statut_retour_fournisseur) {
        throw new Error('Veuillez choisir un statut.');
      }
      const corps = {
        statut_retour_fournisseur: statutForm.statut_retour_fournisseur,
        date_reception: statutForm.date_reception ? new Date(statutForm.date_reception).toISOString() : null,
        reintegrer_stock: !!statutForm.reintegrer_stock,
        observation: statutForm.observation || null
      };
      const r = await fetch(`${backendUrl}/api/retours-fournisseurs/${statutForm.id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(corps)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Mise à jour impossible');

      setSucces('Statut mis à jour.');
      setModalStatutOuvert(false);
      recharger();
    } catch (e) {
      console.error(e);
      setErreur(e.message || 'Erreur réseau');
    }
  };

  const retoursFiltres = useMemo(() => {
    const s = (termeRecherche || '').toLowerCase();
    if (!s) return retours;
    return retours.filter((r) => {
      const ident = `${r.marque || ''} ${r.modele || ''} ${r.stockage || ''} ${r.type || ''} ${r.type_carton || ''} ${r.fournisseur_nom || ''} ${r.numero_dossier || ''}`.toLowerCase();
      return ident.includes(s);
    });
  }, [retours, termeRecherche]);

  const badgeStatut = (st) => {
    const map = {
      en_attente_envoi: 'bg-gray-100 text-gray-800',
      envoye: 'bg-blue-100 text-blue-800',
      recu_fournisseur: 'bg-indigo-100 text-indigo-800',
      remplace: 'bg-green-100 text-green-800',
      repare: 'bg-emerald-100 text-emerald-800',
      avoir: 'bg-teal-100 text-teal-800',
      rejete: 'bg-red-100 text-red-800',
      cloture: 'bg-zinc-100 text-zinc-800',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${map[st] || 'bg-gray-100 text-gray-800'}`}>{st || '—'}</span>;
  };

  const LigneTable = ({ l }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-2 text-sm whitespace-nowrap">{l.id}</td>
      <td className="px-3 py-2 text-sm whitespace-nowrap">{l.fournisseur_nom || '—'}</td>
      <td className="px-3 py-2 text-sm">
        <div className="font-medium text-gray-900">
          {l.marque} {l.modele}
        </div>
        <div className="text-xs text-gray-500">
          {l.stockage || ''} {l.type || ''} {l.type_carton || ''}
        </div>
      </td>
      <td className="px-3 py-2 text-center text-sm whitespace-nowrap">{l.quantite_retournee}</td>
      <td className="px-3 py-2 text-sm">{l.raison}</td>
      <td className="px-3 py-2 text-sm whitespace-nowrap">{l.numero_dossier || '—'}</td>
      <td className="px-3 py-2 text-sm whitespace-nowrap">{l.date_envoi ? new Date(l.date_envoi).toLocaleString('fr-FR') : '—'}</td>
      <td className="px-3 py-2 text-sm whitespace-nowrap">{l.date_reception ? new Date(l.date_reception).toLocaleString('fr-FR') : '—'}</td>
      <td className="px-3 py-2 text-center">{badgeStatut(l.statut_retour_fournisseur)}</td>
      <td className="px-3 py-2 text-center">
        <button
          onClick={() => ouvrirModalStatut(l)}
          className="px-3 py-1.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700"
        >
          Statut
        </button>
      </td>
    </tr>
  );

  return (
    <div id="zoneImpression" className="space-y-5">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #zoneImpression, #zoneImpression * { visibility: visible; }
          #zoneImpression { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; box-shadow: none; }
          .no-print { display: none !important; }
          table { width: 100% !important; border-collapse: collapse; font-size: 10pt; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #f8f8f8; }
        }
      `}</style>

      {/* En-tête + actions */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold">Retours Fournisseurs (réception)</h2>
        <div className="flex items-center gap-2 no-print">
          <input
            value={termeRecherche}
            onChange={(e) => setTermeRecherche(e.target.value)}
            placeholder="Rechercher (produit, fournisseur, dossier)..."
            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            {STATUTS_FOURNISSEUR.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={recharger}
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Recharger
          </button>
          <button
            onClick={imprimer}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            <PrinterIcon className="h-5 w-5" />
            Imprimer
          </button>
        </div>
      </div>

      {/* Messages */}
      {erreur && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2">
          {erreur}
        </div>
      )}
      {succes && (
        <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-3 py-2">
          {succes}
        </div>
      )}

      {/* Tableau liste (réception uniquement) */}
      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">#</th>
              <th className="px-3 py-2 text-left font-semibold">Fournisseur</th>
              <th className="px-3 py-2 text-left font-semibold">Produit</th>
              <th className="px-3 py-2 text-center font-semibold">Qté</th>
              <th className="px-3 py-2 text-left font-semibold">Raison</th>
              <th className="px-3 py-2 text-left font-semibold">N° dossier</th>
              <th className="px-3 py-2 text-left font-semibold">Envoyé le</th>
              <th className="px-3 py-2 text-left font-semibold">Reçu le</th>
              <th className="px-3 py-2 text-center font-semibold">Statut</th>
              <th className="px-3 py-2 text-center font-semibold no-print">Action</th>
            </tr>
          </thead>
          <tbody>
            {chargement ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : retoursFiltres.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-gray-500">
                  Aucun retour fournisseur trouvé.
                </td>
              </tr>
            ) : (
              retoursFiltres.map(l => <LigneTable key={l.id} l={l} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Modal MAJ Statut */}
      {modalStatutOuvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[92vw] max-w-xl bg-white rounded-xl shadow-xl p-4">
            <h3 className="text-lg font-semibold mb-3">Mettre à jour le statut</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Statut</label>
                <select
                  value={statutForm.statut_retour_fournisseur}
                  onChange={(e) => setStatutForm(prev => ({ ...prev, statut_retour_fournisseur: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">— Choisir —</option>
                  {STATUTS_FOURNISSEUR.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Date de réception (optionnel)</label>
                <input
                  type="datetime-local"
                  value={statutForm.date_reception}
                  onChange={(e) => setStatutForm(prev => ({ ...prev, date_reception: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {(statutForm.statut_retour_fournisseur === 'remplace' || statutForm.statut_retour_fournisseur === 'repare') && (
                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    id="chk-reintegrer"
                    type="checkbox"
                    checked={statutForm.reintegrer_stock}
                    onChange={(e) => setStatutForm(prev => ({ ...prev, reintegrer_stock: e.target.checked }))}
                  />
                  <label htmlFor="chk-reintegrer" className="text-sm">
                    Réintégrer la quantité au stock (si remplacement ou réparation)
                  </label>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Observation (optionnel)</label>
                <textarea
                  rows={2}
                  value={statutForm.observation}
                  onChange={(e) => setStatutForm(prev => ({ ...prev, observation: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setModalStatutOuvert(false)}
                className="px-4 py-2 rounded-lg border"
              >
                Annuler
              </button>
              <button
                onClick={validerStatut}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
