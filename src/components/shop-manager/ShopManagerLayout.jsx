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

  useEffect(() => {
    if (shopId) {
      const shop = localStorage.getItem('selectedShop');
      if (shop) {
        const parsedShop = JSON.parse(shop);
        if (parsedShop.id === shopId) {
          setSelectedShop(parsedShop);
        }
      }
      
      // Determine view mode based on user role and context
      if (user) {
        if (user.role === 'brand_admin') {
          setViewMode('brand_admin');
        } else if (user.role === 'district_manager') {
          setViewMode('district_manager');
        } else {
          setViewMode('shop_manager');
        }
      }
    } else {
      setSelectedShop(null);
      setViewMode('shop_manager');
    }
  }, [shopId, user]);

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
    
    // Main dashboard paths
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
    // When going back to district manager, we need to keep the district info
    // The district is still in localStorage from when we opened the shop
    navigate('/district-manager');
  } else {
    navigate('/shop-manager');
  }
};

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-blue text-white p-4 shadow">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              {selectedShop && (
                <button
                  onClick={handleBack}
                  className="mr-3 p-1 hover:bg-primary-red rounded-full transition-colors"
                  title="Back to Dashboard"
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