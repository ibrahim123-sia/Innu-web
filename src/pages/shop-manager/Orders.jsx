import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import {
  getOrdersByShop,
  selectOrdersByShop,
  selectOrderLoading,
} from "../../redux/slice/orderSlice";
import { getShopById, selectCurrentShop } from "../../redux/slice/shopSlice";
import {
  getVideosByOrderId,
  getVideosByShop,
  selectVideos,
} from "../../redux/slice/videoSlice";
import OrderDetailModal from "../../components/shop-manager/OrderDetailModal";
import axios from "axios";

// Stats Cards - Static UI (only numbers will be dynamic)
const StatsCards = ({ orderCounts }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-blue-600">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs md:text-sm text-gray-500">Total RO's</h3>
          <p className="text-xl md:text-3xl font-bold text-blue-600 mt-1 md:mt-2">
            {orderCounts.total}
          </p>
        </div>
        <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 md:w-6 md:h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>

    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-green-600">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs md:text-sm text-gray-500">Posted</h3>
          <p className="text-xl md:text-3xl font-bold text-green-600 mt-1 md:mt-2">
            {orderCounts.completed}
          </p>
        </div>
        <div className="w-8 h-8 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 md:w-6 md:h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>

    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-yellow-600">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs md:text-sm text-gray-500">WIP</h3>
          <p className="text-xl md:text-3xl font-bold text-yellow-600 mt-1 md:mt-2">
            {orderCounts.inProgress}
          </p>
        </div>
        <div className="w-8 h-8 md:w-12 md:h-12 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 md:w-6 md:h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>

    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-purple-600">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs md:text-sm text-gray-500">Estimates</h3>
          <p className="text-xl md:text-3xl font-bold text-purple-600 mt-1 md:mt-2">
            {orderCounts.estimate || 0}
          </p>
        </div>
        <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 md:w-6 md:h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>

    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-indigo-600">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs md:text-sm text-gray-500">With Videos</h3>
          <p className="text-xl md:text-3xl font-bold text-indigo-600 mt-1 md:mt-2">
            {orderCounts.withVideos}
          </p>
        </div>
        <div className="w-8 h-8 md:w-12 md:h-12 bg-indigo-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 md:w-6 md:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
);

// Skeleton for Stats Cards (only numbers skeleton)
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-3 md:h-4 bg-gray-200 rounded w-16 md:w-24 mb-1 md:mb-2"></div>
            <div className="h-6 md:h-8 bg-gray-300 rounded w-12 md:w-16"></div>
          </div>
          <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    ))}
  </div>
);

// Filter Section - Static UI
const FilterSection = ({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, videoFilter, setVideoFilter }) => (
  <div className="bg-white rounded-lg shadow-md p-3 md:p-4 mb-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <div>
        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
          Search
        </label>
        <input
          type="text"
          placeholder="RO#, customer, or vehicle"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        />
      </div>

      <div>
        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
          Status
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        >
          <option value="active">WIP & Estimates (Default)</option>
          <option value="all">All Status</option>
          <option value="work-in-progress">Work-In-Progress</option>
          <option value="estimate">Estimate</option>
          <option value="posted">Posted</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div>
        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
          Videos
        </label>
        <select
          value={videoFilter}
          onChange={(e) => setVideoFilter(e.target.value)}
          className="w-full px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        >
          <option value="all">All Orders</option>
          <option value="with-videos">With Videos</option>
          <option value="without-videos">Without Videos</option>
        </select>
      </div>
      
      <div className="flex items-end">
        <div className="text-xs md:text-sm text-gray-500 pb-1.5 md:pb-2">
          {statusFilter === "active" && "Showing WIP & Estimates"}
        </div>
      </div>
    </div>
  </div>
);

