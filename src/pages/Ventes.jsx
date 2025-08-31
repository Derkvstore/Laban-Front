import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaSpinner, FaShoppingCart, FaMoneyBillWave, FaCheckCircle, FaTimes } from 'react-icons/fa';

const Ventes = () => {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [saleItems, setSaleItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setClients(response.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des clients:', err);
      setError('Erreur lors de la récupération des clients.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setProducts(response.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des produits:', err);
      setError('Erreur lors de la récupération des produits.');
    }
  };

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, []);

  useEffect(() => {
    // Calcul du montant total de la vente
    const newTotalAmount = saleItems.reduce((acc, item) => {
      const price = parseFloat(item.prix_unitaire_negocie.replace(/\s/g, '')) || 0;
      return acc + (price * item.quantite_vendue);
    }, 0);
    setTotalAmount(newTotalAmount);
  }, [saleItems]);

  const handleClientSearch = (e) => {
    setClientSearchTerm(e.target.value);
    setSelectedClient(null);
  };
  
  const handleProductSearch = (e) => {
    const value = e.target.value;
    setProductSearchTerm(value);
    const filtered = products.filter(product => 
      product.marque.toLowerCase().includes(value.toLowerCase()) ||
      product.modele.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleAddItem = (product) => {
    const existingItem = saleItems.find(item => item.product_id === product.id);
    if (existingItem) {
      setError('Ce produit est déjà dans le panier.');
      return;
    }
    
    setSaleItems([...saleItems, {
      product_id: product.id,
      quantite_vendue: 1,
      prix_unitaire_negocie: formatPrice(product.prix_vente_suggere),
      marque: product.marque,
      modele: product.modele,
      stockage: product.stockage,
      type: product.type,
      type_carton: product.type_carton,
    }]);
    setProductSearchTerm('');
    setFilteredProducts([]);
    setSuccess('Produit ajouté au panier.');
    setError('');
  };

  const handleRemoveItem = (productId) => {
    setSaleItems(saleItems.filter(item => item.product_id !== productId));
    setSuccess('Produit retiré du panier.');
  };
  
  const handleItemChange = (e, productId) => {
    const { name, value } = e.target;
    setSaleItems(saleItems.map(item => {
      if (item.product_id === productId) {
        if (name === 'prix_unitaire_negocie') {
          const rawValue = value.replace(/\D/g, '');
          return { ...item, [name]: formatPrice(rawValue) };
        }
        return { ...item, [name]: value };
      }
      return item;
    }));
  };

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    if (!selectedClient) {
      setError('Veuillez sélectionner un client.');
      setIsSubmitting(false);
      return;
    }

    if (saleItems.length === 0) {
      setError('Veuillez ajouter des produits à la vente.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/ventes`, {
        client_id: selectedClient.id,
        vente_items: saleItems.map(item => ({
          ...item,
          prix_unitaire_negocie: parsePrice(item.prix_unitaire_negocie),
        })),
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSuccess('Vente enregistrée avec succès !');
      // Réinitialiser le formulaire
      setSaleItems([]);
      setSelectedClient(null);
      setClientSearchTerm('');
    } catch (err) {
      setError('Erreur lors de l\'enregistrement de la vente.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (value) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const parsePrice = (value) => {
    return parseFloat(value.replace(/\s/g, '')) || 0;
  };

  const closeMessage = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Nouvelle Vente</h1>

        {/* Messages d'interface */}
        {success && (
          <div className="mb-4 p-3 md:p-4 rounded-xl border border-green-200 bg-green-50 text-green-800 flex items-start justify-between">
            <span className="text-sm md:text-base font-medium">{success}</span>
            <button onClick={closeMessage} className="ml-4 p-1 rounded hover:bg-green-100 text-green-700" aria-label="Fermer le message de succès">
              <FaTimes />
            </button>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 md:p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 flex items-start justify-between">
            <span className="text-sm md:text-base font-medium">{error}</span>
            <button onClick={closeMessage} className="ml-4 p-1 rounded hover:bg-red-100 text-red-700" aria-label="Fermer le message d'erreur">
              <FaTimes />
            </button>
          </div>
        )}

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Informations sur la Vente</h2>
          <form onSubmit={handleSubmitSale}>
            {/* Section Client */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">
                Client
              </label>
              {!selectedClient ? (
                <>
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
                    value={clientSearchTerm}
                    onChange={handleClientSearch}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    required
                  />
                  {clientSearchTerm && (
                    <ul className="mt-2 bg-white rounded-lg shadow-md max-h-60 overflow-y-auto">
                      {clients.filter(c => c.nom.toLowerCase().includes(clientSearchTerm.toLowerCase())).map(client => (
                        <li
                          key={client.id}
                          onClick={() => {
                            setSelectedClient(client);
                            setClientSearchTerm(client.nom);
                          }}
                          className="p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                        >
                          {client.nom} ({client.telephone})
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <div className="p-3 bg-blue-100 text-blue-800 rounded-xl flex justify-between items-center">
                  <span>Client sélectionné: <span className="font-semibold">{selectedClient.nom}</span></span>
                  <button type="button" onClick={() => setSelectedClient(null)} className="text-red-600 hover:text-red-800">
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>

            {/* Section Produits */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">
                Ajouter des produits
              </label>
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={productSearchTerm}
                onChange={handleProductSearch}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              />
              {productSearchTerm && filteredProducts.length > 0 && (
                <ul className="mt-2 bg-white rounded-lg shadow-md max-h-60 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <li
                      key={product.id}
                      onClick={() => handleAddItem(product)}
                      className="p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <span>{product.marque} {product.modele} ({product.stockage})</span>
                        <span className="text-gray-500 text-sm">Stock: {product.quantite_en_stock}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Panier de Vente (responsive) */}
            {saleItems.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Panier de Vente</h3>
                {/* Vue tableau pour grands écrans */}
                <div className="hidden md:block overflow-x-auto bg-gray-50 rounded-xl shadow-inner">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-200 text-sm">
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Produit</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Quantité</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Prix Négocié (FCFA)</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Total (FCFA)</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleItems.map(item => (
                        <tr key={item.product_id} className="border-t border-gray-200">
                          <td className="p-4 text-sm font-medium text-gray-900">{item.marque} {item.modele} ({item.stockage})</td>
                          <td className="p-4">
                            <input
                              type="number"
                              name="quantite_vendue"
                              value={item.quantite_vendue}
                              onChange={(e) => handleItemChange(e, item.product_id)}
                              className="w-20 px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="1"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              name="prix_unitaire_negocie"
                              value={item.prix_unitaire_negocie}
                              onChange={(e) => handleItemChange(e, item.product_id)}
                              className="w-32 px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-4 text-sm font-medium">
                            {formatPrice((parsePrice(item.prix_unitaire_negocie) * item.quantite_vendue))} FCFA
                          </td>
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.product_id)}
                              className="text-red-500 hover:text-red-700 transition"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vue liste de cartes pour petits écrans */}
                <div className="md:hidden space-y-4">
                  {saleItems.map(item => (
                    <div key={item.product_id} className="bg-white rounded-xl shadow p-4 border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">{item.marque} {item.modele}</h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.product_id)}
                          className="text-red-500 hover:text-red-700 transition text-lg"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p>
                          <span className="font-medium">Capacité:</span> {item.stockage}
                        </p>
                        <div className="flex items-center space-x-2">
                          <label className="font-medium">Quantité:</label>
                          <input
                            type="number"
                            name="quantite_vendue"
                            value={item.quantite_vendue}
                            onChange={(e) => handleItemChange(e, item.product_id)}
                            className="w-20 px-2 py-1 border rounded-lg"
                            min="1"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="font-medium">Prix Négocié:</label>
                          <input
                            type="text"
                            name="prix_unitaire_negocie"
                            value={item.prix_unitaire_negocie}
                            onChange={(e) => handleItemChange(e, item.product_id)}
                            className="w-32 px-2 py-1 border rounded-lg"
                          />
                          <span className="text-gray-500">FCFA</span>
                        </div>
                        <p className="font-bold text-gray-900 pt-2 border-t border-gray-200">
                          Total: {formatPrice((parsePrice(item.prix_unitaire_negocie) * item.quantite_vendue))} FCFA
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total et soumission */}
            {saleItems.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center p-4 bg-blue-50 text-blue-800 rounded-xl shadow-inner">
                <span className="text-xl font-bold mb-4 sm:mb-0">Montant Total : {formatPrice(totalAmount)} FCFA</span>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : (
                    <FaCheckCircle className="mr-2" />
                  )}
                  Finaliser la Vente
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Ventes;
