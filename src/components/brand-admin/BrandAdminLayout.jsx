import React from "react";
import {
  Outlet,
  NavLink,
  useParams,
  useNavigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import LogoutButton from "../../components/common/LogoutButton";

const BrandAdminLayout = ({ children }) => {
  const { districtId, shopId } = useParams();
  const navigate = useNavigate();

  const user = useSelector((state) => state.user.currentUser);

  const handleBack = () => {
    if (shopId) navigate("/brand-admin/shops");
    if (districtId) navigate("/brand-admin/districts");
  };

  const navItems = districtId
    ? [
        { name: "Overview", path: `/brand-admin/districts/${districtId}` },
        { name: "Shops", path: `/brand-admin/districts/${districtId}/shops` },
        { name: "Users", path: `/brand-admin/districts/${districtId}/users` },
        { name: "Analytics", path: `/brand-admin/districts/${districtId}/analytics` },
      ]
    : shopId
    ? [
        { name: "Overview", path: `/brand-admin/shops/${shopId}` },
        { name: "Orders", path: `/brand-admin/shops/${shopId}/orders` },
        { name: "Users", path: `/brand-admin/shops/${shopId}/users` },
        { name: "Analytics", path: `/brand-admin/shops/${shopId}/analytics` },
      ]
    : [
        { name: "Overview", path: "/brand-admin" },
        { name: "Shops", path: "/brand-admin/shops" },
        { name: "Districts", path: "/brand-admin/districts" },
        { name: "Users", path: "/brand-admin/users" },
        { name: "Analytics", path: "/brand-admin/analytics" },
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-blue text-white p-4 shadow">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            {(shopId || districtId) && (
              <button
                onClick={handleBack}
                className="mr-3 p-1 hover:bg-primary-red rounded-full"
              >
                ←
              </button>
            )}

            <h1 className="text-2xl font-bold">Brand Admin Dashboard</h1>
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
        <div className="container mx-auto flex space-x-1 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.name === "Overview"}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium ${
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
      </nav>

      <main className="container mx-auto p-4 md:p-6">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default BrandAdminLayout;