// Table Skeleton
const TableSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <th key={i} className="px-4 md:px-6 py-3">
                <div className="h-3 md:h-4 bg-gray-200 rounded animate-pulse w-16 md:w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row}>
              {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                <td key={col} className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                  <div className="h-3 md:h-4 bg-gray-200 rounded animate-pulse w-20 md:w-24"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Orders = () => {
  const { shopId } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  const userId = searchParams.get("userId");
  const currentUser = useSelector((state) => state.user.currentUser);

  const activeUserId = userId || currentUser?.id;

  const [shopManager, setShopManager] = useState(null);
  const [targetShopId, setTargetShopId] = useState(null);

  // Get all orders from Redux
  const allOrders = useSelector(selectOrdersByShop) || [];
  const myShop = useSelector(selectCurrentShop);
  const loading = useSelector(selectOrderLoading);

  const [showOrderDetail, setShowOrderDetail] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderVideos, setOrderVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [videoFilter, setVideoFilter] = useState("all");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [videosByOrder, setVideosByOrder] = useState({});

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshIntervalRef = useRef(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    if (shopId) {
      setTargetShopId(shopId);
      setLoadingUser(false);
    } else if (userId) {
      fetchShopManagerData();
    } else if (currentUser?.shop_id) {
      setTargetShopId(currentUser.shop_id);
      setLoadingUser(false);
    }
  }, [shopId, userId, currentUser]);

  const fetchShopManagerData = async () => {
    setLoadingUser(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/users/getUsers/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const userData = response.data.data || response.data;
      setShopManager(userData);
      if (userData?.shop_id) setTargetShopId(userData.shop_id);
    } catch {
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    if (targetShopId) {
      Promise.all([dispatch(getShopById(targetShopId))]).then(() => {
        setTimeout(() => setIsInitialLoad(false), 300);
      });
    }
  }, [dispatch, targetShopId]);

  // Fetch ALL orders when shop is available or refresh is triggered
  useEffect(() => {
    if (myShop?.id) {
      dispatch(getOrdersByShop(myShop.id)).then(() => {
        setIsDataReady(true);
        setLastRefreshed(new Date());
      });
    }
  }, [dispatch, myShop, refreshTrigger]);

  // Fetch videos for all orders when orders change
  useEffect(() => {
    if (allOrders.length > 0) {
      fetchVideosForAllOrders();
    }
  }, [allOrders]);

  const fetchVideosForAllOrders = async () => {
    const videosMap = {};

    await Promise.all(
      allOrders.map(async (order) => {
        try {
          const result = await dispatch(getVideosByOrderId(order.id)).unwrap();
          videosMap[order.id] = result.data || [];
        } catch {
          videosMap[order.id] = [];
        }
      }),
    );

    setVideosByOrder(videosMap);
  };

  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      if (myShop?.id) {
        setRefreshTrigger((prev) => prev + 1);
      }
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [myShop?.id]);

  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    try {
      const result = await dispatch(getVideosByOrderId(order.id)).unwrap();
      setOrderVideos(result.data || []);
    } catch {
      setOrderVideos([]);
    }
    setShowOrderDetail(order.id);
  };

  const handleRefreshVideos = useCallback(
    async (orderId) => {
      if (orderId) {
        try {
          const result = await dispatch(getVideosByOrderId(orderId)).unwrap();
          if (result.data) {
            setOrderVideos(result.data);
            setVideosByOrder((prev) => ({ ...prev, [orderId]: result.data }));
          }
        } catch {}
      }
    },
    [dispatch],
  );

  const getVideoCountForOrder = (orderId) =>
    videosByOrder[orderId]?.length || 0;

  // First apply search to ALL orders (search works across all statuses)
  const ordersAfterSearch = allOrders?.filter((order) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase().trim();
    
    // Combine all searchable fields from the order
    const customerName = order.customer_name?.toLowerCase() || "";
    const vehicleInfo = order.vehicle_info || {};
    const vehicleDesc =
      `${vehicleInfo.year || ""} ${vehicleInfo.make || ""} ${vehicleInfo.model || ""}`.toLowerCase();
    const licensePlate = vehicleInfo.license_plate?.toLowerCase() || "";
    
    // Handle RO number search - check both fields
    const roNumber = (order.ro_number || order.tekmetric_ro_id || "").toLowerCase();
    
    // Create a single searchable text string
    const searchableText = `${customerName} ${vehicleDesc} ${licensePlate} ${roNumber}`;
    
    return searchableText.includes(searchLower);
  });

  // Then apply status and video filters to the searched orders
  const filteredOrders = ordersAfterSearch?.filter((order) => {
    let matches = true;

    // Status filter
    if (statusFilter !== "all") {
      const status = order.status?.toLowerCase() || "";
      
      if (statusFilter === "active") {
        if (
          ![
            "in_progress",
            "work-in-progress",
            "processing",
            "pending",
            "estimate",
          ].includes(status)
        ) {
          matches = false;
        }
      } else if (statusFilter === "work-in-progress") {
        if (!["in_progress", "work-in-progress", "processing"].includes(status))
          matches = false;
      } else if (statusFilter === "estimate") {
        if (!["pending", "estimate"].includes(status)) matches = false;
      } else if (statusFilter === "posted") {
        if (!["completed", "posted", "done"].includes(status)) matches = false;
      } else if (statusFilter === "cancelled") {
        if (!["cancelled", "canceled"].includes(status)) matches = false;
      }
    }

    // Video filter
    if (videoFilter !== "all") {
      const videoCount = getVideoCountForOrder(order.id);
      if (videoFilter === "with-videos" && videoCount === 0) matches = false;
      else if (videoFilter === "without-videos" && videoCount > 0)
        matches = false;
    }

    return matches;
  });

  const getOrderCounts = () => {
    if (!allOrders)
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        estimate: 0,
        withVideos: 0,
        withoutVideos: 0,
        active: 0,
      };

    const withVideos = allOrders.filter(
      (o) => getVideoCountForOrder(o.id) > 0,
    ).length;

    return {
      total: allOrders.length,
      completed: allOrders.filter((o) =>
        ["completed", "posted", "done"].includes(o.status?.toLowerCase()),
      ).length,
      inProgress: allOrders.filter((o) =>
        ["in_progress", "work-in-progress", "processing"].includes(
          o.status?.toLowerCase(),
        ),
      ).length,
      estimate: allOrders.filter((o) =>
        ["pending", "estimate"].includes(o.status?.toLowerCase()),
      ).length,
      withVideos,
      withoutVideos: allOrders.length - withVideos,
    };
  };

  const orderCounts = getOrderCounts();

  const formatLastRefreshed = () =>
    lastRefreshed.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  // Status badge color helper
  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || "";

    if (["completed", "posted", "done"].includes(statusLower)) {
      return "bg-green-100 text-green-800";
    } else if (
      ["in_progress", "work-in-progress", "processing"].includes(statusLower)
    ) {
      return "bg-blue-100 text-blue-800";
    } else if (["pending", "estimate"].includes(statusLower)) {
      return "bg-yellow-100 text-yellow-800";
    } else if (["cancelled", "canceled"].includes(statusLower)) {
      return "bg-red-100 text-red-800";
    } else {
      return "bg-gray-100 text-gray-800";
    }
  };

  if (loadingUser) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-xs md:text-sm text-gray-600">Loading shop manager data...</p>
        </div>
      </div>
    );
  }

  if (!activeUserId && !shopId) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center h-64">
        <div className="text-center bg-yellow-50 p-4 md:p-6 rounded-lg border border-yellow-200">
          <svg
            className="w-10 h-10 md:w-12 md:h-12 text-yellow-500 mx-auto mb-2 md:mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-base md:text-lg font-medium text-yellow-800 mb-1 md:mb-2">
            No Shop Selected
          </h3>
          <p className="text-xs md:text-sm text-yellow-700">Unable to identify the shop.</p>
        </div>
      </div>
    );
  }

  if (userId && shopManager && !shopManager.shop_id) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center h-64">
        <div className="text-center bg-orange-50 p-4 md:p-6 rounded-lg border border-orange-200">
          <svg
            className="w-10 h-10 md:w-12 md:h-12 text-orange-500 mx-auto mb-2 md:mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-base md:text-lg font-medium text-orange-800 mb-1 md:mb-2">
            No Shop Assigned
          </h3>
          <p className="text-xs md:text-sm text-orange-700">
            This shop manager has not been assigned to any shop yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 lg:p-6 transition-opacity duration-300 ease-in-out">
      {/* Auto-refresh indicator */}
      <div className="mb-4 flex justify-end">
        <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 md:px-3 py-1 rounded-lg">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse mr-1.5 md:mr-2"></div>
          <span>Last updated: {formatLastRefreshed()}</span>
          <button 
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="ml-2 text-blue-600 hover:text-blue-800"
            title="Refresh now"
          >
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {isInitialLoad || (loading && !allOrders.length && !isDataReady) ? (
        <StatsSkeleton />
      ) : (
        <StatsCards orderCounts={orderCounts} />
      )}

      {/* Filter Section */}
      <FilterSection
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        videoFilter={videoFilter}
        setVideoFilter={setVideoFilter}
      />

      {/* Results count */}
      <div className="mb-3 md:mb-4 text-xs md:text-sm text-gray-600">
        Showing {filteredOrders.length} of {allOrders.length} orders
        {statusFilter === "active" && " (WIP & Estimates)"}
        {searchTerm && ` • Search: "${searchTerm}"`}
      </div>

      {/* Orders Table */}
      {isInitialLoad || (loading && !allOrders.length && !isDataReady) ? (
        <TableSkeleton />
      ) : filteredOrders?.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RO Number</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Videos</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const vehicleInfo = order.vehicle_info || {};
                  const videoCount = getVideoCountForOrder(order.id);
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div className="text-xs md:text-sm font-medium text-gray-900">#{order.ro_number || order.tekmetric_ro_id || "N/A"}</div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div className="text-xs md:text-sm font-medium text-gray-900">{order.customer_name || "N/A"}</div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div>
                          <div className="text-xs md:text-sm font-medium text-gray-900">
                            {vehicleInfo.year && vehicleInfo.make ? `${vehicleInfo.year} ${vehicleInfo.make}` : "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">{vehicleInfo.model || ""}</div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                          {order.status?.replace(/_/g, " ") || "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <svg className={`w-4 h-4 ${videoCount > 0 ? 'text-indigo-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className={`text-xs font-medium ${videoCount > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                            {videoCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs text-gray-500">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        }) : "N/A"}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="px-2 md:px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-8 md:py-12 text-center transition-opacity duration-300 bg-white rounded-lg shadow-md">
          <svg
            className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-2 md:mb-4"
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
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1 md:mb-2">
            No Orders Found
          </h3>
          <p className="text-xs md:text-sm text-gray-500 px-4">
            {searchTerm || statusFilter !== "active" || videoFilter !== "all"
              ? "Try changing your search filters"
              : "No active orders (WIP or Estimates) for this shop yet"}
          </p>
        </div>
      )}

      {showOrderDetail && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          videos={orderVideos}
          onClose={() => {
            setShowOrderDetail(null);
            setSelectedOrder(null);
            setOrderVideos([]);
          }}
          onVideoUpdate={() => handleRefreshVideos(selectedOrder.id)}
        />
      )}
    </div>
  );
};

export default Orders;