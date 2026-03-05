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
  const { districtId, shopId } = useParams();
  const user = useSelector((state) => state.user.currentUser);
  
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [activeContext, setActiveContext] = useState('district');

  useEffect(() => {
    if (districtId) {
      const district = localStorage.getItem('selectedDistrict');
      if (district) {
        setSelectedDistrict(JSON.parse(district));
        setSelectedShop(null);
        setActiveContext('district');
      }
    } else if (shopId) {
      const shop = localStorage.getItem('selectedShop');
      if (shop) {
        setSelectedShop(JSON.parse(shop));
        setSelectedDistrict(null);
        setActiveContext('shop');
      }
    } else {
      setSelectedDistrict(null);
      setSelectedShop(null);
      setActiveContext('district');
      localStorage.removeItem('selectedShop');
    }
  }, [districtId, shopId]);

  const handleBack = () => {
    if (activeContext === 'district') {
      localStorage.removeItem('selectedDistrict');
      navigate('/brand-admin/districts');
    } else if (activeContext === 'shop') {
      localStorage.removeItem('selectedShop');
      navigate('/district-manager');
    }
  };

  const getHeaderTitle = () => {
    if (activeContext === 'district' && selectedDistrict) {
      return `${selectedDistrict.name} District`;
    }
    if (activeContext === 'shop' && selectedShop) {
      return `${selectedShop.name} Shop`;
    }
    return "District Manager Dashboard";
  };

  const getHeaderSubtitle = () => {
    if (activeContext === 'district' && selectedDistrict) {
      return `Viewing District: ${selectedDistrict.city}${selectedDistrict.state ? `, ${selectedDistrict.state}` : ''}`;
    }
    if (activeContext === 'shop' && selectedShop) {
      return `Viewing Shop: ${selectedShop.city}${selectedShop.state ? `, ${selectedShop.state}` : ''}`;
    }
    return user?.district_name ? `Managing: ${user.district_name}` : "District Management";
  };

  const getNavItems = () => {
    if (activeContext === 'district' && selectedDistrict) {
      return [
        { name: "Overview", path: `/brand-admin/districts/${selectedDistrict.id}` },
        { name: "Shops", path: `/brand-admin/districts/${selectedDistrict.id}/shops` },
        { name: "Users", path: `/brand-admin/districts/${selectedDistrict.id}/users` },
        { name: "Analytics", path: `/brand-admin/districts/${selectedDistrict.id}/analytics` },
      ];
    }
    if (activeContext === 'shop' && selectedShop) {
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

  const showBackButton = () => {
    return activeContext === 'district' || activeContext === 'shop';
  };

  const getBackButtonTitle = () => {
    if (activeContext === 'district') return "Back to Districts";
    if (activeContext === 'shop') return "Back to District Overview";
    return "Back";
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-blue text-white p-4 shadow">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              {(activeContext === 'district' || activeContext === 'shop') && (
                <button
                  onClick={handleBack}
                  className="mr-3 p-1 hover:bg-primary-red rounded-full transition-colors"
                  title={getBackButtonTitle()}
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
              District Manager
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