import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";

// Shop selectors
import {
  getShopsByBrand,
  selectShopsForBrand,
  selectShopLoading,
} from "../../redux/slice/shopSlice";

// Order selectors
import {
  getOrdersByBrand,
  selectOrdersByBrand,
  selectOrderLoading,
} from "../../redux/slice/orderSlice";

// Video selectors
import {
  getVideosByBrand,
  getVideosByShop,
  selectVideos,
  selectVideoLoading,
} from "../../redux/slice/videoSlice";

// Video Edit selectors
import {
  selectEditDetailsList,
  selectBrandEditDetails,
  getAllEditDetails,
  getEditDetailsByBrand,
  selectTotalEditCount,
} from "../../redux/slice/videoEditSlice";

// User selectors - NEW
import {
  getBrandUsers,
  selectUsersByBrandId,
  selectUserLoading,
} from "../../redux/slice/userSlice";

// District selectors - NEW
import {
  getDistrictsByBrand,
  selectDistrictsByBrand,
  selectDistrictLoading,
} from "../../redux/slice/districtSlice";

// Shop Manager selectors - NEW (you'll need to add this if not exists)
import {
  getUsersByDistrict,
  selectUsersByDistrictId,
} from "../../redux/slice/userSlice";

const DEFAULT_PROFILE_PIC =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// Skeleton Loader Components (existing ones remain the same)
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

