// components/district-manager/DistrictManagerLayout.js
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LogoutButton from '../common/LogoutButton';

const DistrictManagerLayout = ({ children, userId }) => {
  const user = useSelector(state => state.user.currentUser);
  
  console.log("DistrictManagerLayout - userId from props:", userId); // Debug log
  
  const navItems = [
    { name: 'Overview', path: '/district-manager' },
    { name: 'Shops', path: '/district-manager/shops' },
    { name: 'Users', path: '/district-manager/users' },
    { name: 'Analytics', path: '/district-manager/analytics' },
  ];

  // Create NavLink with userId parameter
  const createNavLink = (item) => {
    const path = userId ? `${item.path}?userId=${userId}` : item.path;
    
    return (
      <NavLink
        key={item.path}
        to={path}
        end={item.path === '/district-manager'}
        className={({ isActive }) =>
          `px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
            isActive
              ? 'text-primary-blue border-b-2 border-primary-blue'
              : 'text-gray-500 hover:text-primary-red'
          }`
        }
      >
        {item.name}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary-blue text-white p-4 shadow">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold">District Manager Dashboard</h1>
            <p className="text-sm text-primary-blue-100">Manage shops in your district</p>
            {userId && (
              <p className="text-xs text-primary-blue-100 mt-1">
                Viewing as District Manager ID: {userId}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-primary-red px-3 py-1 rounded-full text-sm">
              {user?.role === 'brand_admin' ? 'Brand Admin (Viewing District)' : 'District Manager'}
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
            {navItems.map((item) => createNavLink(item))}
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6">
        {/* Pass userId to children via React.cloneElement or context */}
        {children && React.isValidElement(children) 
          ? React.cloneElement(children, { userId }) 
          : <Outlet context={{ userId }} />}
      </main>
    </div>
  );
};

export default DistrictManagerLayout;