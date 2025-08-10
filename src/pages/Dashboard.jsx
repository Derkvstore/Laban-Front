import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { FaUsers, FaBuilding, FaMobileAlt, FaChartBar, FaFileInvoiceDollar, FaShoppingCart, FaSignOutAlt, FaRegClock, FaSyncAlt, FaHome } from 'react-icons/fa';



// Importe les composants de chaque section

import Accueil from './Accueil';

import Clients from './Clients';

import Fournisseurs from './Fournisseurs';

import Produits from './Produits';

import Ventes from './Ventes';

import Sorties from './Sorties'; // Importe le nouveau composant Sorties

import Factures from './Factures';

import Retours from './Retours';

import Benefices from './Benefices';

import Dettes from './Dettes';

import Rapports from './Rapports';



const Dashboard = () => {

const navigate = useNavigate();

const user = JSON.parse(localStorage.getItem('user'));

const [activeSection, setActiveSection] = useState(localStorage.getItem('activeSection') || 'accueil');

const [currentTime, setCurrentTime] = useState(new Date());



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



// Fonction pour rendre le contenu de chaque section

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

return <Sorties />; // Affiche le composant Sorties

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

default:

return <Accueil user={user} currentTime={currentTime} />;

}

};



return (

<div className="flex h-screen bg-gray-100 font-sans antialiased text-gray-900">

{/* Barre latérale (Sidebar) */}

<aside className="w-64 bg-gray-900 text-white flex flex-col shadow-2xl">

<div className="flex items-center justify-center p-6 border-b border-gray-700">

<h1 className="text-2xl font-bold">Wassolo Service</h1>

</div>

<nav className="flex-grow p-4">

<ul>

<li className="mb-2">

<button

onClick={() => setActiveSection('accueil')}

className={`w-full flex items-center px-4 py-2 rounded-xl transition duration-200 ${activeSection === 'accueil' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700'}`}

>

<FaHome className="mr-3" />

<span>Accueil</span>

</button>

</li>

<li className="mb-2">

<button

onClick={() => setActiveSection('clients')}

className={`w-full flex items-center px-4 py-2 rounded-xl transition duration-200 ${activeSection === 'clients' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700'}`}

>

<FaUsers className="mr-3" />

<span>Clients</span>

</button>

</li>

<li className="mb-2">

<button

onClick={() => setActiveSection('fournisseurs')}

className={`w-full flex items-center px-4 py-2 rounded-xl transition duration-200 ${activeSection === 'fournisseurs' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700'}`}

>

<FaBuilding className="mr-3" />

<span>Fournisseurs</span>

</button>

</li>

<li className="mb-2">

<button

onClick={() => setActiveSection('produits')}

className={`w-full flex items-center px-4 py-2 rounded-xl transition duration-200 ${activeSection === 'produits' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700'}`}

>

<FaMobileAlt className="mr-3" />

<span>Produits</span>

</button>

</li>

<li className="mb-2">

<button

onClick={() => setActiveSection('ventes')}

className={`w-full flex items-center px-4 py-2 rounded-xl transition duration-200 ${activeSection === 'ventes' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700'}`}

>

<FaShoppingCart className="mr-3" />

<span>Ventes (Détail)</span>

</button>

</li>

<li className="mb-2">

<button

onClick={() => setActiveSection('sorties')}

className={`w-full flex items-center px-4 py-2 rounded-xl transition duration-200 ${activeSection === 'sorties' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700'}`}

>

<FaSyncAlt className="mr-3" />

<span>Sorties</span>

</button>

</li>

<li className="mb-2">

<button

onClick={() => setActiveSection('factures')}

className={`w-full flex items-center px-4 py-2 rounded-xl transition duration-200 ${activeSection === 'factures' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700'}`}

>

<FaFileInvoiceDollar className="mr-3" />

<span>Factures (Gros)</span>

</button>

</li>

<li className="mb-2">

<button

onClick={() => setActiveSection('retours')}

className={`w-full flex items-center px-4 py-2 rounded-xl transition duration-200 ${activeSection === 'retours' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700'}`}

>

<FaSyncAlt className="mr-3" />

<span>Retours Mobiles</span>

</button>

</li>

<li className="mb-2">

<button

onClick={() => setActiveSection('benefices')}

className={`w-full flex items-center px-4 py-2 rounded-xl transition duration-200 ${activeSection === 'benefices' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700'}`}

>

<FaChartBar className="mr-3" />

<span>Bénéfices</span>

</button>

</li>

<li className="mb-2">

<button

onClick={() => setActiveSection('dettes')}

className={`w-full flex items-center px-4 py-2 rounded-xl transition duration-200 ${activeSection === 'dettes' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700'}`}

>

<FaRegClock className="mr-3" />

<span>Dettes</span>

</button>

</li>

<li className="mb-2">

<button

onClick={() => setActiveSection('rapports')}

className={`w-full flex items-center px-4 py-2 rounded-xl transition duration-200 ${activeSection === 'rapports' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-700'}`}

>

<FaFileInvoiceDollar className="mr-3" />

<span>Rapports</span>

</button>

</li>

</ul>

</nav>

<div className="p-4 border-t border-gray-700">

<button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200 shadow-lg">

<FaSignOutAlt className="mr-2" />

<span>Déconnexion</span>

</button>

</div>

</aside>



{/* Contenu principal */}

<main className="flex-1 p-8 overflow-y-auto">

<header className="mb-8">

<h1 className="text-4xl font-bold capitalize">{activeSection.replace('-', ' ')}</h1>

</header>

{renderContent()}

</main>

</div>

);

};



export default Dashboard;