// NEW Skeleton for District Managers Section
const DistrictManagersSkeleton = () => (
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
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
              </div>
            </div>
            <div className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="mt-3 border-t pt-3">
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-8"></div>
            </div>
            <div className="space-y-2">
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
  const user = useSelector((state) => state.user.currentUser);
  const brandId = user?.brand_id;

  // Existing state
  const shops = useSelector(selectShopsForBrand(brandId));
  const brandOrders = useSelector(selectOrdersByBrand);
  const allVideos = useSelector(selectVideos);
  const [brandVideos, setBrandVideos] = useState([]);
  const [shopVideosMap, setShopVideosMap] = useState({});
  const [loadingBrandData, setLoadingBrandData] = useState(false);

  // NEW - Users and Districts state
  const [districtManagers, setDistrictManagers] = useState([]);
  const [shopManagersMap, setShopManagersMap] = useState({});
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [expandedDistricts, setExpandedDistricts] = useState({});

  // Video Edit stats
  const allEditDetails = useSelector(selectEditDetailsList);
  const brandEditDetails = useSelector(selectBrandEditDetails);
  const totalEditCount = useSelector(selectTotalEditCount);

  // Loading states
  const shopsLoading = useSelector(selectShopLoading);
  const ordersLoading = useSelector(selectOrderLoading);
  const videosLoading = useSelector(selectVideoLoading);
  const usersLoading = useSelector(selectUserLoading);
  const districtsLoading = useSelector(selectDistrictLoading);

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
    loadingBrandData ||
    usersLoading ||
    districtsLoading ||
    loadingManagers;

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
      // 1. Fetch shops for this brand
      console.log("🏪 Fetching shops for brand:", brandId);
      await dispatch(getShopsByBrand(brandId));

      // 2. Fetch orders for this brand
      console.log("📦 Fetching orders for brand:", brandId);
      await dispatch(getOrdersByBrand(brandId));

      // 3. Fetch videos for this brand
      console.log("🎬 Fetching videos for brand:", brandId);
      await fetchBrandVideos(brandId);

      // 4. Fetch all edit details for video stats
      console.log("📊 Fetching video edit details...");
      await dispatch(getAllEditDetails());

      // 5. Fetch brand-specific edit details
      console.log("📊 Fetching brand edit details for:", brandId);
      await dispatch(getEditDetailsByBrand(brandId));

      // 6. Fetch districts for this brand
      console.log("🏘️ Fetching districts for brand:", brandId);
      await dispatch(getDistrictsByBrand(brandId));

      // 7. Fetch all users for this brand (including district managers)
      console.log("👥 Fetching brand users for brand:", brandId);
      await fetchBrandUsers();

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

  // NEW - Fetch brand users and filter district managers
  const fetchBrandUsers = async () => {
    setLoadingManagers(true);
    try {
      const result = await dispatch(getBrandUsers(brandId)).unwrap();
      console.log("✅ Brand users fetched:", result);

      // Filter users to get district managers
      const usersData = result?.data || result || [];
      const managers = usersData.filter(
        (user) => user.role === "district_manager",
      );
      setDistrictManagers(managers);

      // Initialize expanded state for all district managers
      const expanded = {};
      managers.forEach((manager) => {
        expanded[manager.id] = false;
      });
      setExpandedDistricts(expanded);

      // Fetch shop managers for each district
      await fetchAllShopManagers(managers);
    } catch (error) {
      console.error(`Error fetching brand users:`, error);
      setDistrictManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  // NEW - Fetch shop managers for each district
  const fetchAllShopManagers = async (managers) => {
    const managersByDistrict = {};

    for (const manager of managers) {
      if (manager.district_id) {
        try {
          const result = await dispatch(
            getUsersByDistrict(manager.district_id),
          ).unwrap();
          const usersData = result?.data || result || [];
          // Filter to get only shop managers
          const shopManagers = usersData.filter(
            (user) => user.role === "shop_manager",
          );
          managersByDistrict[manager.id] = shopManagers;
        } catch (error) {
          console.error(
            `Error fetching shop managers for district ${manager.district_id}:`,
            error,
          );
          managersByDistrict[manager.id] = [];
        }
      } else {
        managersByDistrict[manager.id] = [];
      }
    }

    setShopManagersMap(managersByDistrict);
  };

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

  // Calculate brand-specific edit stats
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

  // Calculate video stats manually using brandVideos local state
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

  // Calculate dashboard summary manually
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

  // Memoized derived values
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

  // Helper functions for profile pictures
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
        } catch (e) {
          return profilePicData;
        }
      }
      return profilePicData;
    }

    return DEFAULT_PROFILE_PIC;
  };

  // Toggle dropdown for district manager
  const toggleDistrictExpanded = (districtManagerId) => {
    setExpandedDistricts((prev) => ({
      ...prev,
      [districtManagerId]: !prev[districtManagerId],
    }));
  };

  // Debug logging
  useEffect(() => {
    console.log("📊 Brand Overview State:", {
      brandId,
      totalShops,
      activeShops,
      totalOrders,
      brandVideos: brandVideos?.length,
      brandVideoRequestsCount,
      shopsWithAIRequests,
      topShop: topShop?.name,
      dailyOrders,
      totalEditCount,
      brandEditStats,
      districtManagers: districtManagers?.length,
    });
  }, [
    brandId,
    totalShops,
    activeShops,
    totalOrders,
    brandVideos,
    brandVideoRequestsCount,
    shopsWithAIRequests,
    topShop,
    dailyOrders,
    totalEditCount,
    brandEditStats,
    districtManagers,
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
        <DistrictManagersSkeleton />
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

      {/* NEW SECTION: District Managers */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 hover:shadow-lg transition-shadow duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">District Managers</h2>
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

        {loadingManagers || (usersLoading && districtManagers.length === 0) ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading district managers...</p>
          </div>
        ) : districtManagers && districtManagers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {districtManagers.map((manager) => {
              const shopManagers = shopManagersMap[manager.id] || [];
              const isExpanded = expandedDistricts[manager.id] || false;

              return (
                <div
                  key={manager.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* District Manager Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border bg-gray-100 flex-shrink-0">
                        <img
                          src={getProfilePicUrl(manager.profile_pic_url)}
                          alt={`${manager.first_name} ${manager.last_name}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = DEFAULT_PROFILE_PIC;
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {manager.first_name} {manager.last_name}
                        </h3>
                        <p className="text-xs text-gray-500">{manager.email}</p>
                      </div>
                    </div>
                    {/* Option 1: Open Button - Direct link to district manager portal */}
                    // In your BrandAdminOverview component, make sure the link
                    includes the userId:
                    <Link
                      to={`/district-manager?userId=${manager.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center transition-colors"
                      title="Open District Manager Portal"
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
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      Open
                    </Link>
                  </div>

                  {/* Dropdown for Shop Managers */}
                  <div className="mt-3 border-t pt-3">
                    <button
                      onClick={() => toggleDistrictExpanded(manager.id)}
                      className="w-full flex justify-between items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      <span>Shop Managers ({shopManagers.length})</span>
                      <svg
                        className={`w-5 h-5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                        {shopManagers.length > 0 ? (
                          shopManagers.map((shopManager) => (
                            <div
                              key={shopManager.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100"
                            >
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden border bg-gray-100 flex-shrink-0">
                                  <img
                                    src={getProfilePicUrl(
                                      shopManager.profile_pic_url,
                                    )}
                                    alt={`${shopManager.first_name} ${shopManager.last_name}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = DEFAULT_PROFILE_PIC;
                                    }}
                                  />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {shopManager.first_name}{" "}
                                    {shopManager.last_name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate max-w-[120px]">
                                    {shopManager.email}
                                  </p>
                                </div>
                              </div>

                              {/* Option 2: Open Button for Shop Manager */}
                              <Link
                                to={`/shop-manager?userId=${shopManager.id}`}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs flex items-center transition-colors"
                                title="Open Shop Manager Portal"
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
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                                Open
                              </Link>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic text-center py-2">
                            No shop managers assigned
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-gray-500">No district managers found</p>
            <Link
              to="/brand-admin/users"
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
              Add district managers
            </Link>
          </div>
        )}

        {districtManagers && districtManagers.length > 6 && (
          <div className="mt-4 text-center">
            <Link
              to="/brand-admin/users"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all {districtManagers.length} district managers →
            </Link>
          </div>
        )}
      </div>

      {/* Shops Summary Section (Existing) */}
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
                        {shop.city}
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

                  <Link
                    to="/brand-admin/analytics"
                    className="mt-3 text-xs text-blue-600 hover:text-blue-800 flex items-center justify-end"
                  >
                    View Details
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
                to="/brand-admin/shops/add"
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

      {/* Top Shop & Quick Actions Section (Existing) */}
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
                    {topShop.city}
                    {topShop.state ? `, ${topShop.state}` : ""}
                  </p>
                  {topShop.tekmetric_shop_id && (
                    <p className="text-xs text-blue-600 mt-1">
                      Tekmetric ID: {topShop.tekmetric_shop_id}
                    </p>
                  )}
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
                        {topShop.is_active ? "Active" : "Inactive"}
                      </div>
                      <div className="text-xs text-purple-500">Status</div>
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
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">Manage Districts</h3>
                <p className="text-sm text-gray-500">
                  Organize your shops by districts
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
                <h3 className="font-medium text-gray-800">View Users</h3>
                <p className="text-sm text-gray-500">
                  Check all users in your company
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
