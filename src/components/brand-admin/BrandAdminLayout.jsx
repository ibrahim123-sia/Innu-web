// BrandAdminLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import LogoutButton from "../../components/common/LogoutButton";

const BrandAdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.currentUser);
  const { districtId, shopId } = useParams();
  
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [accessMode, setAccessMode] = useState('brand');

  useEffect(() => {
    if (districtId) {
      const district = localStorage.getItem('selectedDistrict');
      if (district) {
        setSelectedDistrict(JSON.parse(district));
        setSelectedShop(null);
        setAccessMode('district');
      }
    } else if (shopId) {
      const shop = localStorage.getItem('selectedShop');
      if (shop) {
        setSelectedShop(JSON.parse(shop));
        setSelectedDistrict(null);
        setAccessMode('shop');
      }
    } else {
      setSelectedDistrict(null);
      setSelectedShop(null);
      setAccessMode('brand');
      localStorage.removeItem('selectedDistrict');
      localStorage.removeItem('selectedShop');
    }
  }, [districtId, shopId]);

  const handleBack = () => {
    if (accessMode === 'district') {
      localStorage.removeItem('selectedDistrict');
      navigate('/brand-admin/districts');
    } else if (accessMode === 'shop') {
      localStorage.removeItem('selectedShop');
      navigate('/brand-admin/shops');
    }
  };

  const getHeaderTitle = () => {
    if (accessMode === 'district' && selectedDistrict) {
      return `${selectedDistrict.name} District`;
    }
    if (accessMode === 'shop' && selectedShop) {
      return `${selectedShop.name} Shop`;
    }
    return "Brand Admin Dashboard";
  };

  const getHeaderSubtitle = () => {
    if (accessMode === 'district' && selectedDistrict) {
      return `Viewing District: ${selectedDistrict.city}${selectedDistrict.state ? `, ${selectedDistrict.state}` : ''}`;
    }
    if (accessMode === 'shop' && selectedShop) {
      return `Viewing Shop: ${selectedShop.city}${selectedShop.state ? `, ${selectedShop.state}` : ''}`;
    }
    return user?.brand_name ? `Managing: ${user.brand_name}` : "Brand Management";
  };

  const getNavItems = () => {
    if (accessMode === 'district' && selectedDistrict) {
      return [
        { name: "Overview", path: `/brand-admin/districts/${selectedDistrict.id}` },
        { name: "Shops", path: `/brand-admin/districts/${selectedDistrict.id}/shops` },
        { name: "Users", path: `/brand-admin/districts/${selectedDistrict.id}/users` },
        { name: "Analytics", path: `/brand-admin/districts/${selectedDistrict.id}/analytics` },
      ];
    }
    if (accessMode === 'shop' && selectedShop) {
      return [
        { name: "Overview", path: `/brand-admin/shops/${selectedShop.id}` },
        { name: "Orders", path: `/brand-admin/shops/${selectedShop.id}/orders` },
        { name: "Users", path: `/brand-admin/shops/${selectedShop.id}/users` },
        { name: "Analytics", path: `/brand-admin/shops/${selectedShop.id}/analytics` },
      ];
    }
    return [
      { name: "Overview", path: "/brand-admin" },
      { name: "Shops", path: "/brand-admin/shops" },
      { name: "Districts", path: "/brand-admin/districts" },
      { name: "Users", path: "/brand-admin/users" },
      { name: "Analytics", path: "/brand-admin/analytics" },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-blue text-white p-4 shadow">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              {(accessMode === 'district' || accessMode === 'shop') && (
                <button
                  onClick={handleBack}
                  className="mr-3 p-1 hover:bg-primary-red rounded-full transition-colors"
                  title={`Back to ${accessMode === 'district' ? 'Districts' : 'Shops'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
              {accessMode === 'district' 
                ? "Brand Admin • District View" 
                : accessMode === 'shop'
                  ? "Brand Admin • Shop View"
                  : "Brand Admin"}
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

export default BrandAdminLayout;