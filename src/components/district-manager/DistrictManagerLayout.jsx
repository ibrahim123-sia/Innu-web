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
  
  // Get userId from URL if present (for brand admin viewing district manager)
  const userId = searchParams.get("userId");
  
  // State for district and mode
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [mode, setMode] = useState('district_manager'); // 'district_manager', 'brand_admin_viewing_district', 'brand_admin_viewing_manager'

  useEffect(() => {
    // Check the mode based on URL parameters
    if (districtId && !userId) {
      // Brand admin viewing a district directly (from districts list)
      setMode('brand_admin_viewing_district');
      const district = localStorage.getItem('selectedDistrict');
      if (district) {
        setSelectedDistrict(JSON.parse(district));
      } else {
        // If no district in localStorage, clear selection
        setSelectedDistrict(null);
      }
    } else if (userId) {
      // Brand admin viewing a specific district manager's page
      setMode('brand_admin_viewing_manager');
      setSelectedDistrict(null);
    } else {
      // Regular district manager login
      setMode('district_manager');
      setSelectedDistrict(null);
      // Clear any leftover localStorage items
      localStorage.removeItem('selectedDistrict');
      localStorage.removeItem('selectedShop');
      localStorage.removeItem('isImpersonating');
    }
  }, [districtId, userId]);

  const handleBackToDistricts = () => {
    // Clear the district data
    localStorage.removeItem('selectedDistrict');
    localStorage.removeItem('isImpersonating');
    // Navigate back to brand admin districts
    navigate('/brand-admin/districts');
  };

  const handleBackToManagers = () => {
    // Clear the manager data
    localStorage.removeItem('isImpersonating');
    // Navigate back to brand admin users or wherever
    navigate('/brand-admin/users');
  };

  const getHeaderTitle = () => {
    switch(mode) {
      case 'brand_admin_viewing_district':
        return selectedDistrict ? `${selectedDistrict.name} District` : "District View";
      case 'brand_admin_viewing_manager':
        return "District Manager View";
      default:
        return "District Management";
    }
  };

  const getHeaderSubtitle = () => {
    switch(mode) {
      case 'brand_admin_viewing_district':
        return selectedDistrict 
          ? `Viewing as Brand Admin • ${selectedDistrict.city}${selectedDistrict.state ? `, ${selectedDistrict.state}` : ''}`
          : "Viewing district as Brand Admin";
      case 'brand_admin_viewing_manager':
        return "Viewing district manager dashboard as Brand Admin";
      default:
        return "Manage your districts and shops";
    }
  };

  // Determine which nav items to show
  const getNavItems = () => {
    switch(mode) {
      case 'brand_admin_viewing_district':
        // Brand admin viewing a specific district
        return selectedDistrict ? [
          {
            name: "Overview",
            path: `/brand-admin/districts/${selectedDistrict.id}`,
          },
          {
            name: "Shops",
            path: `/brand-admin/districts/${selectedDistrict.id}/shops`,
          },
          {
            name: "Users",
            path: `/brand-admin/districts/${selectedDistrict.id}/users`,
          },
          {
            name: "Analytics",
            path: `/brand-admin/districts/${selectedDistrict.id}/analytics`,
          },
        ] : [];
        
      case 'brand_admin_viewing_manager':
        // Brand admin viewing a specific district manager's page
        return [
          {
            name: "Overview",
            path: `/district-manager?userId=${userId}`,
          },
          {
            name: "Shops",
            path: `/district-manager/shops?userId=${userId}`,
          },
          {
            name: "Users",
            path: `/district-manager/users?userId=${userId}`,
          },
          {
            name: "Analytics",
            path: `/district-manager/analytics?userId=${userId}`,
          },
        ];
        
      default:
        // Regular district manager
        return [
          {
            name: "Overview",
            path: "/district-manager",
          },
          {
            name: "Shops",
            path: "/district-manager/shops",
          },
          {
            name: "Users",
            path: "/district-manager/users",
          },
          {
            name: "Analytics",
            path: "/district-manager/analytics",
          },
        ];
    }
  };

  const navItems = getNavItems();

  // Get the correct role badge text
  const getRoleBadge = () => {
    switch(mode) {
      case 'brand_admin_viewing_district':
        return "Brand Admin • Viewing District";
      case 'brand_admin_viewing_manager':
        return "Brand Admin • Viewing Manager";
      default:
        return "District Manager";
    }
  };

  // Determine if back button should be shown
  const showBackButton = () => {
    return mode === 'brand_admin_viewing_district' || mode === 'brand_admin_viewing_manager';
  };

  // Get back button action
  const getBackButtonAction = () => {
    if (mode === 'brand_admin_viewing_district') {
      return handleBackToDistricts;
    }
    if (mode === 'brand_admin_viewing_manager') {
      return handleBackToManagers;
    }
    return null;
  };

  // Get back button title
  const getBackButtonTitle = () => {
    if (mode === 'brand_admin_viewing_district') {
      return "Back to Districts";
    }
    if (mode === 'brand_admin_viewing_manager') {
      return "Back to Managers";
    }
    return "";
  };

  const backButtonAction = getBackButtonAction();
  const backButtonTitle = getBackButtonTitle();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary-blue text-white p-4 shadow">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              {/* Back button for brand admin viewing */}
              {showBackButton() && backButtonAction && (
                <button
                  onClick={backButtonAction}
                  className="mr-3 p-1 hover:bg-primary-red rounded-full transition-colors"
                  title={backButtonTitle}
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

      {/* Navigation */}
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

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default DistrictManagerLayout;