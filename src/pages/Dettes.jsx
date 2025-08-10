import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSpinner, FaPrint } from 'react-icons/fa';

const Dettes = () => {
  const [dettes, setDettes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalDues, setTotalDues] = useState(0); // Nouvel état pour le solde total
  
  const fetchDettes = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/dettes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const dettesWithItems = await Promise.all(response.data.map(async (dette) => {
          const itemsResponse = await axios.get(`http://localhost:3000/api/vente_items/vente/${dette.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          return { ...dette, vente_items: itemsResponse.data };
      }));
      setDettes(dettesWithItems);

    } catch (err) {
      setError('Erreur lors de la récupération des dettes.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDettes();
  }, []);

  // Recalculer le solde total à chaque fois que la liste des dettes change
  useEffect(() => {
    const total = dettes.reduce((acc, dette) => acc + parseFloat(dette.montant_restant || 0), 0);
    setTotalDues(total);
  }, [dettes]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };
  
  const formatPrice = (value) => {
    if (!value) return '';
    return parseFloat(value).toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + " FCFA";
  };
  
  const getArticleDetails = (items) => {
    if (!items || items.length === 0) return 'N/A';
    const item = items[0];
    return `${item.marque} ${item.modele} (${item.stockage}) ${item.type_carton}`;
  };

  const handlePrint = () => {
    const printContents = document.getElementById('print-area').innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    const cleaned = phoneNumber.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
    }
    return phoneNumber;
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Section Dettes</h1>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            {/* <h2 className="text-xl font-semibold">
              LISTE DES DETTES {new Date().toLocaleDateString('fr-FR')}
            </h2> */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-semibold hidden-for-print">
                Total restant à payer : <span className="text-red-500">{formatPrice(totalDues)}</span>
              </span>
              <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center">
                <FaPrint className="mr-2" /> Imprimer la liste
              </button>
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
          ) : dettes.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <p>Aucune dette trouvée.</p>
            </div>
          ) : (
            <div id="print-area" className="overflow-x-auto">
              <div className="hidden-for-print">
                <h1 className="text-2xl font-bold mb-2">LISTE LABAN SERVICE {new Date().toLocaleDateString('fr-FR')}</h1>
                <hr className="my-4"/>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix Unit.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant payé</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reste à payer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de sortie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dettes.map((dette) => (
                    <tr key={dette.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dette.client_nom}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dette.vente_items && dette.vente_items.length > 0 ? (
                          getArticleDetails(dette.vente_items)
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dette.vente_items && dette.vente_items.length > 0 ? (
                          dette.vente_items[0].quantite_vendue
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dette.vente_items && dette.vente_items.length > 0 ? (
                          formatPrice(dette.vente_items[0].prix_unitaire_negocie)
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(dette.montant_paye)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-500">
                        {formatPrice(dette.montant_restant)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(dette.date_vente)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPhoneNumber(dette.client_telephone)}</td>
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

export default Dettes;
