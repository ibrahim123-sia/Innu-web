import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { useSelector } from 'react-redux';
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
import BrandAdminOrders from './pages/brand-admin/Orders'; // ✅ NEW: Import Orders page

// Import other role dashboards
import DistrictManagerDashboard from './pages/district-manager/Dashboard';
import ShopManagerDashboard from './pages/shop-manager/Dashboard';

// Protected Route Wrapper - EXACT SAME LOGIC
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Role-Specific Route Wrapper - EXACT SAME LOGIC
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
        {/* Public Routes - EXACT SAME LOGIC */}
        <Route path="/login" element={<Login />} />
        
        {/* Super Admin Routes - EXACT SAME LOGIC */}
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
        
        {/* Brand Admin Routes - SAME LOGIC, DIFFERENT PATHS */}
        <Route path="/brand-admin" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminLayout>
                <BrandAdminOverview />
              </BrandAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/brand-admin/shops" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminLayout>
                <BrandAdminShops />
              </BrandAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/brand-admin/districts" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminLayout>
                <BrandAdminDistricts />
              </BrandAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/brand-admin/analytics" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminLayout>
                <BrandAdminAnalytics />
              </BrandAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        {/* ✅ NEW: Brand Admin Orders Route */}
        <Route path="/brand-admin/orders" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminLayout>
                <BrandAdminOrders />
              </BrandAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        {/* Other Dashboard Routes - SAME LOGIC */}
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
        
        {/* Default Routes - EXACT SAME LOGIC */}
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