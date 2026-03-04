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
  
  // State for district and impersonation status
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [isBrandAdminMode, setIsBrandAdminMode] = useState(false);

  useEffect(() => {
    // Check if we're in brand admin mode (districtId in URL and no userId)
    if (districtId && !userId) {
      setIsBrandAdminMode(true);
      // Load district from localStorage
      const district = localStorage.getItem('selectedDistrict');
      if (district) {
        setSelectedDistrict(JSON.parse(district));
      }
    } else {
      setIsBrandAdminMode(false);
    }
  }, [districtId, userId]);

  const handleBackToDistricts = () => {
    // Clear the impersonation data
    localStorage.removeItem('selectedDistrict');
    localStorage.removeItem('isImpersonating');
    // Navigate back to brand admin districts
    navigate('/brand-admin/districts');
  };

  const getHeaderTitle = () => {
    if (isBrandAdminMode && selectedDistrict) {
      return `${selectedDistrict.name} District`;
    }
    return "District Management";
  };

  const getHeaderSubtitle = () => {
    if (isBrandAdminMode && selectedDistrict) {
      return `Viewing as Brand Admin • ${selectedDistrict.city}${selectedDistrict.state ? `, ${selectedDistrict.state}` : ''}`;
    }
    return "Manage your districts and shops";
  };

  const getNavLink = (path) => {
    // If we're in brand admin mode, use brand admin routes
    if (isBrandAdminMode && selectedDistrict) {
      return path.replace('/district-manager', `/brand-admin/districts/${selectedDistrict.id}`);
    }
    return path;
  };

  // Determine which nav items to show
  const getNavItems = () => {
    if (isBrandAdminMode && selectedDistrict) {
      // Brand admin viewing a specific district
      return [
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
      ];
    } else if (userId) {
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
    } else {
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
    if (isBrandAdminMode) {
      return "Brand Admin";
    }
    if (userId) {
      return "Brand Admin Viewing";
    }
    return "District Manager";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary-blue text-white p-4 shadow">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              {/* Back button for brand admin viewing a district */}
              {isBrandAdminMode && selectedDistrict && (
                <button
                  onClick={handleBackToDistricts}
                  className="mr-3 p-1 hover:bg-primary-red rounded-full transition-colors"
                  title="Back to Districts"
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