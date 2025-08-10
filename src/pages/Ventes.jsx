import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaSpinner, FaShoppingCart, FaMoneyBillWave, FaCheckCircle } from 'react-icons/fa';

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
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/clients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setClients(response.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des clients:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setProducts(response.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des produits:', err);
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
      alert('Ce produit est déjà dans le panier.');
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
  };

  const handleRemoveItem = (productId) => {
    setSaleItems(saleItems.filter(item => item.product_id !== productId));
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
      await axios.post('http://localhost:3000/api/ventes', {
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
      alert('Vente enregistrée avec succès !');
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
    return parseFloat(value).toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const parsePrice = (value) => {
    return parseFloat(value.replace(/\s/g, '')) || 0;
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Nouvelle Vente</h1>

        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Informations sur la Vente</h2>
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
                    <FaTrash />
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
                      {product.marque} {product.modele} ({product.stockage}) - Stock: {product.quantite_en_stock}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Tableau des articles de la vente */}
            {saleItems.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Panier de Vente</h3>
                <div className="overflow-x-auto bg-gray-50 rounded-xl">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Produit</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quantité</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Prix Négocié (FCFA)</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total (FCFA)</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Actions</th>
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
                              className="w-20 px-2 py-1 border rounded"
                              min="1"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              name="prix_unitaire_negocie"
                              value={item.prix_unitaire_negocie}
                              onChange={(e) => handleItemChange(e, item.product_id)}
                              className="w-32 px-2 py-1 border rounded"
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
              </div>
            )}

            {/* Total et soumission */}
            {saleItems.length > 0 && (
              <div className="mt-6 flex justify-between items-center p-4 bg-blue-50 text-blue-800 rounded-xl shadow-inner">
                <span className="text-xl font-bold">Montant Total : {formatPrice(totalAmount)} FCFA</span>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition duration-200 flex items-center"
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
            {error && <div className="mt-4 text-red-500 text-center">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Ventes;
