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
  const [activeContext, setActiveContext] = useState('brand');

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
    const from = localStorage.getItem('navigationFrom');
    const fromDistrict = localStorage.getItem('fromDistrict');
    
    if (shop) {
      setSelectedShop(JSON.parse(shop));
      setSelectedDistrict(null);
      setActiveContext('shop');
    }
    
    // If coming from a district, set that context
    if (fromDistrict) {
      localStorage.setItem('fromDistrict', 'true');
    }
  } else {
    setSelectedDistrict(null);
    setSelectedShop(null);
    setActiveContext('brand');
    localStorage.removeItem('selectedDistrict');
    localStorage.removeItem('selectedShop');
    localStorage.removeItem('navigationFrom');
    localStorage.removeItem('fromDistrict');
  }
}, [districtId, shopId]);

const handleBack = () => {
  const from = localStorage.getItem('navigationFrom');
  
  if (from === 'district-list') {
    localStorage.removeItem('navigationFrom');
    localStorage.removeItem('selectedDistrict');
    navigate('/brand-admin/districts');
  } else if (from === 'shop-list') {
    localStorage.removeItem('navigationFrom');
    localStorage.removeItem('selectedShop');
    navigate('/brand-admin/shops');
  } else {
    // Default behavior
    if (activeContext === 'district') {
      localStorage.removeItem('selectedDistrict');
      navigate('/brand-admin/districts');
    } else if (activeContext === 'shop') {
      localStorage.removeItem('selectedShop');
      navigate('/brand-admin/shops');
    }
  }
};

  const getHeaderTitle = () => {
    if (activeContext === 'district' && selectedDistrict) {
      return `${selectedDistrict.name} District`;
    }
    if (activeContext === 'shop' && selectedShop) {
      return `${selectedShop.name} Shop`;
    }
    return "Company Admin Dashboard";
  };

  const getHeaderSubtitle = () => {
    if (activeContext === 'district' && selectedDistrict) {
      return `Viewing District: ${selectedDistrict.city}${selectedDistrict.state ? `, ${selectedDistrict.state}` : ''}`;
    }
    if (activeContext === 'shop' && selectedShop) {
      return `Viewing Shop: ${selectedShop.city}${selectedShop.state ? `, ${selectedShop.state}` : ''}`;
    }
    return user?.brand_name ? `Managing: ${user.brand_name}` : "Company Management";
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
        { name: "Overview", path: `/brand-admin/shops/${selectedShop.id}` },
        { name: "Orders", path: `/brand-admin/shops/${selectedShop.id}/orders` },
        { name: "Analytics", path: `/brand-admin/shops/${selectedShop.id}/analytics` },
        { name: "Users", path: `/brand-admin/shops/${selectedShop.id}/users` },
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
              {(activeContext === 'district' || activeContext === 'shop') && (
                <button
                  onClick={handleBack}
                  className="mr-3 p-1 hover:bg-primary-red rounded-full transition-colors"
                  title={`Back to ${activeContext === 'district' ? 'Districts' : 'Shops'}`}
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
              Brand Admin
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