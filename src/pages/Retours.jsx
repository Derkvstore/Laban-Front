import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

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

  // Remplacez cette URL par l'URL publique de votre serveur backend déployé
  const API_URL = 'http://localhost:3000'; // À remplacer par l'URL publique !

  const formatDate = (v) =>
    v ? new Date(v).toLocaleDateString('fr-FR') : '';
  const formatHeure = (v) =>
    v ? new Date(v).toLocaleTimeString('fr-FR', { hour12: false }) : '';

  useEffect(() => {
    const fetchRetoursEtClients = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [retoursRes, clientsRes] = await Promise.all([
          axios.get(`${API_URL}/api/defective_returns`),
          axios.get(`${API_URL}/api/clients`),
        ]);
        setRetours(retoursRes.data);
        setClients(clientsRes.data);
      } catch (err) {
        console.error('Erreur de chargement des données:', err);
        setError('Impossible de charger les données. Veuillez réessayer.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRetoursEtClients();
  }, [API_URL]);

  const basculerSelection = (id) => {
    const newSelection = new Set(selection);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelection(newSelection);
  };

  const gererEnvoiFournisseur = async () => {
    if (selection.size === 0) {
      setError('Veuillez sélectionner au moins un retour à envoyer.');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessageSucces('');

    const retoursAEnvoyer = Array.from(selection);
    const payload = {
      retours_ids: retoursAEnvoyer,
      numero_dossier,
      date_envoi,
      observation,
    };

    try {
      await axios.post(`${API_URL}/api/retours-fournisseurs`, payload);
      setMessageSucces('Retours envoyés au fournisseur avec succès !');
      setSelection(new Set());
      const retoursRes = await axios.get(`${API_URL}/api/defective_returns`);
      setRetours(retoursRes.data);
    } catch (err) {
      console.error('Erreur lors de l\'envoi au fournisseur:', err);
      setError(
        "Échec de l'envoi au fournisseur. Veuillez vérifier les informations et réessayer."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const retoursFiltres = useMemo(() => {
    let resultats = retours.filter((r) => r.status === 'en_attente');
    if (recherche) {
      const terme = recherche.toLowerCase();
      resultats = resultats.filter(
        (r) =>
          r.marque?.toLowerCase().includes(terme) ||
          r.modele?.toLowerCase().includes(terme) ||
          r.reason?.toLowerCase().includes(terme)
      );
    }
    if (clientFiltre) {
      resultats = resultats.filter((r) => r.client_id === clientFiltre);
    }
    return resultats;
  }, [retours, recherche, clientFiltre]);

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Gestion des retours défectueux
      </h1>
      <p className="text-gray-600 mb-6">
        Sélectionnez les articles à retourner aux fournisseurs.
      </p>

      {error && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md shadow-sm"
          role="alert"
        >
          {error}
        </div>
      )}
      {messageSucces && (
        <div
          className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md shadow-sm"
          role="alert"
        >
          {messageSucces}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Envoyer la sélection aux fournisseurs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Numéro de dossier
            </label>
            <input
              type="text"
              value={numeroDossier}
              onChange={(e) => setNumeroDossier(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 ease-in-out"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date d'envoi
            </label>
            <div className="relative mt-1">
              <input
                type="datetime-local"
                value={dateEnvoi}
                onChange={(e) => setDateEnvoi(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 ease-in-out"
              />
            </div>
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              Observation (optionnel)
            </label>
            <input
              type="text"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition duration-150 ease-in-out"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={gererEnvoiFournisseur}
            disabled={selection.size === 0 || isLoading}
            className={`px-8 py-3 rounded-full text-white font-semibold transition-transform transform hover:scale-105 duration-200 shadow-lg ${
              selection.size === 0 || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin inline-block mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg> Envoi en cours...
              </>
            ) : (
              `Envoyer ${selection.size} article(s) au fournisseur`
            )}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Liste des retours en attente
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Rechercher par marque, modèle ou raison..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
          />
          <select
            value={clientFiltre}
            onChange={(e) => setClientFiltre(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-full focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
          >
            <option value="">Filtrer par client...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nom}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <div className="text-center py-12 text-gray-500">
            <svg className="animate-spin mx-auto h-12 w-12 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg">Chargement des retours...</p>
          </div>
        )}

        {!isLoading && retoursFiltres.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Aucun retour en attente trouvé.</p>
          </div>
        )}

        {!isLoading && retoursFiltres.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allIds = new Set(retoursFiltres.map((r) => r.id));
                          setSelection(allIds);
                        } else {
                          setSelection(new Set());
                        }
                      }}
                      checked={
                        selection.size === retoursFiltres.length && retoursFiltres.length > 0
                      }
                      className="rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Marque
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Modèle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stockage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Qté
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Raison du retour
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Heure
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {retoursFiltres.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selection.has(r.id)}
                        onChange={() => basculerSelection(r.id)}
                        className="rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {r.client_nom || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {r.marque}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {r.modele}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {r.stockage || ''}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {r.type}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                      {r.quantite_retournee}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {r.reason || ''}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(r.return_date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatHeure(r.return_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Retours;
