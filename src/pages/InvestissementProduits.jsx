import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

export default function InvestissementProduits() {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
  const url = `${backendUrl}/api/products`;

  useEffect(() => {
    let annule = false;
    async function charger() {
      try {
        setChargement(true);
        const token = localStorage.getItem("token");
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error(`Erreur API produits: ${res.status}`);
        const data = await res.json();
        if (!annule) setProduits(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!annule) setErreur(e.message || "Erreur inconnue");
      } finally {
        if (!annule) setChargement(false);
      }
    }
    charger();
    return () => {
      annule = true;
    };
  }, [url]);

  // Accès sûr aux champs de la table products
  const lirePrixAchat = (p) => Number(p?.prix_achat ?? 0);
  const lireQuantiteStock = (p) => Number(p?.quantite_en_stock ?? 0);
  const lireStatutProduit = (p) => (p?.statut_produit ?? "").toLowerCase();

  // Produits disponibles = statut 'disponible' ET quantité > 0
  const produitsDisponibles = useMemo(
    () => produits.filter((p) => lireStatutProduit(p) === "disponible" && lireQuantiteStock(p) > 0),
    [produits]
  );

  // Nombre de pièces = somme des quantités (pas le nombre de références)
  const nombrePieces = useMemo(
    () => produitsDisponibles.reduce((acc, p) => acc + lireQuantiteStock(p), 0),
    [produitsDisponibles]
  );

  // Montant investi = somme(prix_achat * quantité_en_stock) sur les disponibles
  const montantInvesti = useMemo(
    () =>
      produitsDisponibles.reduce(
        (total, p) => total + lirePrixAchat(p) * lireQuantiteStock(p),
        0
      ),
    [produitsDisponibles]
  );

  const formatCFA = (val) =>
    Number(val).toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + " CFA";

  return (
    <div className="flex justify-center items-center min-h-[60vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 bg-white p-6 sm:p-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          Investissement Produits (disponibles)
        </h1>

        {chargement && (
          <div className="flex flex-col items-center">
            <div className="animate-pulse h-8 w-40 bg-gray-200 rounded mb-4"></div>
            <div className="animate-pulse h-12 w-56 bg-gray-200 rounded"></div>
          </div>
        )}

        {erreur && !chargement && (
          <p className="text-red-600 text-center">{erreur}</p>
        )}

        {!erreur && !chargement && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-sm text-gray-500">Nombre de pièces</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                {nombrePieces}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-sm text-gray-500">Valeur totale investie</p>
              <p className="text-3xl font-extrabold text-blue-600 mt-1">
                {formatCFA(montantInvesti)}
              </p>
            </div>

            <div className="sm:col-span-2 mt-2 text-center text-xs text-gray-400">
              Calcul basé sur les produits au statut <span className="font-semibold">« disponible »</span> et une quantité &gt; 0.
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
