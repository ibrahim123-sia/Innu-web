import React, { useState, useEffect } from "react";
import {
  Outlet,
  NavLink,
  useNavigate,
  useParams,
  useSearchParams
} from "react-router-dom";
import { useSelector } from "react-redux";
import LogoutButton from "../common/LogoutButton";

const DistrictManagerLayout = ({ children }) => {
  const navigate = useNavigate();
  const { districtId, shopId } = useParams();
  const [searchParams] = useSearchParams();
  const user = useSelector((state) => state.user.currentUser);
  
  const userId = searchParams.get("userId");
  
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [mode, setMode] = useState('district_manager'); // 'district_manager', 'brand_admin', 'shop_view'

  useEffect(() => {
    // Brand admin viewing a district
    if (districtId && !userId && !shopId) {
      setMode('brand_admin');
      const district = localStorage.getItem('selectedDistrict');
      if (district) setSelectedDistrict(JSON.parse(district));
      setSelectedShop(null);
    } 
    // District manager viewing a shop
    else if (shopId || (userId && user?.role === 'district_manager')) {
      setMode('shop_view');
      const shop = localStorage.getItem('selectedShop');
      if (shop) setSelectedShop(JSON.parse(shop));
      
      // Also keep district info for header
      const district = localStorage.getItem('selectedDistrict');
      if (district) setSelectedDistrict(JSON.parse(district));
    }
    // Regular district manager view
    else {
      setMode('district_manager');
      setSelectedDistrict(null);
      setSelectedShop(null);
      localStorage.removeItem('selectedShop');
    }
  }, [districtId, shopId, userId, user?.role]);

  const handleBack = () => {
    if (mode === 'brand_admin') {
      localStorage.removeItem('selectedDistrict');
      localStorage.removeItem('selectedShop');
      navigate('/brand-admin/districts');
    } else if (mode === 'shop_view') {
      localStorage.removeItem('selectedShop');
      // Go back to district overview
      if (selectedDistrict) {
        navigate(`/district-manager`);
      } else {
        navigate('/district-manager');
      }
    } else {
      navigate('/district-manager');
    }
  };

  const getHeaderTitle = () => {
    if (mode === 'brand_admin' && selectedDistrict) {
      return `${selectedDistrict.name} District`;
    }
    if (mode === 'shop_view' && selectedShop) {
      return `${selectedShop.name} Shop`;
    }
    return "District Management";
  };

  const getHeaderSubtitle = () => {
    if (mode === 'brand_admin' && selectedDistrict) {
      return `Viewing District: ${selectedDistrict.city}${selectedDistrict.state ? `, ${selectedDistrict.state}` : ''}`;
    }
    if (mode === 'shop_view') {
      if (selectedDistrict && selectedShop) {
        return `${selectedDistrict.name} District • ${selectedShop.city || ''} ${selectedShop.state || ''}`;
      }
      if (selectedShop) {
        return `Managing Shop: ${selectedShop.city || ''} ${selectedShop.state || ''}`;
      }
      return "Managing Shop Operations";
    }
    return user?.district_name ? `Managing: ${user.district_name}` : "District Management";
  };

  const getRoleBadge = () => {
    if (mode === 'brand_admin') return "Brand Admin • District View";
    if (mode === 'shop_view') return "District Manager • Shop View";
    return "District Manager";
  };

  const getNavItems = () => {
    if (mode === 'brand_admin' && selectedDistrict) {
      return [
        { name: "Overview", path: `/brand-admin/districts/${selectedDistrict.id}` },
        { name: "Shops", path: `/brand-admin/districts/${selectedDistrict.id}/shops` },
        { name: "Users", path: `/brand-admin/districts/${selectedDistrict.id}/users` },
        { name: "Analytics", path: `/brand-admin/districts/${selectedDistrict.id}/analytics` },
      ];
    } else if (mode === 'shop_view' && selectedShop) {
      // Shop manager tabs when viewing a shop
      if (userId) {
        return [
          { name: "Overview", path: `/shop-manager?userId=${userId}` },
          { name: "Orders", path: `/shop-manager/orders?userId=${userId}` },
          { name: "Analytics", path: `/shop-manager/analytics?userId=${userId}` },
          { name: "Users", path: `/shop-manager/users?userId=${userId}` },
        ];
      } else {
        return [
          { name: "Overview", path: `/district-manager/shops/${selectedShop.id}` },
          { name: "Orders", path: `/district-manager/shops/${selectedShop.id}/orders` },
          { name: "Analytics", path: `/district-manager/shops/${selectedShop.id}/analytics` },
          { name: "Users", path: `/district-manager/shops/${selectedShop.id}/users` },
        ];
      }
    } else if (userId) {
      return [
        { name: "Overview", path: `/district-manager?userId=${userId}` },
        { name: "Shops", path: `/district-manager/shops?userId=${userId}` },
        { name: "Users", path: `/district-manager/users?userId=${userId}` },
        { name: "Analytics", path: `/district-manager/analytics?userId=${userId}` },
      ];
    } else {
      return [
        { name: "Overview", path: "/district-manager" },
        { name: "Shops", path: "/district-manager/shops" },
        { name: "Users", path: "/district-manager/users" },
        { name: "Analytics", path: "/district-manager/analytics" },
      ];
    }
  };

  const showBackButton = () => {
    return mode === 'brand_admin' || mode === 'shop_view';
  };

  const getBackButtonTitle = () => {
    if (mode === 'brand_admin') return "Back to Districts";
    if (mode === 'shop_view') return "Back to District Overview";
    return "Back";
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

export default DistrictManagerLayout;