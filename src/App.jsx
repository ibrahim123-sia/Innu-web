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
import DistrictManagerUsers from './pages/district-manager/Users';
import DistrictManagerAnalytics from './pages/district-manager/Analytics';

// Import Shop Manager pages and layout
import ShopManagerLayout from './components/shop-manager/ShopManagerLayout';
import ShopManagerOverview from './pages/shop-manager/Overview';
import ShopManagerOrders from './pages/shop-manager/Orders';
import ShopManagerAnalytics from './pages/shop-manager/Analytics';
import ShopManagerUsers from './pages/shop-manager/Users';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Role-Specific Route Wrapper
const RoleRoute = ({ role, children }) => {
  const user = useSelector(selectCurrentUser);
  
  if (!user) return <Navigate to="/login" />;
  
  const allowedRoles = Array.isArray(role) ? role : [role];
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />;
  }
  
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
        
        {/* Brand Admin Main Routes */}
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
        
        {/* Brand Admin District Detail Routes - Using reused components with BrandAdminLayout */}
        <Route path="/brand-admin/districts/:districtId" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminLayout>
                <DistrictManagerOverview />
              </BrandAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/brand-admin/districts/:districtId/shops" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminLayout>
                <DistrictManagerShops />
              </BrandAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/brand-admin/districts/:districtId/users" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminLayout>
                <DistrictManagerUsers />
              </BrandAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/brand-admin/districts/:districtId/analytics" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminLayout>
                <DistrictManagerAnalytics />
              </BrandAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        {/* Brand Admin Shop Detail Routes - Using reused components with BrandAdminLayout */}
        <Route path="/brand-admin/shops/:shopId" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminLayout>
                <ShopManagerOverview />
              </BrandAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/brand-admin/shops/:shopId/orders" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminLayout>
                <ShopManagerOrders />
              </BrandAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/brand-admin/shops/:shopId/analytics" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminLayout>
                <ShopManagerAnalytics />
              </BrandAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/brand-admin/shops/:shopId/users" element={
          <ProtectedRoute>
            <RoleRoute role="brand_admin">
              <BrandAdminLayout>
                <ShopManagerUsers />
              </BrandAdminLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        {/* District Manager Routes - Using DistrictManagerLayout */}
        <Route path="/district-manager" element={
          <ProtectedRoute>
            <RoleRoute role={['district_manager', 'brand_admin']}>
              <DistrictManagerLayout>
                <DistrictManagerOverview />
              </DistrictManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/district-manager/shops" element={
          <ProtectedRoute>
            <RoleRoute role={['district_manager', 'brand_admin']}>
              <DistrictManagerLayout>
                <DistrictManagerShops />
              </DistrictManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/district-manager/users" element={
          <ProtectedRoute>
            <RoleRoute role={['district_manager', 'brand_admin']}>
              <DistrictManagerLayout>
                <DistrictManagerUsers />
              </DistrictManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/district-manager/analytics" element={
          <ProtectedRoute>
            <RoleRoute role={['district_manager', 'brand_admin']}>
              <DistrictManagerLayout>
                <DistrictManagerAnalytics />
              </DistrictManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        {/* Shop Manager Routes - Using ShopManagerLayout */}
        <Route path="/shop-manager" element={
          <ProtectedRoute>
            <RoleRoute role={['shop_manager', 'district_manager', 'brand_admin']}>
              <ShopManagerLayout>
                <ShopManagerOverview />
              </ShopManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/shop-manager/orders" element={
          <ProtectedRoute>
            <RoleRoute role={['shop_manager', 'district_manager', 'brand_admin']}>
              <ShopManagerLayout>
                <ShopManagerOrders />
              </ShopManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/shop-manager/analytics" element={
          <ProtectedRoute>
            <RoleRoute role={['shop_manager', 'district_manager','brand_admin']}>
              <ShopManagerLayout>
                <ShopManagerAnalytics />
              </ShopManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/shop-manager/users" element={
          <ProtectedRoute>
            <RoleRoute role={['shop_manager', 'district_manager','brand_admin']}>
              <ShopManagerLayout>
                <ShopManagerUsers />
              </ShopManagerLayout>
            </RoleRoute>
          </ProtectedRoute>
        } />
        
        {/* Default Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        
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