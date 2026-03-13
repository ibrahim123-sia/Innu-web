import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import {
  getShopsByBrand,
  selectShopsForBrand,
  selectShopLoading,
} from "../../redux/slice/shopSlice";

import {
  getOrdersByBrand,
  selectOrdersByBrand,
  selectOrderLoading,
} from "../../redux/slice/orderSlice";

import {
  getVideosByBrand,
  getVideosByShop,
  selectVideos,
  selectVideoLoading,
} from "../../redux/slice/videoSlice";

import {
  selectEditDetailsList,
  selectBrandEditDetails,
  getAllEditDetails,
  getEditDetailsByBrand,
  selectTotalEditCount,
} from "../../redux/slice/videoEditSlice";

import {
  getDistrictsByBrand,
  selectDistrictsByBrand,
  selectDistrictLoading,
} from "../../redux/slice/districtSlice";

const DEFAULT_PROFILE_PIC =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const DEFAULT_SHOP_LOGO = 'https://storage.googleapis.com/innu-video-app/brand_logo/logo.png';

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

const DistrictsSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-8">
    <div className="flex justify-between items-center mb-4">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
              </div>
            </div>
            <div className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="mt-3 border-t pt-3">
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
              <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Overview = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.currentUser);
  const brandId = user?.brand_id;

  const shops = useSelector(selectShopsForBrand(brandId));
  const brandOrders = useSelector(selectOrdersByBrand);
  const allVideos = useSelector(selectVideos);
  const [brandVideos, setBrandVideos] = useState([]);
  const [shopVideosMap, setShopVideosMap] = useState({});
  const [loadingBrandData, setLoadingBrandData] = useState(false);

  const districts = useSelector(selectDistrictsByBrand);
  const [shopsByDistrict, setShopsByDistrict] = useState({});

  const allEditDetails = useSelector(selectEditDetailsList);
  const brandEditDetails = useSelector(selectBrandEditDetails);
  const totalEditCount = useSelector(selectTotalEditCount);

  const shopsLoading = useSelector(selectShopLoading);
  const ordersLoading = useSelector(selectOrderLoading);
  const videosLoading = useSelector(selectVideoLoading);
  const districtsLoading = useSelector(selectDistrictLoading);

  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [dailyOrders, setDailyOrders] = useState(0);
  const [topShop, setTopShop] = useState(null);

  const isLoading =
    loading ||
    shopsLoading ||
    ordersLoading ||
    videosLoading ||
    loadingBrandData ||
    districtsLoading;

  useEffect(() => {
    if (brandId) {
      fetchData();
    }
  }, [brandId]);

  const fetchData = async () => {
    if (!brandId) return;

    setLoading(true);
    setIsInitialLoad(true);

    try {
      await dispatch(getShopsByBrand(brandId));
      await dispatch(getOrdersByBrand(brandId));
      await fetchBrandVideos(brandId);
      await dispatch(getAllEditDetails());
      await dispatch(getEditDetailsByBrand(brandId));
      await dispatch(getDistrictsByBrand(brandId));

      setTimeout(() => setIsInitialLoad(false), 300);
      setIsDataReady(true);
    } catch {
      setIsInitialLoad(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandVideos = async (brandId) => {
    setLoadingBrandData(true);
    try {
      const result = await dispatch(getVideosByBrand(brandId)).unwrap();
      const videosData = Array.isArray(result) ? result : [];
      setBrandVideos(videosData);

      if (shops?.length) {
        await fetchAllShopVideos(shops);
      }
    } catch {
      setBrandVideos([]);
    } finally {
      setLoadingBrandData(false);
    }
  };

  const fetchAllShopVideos = async (shopsList) => {
    const videosByShop = {};

    for (const shop of shopsList) {
      try {
        const result = await dispatch(getVideosByShop(shop.id)).unwrap();
        const shopVideos =
          result?.data || (Array.isArray(result) ? result : []);
        videosByShop[shop.id] = shopVideos;
      } catch {
        videosByShop[shop.id] = [];
      }
    }

    setShopVideosMap(videosByShop);
  };

  useEffect(() => {
    if (districts?.length && shops?.length) {
      organizeShopsByDistrict();
    }
  }, [districts, shops]);

  const organizeShopsByDistrict = useCallback(() => {
    const shopsByDistrictMap = {};

    districts.forEach((district) => {
      shopsByDistrictMap[district.id] = [];
    });

    shops.forEach((shop) => {
      if (shop.district_id && shopsByDistrictMap[shop.district_id]) {
        shopsByDistrictMap[shop.district_id].push(shop);
      }
    });

    setShopsByDistrict(shopsByDistrictMap);
  }, [districts, shops]);

  useEffect(() => {
    if (shops?.length && brandVideos?.length) {
      calculateShopVideosMap();
    }
  }, [shops, brandVideos]);

  const calculateShopVideosMap = useCallback(() => {
    const videosByShop = {};

    shops.forEach((shop) => {
      const shopVideos = brandVideos.filter(
        (video) => video.shop_id === shop.id,
      );
      videosByShop[shop.id] = shopVideos || [];
    });

    setShopVideosMap(videosByShop);
  }, [shops, brandVideos]);

  useEffect(() => {
    if (!isLoading && shops?.length) {
      calculateStats();
    }
  }, [shops, brandOrders, shopVideosMap, brandVideos, isLoading]);

  const calculateStats = useCallback(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayOrders =
      brandOrders?.filter((order) => {
        if (!order?.created_at) return false;
        const orderDate = new Date(order.created_at);
        return orderDate >= yesterday;
      }).length || 0;

    setDailyOrders(todayOrders);

    if (shops?.length && Object.keys(shopVideosMap).length) {
      const shopsWithVideoCounts = shops.map((shop) => {
        const shopVideos = shopVideosMap[shop.id] || [];
        const aiVideoRequests = shopVideos.filter((video) =>
          ["completed", "processing"].includes(video?.status),
        ).length;

        return {
          ...shop,
          aiVideoRequests,
          totalVideos: shopVideos.length,
        };
      });

      const sortedShops = [...shopsWithVideoCounts].sort(
        (a, b) => (b.aiVideoRequests || 0) - (a.aiVideoRequests || 0),
      );

      setTopShop(
        sortedShops[0] ||
          (shops[0]
            ? {
                ...shops[0],
                aiVideoRequests: 0,
                totalVideos: 0,
              }
            : null),
      );
    }
  }, [brandOrders, shops, shopVideosMap]);

  const brandEditStats = useMemo(() => {
    if (!brandId) return null;

    const brandEdits =
      allEditDetails?.filter((edit) => edit.brand_id === brandId) || [];
    const brandSpecificEdits =
      brandEditDetails?.filter((edit) => edit.brand_id === brandId) || [];
    const totalBrandEdits = brandEdits.length + brandSpecificEdits.length;

    const aiCorrect = brandEdits.filter(
      (edit) => edit.feedback_reason === "correct",
    ).length;
    const aiErrors = brandEdits.filter(
      (edit) => edit.feedback_reason === "incorrect",
    ).length;

    return {
      totalEdits: totalBrandEdits,
      aiCorrect,
      aiErrors,
      aiSuccessRate:
        totalBrandEdits > 0
          ? ((aiCorrect / totalBrandEdits) * 100).toFixed(1)
          : "0.00",
      aiErrorRate:
        totalBrandEdits > 0
          ? ((aiErrors / totalBrandEdits) * 100).toFixed(1)
          : "0.00",
      totalSegments: brandEdits.length + brandSpecificEdits.length,
    };
  }, [brandId, allEditDetails, brandEditDetails]);

  const videoStats = useMemo(() => {
    if (!brandVideos?.length) {
      return {
        total: 0,
        byStatus: {},
        byStatusPercentage: {},
        recentUploads: 0,
        recentUploadsPercentage: 0,
      };
    }

    const byStatus = {};
    brandVideos.forEach((video) => {
      const status = video.status || "unknown";
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    const byStatusPercentage = {};
    Object.entries(byStatus).forEach(([status, count]) => {
      byStatusPercentage[status] = ((count / brandVideos.length) * 100).toFixed(
        1,
      );
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUploads = brandVideos.filter((video) => {
      if (!video.created_at) return false;
      const createdDate = new Date(video.created_at);
      return createdDate >= sevenDaysAgo;
    }).length;

    const recentUploadsPercentage =
      brandVideos.length > 0
        ? ((recentUploads / brandVideos.length) * 100).toFixed(1)
        : 0;

    return {
      total: brandVideos.length,
      byStatus,
      byStatusPercentage,
      recentUploads,
      recentUploadsPercentage,
    };
  }, [brandVideos]);

  const dashboardSummary = useMemo(() => {
    if (!brandVideos?.length) {
      return {
        total: 0,
        uploaded: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        today: 0,
        yesterday: 0,
        lastWeek: 0,
      };
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const isToday = (date) => {
      if (!date) return false;
      const videoDate = new Date(date);
      return videoDate.toDateString() === today.toDateString();
    };

    const isYesterday = (date) => {
      if (!date) return false;
      const videoDate = new Date(date);
      return videoDate.toDateString() === yesterday.toDateString();
    };

    const isLastWeek = (date) => {
      if (!date) return false;
      const videoDate = new Date(date);
      return videoDate >= lastWeek && videoDate < today;
    };

    return {
      total: brandVideos.length,
      uploaded: brandVideos.filter((v) => v.status === "uploading").length,
      processing: brandVideos.filter((v) => v.status === "processing").length,
      completed: brandVideos.filter((v) =>
        ["completed", "pending"].includes(v.status),
      ).length,
      failed: brandVideos.filter((v) => v.status === "failed").length,
      today: brandVideos.filter((v) => isToday(v.created_at)).length,
      yesterday: brandVideos.filter((v) => isYesterday(v.created_at)).length,
      lastWeek: brandVideos.filter((v) => isLastWeek(v.created_at)).length,
    };
  }, [brandVideos]);

  const brandVideoRequestsCount = brandVideos?.length || 0;
  const totalShops = shops?.length || 0;
  const totalDistricts = districts?.length || 0;
  const activeShops = useMemo(
    () => shops?.filter((shop) => shop.is_active).length || 0,
    [shops],
  );

  const shopsWithAIRequests = useMemo(() => {
    if (!Object.keys(shopVideosMap).length) return 0;
    return Object.keys(shopVideosMap).filter((shopId) => {
      const shopVideos = shopVideosMap[shopId] || [];
      return shopVideos.some((video) =>
        ["completed", "processing"].includes(video?.status),
      );
    }).length;
  }, [shopVideosMap]);

  const activeShopsPercentage = useMemo(
    () =>
      totalShops > 0 ? ((activeShops / totalShops) * 100).toFixed(1) : "0.0",
    [activeShops, totalShops],
  );

  const totalOrders = brandOrders?.length || 0;

  const completedOrders = useMemo(
    () =>
      brandOrders?.filter((order) => {
        if (!order?.status) return false;
        const status = order.status.toLowerCase();
        return ["posted", "completed", "done"].includes(status);
      }).length || 0,
    [brandOrders],
  );

  const pendingOrders = useMemo(
    () =>
      brandOrders?.filter((order) => {
        if (!order?.status) return false;
        const status = order.status.toLowerCase();
        return ["estimate", "pending"].includes(status);
      }).length || 0,
    [brandOrders],
  );

  const inProgressOrders = useMemo(
    () =>
      brandOrders?.filter((order) => {
        if (!order?.status) return false;
        const status = order.status.toLowerCase();
        return [
          "work-in-progress",
          "in_progress",
          "processing",
          "in progress",
        ].includes(status);
      }).length || 0,
    [brandOrders],
  );

  const getProfilePicUrl = (profilePicData) => {
    if (!profilePicData) return DEFAULT_PROFILE_PIC;

    if (typeof profilePicData === "string") {
      if (profilePicData.startsWith("{")) {
        try {
          const parsed = JSON.parse(profilePicData);
          return (
            parsed.publicUrl ||
            parsed.signedUrl ||
            parsed.filePath ||
            DEFAULT_PROFILE_PIC
          );
        } catch {
          return profilePicData;
        }
      }
      return profilePicData;
    }

    return DEFAULT_PROFILE_PIC;
  };

  // Function to get shop image URL
  const getShopImageUrl = (shop) => {
    if (shop.logo_url) {
      return shop.logo_url;
    }
    return DEFAULT_SHOP_LOGO;
  };

  const openShopPage = (shop) => {
    localStorage.setItem("selectedShop", JSON.stringify(shop));
    navigate(`/brand-admin/shops/${shop.id}`);
  };

  if (isInitialLoad || (loading && !isDataReady)) {
    return (
      <div className="transition-opacity duration-300 ease-in-out">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
        </div>
        <StatsSkeleton />
        <DistrictsSkeleton />
      </div>
    );
  }

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Shops</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {totalShops}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {activeShops} active ({activeShopsPercentage}%)
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
                  d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Districts</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {totalDistricts}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Video Requests</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {brandVideoRequestsCount}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {shopsWithAIRequests}{" "}
                {shopsWithAIRequests === 1 ? "shop" : "shops"} with videos
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
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

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Repair Orders</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {totalOrders}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {completedOrders} completed • {inProgressOrders} in progress
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8 hover:shadow-lg transition-shadow duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Shops</h2>
          <Link
            to="/brand-admin/districts"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            Manage Districts
            <svg
              className="w-4 h-4 ml-1"
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

        {districtsLoading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading districts...</p>
          </div>
        ) : districts?.length ? (
          <div className="space-y-6">
            {districts.map((district) => {
              const districtShops = shopsByDistrict[district.id] || [];

              return (
                <div
                  key={district.id}
                  className="border rounded-lg overflow-hidden bg-white"
                >
                  {/* District Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {district.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {district.city}
                          {district.state ? `, ${district.state}` : ""}
                        </p>
                      </div>
                      <div className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                        {districtShops.length}{" "}
                        {districtShops.length === 1 ? "Shop" : "Shops"}
                      </div>
                    </div>
                  </div>

                  {/* Shops List - Updated with exact reference design and shop images */}
                  <div className="p-4">
                    {districtShops.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {districtShops.map((shop) => {
                          const shopVideos = shopVideosMap[shop.id] || [];
                          const aiRequests = shopVideos.filter(v => 
                            ["completed", "processing"].includes(v?.status)
                          ).length;

                          return (
                            <div 
                              key={shop.id} 
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  {/* Shop Image - Using logo_url or default */}
                                  <img
                                    src={getShopImageUrl(shop)}
                                    alt={shop.name}
                                    className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = DEFAULT_SHOP_LOGO;
                                    }}
                                  />
                                  <div>
                                    <h3 className="font-medium text-gray-800">{shop.name}</h3>
                                    <p className="text-xs text-gray-500">
                                      {shop.city}{shop.state ? `, ${shop.state}` : ''}
                                    </p>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => openShopPage(shop)}
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
                                <div className="mt-2 flex items-center text-xs text-red-600 bg-red-50 rounded-md px-2 py-1">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  {aiRequests} AI Request{aiRequests !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <svg
                          className="w-10 h-10 text-gray-300 mx-auto mb-2"
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
                        <p className="text-sm text-gray-500">
                          No shops in this district
                        </p>
                        <Link
                          to="/brand-admin/shops/add"
                          className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                        >
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Add a shop
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <p className="text-gray-500 text-lg">No districts found</p>
            <p className="text-sm text-gray-400 mt-1">
              Create a district to start adding shops
            </p>
            <Link
              to="/brand-admin/districts/add"
              className="mt-4 inline-flex items-center text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create your first district
            </Link>
          </div>
        )}

        {districts?.length > 6 && (
          <div className="mt-6 text-center">
            <Link
              to="/brand-admin/districts"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
            >
              View all {districts.length} districts
              <svg
                className="w-4 h-4 ml-1"
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
        )}
      </div>
    </div>
  );
};

export default Overview;