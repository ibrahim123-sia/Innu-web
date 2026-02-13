import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getOrdersByShop,
  selectOrdersByShop,
  selectOrderLoading,
} from "../../redux/slice/orderSlice";
import {
  getShopById,
  selectCurrentShop,
} from "../../redux/slice/shopSlice";
import { getVideosByOrderId, selectVideos } from "../../redux/slice/videoSlice";
import OrderDetailModal from "../../components/shop-manager/OrderDetailModal";

// Skeleton Loader Components
const TableSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <th key={i} className="px-6 py-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row}>
              {[1, 2, 3, 4, 5, 6].map((col) => (
                <td key={col} className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-200">
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
      <div className="md:col-span-2">
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

const Orders = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.currentUser);
  const shopId = currentUser?.shop_id;

  const orders = useSelector(selectOrdersByShop) || [];
  const myShop = useSelector(selectCurrentShop);
  const loading = useSelector(selectOrderLoading);
  const videos = useSelector(selectVideos) || [];

  const [showOrderDetail, setShowOrderDetail] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderVideos, setOrderVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);

  // Fetch shop data when component mounts
  useEffect(() => {
    if (shopId) {
      Promise.all([
        dispatch(getShopById(shopId))
      ]).then(() => {
        // Short timeout to ensure smooth transition
        setTimeout(() => setIsInitialLoad(false), 300);
      });
    }
  }, [dispatch, shopId]);

  // Fetch orders when shop is loaded
  useEffect(() => {
    if (myShop?.id) {
      dispatch(getOrdersByShop(myShop.id)).then(() => {
        setIsDataReady(true);
      });
    }
  }, [dispatch, myShop]);

  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    try {
      const result = await dispatch(getVideosByOrderId(order.id)).unwrap();
      if (result.data) {
        setOrderVideos(result.data);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      setOrderVideos([]);
    }
    setShowOrderDetail(order.id);
  };

  const filteredOrders = orders?.filter((order) => {
    let matches = true;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const customerName = order.customer_name?.toLowerCase() || "";
      const vehicleInfo = order.vehicle_info || {};
      const vehicleDesc =
        `${vehicleInfo.year || ""} ${vehicleInfo.make || ""} ${vehicleInfo.model || ""}`.toLowerCase();
      const roNumber = order.tekmetric_ro_id?.toLowerCase() || "";

      if (
        !customerName.includes(searchLower) &&
        !vehicleDesc.includes(searchLower) &&
        !roNumber.includes(searchLower)
      ) {
        matches = false;
      }
    }

    if (statusFilter !== "all") {
      const status = order.status?.toLowerCase() || "";
      const filter = statusFilter.toLowerCase();

      if (filter === "work-in-progress") {
        if (!["in_progress", "work-in-progress", "processing"].includes(status)) {
          matches = false;
        }
      } else if (filter === "estimate") {
        if (!["pending", "estimate"].includes(status)) {
          matches = false;
        }
      } else if (filter === "posted") {
        if (!["completed", "posted", "done"].includes(status)) {
          matches = false;
        }
      } else if (filter === "cancelled") {
        if (!["cancelled", "canceled"].includes(status)) {
          matches = false;
        }
      } else if (status !== filter) {
        matches = false;
      }
    }

    return matches;
  });

  // Get order counts for stats
  const getOrderCounts = () => {
    if (!orders) return { total: 0, completed: 0, inProgress: 0, estimate: 0 };

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
    };
  };

  const orderCounts = getOrderCounts();

  // Show skeleton during initial load
  if (isInitialLoad || (loading && !orders.length && !isDataReady)) {
    return (
      <div className="transition-opacity duration-300 ease-in-out">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
        </div>
        <StatsSkeleton />
        <FilterSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Shop Orders</h1>
        <p className="text-gray-600">
          Manage and view all orders for {myShop?.name || 'your shop'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total Orders</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {orderCounts.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Completed</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {orderCounts.completed}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">In Progress</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {orderCounts.inProgress}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Estimates</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {orderCounts.estimate || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by customer, vehicle, or RO#"
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
              <option value="all">All Status</option>
              <option value="estimate">Estimate</option>
              <option value="work-in-progress">Work-In-Progress</option>
              <option value="posted">Posted</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-end h-full">
              <div className="flex space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {orderCounts.total}
                  </div>
                  <div className="text-sm text-gray-500">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {orderCounts.completed}
                  </div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {orderCounts.inProgress}
                  </div>
                  <div className="text-sm text-gray-500">In Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredOrders && filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tekmetric RO ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const vehicleInfo = order.vehicle_info || {};
                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          #{order.tekmetric_ro_id || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {order.customer_name || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {vehicleInfo.year
                              ? `${vehicleInfo.year} ${vehicleInfo.make}`
                              : "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicleInfo.model || ""}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                          {order.status?.replace(/_/g, " ") || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center transition-opacity duration-300">
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
              {searchTerm || statusFilter !== "all"
                ? "Try changing your search filters"
                : "No orders have been created for this shop yet"}
            </p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          videos={orderVideos}
          onClose={() => {
            setShowOrderDetail(null);
            setSelectedOrder(null);
            setOrderVideos([]);
          }}
        />
      )}
    </div>
  );
};

export default Orders;