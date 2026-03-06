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
  const currentUser = useSelector((state) => state.user.currentUser);
  
  const userId = searchParams.get('userId');
  const isImpersonating = !!userId;
  
  const [shopManager, setShopManager] = useState(null);
  const [myShop, setMyShop] = useState(null);
  const [shopOrders, setShopOrders] = useState([]);
  const [shopUsers, setShopUsers] = useState([]);
  const [shopVideos, setShopVideos] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingUser, setLoadingUser] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [dailyOrders, setDailyOrders] = useState(0);
  const [shopStats, setShopStats] = useState(null);

  // Determine which shop ID to use
  const effectiveShopId = shopId || currentUser?.shop_id;

  useEffect(() => {
    if (userId) {
      // Impersonation mode - fetch the user being impersonated
      fetchShopManagerData();
    } else if (effectiveShopId) {
      // Normal mode - fetch shop data directly
      fetchShopData(effectiveShopId);
    } else {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [userId, effectiveShopId]); // Added proper dependencies

  const fetchShopManagerData = async () => {
    setLoadingUser(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/users/getUsers/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userData = response.data.data || response.data;
      setShopManager(userData);
      
      if (userData?.shop_id) {
        fetchShopData(userData.shop_id);
      } else {
        setLoading(false);
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('Error fetching shop manager:', error);
      setLoading(false);
      setIsInitialLoad(false);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchShopData = async (shopIdToFetch) => {
    if (!shopIdToFetch) return;
    
    setLoading(true);
    setIsInitialLoad(true);
    setDataFetched(false);
    
    try {
      const [shopResult, ordersResult, usersResult, videosResult] = await Promise.allSettled([
        dispatch(getShopById(shopIdToFetch)).unwrap(),
        dispatch(getOrdersByShop(shopIdToFetch)).unwrap(),
        dispatch(getUsersByShopId(shopIdToFetch)).unwrap(),
        dispatch(getVideosByShop(shopIdToFetch)).unwrap()
      ]);
      
      // Handle shop data
      if (shopResult.status === 'fulfilled') {
        const shopData = shopResult.value?.data || shopResult.value;
        setMyShop(shopData);
        
        // Store shop in localStorage for layout (only if not impersonating or if it's the correct context)
        if (shopData && !userId) {
          localStorage.setItem('selectedShop', JSON.stringify(shopData));
        }
      }
      
      // Handle orders data
      if (ordersResult.status === 'fulfilled') {
        let ordersData = [];
        const ordersValue = ordersResult.value;
        if (ordersValue?.data && Array.isArray(ordersValue.data)) {
          ordersData = ordersValue.data;
        } else if (Array.isArray(ordersValue)) {
          ordersData = ordersValue;
        }
        setShopOrders(ordersData);
      }
      
      // Handle users data
      if (usersResult.status === 'fulfilled') {
        let usersData = [];
        const usersValue = usersResult.value;
        if (usersValue?.data && Array.isArray(usersValue.data)) {
          usersData = usersValue.data;
        } else if (Array.isArray(usersValue)) {
          usersData = usersValue;
        }
        setShopUsers(usersData);
      }
      
      // Handle videos data
      if (videosResult.status === 'fulfilled') {
        let videosData = [];
        const videosValue = videosResult.value;
        if (videosValue?.data && Array.isArray(videosValue.data)) {
          videosData = videosValue.data;
        } else if (Array.isArray(videosValue)) {
          videosData = videosValue;
        }
        setShopVideos(videosData);
      }
      
      setDataFetched(true);
      
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

  // Show loading state for user data
  if (loadingUser) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Show error if no shop ID available
  if (!effectiveShopId) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <svg className="w-12 h-12 text-yellow-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">No Shop Selected</h3>
          <p className="text-yellow-700">Unable to load shop data. Please try again or contact support.</p>
        </div>
      </div>
    );
  }

  // Show skeleton loading
  if (isInitialLoad || (loading && !dataFetched)) {
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

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      {/* Impersonation Banner - Show when viewing as different user */}
      {isImpersonating && shopManager && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-bold">Impersonation Mode:</span> You are viewing the shop as{' '}
                {shopManager.first_name} {shopManager.last_name} ({shopManager.email})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
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
                {getCompletedOrders()} Completed
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
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                      myShop.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {myShop.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Created Date
                    </label>
                    <p className="text-gray-600">
                      {myShop.created_at
                        ? new Date(myShop.created_at).toLocaleDateString("en-US", {
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
              <p className="text-gray-500">No shop information available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;