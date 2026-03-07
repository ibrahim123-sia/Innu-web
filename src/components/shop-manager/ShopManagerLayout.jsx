import React, { useEffect } from "react";
import {
  Outlet,
  NavLink,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import LogoutButton from "../../components/common/LogoutButton";
import { getShopById } from "../../redux/slice/shopSlice";

const ShopManagerLayout = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { shopId } = useParams();

  const user = useSelector((state) => state.user.currentUser);
  const shop = useSelector((state) => state.shop.currentShop);

  useEffect(() => {
    if (shopId) {
      dispatch(getShopById(shopId));
    }
  }, [shopId, dispatch]);

  useEffect(() => {
    if (!shopId && user?.role === "shop_manager" && user?.shop_id) {
      navigate(`/shop-manager/shops/${user.shop_id}`, { replace: true });
    }
  }, [shopId, user, navigate]);

  const navItems = shopId
    ? [
        { name: "Overview", path: `/shop-manager/shops/${shopId}` },
        { name: "Orders", path: `/shop-manager/shops/${shopId}/orders` },
        { name: "Users", path: `/shop-manager/shops/${shopId}/users` },
        { name: "Analytics", path: `/shop-manager/shops/${shopId}/analytics` },
      ]
    : [
        { name: "Overview", path: "/shop-manager" },
        { name: "Orders", path: "/shop-manager/orders" },
        { name: "Users", path: "/shop-manager/users" },
        { name: "Analytics", path: "/shop-manager/analytics" },
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-blue text-white p-4 shadow">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {shop ? `${shop.name} Management` : "Shop Manager Dashboard"}
            </h1>
            <p className="text-sm">{user?.email}</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-primary-red px-3 py-1 rounded-full text-sm">
              Shop Manager
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

export default ShopManagerLayout;