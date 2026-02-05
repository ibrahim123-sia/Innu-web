import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { useSelector } from 'react-redux';
import store from './redux/store';
import { selectIsAuthenticated, selectCurrentUser } from './redux/slice/userSlice';

// Import pages
import Login from './pages/auth/Login';

// Import new Super Admin pages and layout
import SuperAdminLayout from './components/super-admin/SuperAdminLayout';
import Overview from './pages/super-admin/Overview';
import Brands from './pages/super-admin/Brands';
import Analytics from './pages/super-admin/Analytics';

// Import other role dashboards (keep existing)
import BrandAdminDashboard from './pages/brand-admin/Dashboard';
import DistrictManagerDashboard from './pages/district-manager/Dashboard';
import ShopManagerDashboard from './pages/shop-manager/Dashboard';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Role-Specific Route Wrapper
const RoleRoute = ({ role, children }) => {
  const user = useSelector(selectCurrentUser);
  
  if (!user) return <Navigate to="/login" />;
  if (user.role !== role) return <Navigate to="/login" />;
  
  return children;
};

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* New Super Admin Routes */}
        <Route path="/super-admin" element={
          <ProtectedRoute>
            <RoleRoute role="super_admin">
              <SuperAdminLayout>
                <Overview />
              </SuperAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/super-admin/brands" element={
          <ProtectedRoute>
            <RoleRoute role="super_admin">
              <SuperAdminLayout>
                <Brands />
              </SuperAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/super-admin/analytics" element={
          <ProtectedRoute>
            <RoleRoute role="super_admin">
              <SuperAdminLayout>
                <Analytics />
              </SuperAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        {/* Other Dashboard Routes (keep existing) */}
        <Route path="/brand-admin/dashboard" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminDashboard />
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/district-manager/dashboard" element={
          <ProtectedRoute>
            <RoleRoute role="district_manager">
              <DistrictManagerDashboard />
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/shop-manager/dashboard" element={
          <ProtectedRoute>
            <RoleRoute role="shop_manager">
              <ShopManagerDashboard />
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        {/* Default Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;