import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaPlus, FaSearch, FaToggleOn, FaToggleOff, FaSyncAlt } from "react-icons/fa";

export default function Références() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const [liste, setListe] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [filtreActif, setFiltreActif] = useState("tous"); // 'tous' | 'actifs' | 'inactifs'

  // formulaire création rapide
  const [formRef, setFormRef] = useState({
    marque: "",
    modele: "",
    stockage: "",
    type: "",
    type_carton: "",
    actif: true,
  });

  // suggestions (optionnel, pour confort)
  const [suggestions, setSuggestions] = useState({
    marques: [],
    modeles: [],
    stockages: [],
    types: [],
    type_cartons: [],
  });

  const headersAuth = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const chargerReferences = async () => {
    setChargement(true);
    setErreur("");
    try {
      const { data } = await axios.get(
        `${API_URL}/api/references_produits${recherche ? `?q=${encodeURIComponent(recherche)}` : ""}`,
        { headers: headersAuth() }
      );
      setListe(Array.isArray(data) ? data : []);
    } catch (e) {
      setErreur("Erreur lors du chargement des références.");
      console.error(e);
    } finally {
      setChargement(false);
    }
  };

  const chargerDistincts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/references_produits/distinct`, {
        headers: headersAuth(),
      });
      setSuggestions({
        marques: data?.marques || [],
        modeles: data?.modeles || [],
        stockages: data?.stockages || [],
        types: data?.types || [],
        type_cartons: data?.type_cartons || [],
      });
    } catch (e) {
      // non bloquant
      console.warn("Impossible de charger les listes distinctes", e?.message || e);
    }
  };

  useEffect(() => {
    chargerReferences();
    chargerDistincts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resultatFiltré = useMemo(() => {
    if (filtreActif === "tous") return liste;
    const attendu = filtreActif === "actifs";
    return (liste || []).filter((x) => !!x.actif === attendu);
  }, [liste, filtreActif]);

  const onChangeRef = (e) => {
    const { name, value, type, checked } = e.target;
    setFormRef((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const soumettreReference = async (e) => {
    e.preventDefault();
    setMessage("");
    setErreur("");
    try {
      await axios.post(`${API_URL}/api/references_produits`, formRef, { headers: headersAuth() });
      setMessage("Référence enregistrée !");
      setFormRef({ marque: "", modele: "", stockage: "", type: "", type_carton: "", actif: true });
      await chargerReferences();
      await chargerDistincts();
    } catch (e) {
      setErreur("Erreur lors de l’enregistrement de la référence.");
      console.error(e);
    }
  };

  // bascule actif/inactif sans endpoint supplémentaire :
  // on réutilise le POST (upsert) avec les mêmes champs et actif = !actif
  const basculerActif = async (ref) => {
    setMessage("");
    setErreur("");
    try {
      await axios.post(
        `${API_URL}/api/references_produits`,
        {
          marque: ref.marque,
          modele: ref.modele,
          stockage: ref.stockage,
          type: ref.type,
          type_carton: ref.type_carton,
          actif: !ref.actif,
        },
        { headers: headersAuth() }
      );
      await chargerReferences();
    } catch (e) {
      setErreur("Impossible de changer l’état de la référence.");
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-100 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Références Produits</h2>
        <button
          onClick={() => chargerReferences()}
          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-xl hover:bg-black transition"
          title="Actualiser"
        >
          <FaSyncAlt /> Actualiser
        </button>
      </div>

      {/* Barres d’outils */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="flex items-center bg-white rounded-xl border border-gray-200 px-3 py-2">
          <FaSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Recherche (marque, modèle, …)"
            className="flex-1 outline-none"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && chargerReferences()}
          />
          <button
            className="ml-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={chargerReferences}
          >
            Rechercher
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 px-3 py-2">
          <label className="block text-sm text-gray-500 mb-1">Filtrer</label>
          <select
            value={filtreActif}
            onChange={(e) => setFiltreActif(e.target.value)}
            className="w-full outline-none"
          >
            <option value="tous">Tous</option>
            <option value="actifs">Actifs</option>
            <option value="inactifs">Inactifs</option>
          </select>
        </div>

        <div className="text-sm text-gray-500 flex items-center">
          {chargement ? "Chargement…" : `${resultatFiltré.length} référence(s)`}
        </div>
      </div>

      {/* Messages */}
      {erreur && <div className="mb-4 text-red-600">{erreur}</div>}
      {message && <div className="mb-4 text-green-600">{message}</div>}

      {/* Formulaire d’ajout */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Créer une référence</h3>
        <form onSubmit={soumettreReference} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-500">Marque</label>
            <input
              list="liste_marques"
              name="marque"
              value={formRef.marque}
              onChange={onChangeRef}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <datalist id="liste_marques">
              {suggestions.marques.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-gray-500">Modèle</label>
            <input
              list="liste_modeles"
              name="modele"
              value={formRef.modele}
              onChange={onChangeRef}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <datalist id="liste_modeles">
              {suggestions.modeles.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-sm text-gray-500">Stockage</label>
            <input
              list="liste_stockages"
              name="stockage"
              value={formRef.stockage}
              onChange={onChangeRef}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="liste_stockages">
              {suggestions.stockages.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-sm text-gray-500">Type</label>
            <input
              list="liste_types"
              name="type"
              value={formRef.type}
              onChange={onChangeRef}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="liste_types">
              {suggestions.types.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-sm text-gray-500">Type carton</label>
            <input
              list="liste_type_carton"
              name="type_carton"
              value={formRef.type_carton}
              onChange={onChangeRef}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="liste_type_carton">
              {suggestions.type_cartons.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="actif_ref"
              type="checkbox"
              name="actif"
              checked={formRef.actif}
              onChange={onChangeRef}
            />
            <label htmlFor="actif_ref" className="text-sm text-gray-700">
              Actif
            </label>
          </div>

          <div className="md:col-span-6">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              <FaPlus /> Enregistrer la référence
            </button>
          </div>
        </form>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marque</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modèle</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stockage</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type carton</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actif</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resultatFiltré.map((ref) => (
                <tr key={`${ref.id}-${ref.marque}-${ref.modele}-${ref.stockage || ""}-${ref.type || ""}-${ref.type_carton || ""}`}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{ref.marque}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{ref.modele}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{ref.stockage || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{ref.type || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{ref.type_carton || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    {ref.actif ? (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        <FaToggleOn /> Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <FaToggleOff /> Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    <button
                      onClick={() => basculerActif(ref)}
                      className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 inline-flex items-center gap-2"
                      title={ref.actif ? "Désactiver" : "Activer"}
                    >
                      {ref.actif ? <FaToggleOff /> : <FaToggleOn />} {ref.actif ? "Désactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
              {resultatFiltré.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-gray-400" colSpan={7}>
                    Aucune référence trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
