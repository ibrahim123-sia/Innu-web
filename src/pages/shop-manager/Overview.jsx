import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getShopById, selectCurrentShop } from "../../redux/slice/shopSlice";
import {
  getOrdersByShop,
  selectOrdersByShop,
} from "../../redux/slice/orderSlice";
import { selectAllUsers, getUsersByShopId } from "../../redux/slice/userSlice";
import { getAllVideos, selectVideos } from "../../redux/slice/videoSlice";
import { Link } from "react-router-dom";

const DEFAULT_PROFILE_PIC =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// Skeleton Loader Components
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded animate-pulse w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    ))}
  </div>
);

const ShopInfoSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex justify-between items-center mb-4">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-40"></div>
      <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
    </div>
    <div className="border rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mb-1"></div>
              <div className="h-4 bg-gray-300 rounded animate-pulse w-32"></div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mb-1"></div>
              <div className="h-4 bg-gray-300 rounded animate-pulse w-32"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const QuickActionsSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mb-4"></div>
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center p-4 border rounded-lg">
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse mr-4"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-48"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RecentOrdersSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 mt-8">
    <div className="flex justify-between items-center mb-4">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
    </div>
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between py-2 border-b last:border-0"
        >
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-36"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
        </div>
      ))}
    </div>
  </div>
);

