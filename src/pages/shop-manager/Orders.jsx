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

// Skeleton Components
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded animate-pulse w-16"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    ))}
  </div>
);

const FilterSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-4 mb-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse w-full"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse w-full"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse w-full"></div>
      </div>
      <div className="md:col-span-1">
        <div className="flex items-end h-full">
          <div className="flex space-x-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-300 rounded animate-pulse w-12 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
      >
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="h-5 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded-full animate-pulse w-24"></div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Orders = () => {
  const { shopId } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  const userId = searchParams.get("userId");
  const currentUser = useSelector((state) => state.user.currentUser);

  const activeUserId = userId || currentUser?.id;
  const isImpersonating = !!userId;

  const [shopManager, setShopManager] = useState(null);
  const [targetShopId, setTargetShopId] = useState(null);

  const orders = useSelector(selectOrdersByShop) || [];
  const myShop = useSelector(selectCurrentShop);
  const loading = useSelector(selectOrderLoading);
  const allVideos = useSelector(selectVideos) || [];

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

  useEffect(() => {
    if (myShop?.id) {
      dispatch(getOrdersByShop(myShop.id)).then(() => {
        setIsDataReady(true);
        setLastRefreshed(new Date());
      });
    }
  }, [dispatch, myShop, refreshTrigger]);

  useEffect(() => {
    if (orders.length > 0) {
      fetchVideosForAllOrders();
    }
  }, [orders]);

  const fetchVideosForAllOrders = async () => {
    const videosMap = {};

    await Promise.all(
      orders.map(async (order) => {
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

  // Filter orders based on current filters
  const filteredOrders = orders?.filter((order) => {
    let matches = true;

    // Search filter (customer, vehicle, RO number)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const customerName = order.customer_name?.toLowerCase() || "";
      const vehicleInfo = order.vehicle_info || {};
      const vehicleDesc =
        `${vehicleInfo.year || ""} ${vehicleInfo.make || ""} ${vehicleInfo.model || ""}`.toLowerCase();
      const roNumber = order.tekmetric_ro_id?.toLowerCase() || "";
      const roNumberAlt = order.ro_number?.toLowerCase() || "";

      if (
        !customerName.includes(searchLower) &&
        !vehicleDesc.includes(searchLower) &&
        !roNumber.includes(searchLower) &&
        !roNumberAlt.includes(searchLower)
      ) {
        matches = false;
      }
    }

    // Status filter - "active" shows work-in-progress and estimate
    if (statusFilter === "active") {
      const status = order.status?.toLowerCase() || "";
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
    } else if (statusFilter !== "all") {
      const status = order.status?.toLowerCase() || "";
      const filter = statusFilter.toLowerCase();

      if (filter === "work-in-progress") {
        if (!["in_progress", "work-in-progress", "processing"].includes(status))
          matches = false;
      } else if (filter === "estimate") {
        if (!["pending", "estimate"].includes(status)) matches = false;
      } else if (filter === "posted") {
        if (!["completed", "posted", "done"].includes(status)) matches = false;
      } else if (filter === "cancelled") {
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
    if (!orders)
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        estimate: 0,
        withVideos: 0,
        withoutVideos: 0,
        active: 0,
      };

    const withVideos = orders.filter(
      (o) => getVideoCountForOrder(o.id) > 0,
    ).length;
    const active = orders.filter((o) =>
      [
        "in_progress",
        "work-in-progress",
        "processing",
        "pending",
        "estimate",
      ].includes(o.status?.toLowerCase()),
    ).length;

    return {
      total: orders.length,
      completed: orders.filter((o) =>
        ["completed", "posted", "done"].includes(o.status?.toLowerCase()),
      ).length,
      inProgress: orders.filter((o) =>
        ["in_progress", "work-in-progress", "processing"].includes(
          o.status?.toLowerCase(),
        ),
      ).length,
      estimate: orders.filter((o) =>
        ["pending", "estimate"].includes(o.status?.toLowerCase()),
      ).length,
      active,
      withVideos,
      withoutVideos: orders.length - withVideos,
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
      return "bg-green-100 text-green-800 border-green-200";
    } else if (
      ["in_progress", "work-in-progress", "processing"].includes(statusLower)
    ) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    } else if (["pending", "estimate"].includes(statusLower)) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else if (["cancelled", "canceled"].includes(statusLower)) {
      return "bg-red-100 text-red-800 border-red-200";
    } else {
      return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loadingUser) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading shop manager data...</p>
        </div>
      </div>
    );
  }

  if (!activeUserId && !shopId) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <svg
            className="w-12 h-12 text-yellow-500 mx-auto mb-3"
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
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            No Shop Selected
          </h3>
          <p className="text-yellow-700">Unable to identify the shop.</p>
        </div>
      </div>
    );
  }

  if (userId && shopManager && !shopManager.shop_id) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center bg-orange-50 p-6 rounded-lg border border-orange-200">
          <svg
            className="w-12 h-12 text-orange-500 mx-auto mb-3"
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
          <h3 className="text-lg font-medium text-orange-800 mb-2">
            No Shop Assigned
          </h3>
          <p className="text-orange-700">
            This shop manager has not been assigned to any shop yet.
          </p>
        </div>
      </div>
    );
  }

  if (isInitialLoad || (loading && !orders.length && !isDataReady)) {
    return (
      <div className="transition-opacity duration-300 ease-in-out">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
        </div>
        <StatsSkeleton />
        <FilterSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by RO#, customer, or vehicle"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              <option value="active">WIP & Estimates</option>
              <option value="all">All Status</option>
              <option value="work-in-progress">Work-In-Progress</option>
              <option value="estimate">Estimate</option>
              <option value="posted">Posted</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Videos
            </label>
            <select
              value={videoFilter}
              onChange={(e) => setVideoFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              <option value="all">All Orders</option>
              <option value="with-videos">With Videos</option>
              <option value="without-videos">Without Videos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>

      {/* Orders Cards - Redesigned */}
      {filteredOrders?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const vehicleInfo = order.vehicle_info || {};
            const videoCount = getVideoCountForOrder(order.id);
            const statusBadgeColor = getStatusBadge(order.status);

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300 group"
              >
                {/* Vehicle Info Section - Prominent at top */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">
                        {vehicleInfo.year
                          ? `${vehicleInfo.year} ${vehicleInfo.make}`
                          : "Vehicle Information"}
                      </h3>
                      <p className="text-gray-600 font-medium">
                        {vehicleInfo.model || "Model not specified"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusBadgeColor} ml-2`}
                    >
                      {order.status?.replace(/_/g, " ") || "Unknown"}
                    </span>
                  </div>
                </div>

                {/* Customer and Plate Info */}
                <div className="p-4 bg-white">
                  <div className="flex items-center space-x-4 mb-3">
                    {/* Customer */}
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>

                      <span className="text-gray-800 font-medium">
                        {order.customer_name || "Customer not specified"}
                      </span>
                    </div>

                    {/* Plate Number */}
                    {vehicleInfo.license_plate && (
                      <span className="text-gray-700 font-mono border-l pl-4">
                        {vehicleInfo.license_plate}
                      </span>
                    )}
                  </div>

                  {/* RO Number */}
                  <div className="flex items-center space-x-2 mb-4">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-gray-800 font-medium">
                      RO #{order.ro_number || "N/A"}
                    </span>
                  </div>

                  {/* Footer with Video Count and Open Button */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <svg
                        className={`w-5 h-5 ${videoCount > 0 ? "text-indigo-600" : "text-gray-300"}`}
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
                      <span
                        className={`text-sm font-medium ${videoCount > 0 ? "text-indigo-600" : "text-gray-400"}`}
                      >
                        {videoCount} {videoCount === 1 ? "Video" : "Videos"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-all duration-200 transform group-hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-1"
                    >
                      <span>Open</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center transition-opacity duration-300 bg-white rounded-lg shadow-md">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Orders Found
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== "active" || videoFilter !== "all"
              ? "Try changing your search filters"
              : "No orders have been created for this shop yet"}
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
