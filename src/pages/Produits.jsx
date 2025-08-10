import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaCalendarAlt, FaClock } from 'react-icons/fa';

// Listes pour autocomplétion
const MARQUES = ["iPhone", "Samsung", "iPad", "AirPod"];
const MODELES = {
  iPhone: [
    "X", "XR", "XS", "XS MAX", "11 SIMPLE", "11 PRO", "11 PRO MAX",
    "12 SIMPLE", "12 MINI", "12 PRO", "12 PRO MAX",
    "13 SIMPLE", "13 MINI", "13 PRO", "13 PRO MAX",
    "14 SIMPLE", "14 PLUS", "14 PRO", "14 PRO MAX",
    "15 SIMPLE", "15 PLUS", "15 PRO", "15 PRO MAX",
    "16 SIMPLE", "16 PLUS", "16 PRO", "16 PRO MAX",
  ],
  Samsung: ["Galaxy S21", "Galaxy S22", "Galaxy A14", "Galaxy Note 20"],
  iPad: ["Air 10éme Gen", "Air 11éme Gen", "Pro", "Mini"],
  AirPod: ["1ère Gen", "2ème Gen", "3ème Gen", "4ème Gen", "Pro 1ère Gen", "2ème Gen"],
};
const STOCKAGES = ["64 Go", "128 Go", "256 Go", "512 Go", "1 To"];

const Produits = () => {
  const [products, setProducts] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [formData, setFormData] = useState({
    marque: '',
    modele: '',
    stockage: '',
    type: '',
    quantite_en_stock: '',
    prix_achat: '',
    prix_vente_suggere: '',
    fournisseur_id: '',
    type_carton: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);

  const formatPrice = (value) => {
    if (!value) return '';
    return parseFloat(value).toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const parsePrice = (value) => {
    return parseFloat(value.replace(/\s/g, '')) || 0;
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setProducts(response.data);
    } catch (err) {
      setError('Erreur lors de la récupération des produits.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFournisseurs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/fournisseurs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFournisseurs(response.data);
    } catch (err) {
      setError('Erreur lors de la récupération des fournisseurs.');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchFournisseurs();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    const rawValue = value.replace(/\D/g, '');
    const formattedValue = formatPrice(rawValue);
    setFormData({
      ...formData,
      [name]: formattedValue,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsFormLoading(true);
    setError('');
    setSuccess('');

    const url = editingProduct
      ? `http://localhost:3000/api/products/${editingProduct.id}`
      : 'http://localhost:3000/api/products';
    const method = editingProduct ? 'put' : 'post';
    
    const cleanedFormData = {
      ...formData,
      prix_achat: parsePrice(formData.prix_achat),
      prix_vente_suggere: parsePrice(formData.prix_vente_suggere),
    };
    
    if (cleanedFormData.prix_vente_suggere <= cleanedFormData.prix_achat) {
      setError('Le prix de vente doit être supérieur au prix d\'achat.');
      setIsFormLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios({
        method,
        url,
        data: cleanedFormData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchProducts();
      setSuccess(`Produit ${editingProduct ? 'modifié' : 'ajouté'} avec succès !`);
      setFormData({
        marque: '', modele: '', stockage: '', type: '', quantite_en_stock: '',
        prix_achat: '', prix_vente_suggere: '', fournisseur_id: '', type_carton: '',
      });
      setEditingProduct(null);
    } catch (err) {
      setError('Erreur lors de l\'enregistrement du produit.');
      console.error(err);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      marque: product.marque,
      modele: product.modele,
      stockage: product.stockage,
      type: product.type,
      quantite_en_stock: product.quantite_en_stock,
      prix_achat: formatPrice(product.prix_achat),
      prix_vente_suggere: formatPrice(product.prix_vente_suggere),
      fournisseur_id: product.fournisseur_id,
      type_carton: product.type_carton,
    });
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?');
    if (isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3000/api/products/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        fetchProducts();
        setSuccess('Produit supprimé avec succès !');
      } catch (err) {
        setError('Erreur lors de la suppression du produit.');
        console.error(err);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const options = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString('fr-FR', options);
  };

  const getFournisseurName = (id) => {
    const fournisseur = fournisseurs.find(f => f.id === id);
    return fournisseur ? fournisseur.nom : 'N/A';
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Gestion des Produits</h1>

        {/* Formulaire d'ajout/édition */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">{editingProduct ? 'Modifier un produit' : 'Ajouter un nouveau produit'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <input list="marques" type="text" name="marque" placeholder="Marque" value={formData.marque} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200" required />
              <datalist id="marques">
                {MARQUES.map((marque) => <option key={marque} value={marque} />)}
              </datalist>
              <input list="modeles" type="text" name="modele" placeholder="Modèle" value={formData.modele} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200" required />
              <datalist id="modeles">
                {formData.marque && MODELES[formData.marque] && MODELES[formData.marque].map((modele) => <option key={modele} value={modele} />)}
              </datalist>
              <input list="stockages" type="text" name="stockage" placeholder="Stockage" value={formData.stockage} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200" />
              <datalist id="stockages">
                {STOCKAGES.map((stockage) => <option key={stockage} value={stockage} />)}
              </datalist>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200" required>
                <option value="">Sélectionner un type</option>
                <option value="CARTON">CARTON</option>
                <option value="ARRIVAGE">ARRIVAGE</option>
                <option value="ACCESSOIRE">ACCESSOIRE</option>
              </select>
              <input type="number" name="quantite_en_stock" placeholder="Quantité en stock" value={formData.quantite_en_stock} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200" required />
              <input type="text" name="prix_achat" placeholder="Prix d'achat" value={formData.prix_achat} onChange={handlePriceChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200" required />
              <input type="text" name="prix_vente_suggere" placeholder="Prix de vente suggéré" value={formData.prix_vente_suggere} onChange={handlePriceChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200" required />
              <select name="fournisseur_id" value={formData.fournisseur_id} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200">
                <option value="">Sélectionner un fournisseur</option>
                {fournisseurs.map(f => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition duration-200 flex items-center justify-center"
              disabled={isFormLoading}
            >
              {isFormLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaPlus className="mr-2" />}
              {editingProduct ? 'Modifier le produit' : 'Ajouter le produit'}
            </button>
            {editingProduct && (
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setFormData({
                    marque: '', modele: '', stockage: '', type: '', quantite_en_stock: '',
                    prix_achat: '', prix_vente_suggere: '', fournisseur_id: '', type_carton: '',
                  });
                }}
                className="ml-4 px-6 py-3 bg-gray-400 text-white font-semibold rounded-xl hover:bg-gray-500 transition duration-200"
              >
                Annuler
              </button>
            )}
          </form>
        </div>

        {/* Tableau d'affichage des produits */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Liste des Produits</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modèle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stockage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix Achat 
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix Vente Suggéré 
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fournisseur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.marque}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.modele}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stockage}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.quantite_en_stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(product.prix_achat)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(product.prix_vente_suggere)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getFournisseurName(product.fournisseur_id)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-medium">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="ml-2 text-red-600 hover:text-red-900 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Produits;
