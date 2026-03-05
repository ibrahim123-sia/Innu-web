import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import LogoutButton from "../../components/common/LogoutButton";

const ShopManagerLayout = ({ children }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.currentUser);
  const { shopId } = useParams(); // Get shopId from URL
  
  const [selectedShop, setSelectedShop] = useState(null);
  const [activeContext, setActiveContext] = useState('shop');

  useEffect(() => {
    if (shopId) {
      const shop = localStorage.getItem('selectedShop');
      if (shop) {
        const parsedShop = JSON.parse(shop);
        // Verify the shop ID matches
        if (parsedShop.id === shopId) {
          setSelectedShop(parsedShop);
        } else {
          setSelectedShop(null);
        }
      }
    } else {
      setSelectedShop(null);
      localStorage.removeItem('selectedShop');
    }
  }, [shopId]);

  const handleBack = () => {
    localStorage.removeItem('selectedShop');
    navigate('/district-manager'); // Go back to district manager
  };

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
      
      if (city && state) return `Viewing Shop: ${city}, ${state}`;
      if (city) return `Viewing Shop: ${city}`;
      return "Viewing Shop Details";
    }
    return "Manage your shop operations";
  };

  const getNavItems = () => {
    if (selectedShop) {
      // Shop view with ID in URL
      return [
        { name: "Overview", path: `/shop-manager/shops/${selectedShop.id}` },
        { name: "Orders", path: `/shop-manager/shops/${selectedShop.id}/orders` },
        { name: "Analytics", path: `/shop-manager/shops/${selectedShop.id}/analytics` },
        { name: "Users", path: `/shop-manager/shops/${selectedShop.id}/users` },
      ];
    }
    return [
      { name: "Overview", path: "/shop-manager" },
      { name: "Orders", path: "/shop-manager/orders" },
      { name: "Analytics", path: "/shop-manager/analytics" },
      { name: "Users", path: "/shop-manager/users" },
    ];
  };

  const getRoleBadge = () => {
    // Check user role from Redux
    if (user?.role === 'brand_admin') {
      return "Brand Admin • Shop View";
    }
    if (user?.role === 'district_manager') {
      return "District Manager • Shop View";
    }
    return "Shop Manager";
  };

  const showBackButton = () => {
    return user?.role === 'district_manager' && selectedShop;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-blue text-white p-4 shadow">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              {showBackButton() && (
                <button
                  onClick={handleBack}
                  className="mr-3 p-1 hover:bg-primary-red rounded-full transition-colors"
                  title="Back to District"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold">{getHeaderTitle()}</h1>
                <p className="text-sm text-primary-blue-100">
                  {getHeaderSubtitle()}
                </p>
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