import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

// Shop selectors
import {
  getShopsByBrand,
  selectShopsForBrand,
  selectShopLoading,
} from "../../redux/slice/shopSlice";

// District selectors
import {
  getDistrictsByBrand,
  selectDistrictsByBrand,
  selectDistrictLoading,
} from "../../redux/slice/districtSlice";

// User selectors
import {
  getBrandUsers,
  selectBrandUsers,
  selectUserLoading,
} from "../../redux/slice/userSlice";

// Order selectors
import {
  getOrdersByBrand,
  selectOrdersByBrand,
  selectOrderLoading,
} from "../../redux/slice/orderSlice";

// ✅ CORRECT VIDEO SLICE IMPORTS
import {
  getVideosByBrand,
  getVideosByShop,
  selectVideos,
  selectVideoLoading,
} from "../../redux/slice/videoSlice";

// ✅ VIDEO EDIT SLICE IMPORTS
import {
  selectEditDetailsList,
  selectBrandEditDetails,
  getAllEditDetails,
  getEditDetailsByBrand,
  selectTotalEditCount,
} from "../../redux/slice/videoEditSlice";

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

const DistrictCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-5 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div>
          <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="flex space-x-2">
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-8"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex justify-between">
        <div className="h-3 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
    </div>
  </div>
);

const ShopsSummarySkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-8">
    <div className="flex justify-between items-center mb-4">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
            </div>
            <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-8"></div>
          </div>
          <div className="flex justify-end mt-3">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TopShopSkeleton = () => (
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
          <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mt-1"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-100 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-12 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-100 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-12 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const QuickActionsSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mb-4"></div>
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center p-4 border rounded-lg">
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse mr-4"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-48"></div>
          </div>
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
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
  const brandName = user?.brand_name || 'Your Brand';

  // ✅ Shops from shopSlice
  const shops = useSelector(selectShopsForBrand(brandId)) || [];

  // ✅ Districts from districtSlice
  const districts = useSelector(selectDistrictsByBrand) || [];
  const districtsLoading = useSelector(selectDistrictLoading);

  // ✅ Users from userSlice
  const users = useSelector(selectBrandUsers) || [];
  const usersLoading = useSelector(selectUserLoading);

  // ✅ Orders from orderSlice
  const brandOrders = useSelector(selectOrdersByBrand) || [];

  // ✅ Videos from videoSlice (global)
  const allVideos = useSelector(selectVideos) || [];

  // ✅ Local state for brand-specific videos
  const [brandVideos, setBrandVideos] = useState([]);
  const [shopVideosMap, setShopVideosMap] = useState({});
  const [loadingBrandData, setLoadingBrandData] = useState(false);

  // ✅ Video Edit stats
  const allEditDetails = useSelector(selectEditDetailsList) || [];
  const brandEditDetails = useSelector(selectBrandEditDetails) || [];
  const totalEditCount = useSelector(selectTotalEditCount);

  // UI state for districts dropdown
  const [expandedDistrict, setExpandedDistrict] = useState(null);
  const [expandedShop, setExpandedShop] = useState(null);
  const [districtManagers, setDistrictManagers] = useState({});
  const [shopManagers, setShopManagers] = useState({});
  const [shopsByDistrict, setShopsByDistrict] = useState({});

  // Loading states
  const shopsLoading = useSelector(selectShopLoading);
  const ordersLoading = useSelector(selectOrderLoading);
  const videosLoading = useSelector(selectVideoLoading);

  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [dailyOrders, setDailyOrders] = useState(0);
  const [topShop, setTopShop] = useState(null);

  // Combined loading state
  const isLoading =
    loading ||
    shopsLoading ||
    ordersLoading ||
    videosLoading ||
    districtsLoading ||
    usersLoading ||
    loadingBrandData;

  // Fetch all data
  useEffect(() => {
    if (brandId) {
      fetchData();
    }
  }, [brandId]);

  const fetchData = async () => {
    if (!brandId) return;

    setLoading(true);
    setIsInitialLoad(true);
    console.log("🚀 Fetching brand data for brand:", brandId);
    try {
      // ✅ 1. Fetch shops for this brand
      console.log("🏪 Fetching shops for brand:", brandId);
      await dispatch(getShopsByBrand(brandId));

      // ✅ 2. Fetch districts for this brand
      console.log("🗺️ Fetching districts for brand:", brandId);
      await dispatch(getDistrictsByBrand(brandId));

      // ✅ 3. Fetch users for this brand
      console.log("👥 Fetching users for brand:", brandId);
      await dispatch(getBrandUsers(brandId));

      // ✅ 4. Fetch orders for this brand
      console.log("📦 Fetching orders for brand:", brandId);
      await dispatch(getOrdersByBrand(brandId));

      // ✅ 5. Fetch videos for this brand
      console.log("🎬 Fetching videos for brand:", brandId);
      await fetchBrandVideos(brandId);

      // ✅ 6. Fetch all edit details for video stats
      console.log("📊 Fetching video edit details...");
      await dispatch(getAllEditDetails());

      // ✅ 7. Fetch brand-specific edit details
      console.log("📊 Fetching brand edit details for:", brandId);
      await dispatch(getEditDetailsByBrand(brandId));

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

  // Fetch brand-specific videos
  const fetchBrandVideos = async (brandId) => {
    setLoadingBrandData(true);
    try {
      const result = await dispatch(getVideosByBrand(brandId)).unwrap();
      console.log("✅ Brand videos fetched:", result);

      const videosData = Array.isArray(result) ? result : [];
      setBrandVideos(videosData);

      if (shops && shops.length > 0) {
        await fetchAllShopVideos(shops);
      }
    } catch (error) {
      console.error(`Error fetching videos for brand ${brandId}:`, error);
      setBrandVideos([]);
    } finally {
      setLoadingBrandData(false);
    }
  };

  // Fetch videos for each shop
  const fetchAllShopVideos = async (shopsList) => {
    const videosByShop = {};

    for (const shop of shopsList) {
      try {
        const result = await dispatch(getVideosByShop(shop.id)).unwrap();
        const shopVideos =
          result?.data || (Array.isArray(result) ? result : []);
        videosByShop[shop.id] = shopVideos;
      } catch (error) {
        console.error(`Error fetching videos for shop ${shop.id}:`, error);
        videosByShop[shop.id] = [];
      }
    }

    setShopVideosMap(videosByShop);
  };

  // Organize data by districts and roles
  useEffect(() => {
    if (users?.length > 0 && districts?.length > 0 && shops?.length > 0) {
      // Group district managers by district
      const managersByDistrict = {};
      const managersByShop = {};
      
      // First, find all district managers
      const districtManagersList = users.filter(u => u.role === 'district_manager');
      
      // Assign district managers to districts (assuming district_id field exists on user)
      districtManagersList.forEach(manager => {
        if (manager.district_id) {
          if (!managersByDistrict[manager.district_id]) {
            managersByDistrict[manager.district_id] = [];
          }
          managersByDistrict[manager.district_id].push(manager);
        }
      });
      
      // Find all shop managers
      const shopManagersList = users.filter(u => u.role === 'shop_manager');
      
      // Assign shop managers to shops
      shopManagersList.forEach(manager => {
        if (manager.shop_id) {
          if (!managersByShop[manager.shop_id]) {
            managersByShop[manager.shop_id] = [];
          }
          managersByShop[manager.shop_id].push(manager);
        }
      });
      
      setDistrictManagers(managersByDistrict);
      setShopManagers(managersByShop);
      
      // Group shops by district
      const shopsByDistrictMap = {};
      shops.forEach(shop => {
        if (shop.district_id) {
          if (!shopsByDistrictMap[shop.district_id]) {
            shopsByDistrictMap[shop.district_id] = [];
          }
          shopsByDistrictMap[shop.district_id].push(shop);
        }
      });
      setShopsByDistrict(shopsByDistrictMap);
    }
  }, [users, districts, shops]);

  // Calculate shop videos map when shops and brandVideos are loaded
  useEffect(() => {
    if (shops?.length > 0 && brandVideos?.length > 0) {
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

    console.log(
      "🏪 Shop videos map:",
      Object.keys(videosByShop).length,
      "shops with videos",
    );
    setShopVideosMap(videosByShop);
  }, [shops, brandVideos]);

  // Calculate stats when data changes
  useEffect(() => {
    if (!isLoading && shops?.length > 0) {
      calculateStats();
    }
  }, [shops, brandOrders, shopVideosMap, brandVideos, isLoading]);

  const calculateStats = useCallback(() => {
    // Calculate daily orders (last 24 hours)
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

    // Find top shop with most videos
    if (shops?.length > 0 && Object.keys(shopVideosMap).length > 0) {
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

  // Calculate video stats
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

  // ✅ Memoized derived values
  const brandVideoRequestsCount = brandVideos?.length || 0;

  const totalShops = shops?.length || 0;

  const activeShops = useMemo(
    () => shops?.filter((shop) => shop.is_active).length || 0,
    [shops],
  );

  const shopsWithAIRequests = useMemo(() => {
    if (Object.keys(shopVideosMap).length === 0) return 0;

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

  // Count district managers and shop managers
  const districtManagersCount = useMemo(
    () => users?.filter(u => u.role === 'district_manager').length || 0,
    [users]
  );

  const shopManagersCount = useMemo(
    () => users?.filter(u => u.role === 'shop_manager').length || 0,
    [users]
  );

  // Handle district open - Navigate to District Manager Portal
  const handleOpenDistrict = (districtId) => {
    const district = districts.find(d => d.id === districtId);
    navigate(`/district-manager`, { 
      state: { 
        districtId,
        districtName: district?.name,
        fromBrand: true
      } 
    });
  };

  // Handle shop open - Navigate to Shop Manager Portal
  const handleOpenShop = (shopId) => {
    const shop = shops.find(s => s.id === shopId);
    navigate(`/shop-manager`, { 
      state: { 
        shopId,
        shopName: shop?.name,
        fromBrand: true
      } 
    });
  };

  // Toggle district dropdown
  const toggleDistrictDropdown = (districtId) => {
    setExpandedDistrict(expandedDistrict === districtId ? null : districtId);
    setExpandedShop(null); // Close any open shop dropdowns
  };

  // Toggle shop dropdown
  const toggleShopDropdown = (shopId) => {
    setExpandedShop(expandedShop === shopId ? null : shopId);
  };

  // Get profile picture URL
  const getProfilePicUrl = (profilePicData) => {
    if (!profilePicData) return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    
    if (typeof profilePicData === 'string') {
      if (profilePicData.startsWith('{')) {
        try {
          const parsed = JSON.parse(profilePicData);
          return parsed.publicUrl || parsed.signedUrl || parsed.filePath || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        } catch (e) {
          return profilePicData;
        }
      }
      return profilePicData;
    }
    
    return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
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
        
        {/* Districts Section Skeleton */}
        <div className="mt-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
            <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <DistrictCardSkeleton key={i} />)}
          </div>
        </div>
        
        <ShopsSummarySkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TopShopSkeleton />
          <QuickActionsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Shops Card */}
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

        {/* AI Video Requests Card */}
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

        {/* Daily Orders Card */}
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
              <svg
                className="w-6 h-6 text-indigo-600"
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

        {/* Orders Summary Card */}
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

      {/* Districts Section with District Managers and Shop Managers */}
      <div className="mt-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Districts & Managers</h2>
          <div className="flex space-x-3">
            <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
              {districtManagersCount} District Managers
            </span>
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
              {shopManagersCount} Shop Managers
            </span>
          </div>
        </div>

        {districts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {districts.map((district) => {
              const shopsInDistrict = shopsByDistrict[district.id] || [];
              const managersForDistrict = districtManagers[district.id] || [];
              const activeShopsInDistrict = shopsInDistrict.filter(s => s.is_active).length;
              
              return (
                <div key={district.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
                  {/* District Header */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-white border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {district.name ? district.name.charAt(0).toUpperCase() : 'D'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{district.name}</h3>
                          <p className="text-xs text-gray-500">
                            {shopsInDistrict.length} shops • {activeShopsInDistrict} active
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {/* Open District Manager Portal Button */}
                        <button
                          onClick={() => handleOpenDistrict(district.id)}
                          className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center"
                          title="Open District Manager Portal"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Open
                        </button>
                        
                        {/* Dropdown Toggle Button */}
                        <button
                          onClick={() => toggleDistrictDropdown(district.id)}
                          className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                          title={expandedDistrict === district.id ? "Hide Details" : "Show Details"}
                        >
                          <svg 
                            className={`w-5 h-5 transform transition-transform ${expandedDistrict === district.id ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* District Details Dropdown */}
                  {expandedDistrict === district.id && (
                    <div className="p-4 bg-gray-50 border-t max-h-96 overflow-y-auto">
                      {/* District Managers Section */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-purple-700 mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          District Managers ({managersForDistrict.length})
                        </h4>
                        
                        {managersForDistrict.length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {managersForDistrict.map((manager) => (
                              <div key={manager.id} className="flex items-center p-2 bg-purple-50 rounded-lg border border-purple-100">
                                <div className="w-8 h-8 rounded-full overflow-hidden mr-2 bg-purple-200 flex-shrink-0">
                                  <img 
                                    src={getProfilePicUrl(manager.profile_pic_url)} 
                                    alt={manager.first_name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">
                                    {manager.first_name} {manager.last_name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">{manager.email}</p>
                                </div>
                                <button
                                  onClick={() => handleOpenDistrict(district.id)}
                                  className="ml-2 text-xs text-purple-600 hover:text-purple-800"
                                >
                                  View
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic mb-3">No district manager assigned</p>
                        )}
                      </div>

                      {/* Shops in District Section */}
                      <div>
                        <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Shops in {district.name} ({shopsInDistrict.length})
                        </h4>
                        
                        {shopsInDistrict.length > 0 ? (
                          <div className="space-y-2">
                            {shopsInDistrict.map((shop) => {
                              const shopManagersList = shopManagers[shop.id] || [];
                              const shopVideos = shopVideosMap[shop.id] || [];
                              const videoCount = shopVideos.length;
                              
                              return (
                                <div key={shop.id} className="border rounded-lg bg-white overflow-hidden">
                                  {/* Shop Header */}
                                  <div className="flex items-center justify-between p-3 hover:bg-gray-50">
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${shop.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{shop.name}</p>
                                        <div className="flex items-center text-xs text-gray-500">
                                          <span className="truncate">{shop.city || 'No city'}</span>
                                          {videoCount > 0 && (
                                            <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                                              {videoCount} videos
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      {/* Open Shop Manager Portal Button */}
                                      <button
                                        onClick={() => handleOpenShop(shop.id)}
                                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center whitespace-nowrap"
                                        title="Open Shop Manager Portal"
                                      >
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Open
                                      </button>
                                      
                                      {/* Shop Dropdown Toggle */}
                                      <button
                                        onClick={() => toggleShopDropdown(shop.id)}
                                        className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                      >
                                        <svg 
                                          className={`w-4 h-4 transform transition-transform ${expandedShop === shop.id ? 'rotate-180' : ''}`} 
                                          fill="none" 
                                          stroke="currentColor" 
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Shop Managers Dropdown */}
                                  {expandedShop === shop.id && (
                                    <div className="p-3 bg-gray-50 border-t">
                                      <h5 className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Shop Managers ({shopManagersList.length})
                                      </h5>
                                      
                                      {shopManagersList.length > 0 ? (
                                        <div className="space-y-2">
                                          {shopManagersList.map((manager) => (
                                            <div key={manager.id} className="flex items-center p-2 bg-green-50 rounded-lg border border-green-100">
                                              <div className="w-6 h-6 rounded-full overflow-hidden mr-2 bg-green-200 flex-shrink-0">
                                                <img 
                                                  src={getProfilePicUrl(manager.profile_pic_url)} 
                                                  alt={manager.first_name}
                                                  className="w-full h-full object-cover"
                                                  onError={(e) => {
                                                    e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                                                  }}
                                                />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-800 truncate">
                                                  {manager.first_name} {manager.last_name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">{manager.email}</p>
                                              </div>
                                              <button
                                                onClick={() => handleOpenShop(shop.id)}
                                                className="ml-2 text-xs text-green-600 hover:text-green-800"
                                              >
                                                View
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-400 italic">No shop manager assigned</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No shops in this district</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* District Footer Stats */}
                  <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex justify-between">
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {shopsInDistrict.length} shops
                    </span>
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {managersForDistrict.length} managers
                    </span>
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {activeShopsInDistrict} active
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Districts Found</h3>
            <p className="text-gray-500 mb-4 max-w-md mx-auto">
              No districts are associated with your brand yet. Districts help you organize your shops and assign district managers.
            </p>
            <Link
              to="/brand-admin/districts"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Manage Districts
            </Link>
          </div>
        )}
        
        {districts.length > 0 && (
          <div className="mt-4 text-right">
            <Link
              to="/brand-admin/districts"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
            >
              View All Districts
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Shops Summary Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 hover:shadow-lg transition-shadow duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Your Shops</h2>
          <Link
            to="/brand-admin/shops"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            View All Shops
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops && shops.length > 0 ? (
            shops.slice(0, 6).map((shop) => {
              const shopVideos = shopVideosMap[shop.id] || [];
              const aiRequests = shopVideos.filter((v) =>
                ["completed", "processing", "failed", "uploading"].includes(
                  v?.status,
                ),
              ).length;
              const shopManagersList = shopManagers[shop.id] || [];

              return (
                <div
                  key={shop.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">
                        {shop.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {shop.city || 'No city'}
                        {shop.state ? `, ${shop.state}` : ""}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        shop.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {shop.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-gray-600">AI Video Requests:</span>
                    <span className="font-bold text-red-600">{aiRequests}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1 text-xs">
                    <span className="text-gray-500">Shop Managers:</span>
                    <span className="font-medium text-green-600">{shopManagersList.length}</span>
                  </div>

                  <div className="flex justify-end mt-3 space-x-2">
                    <button
                      onClick={() => toggleShopDropdown(shop.id)}
                      className="text-xs text-gray-600 hover:text-gray-800 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {expandedShop === shop.id ? 'Hide Managers' : 'Show Managers'}
                    </button>
                    
                    <button
                      onClick={() => handleOpenShop(shop.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      title="Open Shop Manager Portal"
                    >
                      Open Portal
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
                    </button>
                  </div>

                  {/* Shop Managers Dropdown in Shop Card */}
                  {expandedShop === shop.id && shopManagersList.length > 0 && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg border">
                      <h5 className="text-xs font-medium text-gray-600 mb-2">Shop Managers:</h5>
                      <div className="space-y-2">
                        {shopManagersList.map((manager) => (
                          <div key={manager.id} className="flex items-center p-2 bg-white rounded-lg border">
                            <div className="w-6 h-6 rounded-full overflow-hidden mr-2 bg-green-200 flex-shrink-0">
                              <img 
                                src={getProfilePicUrl(manager.profile_pic_url)} 
                                alt={manager.first_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">
                                {manager.first_name} {manager.last_name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{manager.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
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
              <p className="text-gray-500">No shops found for this company</p>
              <Link
                to="/brand-admin/shops"
                className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <svg
                  className="w-4 h-4 mr-1"
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
                Add your first shop
              </Link>
            </div>
          )}
        </div>

        {shops && shops.length > 6 && (
          <div className="mt-4 text-center">
            <Link
              to="/brand-admin/shops"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all {shops.length} shops →
            </Link>
          </div>
        )}
      </div>

      {/* Top Shop & Quick Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Shop */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Top Performing Shop
            </h2>
            {topShop?.aiVideoRequests > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                #1 in AI Requests
              </span>
            )}
          </div>

          {topShop ? (
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm3 6a1 1 0 000 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg">{topShop.name}</h3>
                  <p className="text-sm text-gray-500">
                    {topShop.city || 'No city'}
                    {topShop.state ? `, ${topShop.state}` : ""}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-red-500"
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
                    <div>
                      <div className="text-xl font-bold text-red-600">
                        {topShop.aiVideoRequests}
                      </div>
                      <div className="text-xs text-red-500">
                        AI Video Requests
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {brandVideoRequestsCount > 0
                          ? `${((topShop.aiVideoRequests / brandVideoRequestsCount) * 100).toFixed(1)}%`
                          : "0%"}
                      </div>
                      <div className="text-xs text-green-500">
                        of Total Requests
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                    <div>
                      <div className="text-xl font-bold text-blue-600">
                        {topShop.totalVideos || 0}
                      </div>
                      <div className="text-xs text-blue-500">Total Videos</div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-purple-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <div className="text-xl font-bold text-purple-600">
                        {shopManagers[topShop.id]?.length || 0}
                      </div>
                      <div className="text-xs text-purple-500">Shop Managers</div>
                    </div>
                  </div>
                </div>
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-500">
                No AI video request data available
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {totalShops === 0
                  ? "Add shops to start uploading videos"
                  : "Upload videos to see shop performance"}
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-4">
            <Link
              to="/brand-admin/shops"
              className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-700 transition-colors">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">Manage Shops</h3>
                <p className="text-sm text-gray-500">
                  View and manage all your shops
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
              to="/brand-admin/districts"
              className="flex items-center p-4 border rounded-lg hover:bg-purple-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-700 transition-colors">
                <svg
                  className="w-6 h-6 text-white"
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
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">Manage Districts</h3>
                <p className="text-sm text-gray-500">
                  Organize your shops and assign district managers
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
              to="/brand-admin/users"
              className="flex items-center p-4 border rounded-lg hover:bg-indigo-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-indigo-700 transition-colors">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path
                    fillRule="evenodd"
                    d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">Manage Users</h3>
                <p className="text-sm text-gray-500">
                  Create and manage district and shop managers
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
              to="/brand-admin/analytics"
              className="flex items-center p-4 border rounded-lg hover:bg-green-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-700 transition-colors">
                <svg
                  className="w-6 h-6 text-white"
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
                <h3 className="font-medium text-gray-800">View Analytics</h3>
                <p className="text-sm text-gray-500">
                  Check your brand performance analytics
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
  );
};

export default Overview;