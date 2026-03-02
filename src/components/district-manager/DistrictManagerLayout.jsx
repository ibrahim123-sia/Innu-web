import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LogoutButton from '../common/LogoutButton';
import axios from 'axios';

const DistrictManagerLayout = ({ children }) => {
  const [searchParams] = useSearchParams();
  const user = useSelector(state => state.user.currentUser);
  
  // Get userId from URL if present
  const userId = searchParams.get('userId');
  const isImpersonating = !!userId;
  
  // State for the district manager being viewed
  const [viewingUser, setViewingUser] = useState(null);
  
  // Fetch the district manager's data when userId is present
  useEffect(() => {
    if (userId) {
      fetchDistrictManagerData();
    }
  }, [userId]);

  const fetchDistrictManagerData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/users/getUsers/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const userData = response.data.data || response.data;
      setViewingUser(userData);
    } catch (error) {
      console.error('Error fetching district manager:', error);
    }
  };
  
  const navItems = [
    { name: 'Overview', path: '/district-manager' },
    { name: 'Shops', path: '/district-manager/shops' },
    { name: 'Users', path: '/district-manager/users' },
    { name: 'Analytics', path: '/district-manager/analytics' },
  ];

  // Function to preserve userId in navigation links
  const getNavLink = (path) => {
    return userId ? `${path}?userId=${userId}` : path;
  };

  // Determine which email to show
  const displayEmail = isImpersonating && viewingUser 
    ? viewingUser.email 
    : user?.email;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary-blue text-white p-4 shadow">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold">District Manager Dashboard</h1>
            <p className="text-sm text-primary-blue-100">Manage shops in your district</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-primary-red px-3 py-1 rounded-full text-sm">
              District Manager
            </div>
            <span className="hidden md:inline text-white">{displayEmail}</span>
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
                to={getNavLink(item.path)}
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

export default DistrictManagerLayout;