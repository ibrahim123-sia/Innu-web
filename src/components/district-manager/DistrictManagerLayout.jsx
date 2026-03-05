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
  const { districtId } = useParams();
  const [searchParams] = useSearchParams();
  const user = useSelector((state) => state.user.currentUser);
  
  const userId = searchParams.get("userId");
  
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [isBrandAdminMode, setIsBrandAdminMode] = useState(false);

  useEffect(() => {
    if (districtId && !userId) {
      setIsBrandAdminMode(true);
      const district = localStorage.getItem('selectedDistrict');
      if (district) setSelectedDistrict(JSON.parse(district));
    } else {
      setIsBrandAdminMode(false);
    }
  }, [districtId, userId]);

  const handleBackToDistricts = () => {
    localStorage.removeItem('selectedDistrict');
    localStorage.removeItem('isImpersonating');
    navigate('/brand-admin/districts');
  };

  const getHeaderTitle = () => {
    if (isBrandAdminMode && selectedDistrict) return `${selectedDistrict.name} District`;
    return "District Management";
  };

  const getRoleBadge = () => {
    if (isBrandAdminMode) return "Brand Admin";
    if (userId) return "Brand Admin Viewing";
    return "District Manager";
  };

  const getNavItems = () => {
    if (isBrandAdminMode && selectedDistrict) {
      return [
        { name: "Overview", path: `/brand-admin/districts/${selectedDistrict.id}` },
        { name: "Shops", path: `/brand-admin/districts/${selectedDistrict.id}/shops` },
        { name: "Users", path: `/brand-admin/districts/${selectedDistrict.id}/users` },
        { name: "Analytics", path: `/brand-admin/districts/${selectedDistrict.id}/analytics` },
      ];
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

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-blue text-white p-4 shadow">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              {isBrandAdminMode && selectedDistrict && (
                <button
                  onClick={handleBackToDistricts}
                  className="mr-3 p-1 hover:bg-primary-red rounded-full transition-colors"
                  title="Back to Districts"
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