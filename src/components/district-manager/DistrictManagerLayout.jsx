import React, { useEffect } from "react";
import {
  Outlet,
  NavLink,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import LogoutButton from "../common/LogoutButton";
import { getShopById } from "../../redux/slice/shopSlice";

const DistrictManagerLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { shopId } = useParams();

  const user = useSelector((state) => state.user.currentUser);
  const shop = useSelector((state) => state.shop.currentShop);

  useEffect(() => {
    if (shopId) {
      dispatch(getShopById(shopId));
    }
  }, [shopId, dispatch]);

  const handleBack = () => {
    navigate("/district-manager/shops");
  };

  const navItems = shopId
    ? [
        { name: "Overview", path: `/district-manager/shops/${shopId}` },
        { name: "Orders", path: `/district-manager/shops/${shopId}/orders` },
        { name: "Analytics", path: `/district-manager/shops/${shopId}/analytics` },
        { name: "Users", path: `/district-manager/shops/${shopId}/users` },
      ]
    : [
        { name: "Overview", path: "/district-manager" },
        { name: "Shops", path: "/district-manager/shops" },
        { name: "Users", path: "/district-manager/users" },
        { name: "Analytics", path: "/district-manager/analytics" },
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-blue text-white p-4 shadow">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            {shopId && (
              <button
                onClick={handleBack}
                className="mr-3 p-1 hover:bg-primary-red rounded-full"
              >
                ←
              </button>
            )}

            <h1 className="text-2xl font-bold">
              {shop ? `${shop.name} Management` : "District Manager Dashboard"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-primary-red px-3 py-1 rounded-full text-sm">
              District Manager
            </div>
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

export default DistrictManagerLayout;