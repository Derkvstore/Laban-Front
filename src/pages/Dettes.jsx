import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaSpinner, FaPrint } from 'react-icons/fa';

const Dettes = () => {
  const [dettes, setDettes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalDues, setTotalDues] = useState(0); 

  const tableRef = useRef(null);
  
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchDettes = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/dettes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const dettesWithItems = await Promise.all(response.data.map(async (dette) => {
          const itemsResponse = await axios.get(`${API_URL}/api/vente_items/vente/${dette.id}`, {
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
    if (value === null || value === undefined) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };
  
  const getArticleDetails = (items) => {
    if (!items || items.length === 0) return 'N/A';
    const item = items[0];
    return `${item.marque} ${item.modele} (${item.stockage}) ${item.type_carton}`;
  };

  const handlePrint = () => {
    if (!tableRef.current) {
      window.print();
      return;
    }
    const content = tableRef.current.innerHTML;
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) { window.print(); return; }
    w.document.open();
    w.document.write(`
      <html>
        <head>
          <title>Liste des Dettes</title>
          <style>
            * { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
            h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
            .print-header { text-align: center; margin-bottom: 2rem; }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
            th { background-color: #f3f4f6; }
            .right { text-align: right; }
            @page { margin: 14mm; }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>LISTE LABAN SERVICE</h1>
            <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          <div>${content}</div>
          <script>
            window.onload = function(){ window.print(); window.onafterprint = () => window.close(); };
          </script>
        </body>
      </html>
    `);
    w.document.close();
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
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Section Dettes</h1>
        
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-xl font-semibold mb-2 sm:mb-0 text-gray-800">
              Liste des dettes
            </h2>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-start sm:items-center">
              <span className="text-sm font-semibold">
                Total restant à payer : <span className="text-red-500">{formatPrice(totalDues)} FCFA</span>
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
            <div id="print-area" className="overflow-x-auto rounded-xl border border-gray-100">
              <div ref={tableRef}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix Unit.</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant payé</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reste à payer</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de sortie</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dettes.map((dette) => (
                      <tr key={dette.id}>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dette.client_nom}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dette.vente_items && dette.vente_items.length > 0 ? (
                            getArticleDetails(dette.vente_items)
                          ) : 'N/A'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dette.vente_items && dette.vente_items.length > 0 ? (
                            dette.vente_items[0].quantite_vendue
                          ) : 'N/A'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dette.vente_items && dette.vente_items.length > 0 ? (
                            formatPrice(dette.vente_items[0].prix_unitaire_negocie)
                          ) : 'N/A'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(dette.montant_paye)}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-500">
                          {formatPrice(dette.montant_restant)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(dette.date_vente)}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPhoneNumber(dette.client_telephone)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dettes;