const Overview = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.currentUser);
  const shopId = currentUser?.shop_id;

  const myShop = useSelector(selectCurrentShop);
  const shopOrders = useSelector(selectOrdersByShop) || [];
  const shopUsers = useSelector(selectAllUsers) || [];
  const allVideos = useSelector(selectVideos) || [];

  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [dailyOrders, setDailyOrders] = useState(0);
  const [totalAIVideoRequests, setTotalAIVideoRequests] = useState(0);
  const [shopStats, setShopStats] = useState(null);
  const [filteredShopUsers, setFilteredShopUsers] = useState([]);
  const [topShop, setTopShop] = useState(null);

  useEffect(() => {
    if (shopId) {
      Promise.all([dispatch(getShopById(shopId))]).then(() => {
        setTimeout(() => setIsInitialLoad(false), 300);
      });
    }
  }, [dispatch, shopId]);

  useEffect(() => {
    if (myShop?.id) {
      Promise.all([
        dispatch(getOrdersByShop(shopId)),
        dispatch(getUsersByShopId(shopId)),
        dispatch(getAllVideos()),
      ]).then(() => {
        setIsDataReady(true);
        setLoading(false);
      });
    }
  }, [dispatch, myShop, shopId]);

  useEffect(() => {
    if (shopUsers && shopId) {
      const filtered = shopUsers.filter((user) => user.shop_id === shopId);
      setFilteredShopUsers(filtered);
    }
  }, [shopUsers, shopId]);

  useEffect(() => {
    calculateStats();
  }, [shopOrders, filteredShopUsers, allVideos, myShop]);

  const calculateStats = () => {
    // Calculate daily orders (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const todayOrders =
      shopOrders?.filter((order) => {
        if (!order?.created_at) return false;
        const orderDate = new Date(order.created_at);
        return orderDate >= yesterday;
      }).length || 0;

    setDailyOrders(todayOrders);

    // Calculate total AI video requests for this shop
    if (myShop && allVideos) {
      const shopVideos = allVideos.filter(
        (video) => video.shop_id === myShop.id,
      );
      setTotalAIVideoRequests(shopVideos.length);
    }

    // Calculate shop statistics
    if (myShop && shopOrders && filteredShopUsers) {
      const activeUsers = filteredShopUsers.filter(
        (user) => user.is_active,
      ).length;
      const completedOrders = shopOrders.filter((order) =>
        ["completed", "posted", "done"].includes(order.status?.toLowerCase()),
      ).length;

      setShopStats({
        activeUsers,
        completedOrders,
        completionRate:
          shopOrders.length > 0
            ? ((completedOrders / shopOrders.length) * 100).toFixed(1)
            : 0,
      });
    }

    // Calculate top performing shop
    if (filteredShopUsers.length > 0 && myShop) {
      const technicians = filteredShopUsers.filter(
        (user) => user.role === "technician",
      ).length;
      const pendingOrders = shopOrders.filter((order) =>
        ["pending", "estimate"].includes(order.status?.toLowerCase()),
      ).length;
      const inProgressOrders = shopOrders.filter((order) =>
        ["in_progress", "work-in-progress", "processing"].includes(
          order.status?.toLowerCase(),
        ),
      ).length;

      setTopShop({
        name: myShop.name,
        city: myShop.city,
        state: myShop.state,
        is_active: myShop.is_active,
        tekmetric_shop_id: myShop.tekmetric_shop_id,
        totalOrders: shopOrders.length,
        totalTechnicians: technicians,
        pendingOrders,
        inProgressOrders,
        completedOrders: shopOrders.filter((order) =>
          ["completed", "posted", "done"].includes(order.status?.toLowerCase()),
        ).length,
        videoRequests: totalAIVideoRequests,
      });
    }
  };

  const getTotalEmployees = () => {
    return filteredShopUsers?.filter((user) => user.is_active).length || 0;
  };

  const getTotalOrders = () => {
    return shopOrders?.length || 0;
  };

  const getCompletedOrders = () => {
    return (
      shopOrders?.filter((order) =>
        ["completed", "posted", "done"].includes(order.status?.toLowerCase()),
      ).length || 0
    );
  };

  const getActiveTechnicians = () => {
    return (
      filteredShopUsers?.filter(
        (user) => user.role === "technician" && user.is_active,
      ).length || 0
    );
  };

  // Show skeleton during initial load
  if (isInitialLoad || (loading && !isDataReady)) {
    return (
      <div className="transition-opacity duration-300 ease-in-out">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
        </div>
        <StatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ShopInfoSkeleton />
          <QuickActionsSkeleton />
        </div>
        <RecentOrdersSkeleton />
      </div>
    );
  }

  return (
    <div className="transition-opacity duration-300 ease-in-out">
     
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Employees</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {getTotalEmployees()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {getActiveTechnicians()} Active Technicians
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Orders</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {getTotalOrders()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {getCompletedOrders()} Completed
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Video Requests</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {totalAIVideoRequests}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Videos processed by AI
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Daily Orders</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {dailyOrders}
              </p>
              <p className="text-xs text-gray-400 mt-1">Last 24 hours</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Info & Quick Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Shop Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Shop Information
            </h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Tekmetric ID: {myShop?.tekmetric_shop_id || "N/A"}
            </span>
          </div>

          {myShop ? (
            <div className="border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Shop Name
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {myShop.name}
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Street Address
                    </label>
                    <p className="text-gray-600">
                      {myShop.street_address || "Not provided"}
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <p className="text-gray-600">
                      {myShop.city || "Not provided"}
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <p className="text-gray-600">
                      {myShop.state || "Not provided"}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <span
                      className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                        myShop.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {myShop.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Created Date
                    </label>
                    <p className="text-gray-600">
                      {myShop.created_at
                        ? new Date(myShop.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Total employees in shop:
                  </span>
                  <span className="font-bold text-blue-600">
                    {getTotalEmployees()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">
                    Total orders processed:
                  </span>
                  <span className="font-bold text-green-600">
                    {getTotalOrders()}
                  </span>
                </div>
                {shopStats && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">
                      Order completion rate:
                    </span>
                    <span className="font-bold text-purple-600">
                      {shopStats.completionRate}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <svg
                className="w-12 h-12 text-gray-300 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="text-gray-500">Shop information not available</p>
              <p className="text-sm text-gray-400 mt-1">
                Please contact administrator
              </p>
            </div>
          )}
        </div>

        {/* Top Shop Performance Card */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
          {/* Quick Actions */}
          <div className="mt-6">
            <h3 className="font-medium text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/shop-manager/orders"
                className="flex items-center p-3 border rounded-lg hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    Manage Orders
                  </p>
                  <p className="text-xs text-gray-500">
                    View and manage all shop orders
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>

              <Link
                to="/shop-manager/users"
                className="flex items-center p-3 border rounded-lg hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors">
                  <svg
                    className="w-4 h-4 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    Manage Technicians
                  </p>
                  <p className="text-xs text-gray-500">
                    Create and manage technicians
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>

              <Link
                to="/shop-manager/analytics"
                className="flex items-center p-3 border rounded-lg hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    View Analytics
                  </p>
                  <p className="text-xs text-gray-500">
                    Check shop performance metrics
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
          <Link
            to="/shop-manager/orders"
            className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
          >
            View All
          </Link>
        </div>

        {shopOrders && shopOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RO #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shopOrders.slice(0, 5).map((order) => {
                  const vehicleInfo = order.vehicle_info || {};
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded-md">
                          #
                          {order.tekmetric_ro_id ||
                            order.id?.slice(0, 8) ||
                            "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.customer_name || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {vehicleInfo.year
                          ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            ["completed", "posted", "done"].includes(
                              order.status?.toLowerCase(),
                            )
                              ? "bg-green-100 text-green-800"
                              : ["pending", "estimate"].includes(
                                    order.status?.toLowerCase(),
                                  )
                                ? "bg-yellow-100 text-yellow-800"
                                : ["cancelled", "canceled"].includes(
                                      order.status?.toLowerCase(),
                                    )
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {order.status?.replace(/_/g, " ") || "In Progress"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-gray-500 italic">No orders found</p>
            <p className="text-sm text-gray-400 mt-1">
              Orders will appear here when created
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
