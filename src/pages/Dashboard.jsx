import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaBuilding, FaMobileAlt, FaChartBar, FaFileInvoiceDollar, FaShoppingCart, FaSignOutAlt, FaRegClock, FaSyncAlt, FaHome, FaBars, FaTimes } from 'react-icons/fa';

// Importe les composants de chaque section
import Accueil from './Accueil';
import Clients from './Clients';
import Fournisseurs from './Fournisseurs';
import Produits from './Produits';
import Ventes from './Ventes';
import Sorties from './Sorties';
import Factures from './Factures';
import Retours from './Retours';
import Benefices from './Benefices';
import Dettes from './Dettes';
import Rapports from './Rapports';
import InvestissementProduits from './InvestissementProduits';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [activeSection, setActiveSection] = useState(localStorage.getItem('activeSection') || 'accueil');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    localStorage.removeItem('activeSection');
    navigate('/login');
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    localStorage.setItem('activeSection', activeSection);
  }, [activeSection]);

  if (!user) {
    return <div>Chargement...</div>;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'accueil':
        return <Accueil user={user} currentTime={currentTime} />;
      case 'clients':
        return <Clients />;
      case 'fournisseurs':
        return <Fournisseurs />;
      case 'produits':
        return <Produits />;
      case 'ventes':
        return <Ventes />;
      case 'sorties':
        return <Sorties />;
      case 'factures':
        return <Factures />;
      case 'retours':
        return <Retours />;
      case 'benefices':
        return <Benefices />;
      case 'dettes':
        return <Dettes />;
      case 'rapports':
        return <Rapports />;
      case 'investissement':
        return <InvestissementProduits />;
      default:
        return <Accueil user={user} currentTime={currentTime} />;
    }
  };

  const menuItems = [
    { name: 'Accueil', icon: FaHome, section: 'accueil' },
    { name: 'Clients', icon: FaUsers, section: 'clients' },
    { name: 'Fournisseurs', icon: FaBuilding, section: 'fournisseurs' },
    { name: 'Produits', icon: FaMobileAlt, section: 'produits' },
    { name: 'Ventes (Détail)', icon: FaShoppingCart, section: 'ventes' },
    { name: 'Sorties', icon: FaSyncAlt, section: 'sorties' },
    { name: 'Factures (Gros)', icon: FaFileInvoiceDollar, section: 'factures' },
    { name: 'Retours Mobiles', icon: FaSyncAlt, section: 'retours' },
    { name: 'Bénéfices', icon: FaChartBar, section: 'benefices' },
    { name: 'Dettes', icon: FaRegClock, section: 'dettes' },
    { name: 'Rapports', icon: FaFileInvoiceDollar, section: 'rapports' },
    { name: 'Investissement Produits', icon: FaChartBar, section: 'investissement' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans antialiased text-gray-900">
      {/* Bouton pour ouvrir/fermer le menu sur mobile */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 text-white bg-gray-900 rounded-xl shadow-lg"
        aria-label={isSidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={isSidebarOpen}
        aria-controls="barre-laterale"
      >
        {isSidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] md:hidden z-30"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Barre latérale */}
      <aside
        id="barre-laterale"
        className={[
          'fixed inset-y-0 left-0 w-64 bg-gray-900 text-white shadow-2xl z-40',
          'transition-transform duration-300 transform',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:translate-x-0 md:flex md:flex-col'
        ].join(' ')}
      >
        <div className="flex items-center justify-center p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold">Wassolo Service</h1>
        </div>
        <nav className="flex-grow p-4 overflow-y-auto">
          <ul>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.section} className="mb-2">
                  <button
                    onClick={() => {
                      setActiveSection(item.section);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-2 rounded-xl transition duration-200 ${activeSection === item.section ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700'}`}
                  >
                    <Icon className="mr-3" />
                    <span>{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200 shadow-lg"
          >
            <FaSignOutAlt className="mr-2" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 w-full min-w-0 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <header className="mb-4 sm:mb-6 md:mb-8 mt-12 md:mt-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold capitalize">
            {activeSection.replace('-', ' ')}
          </h1>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
