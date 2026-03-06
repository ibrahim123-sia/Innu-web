import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import LogoutButton from "../../components/common/LogoutButton";

const ShopManagerLayout = ({ children }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.currentUser);
  const { shopId } = useParams();
  
  const [selectedShop, setSelectedShop] = useState(null);
  const [viewMode, setViewMode] = useState('shop_manager'); // 'shop_manager', 'brand_admin', 'district_manager'
  const [activeContext, setActiveContext] = useState('shop'); // Track the context

  useEffect(() => {
    // If we have a shopId in the URL, try to get shop details
    if (shopId) {
      const shop = localStorage.getItem('selectedShop');
      if (shop) {
        const parsedShop = JSON.parse(shop);
        if (parsedShop.id === shopId) {
          setSelectedShop(parsedShop);
        } else {
          // If the stored shop doesn't match the URL shopId, create a basic shop object
          setSelectedShop({ id: shopId, name: "Shop" });
        }
      } else {
        // If no shop in localStorage, create a basic shop object from the ID
        setSelectedShop({ id: shopId, name: "Shop" });
      }
      
      // Determine view mode based on the URL path
      const path = window.location.pathname;
      if (path.includes('/brand-admin/')) {
        setViewMode('brand_admin');
        setActiveContext('brand');
      } else if (path.includes('/district-manager/')) {
        setViewMode('district_manager');
        setActiveContext('district');
      } else {
        setViewMode('shop_manager');
        setActiveContext('shop');
      }
    } else {
      // If no shopId in URL, check if user has a shop_id from their profile
      if (user?.shop_id) {
        // Redirect to the correct URL with shopId
        navigate(`/shop-manager/shops/${user.shop_id}`, { replace: true });
      } else {
        setSelectedShop(null);
        setViewMode('shop_manager');
        setActiveContext('shop');
      }
    }
  }, [shopId, user, navigate]);

  const getHeaderTitle = () => {
    if (selectedShop) {
      return `${selectedShop.name || 'Shop'} Management`;
    }
    return "Shop Manager Dashboard";
  };

  const getHeaderSubtitle = () => {
    if (selectedShop) {
      const city = selectedShop.city || '';
      const state = selectedShop.state || '';
      
      if (city && state) return `Managing: ${city}, ${state}`;
      if (city) return `Managing: ${city}`;
      return "Managing Shop";
    }
    
    if (user?.shops?.length > 1) return `You have access to ${user.shops.length} shops`;
    if (user?.shops?.length === 1) return "Managing your shop";
    return "Manage your shop operations";
  };

  const getRoleBadge = () => {
    if (viewMode === 'brand_admin') {
      return "Brand Admin • Shop View";
    }
    if (viewMode === 'district_manager') {
      return "District Manager • Shop View";
    }
    return "Shop Manager";
  };

  const getNavItems = () => {
    if (selectedShop && selectedShop.id) {
      // Base path depends on who is viewing
      let basePath = '';
      if (viewMode === 'brand_admin') {
        basePath = `/brand-admin/shops/${selectedShop.id}`;
      } else if (viewMode === 'district_manager') {
        basePath = `/district-manager/shops/${selectedShop.id}`;
      } else {
        basePath = `/shop-manager/shops/${selectedShop.id}`;
      }

      return [
        { name: "Overview", path: basePath },
        { name: "Orders", path: `${basePath}/orders` },
        { name: "Analytics", path: `${basePath}/analytics` },
        { name: "Users", path: `${basePath}/users` },
      ];
    }
    
    // Main dashboard paths (should not happen for shop manager)
    if (viewMode === 'brand_admin') {
      return [
        { name: "Overview", path: "/brand-admin" },
        { name: "Shops", path: "/brand-admin/shops" },
        { name: "Districts", path: "/brand-admin/districts" },
        { name: "Users", path: "/brand-admin/users" },
        { name: "Analytics", path: "/brand-admin/analytics" },
      ];
    }
    if (viewMode === 'district_manager') {
      return [
        { name: "Overview", path: "/district-manager" },
        { name: "Shops", path: "/district-manager/shops" },
        { name: "Users", path: "/district-manager/users" },
        { name: "Analytics", path: "/district-manager/analytics" },
      ];
    }
    return [
      { name: "Overview", path: "/shop-manager" },
      { name: "Orders", path: "/shop-manager/orders" },
      { name: "Analytics", path: "/shop-manager/analytics" },
      { name: "Users", path: "/shop-manager/users" },
    ];
  };

  const handleBack = () => {
    localStorage.removeItem('selectedShop');
    
    if (viewMode === 'brand_admin') {
      navigate('/brand-admin/shops');
    } else if (viewMode === 'district_manager') {
      navigate('/district-manager');
    } else {
      navigate('/shop-manager');
    }
  };

  const navItems = getNavItems();

  // If no shopId and no user shop_id, show error
  if (!shopId && !user?.shop_id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-primary-blue text-white p-4 shadow">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Shop Manager Dashboard</h1>
            <LogoutButton />
          </div>
        </header>
        <main className="container mx-auto p-6">
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-center">
            <svg className="w-12 h-12 text-yellow-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">No Shop Assigned</h3>
            <p className="text-yellow-700">You don't have a shop assigned to your account. Please contact an administrator.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-blue text-white p-4 shadow">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              {selectedShop && viewMode !== 'shop_manager' && (
                <button
                  onClick={handleBack}
                  className="mr-3 p-1 hover:bg-primary-red rounded-full transition-colors"
                  title={`Back to ${viewMode === 'brand_admin' ? 'Brand Admin' : 'District'} Dashboard`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold">{getHeaderTitle()}</h1>
                <p className="text-sm text-primary-blue-100">{getHeaderSubtitle()}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-primary-red px-3 py-1 rounded-full text-sm">
              {getRoleBadge()}
            </div>
            <span className="hidden md:inline text-white">{user?.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.name === "Overview"}
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "text-primary-blue border-b-2 border-primary-blue"
                      : "text-gray-500 hover:text-primary-red"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-6">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default ShopManagerLayout;