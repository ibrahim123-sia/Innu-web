import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams, useParams } from "react-router-dom";
import { getShopById } from "../../redux/slice/shopSlice";
import {
  getOrdersByShop,
} from "../../redux/slice/orderSlice";
import { getUsersByShopId } from "../../redux/slice/userSlice";
import { getVideosByShop } from "../../redux/slice/videoSlice";
import axios from 'axios';

const DEFAULT_PROFILE_PIC =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// Skeleton components (keep as is)
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

const Overview = () => {
  const [searchParams] = useSearchParams();
  const { shopId } = useParams();
  const dispatch = useDispatch();
  
  const userId = searchParams.get('userId');
  
  const [selectedShop, setSelectedShop] = useState(null);
  const [isBrandAdminMode, setIsBrandAdminMode] = useState(false);
  const [isDistrictManagerMode, setIsDistrictManagerMode] = useState(false);
  
  const [shopManager, setShopManager] = useState(null);
  
  const [myShop, setMyShop] = useState(null);
  const [shopOrders, setShopOrders] = useState([]);
  const [shopUsers, setShopUsers] = useState([]);
  const [shopVideos, setShopVideos] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [dailyOrders, setDailyOrders] = useState(0);
  const [shopStats, setShopStats] = useState(null);
  
  // Determine mode based on URL params
  useEffect(() => {
    console.log('ShopManagerOverview - Params:', { shopId, userId });
    
    if (shopId && !userId) {
      // Brand admin viewing a shop directly
      setIsBrandAdminMode(true);
      setIsDistrictManagerMode(false);
      const shop = localStorage.getItem('selectedShop');
      if (shop) {
        const parsedShop = JSON.parse(shop);
        if (parsedShop.id === shopId) {
          setSelectedShop(parsedShop);
          setLoadingUser(false);
          fetchShopData(shopId);
        } else {
          setLoadingUser(false);
          fetchShopData(shopId);
        }
      } else {
        setLoadingUser(false);
        fetchShopData(shopId);
      }
    } else if (userId) {
      // Someone is viewing a shop manager's page
      setIsBrandAdminMode(false);
      setIsDistrictManagerMode(true);
      fetchShopManagerData();
    } else {
      setLoadingUser(false);
    }
  }, [shopId, userId]);

  const fetchShopManagerData = async () => {
    setLoadingUser(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`http://localhost:5000/api/users/getUsers/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userData = response.data.data || response.data;
      console.log('Shop manager data:', userData);
      setShopManager(userData);
      setLoadingUser(false);
    } catch (error) {
      console.error('Error fetching shop manager:', error);
      setLoadingUser(false);
    }
  };

  // Once we have shop manager, fetch their shop data
  useEffect(() => {
    if (isDistrictManagerMode && shopManager?.shop_id) {
      console.log('Fetching shop data for shop_id:', shopManager.shop_id);
      fetchShopData(shopManager.shop_id);
    } else if (isDistrictManagerMode && !loadingUser && shopManager && !shopManager.shop_id) {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [shopManager, loadingUser, isDistrictManagerMode]);

  const fetchShopData = async (shopId) => {
    if (!shopId) return;
    
    setLoading(true);
    setIsInitialLoad(true);
    
    try {
      console.log('Fetching shop data for shopId:', shopId);
      
      const [shopResult, ordersResult, usersResult, videosResult] = await Promise.all([
        dispatch(getShopById(shopId)).unwrap(),
        dispatch(getOrdersByShop(shopId)).unwrap(),
        dispatch(getUsersByShopId(shopId)).unwrap(),
        dispatch(getVideosByShop(shopId)).unwrap()
      ]);
      
      const shopData = shopResult?.data || shopResult;
      console.log('Shop data fetched:', shopData);
      setMyShop(shopData);
      
      let ordersData = [];
      if (ordersResult?.data && Array.isArray(ordersResult.data)) {
        ordersData = ordersResult.data;
      } else if (Array.isArray(ordersResult)) {
        ordersData = ordersResult;
      }
      setShopOrders(ordersData);
      
      let usersData = [];
      if (usersResult?.data && Array.isArray(usersResult.data)) {
        usersData = usersResult.data;
      } else if (Array.isArray(usersResult)) {
        usersData = usersResult;
      }
      setShopUsers(usersData);
      
      let videosData = [];
      if (videosResult?.data && Array.isArray(videosResult.data)) {
        videosData = videosResult.data;
      } else if (Array.isArray(videosResult)) {
        videosData = videosResult;
      }
      setShopVideos(videosData);
      
      setIsDataReady(true);
      
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setIsInitialLoad(false), 300);
    }
  };

  useEffect(() => {
    calculateStats();
  }, [shopOrders, shopUsers, shopVideos, myShop]);

  const calculateStats = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const todayOrders = shopOrders?.filter((order) => {
      if (!order?.created_at) return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterday;
    }).length || 0;

    setDailyOrders(todayOrders);

    if (myShop && shopOrders && shopUsers) {
      const activeUsers = shopUsers.filter((user) => user.is_active).length;
      const completedOrders = shopOrders.filter((order) =>
        ["completed", "posted", "done"].includes(order.status?.toLowerCase()),
      ).length;

      setShopStats({
        activeUsers,
        completedOrders,
        completionRate: shopOrders.length > 0
          ? ((completedOrders / shopOrders.length) * 100).toFixed(1)
          : 0,
      });
    }
  };

  const getTotalEmployees = () => shopUsers?.filter((user) => user.is_active).length || 0;
  const getTotalOrders = () => shopOrders?.length || 0;
  
  const getCompletedOrders = () => shopOrders?.filter((order) =>
    ["completed", "posted", "done"].includes(order.status?.toLowerCase()),
  ).length || 0;
  
  const getActiveTechnicians = () => shopUsers?.filter(
    (user) => user.role === "technician" && user.is_active,
  ).length || 0;

  // Show loading while fetching user data
  if (loadingUser) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">
            {isBrandAdminMode ? "Loading shop data..." : "Loading shop manager data..."}
          </p>
        </div>
      </div>
    );
  }

  // Show message if no userId and no shopId
  if (!userId && !shopId) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <svg className="w-12 h-12 text-yellow-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">No Shop Selected</h3>
          <p className="text-yellow-700">Please select a shop to view.</p>
        </div>
      </div>
    );
  }

  // Show message if shop manager has no shop assigned
  if (isDistrictManagerMode && shopManager && !shopManager.shop_id) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center bg-orange-50 p-6 rounded-lg border border-orange-200">
          <svg className="w-12 h-12 text-orange-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-orange-800 mb-2">No Shop Assigned</h3>
          <p className="text-orange-700">This shop manager has not been assigned to any shop yet.</p>
        </div>
      </div>
    );
  }

  // Show skeleton during initial load
  if (isInitialLoad || (loading && !isDataReady)) {
    return (
      <div className="transition-opacity duration-300 ease-in-out">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
        </div>
        <StatsSkeleton />
        <ShopInfoSkeleton />
      </div>
    );
  }

  const shopName = myShop?.name || (selectedShop?.name || 'Your Shop');
  const shopCity = myShop?.city || (selectedShop?.city || '');

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
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Repair Orders</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {getTotalOrders()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {getCompletedOrders()} Posted
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Video Requests</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {shopVideos.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Videos processed by AI
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Daily Repair Orders</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {dailyOrders}
              </p>
              <p className="text-xs text-gray-400 mt-1">Last 24 hours</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Information Card */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Shop Information
            </h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Tekmetric ID: {myShop?.tekmetric_shop_id || (selectedShop?.tekmetric_shop_id || "N/A")}
            </span>
          </div>

          {myShop || selectedShop ? (
            <div className="border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Shop Name
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {myShop?.name || selectedShop?.name}
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Street Address
                    </label>
                    <p className="text-gray-600">
                      {myShop?.street_address || selectedShop?.street_address || "Not provided"}
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <p className="text-gray-600">
                      {myShop?.city || selectedShop?.city || "Not provided"}
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <p className="text-gray-600">
                      {myShop?.state || selectedShop?.state || "Not provided"}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                      (myShop?.is_active || selectedShop?.is_active)
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {(myShop?.is_active || selectedShop?.is_active) ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Created Date
                    </label>
                    <p className="text-gray-600">
                      {myShop?.created_at || selectedShop?.created_at
                        ? new Date(myShop?.created_at || selectedShop?.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
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
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-500">Shop information not available</p>
              <p className="text-sm text-gray-400 mt-1">
                Please contact administrator
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;