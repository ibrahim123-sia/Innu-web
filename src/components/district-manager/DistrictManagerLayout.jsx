import React, { useState, useEffect } from "react";
import {
  Outlet,
  NavLink,
  useNavigate,
  useParams
} from "react-router-dom";
import { useSelector } from "react-redux";
import LogoutButton from "../common/LogoutButton";

const DistrictManagerLayout = ({ children }) => {
  const navigate = useNavigate();
  const { shopId } = useParams();
  const user = useSelector((state) => state.user.currentUser);
  
  const [selectedShop, setSelectedShop] = useState(null);

  useEffect(() => {
    if (shopId) {
      const shop = localStorage.getItem('selectedShop');
      if (shop) {
        setSelectedShop(JSON.parse(shop));
      }
    } else {
      setSelectedShop(null);
    }
  }, [shopId]);

  const getHeaderTitle = () => {
    if (selectedShop) {
      return `${selectedShop.name || 'Shop'} Management`;
    }
    return "District Manager Dashboard";
  };



  const getNavItems = () => {
    if (selectedShop) {
      return [
        { name: "Overview", path: `/district-manager/shops/${selectedShop.id}` },
        { name: "Orders", path: `/district-manager/shops/${selectedShop.id}/orders` },
        { name: "Analytics", path: `/district-manager/shops/${selectedShop.id}/analytics` },
        { name: "Users", path: `/district-manager/shops/${selectedShop.id}/users` },
      ];
    }
    return [
      { name: "Overview", path: "/district-manager" },
      { name: "Shops", path: "/district-manager/shops" },
      { name: "Users", path: "/district-manager/users" },
      { name: "Analytics", path: "/district-manager/analytics" },
    ];
  };

  const handleBack = () => {
    if (selectedShop) {
      localStorage.removeItem('selectedShop');
      navigate('/district-manager');
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-blue text-white p-4 shadow">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              {/* Show back button when viewing a shop */}
              {selectedShop && (
                <button
                  onClick={handleBack}
                  className="mr-3 p-1 hover:bg-primary-red rounded-full transition-colors"
                  title="Back to District Overview"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold">{getHeaderTitle()}</h1>
              
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-primary-red px-3 py-1 rounded-full text-sm">
              {selectedShop ? "District Manager" : "District Manager"}
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

export default DistrictManagerLayout;