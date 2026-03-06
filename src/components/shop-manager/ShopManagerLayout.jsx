import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import LogoutButton from "../../components/common/LogoutButton";

const ShopManagerLayout = ({ children }) => {
  const navigate = useNavigate();
  const { shopId } = useParams();
  const user = useSelector((state) => state.user.currentUser);
  
  const [selectedShop, setSelectedShop] = useState(null);

  useEffect(() => {
    if (shopId) {
      const shop = localStorage.getItem('selectedShop');
      if (shop) {
        const parsedShop = JSON.parse(shop);
        if (parsedShop.id === shopId) {
          setSelectedShop(parsedShop);
        } else {
          // If stored shop doesn't match URL, create basic shop object
          setSelectedShop({ id: shopId, name: "Shop" });
        }
      } else {
        // Try to get shop from user data
        if (user?.shop_id === shopId) {
          setSelectedShop({ id: shopId, name: user.shop_name || "Your Shop" });
        } else {
          setSelectedShop({ id: shopId, name: "Shop" });
        }
      }
    } else {
      setSelectedShop(null);
    }
  }, [shopId, user]);

  // Auto-redirect if user has shop_id but no shopId in URL
  useEffect(() => {
    if (!shopId && user?.shop_id) {
      navigate(`/shop-manager/shops/${user.shop_id}`, { replace: true });
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
      return "Managing your shop";
    }
    return user?.email ? `Welcome, ${user.email}` : "Shop Management";
  };

  const getNavItems = () => {
    if (selectedShop && selectedShop.id) {
      return [
        { name: "Overview", path: `/shop-manager/shops/${selectedShop.id}` },
        { name: "Orders", path: `/shop-manager/shops/${selectedShop.id}/orders` },
        { name: "Analytics", path: `/shop-manager/shops/${selectedShop.id}/analytics` },
        { name: "Users", path: `/shop-manager/shops/${selectedShop.id}/users` },
      ];
    }
    // Fallback for when no shop is selected (should rarely happen)
    return [
      { name: "Overview", path: "/shop-manager" },
      { name: "Orders", path: "/shop-manager/orders" },
      { name: "Analytics", path: "/shop-manager/analytics" },
      { name: "Users", path: "/shop-manager/users" },
    ];
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
              Shop Manager
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