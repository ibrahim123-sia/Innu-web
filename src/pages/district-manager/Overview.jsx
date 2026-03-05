import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams, useParams, Link } from "react-router-dom";
import { getShopsByDistrict } from "../../redux/slice/shopSlice";
import { getOrdersByDistrict } from "../../redux/slice/orderSlice";
import {
  getVideosByDistrict,
  getVideosByShop,
} from "../../redux/slice/videoSlice";
import { getUsersByDistrict } from "../../redux/slice/userSlice";
import axios from "axios";

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

const ShopManagerCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
    <div className="flex items-center space-x-3 mb-3">
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-40"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded w-24"></div>
      <div className="h-3 bg-gray-200 rounded w-32"></div>
    </div>
  </div>
);

const TopShopSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-4"></div>
    <div className="border rounded-lg p-4">
      <div className="flex items-center space-x-4 mb-3">
        <div className="w-16 h-16 rounded-lg bg-gray-200 animate-pulse"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-100 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-8 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-12 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
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
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
          </div>
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  </div>
);

const ShopsListSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 mt-8">
    <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="border rounded-lg p-4 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="w-16 h-8 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="h-3 bg-gray-200 rounded w-20"></div>
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Overview = () => {
  const [searchParams] = useSearchParams();
  const { districtId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userId = searchParams.get("userId");
  const currentUser = useSelector((state) => state.user.currentUser);

  const activeUserId = userId || currentUser?.id;
  const isImpersonating = !!userId;

  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [isBrandAdminMode, setIsBrandAdminMode] = useState(false);

  const [districtManager, setDistrictManager] = useState(null);
  const [shops, setShops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [districtVideos, setDistrictVideos] = useState([]);
  
  const [shopVideosMap, setShopVideosMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [loadingUser, setLoadingUser] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (districtId && !userId) {
      setIsBrandAdminMode(true);
      const district = localStorage.getItem('selectedDistrict');
      if (district) {
        setSelectedDistrict(JSON.parse(district));
        setLoadingUser(false);
      } else {
        fetchDistrictById(districtId);
      }
    } else if (userId) {
      setIsBrandAdminMode(false);
      fetchDistrictManagerData();
    } else if (currentUser) {
      setDistrictManager(currentUser);
      setLoadingUser(false);
    }
  }, [districtId, userId, currentUser]);

  const fetchDistrictById = async (id) => {
    setLoadingUser(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/districts/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const districtData = response.data.data || response.data;
      setSelectedDistrict(districtData);
    } catch {
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchDistrictManagerData = async () => {
    setLoadingUser(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/users/getUsers/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const userData = response.data.data || response.data;
      setDistrictManager(userData);
    } catch {
    } finally {
      setLoadingUser(false);
    }
  };

  const getDistrictId = () => {
    if (isBrandAdminMode && selectedDistrict) {
      return selectedDistrict.id;
    }
    if (districtManager?.district_id) {
      return districtManager.district_id;
    }
    return null;
  };

  useEffect(() => {
    const districtId = getDistrictId();
    if (districtId) {
      fetchData(districtId);
    } else if (
      !loadingUser &&
      !isBrandAdminMode &&
      districtManager &&
      !districtManager.district_id
    ) {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [districtManager, selectedDistrict, loadingUser, isBrandAdminMode]);

  const fetchData = async (districtId) => {
    if (!districtId) return;

    setLoading(true);
    setIsInitialLoad(true);
    setDataFetched(false);

    try {
      const [shopsResult, ordersResult, usersResult] = await Promise.all([
        dispatch(getShopsByDistrict(districtId)).unwrap(),
        dispatch(getOrdersByDistrict(districtId)).unwrap(),
        dispatch(getUsersByDistrict(districtId)).unwrap(),
      ]);

      let shopsData = [];
      if (shopsResult?.data && Array.isArray(shopsResult.data)) {
        shopsData = shopsResult.data;
      } else if (Array.isArray(shopsResult)) {
        shopsData = shopsResult;
      } else if (shopsResult?.shops && Array.isArray(shopsResult.shops)) {
        shopsData = shopsResult.shops;
      }
      setShops(shopsData);

      let ordersData = [];
      if (ordersResult?.data && Array.isArray(ordersResult.data)) {
        ordersData = ordersResult.data;
      } else if (Array.isArray(ordersResult)) {
        ordersData = ordersResult;
      }
      setOrders(ordersData);

      let usersData = [];
      if (usersResult?.data && Array.isArray(usersResult.data)) {
        usersData = usersResult.data;
      } else if (Array.isArray(usersResult)) {
        usersData = usersResult;
      }
      setUsers(usersData);

      await fetchVideosForDistrict(districtId);
      await fetchAllShopVideos(shopsData);

      setDataFetched(true);
    } catch {
    } finally {
      setLoading(false);
      setTimeout(() => setIsInitialLoad(false), 300);
    }
  };

  const fetchVideosForDistrict = async (districtId) => {
    try {
      const result = await dispatch(getVideosByDistrict(districtId)).unwrap();

      let videosData = [];
      if (result?.data && Array.isArray(result.data)) {
        videosData = result.data;
      } else if (Array.isArray(result)) {
        videosData = result;
      }

      setDistrictVideos(videosData);
    } catch {
    }
  };

  const fetchAllShopVideos = async (shopsList) => {
    const videosByShop = {};

    for (const shop of shopsList) {
      try {
        const result = await dispatch(getVideosByShop(shop.id)).unwrap();
        const shopVideos = result?.data || (Array.isArray(result) ? result : []);
        videosByShop[shop.id] = shopVideos;
      } catch {
        videosByShop[shop.id] = [];
      }
    }

    setShopVideosMap(videosByShop);
  };

  const shopManagers = useMemo(() => {
    if (!users?.length) return [];
    return users.filter((user) => user.role === "shop_manager");
  }, [users]);

  const dailyOrders = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return orders.filter((order) => {
      if (!order?.created_at) return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterday;
    }).length;
  }, [orders]);

  const totalVideos = districtVideos.length;

  const totalShops = shops.length;
  const activeShops = shops.filter((shop) => shop.is_active).length;

  const handleOpenShop = (shop) => {
    localStorage.removeItem('selectedDistrict');
    localStorage.setItem('selectedShop', JSON.stringify(shop));
    
    if (isBrandAdminMode) {
      navigate(`/brand-admin/shops/${shop.id}`);
    } else {
      const shopManager = shopManagers.find(m => m.shop_id === shop.id);
      if (shopManager) {
        navigate(`/shop-manager?userId=${shopManager.id}`);
      } else {
        navigate(`/shop-manager?shopId=${shop.id}`);
      }
    }
  };

  const getProfilePicUrl = (profilePicData) => {
    if (!profilePicData) return "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    if (typeof profilePicData === "string") {
      if (profilePicData.startsWith("{")) {
        try {
          const parsed = JSON.parse(profilePicData);
          return parsed.publicUrl || parsed.signedUrl || parsed.filePath || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        } catch {
          return profilePicData;
        }
      }
      return profilePicData;
    }

    return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  };

  if (loadingUser) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">
            {isBrandAdminMode ? "Loading district data..." : "Loading district manager data..."}
          </p>
        </div>
      </div>
    );
  }

  if (!activeUserId && !isBrandAdminMode) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <svg className="w-12 h-12 text-yellow-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Not Logged In</h3>
          <p className="text-yellow-700">Please log in to access the district manager dashboard.</p>
        </div>
      </div>
    );
  }

  if (!isBrandAdminMode && districtManager && !districtManager.district_id) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center bg-orange-50 p-6 rounded-lg border border-orange-200">
          <svg className="w-12 h-12 text-orange-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-orange-800 mb-2">No District Assigned</h3>
          <p className="text-orange-700">This district manager has not been assigned to any district yet.</p>
        </div>
      </div>
    );
  }

  if (isInitialLoad || (loading && !dataFetched)) {
    return (
      <div className="p-6 transition-opacity duration-300 ease-in-out">
        <StatsSkeleton />
        <ShopsListSkeleton />
      </div>
    );
  }

  const getDisplayName = () => {
    if (isBrandAdminMode && selectedDistrict) {
      return selectedDistrict.name || "District";
    }
    if (districtManager) {
      return districtManager.district_name || "Your District";
    }
    return "District";
  };

  const districtName = getDisplayName();

  return (
    <div className="p-6 transition-opacity duration-300 ease-in-out">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Shops</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {totalShops}
              </p>
              <p className="text-xs text-gray-400 mt-1">{activeShops} active</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Video Requests</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {totalVideos}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Daily Repair Orders</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">
                {dailyOrders}
              </p>
              <p className="text-xs text-gray-400 mt-1">Last 24 hours</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Shop Managers</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {shopManagers.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Managing {totalShops} shops
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8 hover:shadow-lg transition-shadow duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Shops in {districtName}
          </h2>
          <Link
            to={isBrandAdminMode 
              ? `/brand-admin/districts/${selectedDistrict?.id}/shops` 
              : `/district-manager/shops?userId=${activeUserId}`}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            View All Shops
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {shops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shops.map((shop) => {
              const shopVideos = shopVideosMap[shop.id] || [];
              const aiRequests = shopVideos.filter(v => 
                ["completed", "processing"].includes(v?.status)
              ).length;
              
              const shopManager = shopManagers.find(m => m.shop_id === shop.id);

              return (
                <div key={shop.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl">
                        {shop.name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{shop.name}</h3>
                        <p className="text-xs text-gray-500">
                          {shop.city}{shop.state ? `, ${shop.state}` : ''}
                        </p>
                        {shopManager && (
                          <p className="text-xs text-green-600 mt-1">
                            Manager: {shopManager.name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleOpenShop(shop)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center transition-colors"
                      title="Open Shop Overview"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open
                    </button>
                  </div>

                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      shop.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {shop.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {aiRequests > 0 && (
                    <div className="mt-2 flex justify-between items-center text-sm">
                      <span className="text-gray-600">AI Videos:</span>
                      <span className="font-bold text-red-600">{aiRequests}</span>
                    </div>
                  )}

                  {shop.tekmetric_shop_id && (
                    <div className="mt-2 text-xs text-gray-400">
                      Tekmetric ID: {shop.tekmetric_shop_id}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-gray-500">No shops found in this district</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;