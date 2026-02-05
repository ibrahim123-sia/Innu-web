import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import store from './redux/store';
import { selectIsAuthenticated, selectCurrentUser } from './redux/slice/userSlice';

// Import pages
import Login from './pages/auth/Login';

// Import Super Admin pages and layout
import SuperAdminLayout from './components/super-admin/SuperAdminLayout';
import Overview from './pages/super-admin/Overview';
import Brands from './pages/super-admin/Brands';
import Analytics from './pages/super-admin/Analytics';

// Import Brand Admin pages and layout
import BrandAdminLayout from './components/brand-admin/BrandAdminLayout';
import BrandAdminOverview from './pages/brand-admin/Overview';
import BrandAdminShops from './pages/brand-admin/Shops';
import BrandAdminDistricts from './pages/brand-admin/Districts';
import BrandAdminAnalytics from './pages/brand-admin/Analytics';

// Import other role dashboards (keep existing)
import DistrictManagerDashboard from './pages/district-manager/Dashboard';
import ShopManagerDashboard from './pages/shop-manager/Dashboard';

// Main App Component
function App() {
  // Protected Route Wrapper Component - defined INSIDE App component
  const ProtectedRoute = ({ children, requiredRole }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const user = useSelector(selectCurrentUser);
    
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    // Check role if required
    if (requiredRole && user?.role !== requiredRole) {
      return <Navigate to="/login" />;
    }
    
    return children;
  };

  // Component to handle default routing based on authentication
  const DefaultRoute = () => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const user = useSelector(selectCurrentUser);
    
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    // Redirect based on role
    switch(user?.role) {
      case 'super_admin':
        return <Navigate to="/super-admin" />;
      case 'brand_admin':
        return <Navigate to="/brand-admin" />;
      case 'district_manager':
        return <Navigate to="/district-manager/dashboard" />;
      case 'shop_manager':
        return <Navigate to="/shop-manager/dashboard" />;
      default:
        return <Navigate to="/login" />;
    }
  };

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Super Admin Routes */}
          <Route path="/super-admin" element={
            <ProtectedRoute requiredRole="super_admin">
              <SuperAdminLayout>
                <Overview />
              </SuperAdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/super-admin/brands" element={
            <ProtectedRoute requiredRole="super_admin">
              <SuperAdminLayout>
                <Brands />
              </SuperAdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/super-admin/analytics" element={
            <ProtectedRoute requiredRole="super_admin">
              <SuperAdminLayout>
                <Analytics />
              </SuperAdminLayout>
            </ProtectedRoute>
          } />
          
          {/* Brand Admin Routes */}
          <Route path="/brand-admin" element={
            <ProtectedRoute requiredRole="brand_admin">
              <BrandAdminLayout>
                <BrandAdminOverview />
              </BrandAdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/brand-admin/shops" element={
            <ProtectedRoute requiredRole="brand_admin">
              <BrandAdminLayout>
                <BrandAdminShops />
              </BrandAdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/brand-admin/districts" element={
            <ProtectedRoute requiredRole="brand_admin">
              <BrandAdminLayout>
                <BrandAdminDistricts />
              </BrandAdminLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/brand-admin/analytics" element={
            <ProtectedRoute requiredRole="brand_admin">
              <BrandAdminLayout>
                <BrandAdminAnalytics />
              </BrandAdminLayout>
            </ProtectedRoute>
          } />
          
          {/* Other Dashboard Routes */}
          <Route path="/district-manager/dashboard" element={
            <ProtectedRoute requiredRole="district_manager">
              <DistrictManagerDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/shop-manager/dashboard" element={
            <ProtectedRoute requiredRole="shop_manager">
              <ShopManagerDashboard />
            </ProtectedRoute>
          } />
          
          {/* Default Routes */}
          <Route path="/" element={<DefaultRoute />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;