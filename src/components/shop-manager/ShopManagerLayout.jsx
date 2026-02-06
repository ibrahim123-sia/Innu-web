import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LogoutButton from '../../components/common/LogoutButton';

const ShopManagerLayout = ({ children }) => {
  const user = useSelector(state => state.user.currentUser);
  const myShop = useSelector(state => state.shop.myShop);
  
  const navItems = [
    { name: 'Overview', path: '/shop-manager' },
    { name: 'Orders', path: '/shop-manager/orders' },
    { name: 'Analytics', path: '/shop-manager/analytics' },
    { name: 'Users', path: '/shop-manager/users' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#002868] text-white p-4 shadow">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold">Shop Manager Dashboard</h1>
            <p className="text-sm text-blue-100">
              {myShop ? `${myShop.name} - ${myShop.city}` : 'Loading shop...'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-[#BF0A30] px-3 py-1 rounded-full text-sm">
              Shop Manager
            </div>
            <span className="hidden md:inline text-white">{user?.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/shop-manager'}
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-[#002868] border-b-2 border-[#002868]'
                      : 'text-gray-500 hover:text-[#BF0A30]'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default ShopManagerLayout;