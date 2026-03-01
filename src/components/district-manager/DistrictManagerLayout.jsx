import React, { useEffect } from 'react';
import { Outlet, NavLink, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import LogoutButton from '../common/LogoutButton';
import { fetchUserById } from '../../redux/slice/userSlice'; // You'll need this action

const DistrictManagerLayout = ({ children }) => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  const impersonatedUser = useSelector(state => state.user.impersonatedUser);
  
  const userId = searchParams.get('userId');
  const mode = searchParams.get('mode');
  const isImpersonating = mode === 'impersonate' && userId;
  
  // Fetch impersonated user data if in impersonation mode
  useEffect(() => {
    if (isImpersonating && userId) {
      dispatch(fetchUserById(userId));
    }
  }, [isImpersonating, userId, dispatch]);
  
  // Determine which user to display
  const displayUser = isImpersonating ? impersonatedUser : user;
  const displayName = displayUser ? `${displayUser.first_name} ${displayUser.last_name}` : 'District Manager';
  const displayEmail = displayUser?.email || user?.email;
  
  const navItems = [
    { name: 'Overview', path: '/district-manager' },
    { name: 'Shops', path: '/district-manager/shops' },
    { name: 'Users', path: '/district-manager/users' },
    { name: 'Analytics', path: '/district-manager/analytics' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-yellow-100 border-b-2 border-yellow-500 text-yellow-800 px-4 py-2">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">
                You are viewing {displayName}'s dashboard (Impersonation Mode)
              </span>
            </div>
            <a 
              href="/brand-admin" 
              className="bg-yellow-200 hover:bg-yellow-300 px-3 py-1 rounded text-sm font-medium"
            >
              Return to Brand Admin
            </a>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-primary-blue text-white p-4 shadow">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold">
              {isImpersonating ? `${displayName}'s Dashboard` : 'District Manager Dashboard'}
            </h1>
            <p className="text-sm text-primary-blue-100">
              {isImpersonating ? `District: ${displayUser?.district_name || 'Unknown'}` : 'Manage shops in your district'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm ${isImpersonating ? 'bg-yellow-500' : 'bg-primary-red'}`}>
              {isImpersonating ? 'Impersonating' : 'District Manager'}
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
                to={isImpersonating ? `${item.path}?userId=${userId}&mode=impersonate` : item.path}
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