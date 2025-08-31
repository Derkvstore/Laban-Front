import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaBuilding,
  FaMobileAlt,
  FaChartBar,
  FaFileInvoiceDollar,
  FaShoppingCart,
  FaSignOutAlt,
  FaRegClock,
  FaSyncAlt,
  FaHome,
  FaBars,
  FaTimes,
  FaTags
} from 'react-icons/fa';

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
import Références from './Références';
import InvestissementProduits from './InvestissementProduits';
import RapportJournalier from './RapportJournalier';


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

  // Horloge temps réel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Persistance de la section active
  useEffect(() => {
    localStorage.setItem('activeSection', activeSection);
  }, [activeSection]);

  // Fermeture sidebar au clavier (Échap)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    if (isSidebarOpen) {
      document.addEventListener('keydown', onKeyDown);
    }
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isSidebarOpen]);

  if (!user) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-base sm:text-lg">
        Chargement...
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'accueil':
        return <Accueil user={user} currentTime={currentTime} />;
      case 'clients':
        return <Clients />;
      case 'fournisseurs':
        return <Fournisseurs />;
      case 'investissementProduits':
        return <InvestissementProduits />;
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
         case 'rapportJournalier':
        return <RapportJournalier />;
      case 'references':
        return <Références />;
      default:
        return <Accueil user={user} currentTime={currentTime} />;
    }
  };

  const menuItems = [
    { name: 'Accueil', icon: FaHome, section: 'accueil' },
    { name: 'Clients', icon: FaUsers, section: 'clients' },
    { name: 'Fournisseurs', icon: FaBuilding, section: 'fournisseurs' },
    { name: 'Produits', icon: FaMobileAlt, section: 'produits' },
    { name: 'Références', icon: FaTags, section: 'references' },
    { name: 'Ventes (Détail)', icon: FaShoppingCart, section: 'ventes' },
    { name: 'Sorties', icon: FaSyncAlt, section: 'sorties' },
    { name: 'Factures (Gros)', icon: FaFileInvoiceDollar, section: 'factures' },
    { name: 'Retours Mobiles', icon: FaSyncAlt, section: 'retours' },
    { name: 'Bénéfices', icon: FaChartBar, section: 'benefices' },
    { name: 'Dettes', icon: FaRegClock, section: 'dettes' },
    { name: 'Rapports', icon: FaFileInvoiceDollar, section: 'rapports' },
   { name: 'Rapport Journalier', icon: FaChartBar, section: 'rapportJournalier' },
    { name: 'Investissement Produits', icon: FaFileInvoiceDollar, section: 'investissementProduits' },
  ];

  return (
    <div className="flex min-h-dvh bg-gray-100 font-sans antialiased text-gray-900">
      {/* Bouton menu mobile (toujours accessible en haut) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-xl shadow-lg text-white bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/70 motion-reduce:transition-none transition"
        aria-label={isSidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={isSidebarOpen}
        aria-controls="barre-laterale"
      >
        {isSidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Backdrop mobile pour cliquer hors de la sidebar */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity motion-reduce:transition-none"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (overlay sur mobile, fixe sur desktop) */}
      <aside
        id="barre-laterale"
        className={[
          'fixed md:relative z-50 md:z-0',
          'inset-y-0 left-0',
          'w-72 sm:w-72 md:w-64',
          'bg-gray-900 text-white',
          'flex flex-col shadow-2xl md:shadow-none',
          'transition-transform duration-300 motion-reduce:transition-none',
          'transform md:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:flex'
        ].join(' ')}
      >
        <div className="flex items-center justify-between md:justify-center gap-3 p-5 border-b border-gray-800/60">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Wassolo Service</h1>
          {/* Bouton fermer dans l’entête (mobile) */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
            aria-label="Fermer le menu"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="flex-grow p-3 sm:p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.section;
              return (
                <li key={item.section}>
                  <button
                    onClick={() => {
                      setActiveSection(item.section);
                      setIsSidebarOpen(false);
                    }}
                    className={[
                      'w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-xl text-sm sm:text-base',
                      'transition-colors motion-reduce:transition-none',
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'hover:bg-gray-800/70 text-gray-100'
                    ].join(' ')}
                  >
                    <Icon className="shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 sm:p-4 border-t border-gray-800/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors motion-reduce:transition-none shadow-lg"
          >
            <FaSignOutAlt className="shrink-0" />
            <span className="truncate">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main
        className={[
          'flex-1',
          'p-3 sm:p-5 lg:p-8',
          'md:ml-0',
          'w-full max-w-[1400px] mx-auto'
        ].join(' ')}
      >
        {/* Espace en haut pour éviter que le bouton mobile chevauche le header */}
        <div className="h-12 md:h-0" aria-hidden="true" />

        <header className="sticky top-0 md:static z-10 -mx-3 sm:mx-0 mb-4 sm:mb-8 backdrop-blur supports-[backdrop-filter]:bg-white/50 bg-white md:bg-transparent px-3 sm:px-0 py-2 md:py-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold capitalize leading-tight">
            {activeSection.replace('-', ' ')}
          </h1>
        </header>

        <section className="min-h-[60vh]">
          {renderContent()}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
