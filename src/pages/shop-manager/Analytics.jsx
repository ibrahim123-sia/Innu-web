import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import store from "../../redux/store";
import { getShopById, selectCurrentShop } from "../../redux/slice/shopSlice";
import {
  getOrdersByShop,
  selectOrdersByShop,
} from "../../redux/slice/orderSlice";
import { selectAllUsers, getBrandUsers } from "../../redux/slice/userSlice";
import {
  getVideosByShop,
  getVideosByUser,
  selectVideos,
} from "../../redux/slice/videoSlice";
import {
  getEditDetailsByShop,
  getEditDetailsByUser,
  selectShopEditDetails,
  selectAllUserEdits,
  clearUserEditDetails,
} from "../../redux/slice/videoEditSlice";
import axios from "axios";

const DEFAULT_PROFILE_PIC =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const selectVideosByShop = (state) => {
  const videos = state.video.videos;
  if (videos && videos.data && Array.isArray(videos.data)) {
    return videos.data;
  }
  if (Array.isArray(videos)) {
    return videos;
  }
  return [];
};

const selectEditDetailsByShop = (state) => {
  const edits = state.videoEdit.shopEditDetails;
  if (edits && edits.data && Array.isArray(edits.data)) {
    return edits.data;
  }
  if (Array.isArray(edits)) {
    return edits;
  }
  return [];
};

const selectVideosByUser = (userId) => (state) => {
  if (!userId) return [];
  const shopVideos = selectVideosByShop(state);
  return shopVideos.filter((video) => video.created_by === userId);
};

const selectEditDetailsByUserId = (userId) => (state) => {
  if (!userId) return [];
  return selectAllUserEdits(userId)(state);
};

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

const VideoStatsSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-8">
    <div className="flex items-center justify-between mb-6">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mx-auto"></div>
        </div>
      ))}
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
    <div className="p-6 border-b">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <th key={i} className="px-6 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[1, 2, 3, 4].map((row) => (
            <tr key={row} className="hover:bg-gray-50">
              {[1, 2, 3, 4, 5, 6].map((col) => (
                <td key={col} className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {col === 1 && (
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                    )}
                    <div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
                      {col === 1 && (
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                      )}
                    </div>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Analytics = () => {
  const dispatch = useDispatch();
  const { shopId } = useParams();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");

  const currentUser = useSelector((state) => state.user?.currentUser);
  const isImpersonating = !!userId;

  const [shopManager, setShopManager] = useState(null);
  const [targetShopId, setTargetShopId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);

  const effectiveShopId = shopId || currentUser?.shop_id;

  const myShop = useSelector(selectCurrentShop);
  const orders = useSelector(selectOrdersByShop) || [];
  const shopUsers = useSelector(selectAllUsers) || [];

  const allVideos = useSelector(selectVideosByShop) || [];
  const shopEdits = useSelector(selectEditDetailsByShop) || [];

  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [videoStats, setVideoStats] = useState(null);
  const [filteredShopUsers, setFilteredShopUsers] = useState([]);
  const [loadingData, setLoadingData] = useState({});
  const [userPerformanceData, setUserPerformanceData] = useState([]);
  const [dataFetchComplete, setDataFetchComplete] = useState(false);

  const [showUserAnalyticsModal, setShowUserAnalyticsModal] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showAllFeedbackModal, setShowAllFeedbackModal] = useState(false);
  const [selectedUserForFeedback, setSelectedUserForFeedback] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchShopManagerData();
    } else if (shopId) {
      setTargetShopId(shopId);
      setLoadingUser(false);
    } else if (currentUser?.shop_id) {
      setTargetShopId(currentUser.shop_id);
      setLoadingUser(false);
    }
  }, [userId, shopId, currentUser]);

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
      if (userData?.shop_id) {
        setTargetShopId(userData.shop_id);
      }
    } catch (error) {
      console.error("Error fetching shop manager:", error);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!targetShopId) return;

    setLoading(true);
    try {
      dispatch(clearUserEditDetails());

      await Promise.all([
        dispatch(getShopById(targetShopId)),
        dispatch(getOrdersByShop(targetShopId)),
        dispatch(getBrandUsers(currentUser.brand_id)),
        dispatch(getVideosByShop(targetShopId)),
        dispatch(getEditDetailsByShop(targetShopId)),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setIsDataReady(true);
    }
  }, [dispatch, targetShopId]);

  const fetchUserEditDetails = useCallback(
    async (userId) => {
      setLoadingData((prev) => ({ ...prev, [userId]: true }));
      try {
        await dispatch(getEditDetailsByUser(userId));
        return true;
      } catch (error) {
        console.error(`Error fetching edit details for user ${userId}:`, error);
        return false;
      } finally {
        setLoadingData((prev) => ({ ...prev, [userId]: false }));
      }
    },
    [dispatch],
  );

  const fetchAllUsersEditDetails = useCallback(
    async (users) => {
      if (!users.length) return;

      for (const user of users) {
        await fetchUserEditDetails(user.id);
      }

      setDataFetchComplete(true);
    },
    [fetchUserEditDetails],
  );

  useEffect(() => {
    if (targetShopId) {
      dispatch(getShopById(targetShopId)).then(() => {
        setTimeout(() => setIsInitialLoad(false), 300);
      });
    }
  }, [dispatch, targetShopId]);

  useEffect(() => {
    if (myShop?.id) {
      fetchData();
    }
  }, [myShop?.id, fetchData]);

  useEffect(() => {
    if (shopUsers?.length > 0) {
      const filtered = shopUsers.filter(
        (user) =>
          user.brand_id === currentUser.brand_id
      );
      setFilteredShopUsers(filtered);
    }
  }, [shopUsers, currentUser]);

  useEffect(() => {
    if (filteredShopUsers.length > 0 && !dataFetchComplete) {
      fetchAllUsersEditDetails(filteredShopUsers);
    }
  }, [filteredShopUsers, dataFetchComplete, fetchAllUsersEditDetails]);

  useEffect(() => {
    if (allVideos?.length > 0) {
      calculateVideoStats(allVideos);
    }
  }, [allVideos]);

  const calculateVideoStats = useCallback((videos) => {
    if (!videos || videos.length === 0) return;

    const stats = {
      total: videos.length,
      byStatus: {
        uploading: videos.filter((v) => v.status === "uploading").length,
        processing: videos.filter((v) => v.status === "processing").length,
        completed: videos.filter((v) => v.status === "completed").length,
        failed: videos.filter((v) => v.status === "failed").length,
      },
    };

    setVideoStats(stats);
  }, []);

  useEffect(() => {
    if (filteredShopUsers.length === 0) {
      setUserPerformanceData([]);
      return;
    }

    const state = store.getState();

    const processedData = filteredShopUsers
      .map((user) => {
        const userVideos =
          allVideos.filter((video) => video.created_by === user.id) || [];
        const userEdits = selectEditDetailsByUserId(user.id)(state) || [];

        const totalVideos = userVideos.length;

        const uniqueVideoIdsWithEdits = new Set();
        userEdits.forEach((edit) => {
          if (edit.video_id) {
            uniqueVideoIdsWithEdits.add(edit.video_id);
          }
        });

        const manualCorrections = uniqueVideoIdsWithEdits.size;
        const successCount = totalVideos - manualCorrections;

        const adjustedSuccessCount = Math.max(0, successCount);
        const adjustedManualCorrections = Math.min(
          manualCorrections,
          totalVideos,
        );

        const successRate =
          totalVideos > 0
            ? ((adjustedSuccessCount / totalVideos) * 100).toFixed(1)
            : 0;
        const errorRate =
          totalVideos > 0
            ? ((adjustedManualCorrections / totalVideos) * 100).toFixed(1)
            : 0;

        return {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          profilePic: user.profile_pic_url || DEFAULT_PROFILE_PIC,
          totalVideos,
          manualCorrections: adjustedManualCorrections,
          successCount: adjustedSuccessCount,
          successRate,
          errorRate,
          completedVideos: userVideos.filter((v) => v.status === "completed")
            .length,
          processingVideos: userVideos.filter((v) => v.status === "processing")
            .length,
          pendingVideos: userVideos.filter((v) => v.status === "pending")
            .length,
          failedVideos: userVideos.filter((v) => v.status === "failed").length,
          loading: loadingData[user.id] || false,
          userEdits,
        };
      })
      .sort((a, b) => b.totalVideos - a.totalVideos);

    setUserPerformanceData(processedData);
  }, [filteredShopUsers, loadingData, dataFetchComplete, allVideos]);

  const stats = useMemo(() => {
    const totalAIVideoRequests = allVideos?.length || 0;

    const videosWithCorrections = new Set();
    shopEdits.forEach((edit) => {
      if (edit.video_id) {
        videosWithCorrections.add(edit.video_id);
      }
    });

    const totalManualCorrections = videosWithCorrections.size;
    const aiSuccess = totalAIVideoRequests - totalManualCorrections;
    const adjustedAiSuccess = Math.max(0, aiSuccess);

    const aiSuccessRate =
      totalAIVideoRequests > 0
        ? ((adjustedAiSuccess / totalAIVideoRequests) * 100).toFixed(1)
        : 0;

    const aiErrorRate =
      totalAIVideoRequests > 0
        ? ((totalManualCorrections / totalAIVideoRequests) * 100).toFixed(1)
        : 0;

    return {
      totalAIVideoRequests,
      totalManualCorrections,
      aiSuccess: adjustedAiSuccess,
      aiSuccessRate,
      aiErrorRate,
    };
  }, [allVideos, shopEdits]);

  const handleViewUserAnalytics = useCallback(
    async (userId) => {
      setShowUserAnalyticsModal(userId);

      if (!loadingData[userId]) {
        await fetchUserEditDetails(userId);
      }
    },
    [loadingData, fetchUserEditDetails],
  );

  const handleViewAllFeedback = useCallback((userId) => {
    setSelectedUserForFeedback(userId);
    setShowAllFeedbackModal(true);
  }, []);

  const handleViewFeedback = useCallback((edit) => {
    setSelectedFeedback(edit);
    setShowFeedbackModal(true);
  }, []);

  const handleRefreshData = useCallback(() => {
    setDataFetchComplete(false);
    setUserPerformanceData([]);
    fetchData();
  }, [fetchData]);

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

  if (!targetShopId) {
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
          <p className="text-yellow-700">
            Unable to load analytics. No shop ID found.
          </p>
        </div>
      </div>
    );
  }

  if (isInitialLoad || (loading && !isDataReady)) {
    return (
      <div className="p-6 transition-opacity duration-300 ease-in-out">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
        </div>
        <StatsSkeleton />
        <VideoStatsSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 transition-opacity duration-300 ease-in-out">
      {isImpersonating && shopManager && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-yellow-700">
                <span className="font-bold">Impersonation Mode:</span> You are
                viewing analytics as {shopManager.first_name}{" "}
                {shopManager.last_name} ({shopManager.email})
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Total AI Video Requests</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.totalAIVideoRequests}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Total videos processed
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
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
              <h3 className="text-sm text-gray-500">AI Success Rate</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.aiSuccessRate}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.aiSuccess} videos without corrections
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
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
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">AI Error Rate</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats.aiErrorRate}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.totalManualCorrections} videos with corrections
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Manual Correction Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Manual Corrections</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats.totalManualCorrections}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Videos with corrections
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8 hover:shadow-lg transition-shadow duration-200">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              User Performance
            </h2>
            <p className="text-gray-600">
              AI video requests and manual corrections by user
            </p>
          </div>
          <button
            onClick={handleRefreshData}
            className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm flex items-center transition-colors"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {filteredShopUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Video Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manual Corrections
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userPerformanceData.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border bg-gray-100">
                          <img
                            src={user.profilePic}
                            alt={user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = DEFAULT_PROFILE_PIC;
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "editor"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role || "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.loading ? (
                        <div className="animate-pulse h-6 w-12 bg-gray-200 rounded"></div>
                      ) : (
                        <div className="text-lg font-bold text-blue-600">
                          {user.totalVideos}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.loading ? (
                        <div className="animate-pulse h-6 w-12 bg-gray-200 rounded"></div>
                      ) : (
                        <div className="text-lg font-bold text-purple-600">
                          {user.manualCorrections}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.loading ? (
                        <div className="space-y-2">
                          <div className="animate-pulse h-4 w-20 bg-gray-200 rounded"></div>
                          <div className="animate-pulse h-2 w-32 bg-gray-200 rounded-full"></div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Success Rate:
                            </span>
                            <span className="text-sm font-medium text-green-600">
                              {user.successRate}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-green-500 h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(parseFloat(user.successRate), 100)}%`,
                              }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Error Rate:
                            </span>
                            <span className="text-sm font-medium text-red-600">
                              {user.errorRate}%
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewUserAnalytics(user.id)}
                        disabled={loadingData[user.id] || user.loading}
                        className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm flex items-center transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {loadingData[user.id] || user.loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                            Loading...
                          </>
                        ) : (
                          <>
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View Details
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Users Found
            </h3>
            <p className="text-gray-500 mb-4">
              No users are associated with this shop yet.
            </p>
            <button
              onClick={handleRefreshData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>

      {showUserAnalyticsModal && (
        <UserAnalyticsModal
          userId={showUserAnalyticsModal}
          user={filteredShopUsers.find((u) => u.id === showUserAnalyticsModal)}
          shopName={myShop?.name}
          loading={loadingData[showUserAnalyticsModal]}
          onClose={() => setShowUserAnalyticsModal(null)}
          onViewAllFeedback={handleViewAllFeedback}
          onViewFeedback={handleViewFeedback}
          allVideos={allVideos}
        />
      )}

      {showAllFeedbackModal && selectedUserForFeedback && (
        <AllFeedbackModal
          userId={selectedUserForFeedback}
          user={filteredShopUsers.find((u) => u.id === selectedUserForFeedback)}
          onClose={() => {
            setShowAllFeedbackModal(false);
            setSelectedUserForFeedback(null);
          }}
          onViewFeedback={handleViewFeedback}
        />
      )}

      {showFeedbackModal && selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedFeedback(null);
          }}
        />
      )}
    </div>
  );
};

const UserAnalyticsModal = ({
  userId,
  user,
  shopName,
  loading,
  onClose,
  onViewAllFeedback,
  onViewFeedback,
  allVideos,
}) => {
  const state = useSelector((state) => state);
  const userVideos =
    allVideos?.filter((video) => video.created_by === userId) || [];
  const userEdits = selectEditDetailsByUserId(userId)(state) || [];

  const uniqueVideoIdsWithEdits = new Set();
  userEdits.forEach((edit) => {
    if (edit.video_id) {
      uniqueVideoIdsWithEdits.add(edit.video_id);
    }
  });

  const totalVideos = userVideos.length;
  const manualCorrections = uniqueVideoIdsWithEdits.size;
  const successCount = totalVideos - manualCorrections;
  const adjustedSuccessCount = Math.max(0, successCount);
  const adjustedManualCorrections = Math.min(manualCorrections, totalVideos);

  const successRate =
    totalVideos > 0
      ? ((adjustedSuccessCount / totalVideos) * 100).toFixed(1)
      : 0;
  const errorRate =
    totalVideos > 0
      ? ((adjustedManualCorrections / totalVideos) * 100).toFixed(1)
      : 0;

  const completedVideos = userVideos.filter(
    (v) => v.status === "completed",
  ).length;
  const processingVideos = userVideos.filter(
    (v) => v.status === "processing",
  ).length;
  const pendingVideos = userVideos.filter((v) => v.status === "pending").length;
  const failedVideos = userVideos.filter((v) => v.status === "failed").length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border bg-gray-100">
              <img
                src={user?.profile_pic_url || DEFAULT_PROFILE_PIC}
                alt={user?.first_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = DEFAULT_PROFILE_PIC;
                }}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-gray-600">Complete user analytics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-8 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium text-gray-900">
                  {user?.role || "User"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p
                  className={`font-medium ${user?.is_active ? "text-green-600" : "text-red-600"}`}
                >
                  {user?.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Shop</p>
                <p className="font-medium text-gray-900">{shopName}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Video Processing Stats
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">Total Videos</div>
                <div className="text-2xl font-bold text-blue-700">
                  {totalVideos}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">Completed</div>
                <div className="text-2xl font-bold text-green-700">
                  {completedVideos}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-yellow-600">Processing</div>
                <div className="text-2xl font-bold text-yellow-700">
                  {processingVideos}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-600">Failed</div>
                <div className="text-2xl font-bold text-red-700">
                  {failedVideos}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              AI Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-600">
                      AI Video Requests
                    </h4>
                    <p className="text-2xl font-bold text-blue-700 mt-1">
                      {totalVideos}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-500"
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

              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-green-600">
                      Success Rate
                    </h4>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                      {successRate}%
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-500"
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
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-red-600">
                      Error Rate
                    </h4>
                    <p className="text-2xl font-bold text-red-700 mt-1">
                      {errorRate}%
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-purple-600">
                      Manual Corrections
                    </h4>
                    <p className="text-2xl font-bold text-purple-700 mt-1">
                      {adjustedManualCorrections}
                    </p>
                    <p className="text-xs text-purple-500">
                      ({userEdits.length} total edits)
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {userEdits && userEdits.length > 0 ? (
            <div className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Manual Correction Feedback
                </h3>
                <button
                  onClick={() => onViewAllFeedback(userId)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  View All ({userEdits.length})
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
              <div className="space-y-3">
                {userEdits.slice(0, 5).map((edit, index) => (
                  <div
                    key={edit.edit_id || edit.id || index}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onViewFeedback(edit)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {edit.segment_index !== undefined && (
                          <p className="text-xs text-gray-500 mb-1">
                            Segment {edit.segment_index + 1}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mb-1">
                          Video ID: {edit.video_id?.substring(0, 8)}...
                        </p>
                        {edit.feedback_reason ? (
                          <div className="mt-2">
                            <p className="text-sm text-gray-700 font-medium">
                              Feedback:
                            </p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded mt-1">
                              {edit.feedback_reason}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            No feedback provided
                          </p>
                        )}
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 ml-4">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {userEdits.length > 5 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => onViewAllFeedback(userId)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + {userEdits.length - 5} more feedback items
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border rounded-lg p-6 text-center">
              <p className="text-gray-500">
                No manual corrections for this user
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const AllFeedbackModal = ({ userId, user, onClose, onViewFeedback }) => {
  const state = useSelector((state) => state);
  const userEdits = selectEditDetailsByUserId(userId)(state) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Feedback - {user?.first_name} {user?.last_name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Total {userEdits.length} feedback items
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {userEdits.length > 0 ? (
            <div className="space-y-4">
              {userEdits.map((edit, index) => (
                <div
                  key={edit.edit_id || edit.id || index}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onViewFeedback(edit)}
                >
                  {edit.segment_index !== undefined && (
                    <p className="text-xs text-gray-500 mb-1">
                      Segment {edit.segment_index + 1}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mb-2">
                    Video ID: {edit.video_id?.substring(0, 8)}...
                  </p>
                  {edit.feedback_reason ? (
                    <p className="text-gray-700">{edit.feedback_reason}</p>
                  ) : (
                    <p className="text-gray-400 italic">No feedback provided</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No feedback available for this user
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const FeedbackDetailModal = ({ feedback, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {feedback.segment_index !== undefined
              ? `Feedback - Segment ${feedback.segment_index + 1}`
              : "Feedback"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-500">Video ID</p>
            <p className="text-sm font-mono bg-gray-50 p-2 rounded">
              {feedback.video_id}
            </p>
          </div>
          {feedback.segment_index !== undefined && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">Segment</p>
              <p className="font-medium">{feedback.segment_index + 1}</p>
            </div>
          )}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Feedback</p>
            <p className="text-gray-800">
              {feedback.feedback_reason || "No feedback provided"}
            </p>
          </div>
          {feedback.created_at && (
            <p className="text-xs text-gray-500 mt-4">
              Submitted: {new Date(feedback.created_at).toLocaleString()}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
