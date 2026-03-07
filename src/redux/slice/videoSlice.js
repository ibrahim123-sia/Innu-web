import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import axios from "axios";

const API = axios.create({
  baseURL: "https://innu-api-112488489004.us-central1.run.app/api",
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getUploadUrl = createAsyncThunk(
  "video/getUploadUrl",
  async ({ order_id }, { rejectWithValue }) => {
    try {
      const response = await API.post(`videos/orders/${order_id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const confirmUpload = createAsyncThunk(
  "video/confirmUpload",
  async ({ videoId }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/videos/${videoId}/confirm-upload`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getAllVideos = createAsyncThunk(
  "video/getAllVideos",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/videos");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  },
);

export const getAllEduVideos = createAsyncThunk(
  "video/getAllEduVideos",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("videos/edu-videos/all");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  },
);

export const getVideoById = createAsyncThunk(
  "video/getVideoById",
  async (videoId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/${videoId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getVideosByOrderId = createAsyncThunk(
  "video/getVideosByOrderId",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/orders/${orderId}/videos`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getVideosByShop = createAsyncThunk(
  "video/getVideosByShop",
  async (shopId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/shop/${shopId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getVideosByBrand = createAsyncThunk(
  "video/getVideosByBrand",
  async (brandId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/brand/${brandId}`);
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getVideosByDistrict = createAsyncThunk(
  "video/getVideosByDistrict",
  async (districtId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/district/${districtId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getVideosByUser = createAsyncThunk(
  "video/getVideosByUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/user/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getCategories = createAsyncThunk(
  "video/getCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/videos/categories");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getCategoriesVideos = createAsyncThunk(
  "video/getCategoriesVideos",
  async (category, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/categories/videos/${category}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getVideoCountByOrder = createAsyncThunk(
  "video/getVideoCountByOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/count/order/${orderId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const updateVideo = createAsyncThunk(
  "video/updateVideo",
  async ({ videoId, updateData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/videos/${videoId}`, updateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const updateVideoStatus = createAsyncThunk(
  "video/updateVideoStatus",
  async ({ videoId, status }, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/videos/${videoId}/status`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const deleteVideo = createAsyncThunk(
  "video/deleteVideo",
  async (videoId, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/videos/${videoId}`);
      return { videoId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

const initialState = {
  videos: [],
  eduVideos: [], // Added for educational videos
  currentVideo: null,
  categories: [],
  categoryVideos: [],
  videoCount: null,
  loading: false,
  error: null,
  success: false,
  message: "",
  operations: {
    uploading: false,
    confirming: false,
    fetching: false,
    updating: false,
    deleting: false,
    fetchingCategories: false,
    fetchingCount: false,
    fetchingEduVideos: false, // Added for educational videos
  },
  filters: {
    status: null,
    keywords: null,
    brand_id: null,
    shop_id: null,
    district_id: null,
    date_from: null,
    date_to: null,
    order_id: null,
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  uploadData: null,
};

const videoSlice = createSlice({
  name: "video",
  initialState,
  reducers: {
    resetVideoState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = "";
      state.operations = initialState.operations;
    },
    clearCurrentVideo: (state) => {
      state.currentVideo = null;
    },
    clearUploadData: (state) => {
      state.uploadData = null;
    },
    clearVideos: (state) => {
      state.videos = [];
    },
    clearEduVideos: (state) => { // Added for educational videos
      state.eduVideos = [];
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    updateVideoInList: (state, action) => {
      const { id, updateData } = action.payload;
      const index = state.videos.findIndex((video) => video.id === id);
      if (index !== -1) {
        state.videos[index] = { ...state.videos[index], ...updateData };
      }
      if (state.currentVideo?.id === id) {
        state.currentVideo = { ...state.currentVideo, ...updateData };
      }
    },
    updateVideoStatusLocally: (state, action) => {
      const { videoId, status } = action.payload;
      const video = state.videos.find((v) => v.id === videoId);
      if (video) video.status = status;
      if (state.currentVideo?.id === videoId) state.currentVideo.status = status;
    },
    clearCategories: (state) => {
      state.categories = [];
      state.categoryVideos = [];
    },
    clearVideoCount: (state) => {
      state.videoCount = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload URL
      .addCase(getUploadUrl.pending, (state) => {
        state.operations.uploading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(getUploadUrl.fulfilled, (state, action) => {
        state.operations.uploading = false;
        state.success = true;
        state.uploadData = action.payload;
        state.message = "Upload URL generated successfully";

        if (action.payload.video &&
          !state.videos.find((v) => v.id === action.payload.video.id)) {
          state.videos.unshift(action.payload.video);
        }
      })
      .addCase(getUploadUrl.rejected, (state, action) => {
        state.operations.uploading = false;
        state.error = action.payload?.error || "Failed to generate upload URL";
      })

      // Confirm Upload
      .addCase(confirmUpload.pending, (state) => {
        state.operations.confirming = true;
        state.error = null;
        state.success = false;
      })
      .addCase(confirmUpload.fulfilled, (state, action) => {
        state.operations.confirming = false;
        state.success = true;
        state.message = "Upload confirmed successfully";

        const updatedVideo = action.payload.video;
        const index = state.videos.findIndex((v) => v.id === updatedVideo.id);
        if (index !== -1) state.videos[index] = updatedVideo;
        if (state.currentVideo?.id === updatedVideo.id) state.currentVideo = updatedVideo;
      })
      .addCase(confirmUpload.rejected, (state, action) => {
        state.operations.confirming = false;
        state.error = action.payload?.error || "Failed to confirm upload";
      })

      // Get All Videos
      .addCase(getAllVideos.pending, (state) => {
        state.operations.fetching = true;
        state.error = null;
        state.loading = true;
      })
      .addCase(getAllVideos.fulfilled, (state, action) => {
        state.operations.fetching = false;
        state.loading = false;
        if (action.payload.data) {
          state.videos = action.payload.data;
          state.pagination.total = action.payload.count || action.payload.data.length;
        } else if (Array.isArray(action.payload)) {
          state.videos = action.payload;
          state.pagination.total = action.payload.length;
        } else {
          state.videos = [];
          state.pagination.total = 0;
        }
      })
      .addCase(getAllVideos.rejected, (state, action) => {
        state.operations.fetching = false;
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch videos";
        state.videos = [];
      })

      // Get All Educational Videos
      .addCase(getAllEduVideos.pending, (state) => {
        state.operations.fetchingEduVideos = true;
        state.error = null;
        state.loading = true;
      })
      .addCase(getAllEduVideos.fulfilled, (state, action) => {
        state.operations.fetchingEduVideos = false;
        state.loading = false;
        
        if (action.payload.data) {
          state.eduVideos = action.payload.data;
          state.pagination.total = action.payload.count || action.payload.data.length;
        } else if (Array.isArray(action.payload)) {
          state.eduVideos = action.payload;
          state.pagination.total = action.payload.length;
        } else {
          state.eduVideos = [];
          state.pagination.total = 0;
        }
      })
      .addCase(getAllEduVideos.rejected, (state, action) => {
        state.operations.fetchingEduVideos = false;
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch educational videos";
        state.eduVideos = [];
      })

      // Get Video By Id
      .addCase(getVideoById.pending, (state) => {
        state.operations.fetching = true;
        state.error = null;
      })
      .addCase(getVideoById.fulfilled, (state, action) => {
        state.operations.fetching = false;
        state.currentVideo = action.payload.data;
      })
      .addCase(getVideoById.rejected, (state, action) => {
        state.operations.fetching = false;
        state.error = action.payload?.error || "Failed to fetch video";
      })

      // Get Videos By Order Id
      .addCase(getVideosByOrderId.pending, (state) => {
        state.operations.fetching = true;
        state.error = null;
      })
      .addCase(getVideosByOrderId.fulfilled, (state, action) => {
        state.operations.fetching = false;
        state.videos = action.payload.data || [];
        state.pagination.total = action.payload.count || state.videos.length;
      })
      .addCase(getVideosByOrderId.rejected, (state, action) => {
        state.operations.fetching = false;
        state.error = action.payload?.error || "Failed to fetch videos by order";
      })

      // Get Videos By Shop
      .addCase(getVideosByShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVideosByShop.fulfilled, (state, action) => {
        state.loading = false;
        state.videos = action.payload.data || [];
      })
      .addCase(getVideosByShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch shop videos";
      })

      // Get Videos By Brand
      .addCase(getVideosByBrand.pending, (state) => {
        state.operations.fetching = true;
        state.error = null;
      })
      .addCase(getVideosByBrand.fulfilled, (state, action) => {
        state.operations.fetching = false;
        state.videos = action.payload || [];
      })
      .addCase(getVideosByBrand.rejected, (state, action) => {
        state.operations.fetching = false;
        state.error = action.payload?.error || "Failed to fetch videos by brand";
      })

      // Get Videos By District
      .addCase(getVideosByDistrict.pending, (state) => {
        state.operations.fetching = true;
        state.error = null;
      })
      .addCase(getVideosByDistrict.fulfilled, (state, action) => {
        state.operations.fetching = false;
        state.videos = action.payload.data || [];
        state.pagination.total = action.payload.count || state.videos.length;
      })
      .addCase(getVideosByDistrict.rejected, (state, action) => {
        state.operations.fetching = false;
        state.error = action.payload?.error || "Failed to fetch videos by district";
      })

      // Get Videos By User
      .addCase(getVideosByUser.pending, (state) => {
        state.operations.fetching = true;
        state.error = null;
      })
      .addCase(getVideosByUser.fulfilled, (state, action) => {
        state.operations.fetching = false;
        state.videos = action.payload.data || [];
        state.pagination.total = action.payload.count || state.videos.length;
      })
      .addCase(getVideosByUser.rejected, (state, action) => {
        state.operations.fetching = false;
        state.error = action.payload?.error || "Failed to fetch videos by user";
      })

      // Get Categories
      .addCase(getCategories.pending, (state) => {
        state.operations.fetchingCategories = true;
        state.error = null;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.operations.fetchingCategories = false;
        state.categories = action.payload.data || [];
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.operations.fetchingCategories = false;
        state.error = action.payload?.error || "Failed to fetch categories";
      })

      // Get Categories Videos
      .addCase(getCategoriesVideos.pending, (state) => {
        state.operations.fetching = true;
        state.error = null;
      })
      .addCase(getCategoriesVideos.fulfilled, (state, action) => {
        state.operations.fetching = false;
        state.categoryVideos = action.payload.data || [];
      })
      .addCase(getCategoriesVideos.rejected, (state, action) => {
        state.operations.fetching = false;
        state.error = action.payload?.error || "Failed to fetch category videos";
      })

      // Get Video Count By Order
      .addCase(getVideoCountByOrder.pending, (state) => {
        state.operations.fetchingCount = true;
        state.error = null;
      })
      .addCase(getVideoCountByOrder.fulfilled, (state, action) => {
        state.operations.fetchingCount = false;
        state.videoCount = action.payload.videoCount;
      })
      .addCase(getVideoCountByOrder.rejected, (state, action) => {
        state.operations.fetchingCount = false;
        state.error = action.payload?.error || "Failed to fetch video count";
      })

      // Update Video
      .addCase(updateVideo.pending, (state) => {
        state.operations.updating = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateVideo.fulfilled, (state, action) => {
        state.operations.updating = false;
        state.success = true;
        state.message = "Video updated successfully";

        const updatedVideo = action.payload.data;
        const index = state.videos.findIndex((v) => v.id === updatedVideo?.id);
        if (index !== -1) state.videos[index] = updatedVideo;
        if (state.currentVideo?.id === updatedVideo?.id) state.currentVideo = updatedVideo;
      })
      .addCase(updateVideo.rejected, (state, action) => {
        state.operations.updating = false;
        state.error = action.payload?.error || "Failed to update video";
      })

      // Update Video Status
      .addCase(updateVideoStatus.pending, (state) => {
        state.operations.updating = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateVideoStatus.fulfilled, (state, action) => {
        state.operations.updating = false;
        state.success = true;
        state.message = "Video status updated successfully";

        const updatedVideo = action.payload.data;
        const index = state.videos.findIndex((v) => v.id === updatedVideo?.id);
        if (index !== -1) state.videos[index] = updatedVideo;
        if (state.currentVideo?.id === updatedVideo?.id) state.currentVideo = updatedVideo;
      })
      .addCase(updateVideoStatus.rejected, (state, action) => {
        state.operations.updating = false;
        state.error = action.payload?.error || "Failed to update video status";
      })

      // Delete Video
      .addCase(deleteVideo.pending, (state) => {
        state.operations.deleting = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteVideo.fulfilled, (state, action) => {
        state.operations.deleting = false;
        state.success = true;
        state.message = action.payload.message || "Video deleted successfully";

        state.videos = state.videos.filter((video) => video.id !== action.payload.videoId);
        state.eduVideos = state.eduVideos.filter((video) => video.id !== action.payload.videoId);
        if (state.currentVideo?.id === action.payload.videoId) state.currentVideo = null;
      })
      .addCase(deleteVideo.rejected, (state, action) => {
        state.operations.deleting = false;
        state.error = action.payload?.error || "Failed to delete video";
      });
  },
});

export const {
  resetVideoState,
  clearCurrentVideo,
  clearUploadData,
  clearVideos,
  clearEduVideos,
  setFilters,
  clearFilters,
  setPagination,
  updateVideoInList,
  updateVideoStatusLocally,
  clearCategories,
  clearVideoCount,
} = videoSlice.actions;

// Base Selectors
export const selectVideos = (state) => state.video.videos;
export const selectEduVideos = (state) => state.video.eduVideos;
export const selectCurrentVideo = (state) => state.video.currentVideo;
export const selectCategories = (state) => state.video.categories;
export const selectCategoryVideos = (state) => state.video.categoryVideos;
export const selectVideoCount = (state) => state.video.videoCount;
export const selectVideoLoading = (state) => state.video.loading;
export const selectVideoError = (state) => state.video.error;
export const selectVideoSuccess = (state) => state.video.success;
export const selectVideoMessage = (state) => state.video.message;
export const selectVideoOperations = (state) => state.video.operations;
export const selectVideoFilters = (state) => state.video.filters;
export const selectVideoPagination = (state) => state.video.pagination;
export const selectUploadData = (state) => state.video.uploadData;

// Operation-specific selectors
export const selectIsUploading = (state) => state.video.operations.uploading;
export const selectIsConfirming = (state) => state.video.operations.confirming;
export const selectIsFetching = (state) => state.video.operations.fetching;
export const selectIsUpdating = (state) => state.video.operations.updating;
export const selectIsDeleting = (state) => state.video.operations.deleting;
export const selectIsFetchingCategories = (state) =>
  state.video.operations.fetchingCategories;
export const selectIsFetchingCount = (state) =>
  state.video.operations.fetchingCount;
export const selectIsFetchingEduVideos = (state) => // Added for educational videos
  state.video.operations.fetchingEduVideos;

// ID-based selectors
export const selectVideoById = (videoId) => (state) =>
  state.video.videos.find((video) => video.id === videoId) ||
  state.video.currentVideo;

export const selectEduVideoById = (videoId) => (state) => // Added for educational videos
  state.video.eduVideos.find((video) => video.id === videoId);

export const selectVideosByShop = (shopId) => (state) =>
  state.video.videos.filter((video) => video.shop_id === shopId);

export const selectVideosByBrand = (brandId) => (state) =>
  state.video.videos.filter((video) => video.brand_id === brandId);

export const selectVideosByOrder = (orderId) => (state) =>
  state.video.videos.filter((video) => video.order_id === orderId);

export const selectVideosByUser = (userId) => (state) =>
  state.video.videos.filter((video) => video.created_by === userId);

// Filtered Videos Selector
export const selectFilteredVideos = createSelector(
  [(state) => state.video.videos, (state) => state.video.filters],
  (videos, filters) => {
    if (!videos.length) return [];

    return videos.filter((video) => {
      if (filters.status && video.status !== filters.status) return false;
      if (filters.shop_id && video.shop_id !== filters.shop_id) return false;
      if (filters.brand_id && video.brand_id !== filters.brand_id) return false;
      if (filters.district_id && video.district_id !== filters.district_id) return false;
      if (filters.order_id && video.order_id !== filters.order_id) return false;

      if (filters.date_from) {
        const videoDate = new Date(video.created_at);
        const filterFrom = new Date(filters.date_from);
        if (videoDate < filterFrom) return false;
      }

      if (filters.date_to) {
        const videoDate = new Date(video.created_at);
        const filterTo = new Date(filters.date_to);
        filterTo.setHours(23, 59, 59, 999);
        if (videoDate > filterTo) return false;
      }

      if (filters.keywords && video.detected_keywords) {
        const keywords = filters.keywords.toLowerCase().split(",").map((k) => k.trim());
        const videoKeywords = Array.isArray(video.detected_keywords)
          ? video.detected_keywords.map((k) => k.toLowerCase())
          : JSON.parse(video.detected_keywords || "[]").map((k) => k.toLowerCase());

        return keywords.some((keyword) =>
          videoKeywords.some((vk) => vk.includes(keyword))
        );
      }

      return true;
    });
  },
);

// Filtered Educational Videos Selector
export const selectFilteredEduVideos = createSelector( // Added for educational videos
  [(state) => state.video.eduVideos, (state) => state.video.filters],
  (eduVideos, filters) => {
    if (!eduVideos.length) return [];

    return eduVideos.filter((video) => {
      if (filters.status && video.status !== filters.status) return false;
      
      if (filters.date_from) {
        const videoDate = new Date(video.created_at);
        const filterFrom = new Date(filters.date_from);
        if (videoDate < filterFrom) return false;
      }

      if (filters.date_to) {
        const videoDate = new Date(video.created_at);
        const filterTo = new Date(filters.date_to);
        filterTo.setHours(23, 59, 59, 999);
        if (videoDate > filterTo) return false;
      }

      if (filters.keywords && video.title) {
        const keywords = filters.keywords.toLowerCase().split(",").map((k) => k.trim());
        return keywords.some((keyword) => 
          video.title.toLowerCase().includes(keyword) || 
          (video.description && video.description.toLowerCase().includes(keyword))
        );
      }

      return true;
    });
  },
);

// Dashboard Summary Selector
export const selectDashboardSummary = createSelector(
  [(state) => state.video.videos],
  (videos) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const isToday = (date) => new Date(date).toDateString() === today.toDateString();
    const isYesterday = (date) => new Date(date).toDateString() === yesterday.toDateString();
    const isLastWeek = (date) => {
      const videoDate = new Date(date);
      return videoDate >= lastWeek && videoDate < today;
    };

    return {
      total: videos.length,
      uploaded: videos.filter((v) => v.status === "uploading").length,
      processing: videos.filter((v) => v.status === "processing").length,
      completed: videos.filter((v) => v.status === "completed" || v.status === "pending").length,
      failed: videos.filter((v) => v.status === "failed").length,
      today: videos.filter((v) => isToday(v.created_at)).length,
      yesterday: videos.filter((v) => isYesterday(v.created_at)).length,
      lastWeek: videos.filter((v) => isLastWeek(v.created_at)).length,
    };
  },
);

// Educational Videos Dashboard Summary
export const selectEduDashboardSummary = createSelector( // Added for educational videos
  [(state) => state.video.eduVideos],
  (eduVideos) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const isToday = (date) => new Date(date).toDateString() === today.toDateString();
    const isYesterday = (date) => new Date(date).toDateString() === yesterday.toDateString();
    const isLastWeek = (date) => {
      const videoDate = new Date(date);
      return videoDate >= lastWeek && videoDate < today;
    };

    return {
      total: eduVideos.length,
      published: eduVideos.filter((v) => v.status === "published").length,
      draft: eduVideos.filter((v) => v.status === "draft").length,
      archived: eduVideos.filter((v) => v.status === "archived").length,
      today: eduVideos.filter((v) => isToday(v.created_at)).length,
      yesterday: eduVideos.filter((v) => isYesterday(v.created_at)).length,
      lastWeek: eduVideos.filter((v) => isLastWeek(v.created_at)).length,
    };
  },
);

// Status Distribution Selector
export const selectStatusDistribution = createSelector(
  [(state) => state.video.videos],
  (videos) => {
    const distribution = {};

    videos.forEach((video) => {
      const status = video.status || "unknown";
      distribution[status] = (distribution[status] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([status, count]) => ({
        status,
        count,
        percentage: videos.length > 0 ? Math.round((count / videos.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  },
);

// Educational Videos Status Distribution
export const selectEduStatusDistribution = createSelector( // Added for educational videos
  [(state) => state.video.eduVideos],
  (eduVideos) => {
    const distribution = {};

    eduVideos.forEach((video) => {
      const status = video.status || "unknown";
      distribution[status] = (distribution[status] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([status, count]) => ({
        status,
        count,
        percentage: eduVideos.length > 0 ? Math.round((count / eduVideos.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  },
);

export default videoSlice.reducer;