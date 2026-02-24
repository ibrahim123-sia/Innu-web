import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectAllBrands, getAllBrands } from "../../redux/slice/brandSlice";
import {
  getShopsByBrand,
  selectShopsByBrand,
} from "../../redux/slice/shopSlice";
import { getOrdersByBrand } from "../../redux/slice/orderSlice";

import { getAllVideos, selectVideos } from "../../redux/slice/videoSlice";
import { Link } from "react-router-dom";

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

const BrandShopsSummarySkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-8">
    <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-8"></div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-8"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TopBrandSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex justify-between items-center mb-4">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
      <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
    </div>
    <div className="border rounded-lg p-4">
      <div className="flex items-center space-x-4 mb-3">
        <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-40 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-100 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-12 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-12 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>
          </div>
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

const Overview = () => {
  const dispatch = useDispatch();
  const brands = useSelector(selectAllBrands);
  const shopsByBrand = useSelector(selectShopsByBrand);
  // ✅ Get videos from Redux state using correct selector from videoSlice
  const videos = useSelector(selectVideos);

  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [dailyOrders, setDailyOrders] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [videosByBrand, setVideosByBrand] = useState([]);
  const [topBrand, setTopBrand] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [totalShops, setTotalShops] = useState(0);
  const [activeShops, setActiveShops] = useState(0);

  useEffect(() => {
    if (videos && videos.length > 0) {
      // Set total video count
      setTotalVideos(videos.length);

      // Calculate videos by brand
      const videosByBrandMap = {};
      videos.forEach((video) => {
        if (video.brand_id) {
          if (!videosByBrandMap[video.brand_id]) {
            videosByBrandMap[video.brand_id] = {
              brand_id: video.brand_id,
              total_videos: 0,
            };
          }
          videosByBrandMap[video.brand_id].total_videos++;
        }
      });

      const videosByBrandArray = Object.values(videosByBrandMap);
      setVideosByBrand(videosByBrandArray);
    } else {
      setTotalVideos(0);
      setVideosByBrand([]);
    }
  }, [videos]);

  // Calculate shop stats whenever Redux shopsByBrand changes
  useEffect(() => {
    calculateShopStats(shopsByBrand);
  }, [shopsByBrand]);

  const fetchShopsForBrand = useCallback(
    async (brandId) => {
      try {
        console.log(`🔍 Fetching shops for brand: ${brandId}`);
        const result = await dispatch(getShopsByBrand(brandId));

        if (result.payload?.data?.data) {
          return result.payload.data.data;
        }
        return [];
      } catch (error) {
        console.error(`❌ Error fetching shops for brand ${brandId}:`, error);
        return [];
      }
    },
    [dispatch],
  );

  const calculateShopStats = useCallback((shopsData) => {
    let total = 0;
    let active = 0;

    if (!shopsData || Object.keys(shopsData).length === 0) {
      setTotalShops(0);
      setActiveShops(0);
      return;
    }

    Object.values(shopsData).forEach((shops) => {
      if (Array.isArray(shops)) {
        total += shops.length;
        active += shops.filter((shop) => shop?.is_active).length;
      }
    });

    setTotalShops(total);
    setActiveShops(active);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const calculateStats = useCallback(() => {
    // Calculate daily orders
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayOrders =
      allOrders?.filter((order) => {
        if (!order.created_at) return false;
        const orderDate = new Date(order.created_at);
        return orderDate >= yesterday;
      }).length || 0;

    setDailyOrders(todayOrders);

    // Find top brand based on video count
    console.log("Calculating top brand with:", {
      videos: videos,
      videosByBrand: videosByBrand,
      brands: brands,
    });

    if (videos && videos.length > 0 && brands && brands.length > 0) {
      // Calculate videos per brand directly from videos array
      const videoCountByBrand = {};
      videos.forEach((video) => {
        if (video.brand_id) {
          videoCountByBrand[video.brand_id] =
            (videoCountByBrand[video.brand_id] || 0) + 1;
        }
      });

      console.log("Video count by brand:", videoCountByBrand);

      // Find brand with most videos
      let topBrandId = null;
      let maxVideos = 0;

      Object.entries(videoCountByBrand).forEach(([brandId, count]) => {
        if (count > maxVideos) {
          maxVideos = count;
          topBrandId = brandId;
        }
      });

      if (topBrandId) {
        const brandInfo = brands.find(
          (b) => String(b.id) === String(topBrandId),
        );

        if (brandInfo) {
          setTopBrand({
            ...brandInfo,
            totalVideos: maxVideos,
            shopCount: shopsByBrand[brandInfo.id]?.length || 0,
            activeShopCount:
              shopsByBrand[brandInfo.id]?.filter((shop) => shop.is_active)
                .length || 0,
          });
        }
      } else {
        setTopBrand(null);
      }
    } else {
      console.log("No videos or brands available for top brand calculation");
      setTopBrand(null);
    }
  }, [allOrders, videos, brands, shopsByBrand, videosByBrand]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats, allOrders, videos, brands, shopsByBrand, videosByBrand]);

  const fetchData = async () => {
    setLoading(true);
    setIsInitialLoad(true);
    console.log("🚀 Fetching data...");
    try {
      // ✅ 1. Fetch all brands FIRST
      const brandsResult = await dispatch(getAllBrands());
      const brandsData = brandsResult.payload || brandsResult.data || [];

      // ✅ 2. Fetch ALL videos using correct thunk from videoSlice
      console.log("🎬 Fetching all videos...");
      const videosResult = await dispatch(getAllVideos());
      console.log("Videos API response:", videosResult);

      // ✅ 3. Fetch shops for each brand
      if (brandsData && brandsData.length > 0) {
        console.log("🏪 Fetching shops for each brand...");

        for (const brand of brandsData) {
          await fetchShopsForBrand(brand.id);
        }

        // ✅ 4. Fetch orders for each brand
        const ordersPromises = brandsData.map((brand) =>
          dispatch(getOrdersByBrand(brand.id)),
        );

        const ordersResponses = await Promise.all(ordersPromises);

        const combinedOrders = ordersResponses.reduce((acc, result) => {
          const orders = result.payload?.data || result.data || [];
          return [...acc, ...orders];
        }, []);

        setAllOrders(combinedOrders);
      }

      // Add a small delay to show skeletons
      setTimeout(() => setIsInitialLoad(false), 300);
      setIsDataReady(true);
    } catch (error) {
      console.error("💥 Error fetching data:", error);
      setIsInitialLoad(false);
    } finally {
      setLoading(false);
    }
  };

  const getTotalVideos = () => totalVideos || 0;
  const getShopCountForBrand = (brandId) => shopsByBrand[brandId]?.length || 0;
  const getActiveShopCountForBrand = (brandId) =>
    shopsByBrand[brandId]?.filter((shop) => shop.is_active).length || 0;

  // Debug logging
  useEffect(() => {
    console.log("📊 Current state:", {
      totalVideos: videos?.length,
      totalVideos,
      videosByBrandCount: videosByBrand?.length,
      brandsCount: brands?.length,
      totalShops,
      activeShops,
      dailyOrders,
      topBrand: topBrand,
    });
  }, [
    videos,
    totalVideos,
    videosByBrand,
    brands,
    totalShops,
    activeShops,
    dailyOrders,
    topBrand,
  ]);

  // Show skeleton during initial load
  if (isInitialLoad || (loading && !isDataReady)) {
    return (
      <div className="transition-opacity duration-300 ease-in-out">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
        </div>
        <StatsSkeleton />
        <BrandShopsSummarySkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TopBrandSkeleton />
          <QuickActionsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Brands Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary-blue hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Companies</h3>
              <p className="text-3xl font-bold text-primary-blue mt-2">
                {brands?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary-blue"
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

        {/* Total Videos Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total AI Videos</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {getTotalVideos()}
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

        {/* Daily Orders Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Daily Repair Orders</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {dailyOrders}
              </p>
              <p className="text-xs text-gray-400 mt-1">Last 24 hours</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
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

        {/* Active Shops Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Active Shops</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {activeShops}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Total: {totalShops} shops across {brands?.length || 0} companies
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
                  d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Shops Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 hover:shadow-lg transition-shadow duration-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Shops by Company
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands && brands.length > 0 ? (
            brands.slice(0, 6).map((brand) => (
              <div
                key={brand.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0">
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://cdn-icons-png.flaticon.com/512/891/891419.png";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50">
                        <svg
                          className="w-5 h-5 text-blue-300"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">
                      {brand.name}
                    </h3>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">Total Shops:</span>
                  <span className="font-bold text-primary-blue">
                    {getShopCountForBrand(brand.id)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">Active Shops:</span>
                  <span className="font-bold text-green-600">
                    {getActiveShopCountForBrand(brand.id)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500">No companies available</p>
            </div>
          )}
        </div>
        {brands && brands.length > 6 && (
          <div className="mt-4 text-center">
            <Link
              to="/super-admin/brands"
              className="text-sm text-primary-blue hover:text-blue-700 font-medium"
            >
              View all {brands.length} companies →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
