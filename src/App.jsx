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
import BrandAdminUsers from './pages/brand-admin/Users';
import BrandAdminAnalytics from './pages/brand-admin/Analytics';
import BrandAdminOrders from './pages/brand-admin/Orders';

// Import District Manager pages and layout
import DistrictManagerLayout from './components/district-manager/DistrictManagerLayout';
import DistrictManagerOverview from './pages/district-manager/Overview';
import DistrictManagerShops from './pages/district-manager/Shops';
import DistrictManagerUsers from './pages/district-manager/Users'; // Import Users page for District Manager
import DistrictManagerAnalytics from './pages/district-manager/Analytics';

// Import Shop Manager components
import ShopManagerLayout from './components/shop-manager/ShopManagerLayout';
import ShopManagerOverview from './pages/shop-manager/Overview';
import ShopManagerOrders from './pages/shop-manager/Orders';
import ShopManagerAnalytics from './pages/shop-manager/Analytics';
import ShopManagerUsers from './pages/shop-manager/Users';

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
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Super Admin Routes */}
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
        
        {/* Brand Admin Routes */}
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
        
        <Route path="/brand-admin/users" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminLayout>
                <BrandAdminUsers />
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
        
        <Route path="/brand-admin/orders" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminLayout>
                <BrandAdminOrders />
              </BrandAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        {/* District Manager Routes */}
        <Route path="/district-manager" element={
          <ProtectedRoute>
            <RoleRoute role="district_manager">
              <DistrictManagerLayout>
                <DistrictManagerOverview />
              </DistrictManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/district-manager/shops" element={
          <ProtectedRoute>
            <RoleRoute role="district_manager">
              <DistrictManagerLayout>
                <DistrictManagerShops />
              </DistrictManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        {/* NEW: District Manager Users Route */}
        <Route path="/district-manager/users" element={
          <ProtectedRoute>
            <RoleRoute role="district_manager">
              <DistrictManagerLayout>
                <DistrictManagerUsers />
              </DistrictManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/district-manager/analytics" element={
          <ProtectedRoute>
            <RoleRoute role="district_manager">
              <DistrictManagerLayout>
                <DistrictManagerAnalytics />
              </DistrictManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        {/* Shop Manager Routes */}
        <Route path="/shop-manager" element={
          <ProtectedRoute>
            <RoleRoute role="shop_manager">
              <ShopManagerLayout>
                <ShopManagerOverview />
              </ShopManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/shop-manager/orders" element={
          <ProtectedRoute>
            <RoleRoute role="shop_manager">
              <ShopManagerLayout>
                <ShopManagerOrders />
              </ShopManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/shop-manager/analytics" element={
          <ProtectedRoute>
            <RoleRoute role="shop_manager">
              <ShopManagerLayout>
                <ShopManagerAnalytics />
              </ShopManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/shop-manager/users" element={
          <ProtectedRoute>
            <RoleRoute role="shop_manager">
              <ShopManagerLayout>
                <ShopManagerUsers />
              </ShopManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        {/* Default Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Redirect based on role after login */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <RoleRedirect />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

// Component to redirect users based on their role after login
function RoleRedirect() {
  const user = useSelector(selectCurrentUser);
  
  if (!user) return <Navigate to="/login" />;
  
  switch (user.role) {
    case 'super_admin':
      return <Navigate to="/super-admin" />;
    case 'brand_admin':
      return <Navigate to="/brand-admin" />;
    case 'district_manager':
      return <Navigate to="/district-manager" />;
    case 'shop_manager':
      return <Navigate to="/shop-manager" />;
    default:
      return <Navigate to="/login" />;
  }
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;