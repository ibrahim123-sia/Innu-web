// src/redux/slice/videoSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==========================================
// 📤 Upload Operations
// ==========================================
export const getUploadUrl = createAsyncThunk(
  'video/getUploadUrl',
  async ({ order_id }, { rejectWithValue }) => {
    try {
      const response = await API.post(`videos/orders/${order_id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const confirmUpload = createAsyncThunk(
  'video/confirmUpload',
  async ({ videoId }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/videos/${videoId}/confirm-upload`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ==========================================
// 📦 Read Operations
// ==========================================

// ✅ FIXED: Correct thunk name - 'video/getAllVideos' not 'video/getallvideos'
export const getAllVideos = createAsyncThunk(
  'video/getAllVideos',
  async (_, { rejectWithValue }) => {
    try {
      console.log('📹 Fetching all videos...');
      const response = await API.get('/videos');
      console.log('📹 Videos API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('📹 Videos API error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const getVideoById = createAsyncThunk(
  'video/getVideoById',
  async (videoId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/${videoId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getVideosByStatus = createAsyncThunk(
  'video/getVideosByStatus',
  async (status, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/status/${status}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getVideosByOrderId = createAsyncThunk(
  'video/getVideosByOrderId',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/orders/${orderId}/videos`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getVideosByShop = createAsyncThunk(
  'video/getVideosByShop',
  async (shopId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/shop/${shopId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getVideosByBrand = createAsyncThunk(
  'video/getVideosByBrand',
  async (brandId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/brand/${brandId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getVideosByDistrict = createAsyncThunk(
  'video/getVideosByDistrict',
  async (districtId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/district/${districtId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const searchVideos = createAsyncThunk(
  'video/searchVideos',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await API.get('/videos/search', { params: searchParams });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ==========================================
// 🛠️ Update Operations
// ==========================================
export const updateVideo = createAsyncThunk(
  'video/updateVideo',
  async ({ videoId, updateData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/videos/${videoId}`, updateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateVideoStatus = createAsyncThunk(
  'video/updateVideoStatus',
  async ({ videoId, status }, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/videos/${videoId}/status`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ==========================================
// 🗑️ Delete Operation
// ==========================================
export const deleteVideo = createAsyncThunk(
  'video/deleteVideo',
  async (videoId, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/videos/${videoId}`);
      return { videoId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ==========================================
// 📊 Analytics Operations
// ==========================================
export const getVideoStats = createAsyncThunk(
  'video/getVideoStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/videos/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getStatusBreakdown = createAsyncThunk(
  'video/getStatusBreakdown',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/videos/stats');
      return response.data;
    } catch (error) {
      console.log('Using derived status breakdown');
      return rejectWithValue({ error: 'Endpoint not available' });
    }
  }
);

// ==========================================
// 🎬 Video Edit Details Operations
// ==========================================
export const saveEditDetails = createAsyncThunk(
  'video/saveEditDetails',
  async ({ videoId, details }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/videos/${videoId}/edit-details`, details);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getEditDetails = createAsyncThunk(
  'video/getEditDetails',
  async (videoId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/${videoId}/edit-details`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const swapEditDetail = createAsyncThunk(
  'video/swapEditDetail',
  async ({ editId, libraryId, reason }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/videos/edit-details/${editId}/swap`, { 
        libraryId, 
        reason 
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getReStitchBlueprint = createAsyncThunk(
  'video/getReStitchBlueprint',
  async (videoId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/videos/${videoId}/restitch-blueprint`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ==========================================
// 🎛️ Initial State
// ==========================================
const initialState = {
  videos: [],
  currentVideo: null,
  loading: false,
  error: null,
  success: false,
  message: '',
  operations: {
    uploading: false,
    confirming: false,
    fetching: false,
    updating: false,
    deleting: false,
    searching: false,
    gettingStats: false,
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
  analytics: {
    stats: null,
    statusBreakdown: null,
  },
  editDetails: null,
};

// ==========================================
// 🎬 Video Slice
// ==========================================
const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    resetVideoState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = '';
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
      const index = state.videos.findIndex(video => video.id === id);
      if (index !== -1) {
        state.videos[index] = { ...state.videos[index], ...updateData };
      }
      if (state.currentVideo?.id === id) {
        state.currentVideo = { ...state.currentVideo, ...updateData };
      }
    },
    updateVideoStatusLocally: (state, action) => {
      const { videoId, status } = action.payload;
      const video = state.videos.find(v => v.id === videoId);
      if (video) {
        video.status = status;
      }
      if (state.currentVideo?.id === videoId) {
        state.currentVideo.status = status;
      }
    },
    clearAnalytics: (state) => {
      state.analytics = initialState.analytics;
    },
    setCurrentVideoWithSignedUrls: (state, action) => {
      if (state.currentVideo) {
        state.currentVideo = {
          ...state.currentVideo,
          ...action.payload
        };
      }
    },
    clearEditDetails: (state) => {
      state.editDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ==========================================
      // 📤 Upload Operations
      // ==========================================
      .addCase(getUploadUrl.pending, (state) => {
        state.operations.uploading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(getUploadUrl.fulfilled, (state, action) => {
        state.operations.uploading = false;
        state.success = true;
        state.uploadData = action.payload;
        state.message = 'Upload URL generated successfully';
        
        if (action.payload.video && !state.videos.find(v => v.id === action.payload.video.id)) {
          state.videos.unshift(action.payload.video);
        }
      })
      .addCase(getUploadUrl.rejected, (state, action) => {
        state.operations.uploading = false;
        state.error = action.payload?.error || 'Failed to generate upload URL';
      })
      
      .addCase(confirmUpload.pending, (state) => {
        state.operations.confirming = true;
        state.error = null;
        state.success = false;
      })
      .addCase(confirmUpload.fulfilled, (state, action) => {
        state.operations.confirming = false;
        state.success = true;
        state.message = 'Upload confirmed successfully';
        
        const updatedVideo = action.payload.video;
        const index = state.videos.findIndex(v => v.id === updatedVideo.id);
        if (index !== -1) {
          state.videos[index] = updatedVideo;
        }
        
        if (state.currentVideo?.id === updatedVideo.id) {
          state.currentVideo = updatedVideo;
        }
      })
      .addCase(confirmUpload.rejected, (state, action) => {
        state.operations.confirming = false;
        state.error = action.payload?.error || 'Failed to confirm upload';
      })
      
      // ==========================================
      // 📦 Read Operations
      // ==========================================
      
      // ✅ FIXED: Get All Videos
      .addCase(getAllVideos.pending, (state) => {
        state.operations.fetching = true;
        state.error = null;
        state.loading = true;
      })
      .addCase(getAllVideos.fulfilled, (state, action) => {
        state.operations.fetching = false;
        state.loading = false;
        // Handle different response structures
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
        console.log(`📹 Loaded ${state.videos.length} videos into Redux`);
      })
      .addCase(getAllVideos.rejected, (state, action) => {
        state.operations.fetching = false;
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch videos';
        state.videos = [];
      })
      
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
        state.error = action.payload?.error || 'Failed to fetch video';
      })
      
      .addCase(getVideosByStatus.pending, (state) => {
        state.operations.fetching = true;
        state.error = null;
      })
      .addCase(getVideosByStatus.fulfilled, (state, action) => {
        state.operations.fetching = false;
        state.videos = action.payload.data || [];
        state.pagination.total = action.payload.count || state.videos.length;
      })
      .addCase(getVideosByStatus.rejected, (state, action) => {
        state.operations.fetching = false;
        state.error = action.payload?.error || 'Failed to fetch videos by status';
      })
      
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
        state.error = action.payload?.error || 'Failed to fetch videos by order';
      })
      
      .addCase(getVideosByShop.pending, (state) => {
        state.operations.fetching = true;
        state.error = null;
      })
      .addCase(getVideosByShop.fulfilled, (state, action) => {
        state.operations.fetching = false;
        state.videos = action.payload.data || [];
        state.pagination.total = action.payload.count || state.videos.length;
      })
      .addCase(getVideosByShop.rejected, (state, action) => {
        state.operations.fetching = false;
        state.error = action.payload?.error || 'Failed to fetch videos by shop';
      })
      
      .addCase(getVideosByBrand.pending, (state) => {
        state.operations.fetching = true;
        state.error = null;
      })
      .addCase(getVideosByBrand.fulfilled, (state, action) => {
        state.operations.fetching = false;
        state.videos = action.payload.data || [];
        state.pagination.total = action.payload.count || state.videos.length;
      })
      .addCase(getVideosByBrand.rejected, (state, action) => {
        state.operations.fetching = false;
        state.error = action.payload?.error || 'Failed to fetch videos by brand';
      })
      
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
        state.error = action.payload?.error || 'Failed to fetch videos by district';
      })
      
      .addCase(searchVideos.pending, (state) => {
        state.operations.searching = true;
        state.error = null;
      })
      .addCase(searchVideos.fulfilled, (state, action) => {
        state.operations.searching = false;
        state.videos = action.payload.data || [];
        state.pagination.total = action.payload.count || state.videos.length;
      })
      .addCase(searchVideos.rejected, (state, action) => {
        state.operations.searching = false;
        state.error = action.payload?.error || 'Failed to search videos';
      })
      
      // ==========================================
      // 🛠️ Update Operations
      // ==========================================
      .addCase(updateVideo.pending, (state) => {
        state.operations.updating = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateVideo.fulfilled, (state, action) => {
        state.operations.updating = false;
        state.success = true;
        state.message = 'Video updated successfully';
        
        const updatedVideo = action.payload.data;
        const index = state.videos.findIndex(v => v.id === updatedVideo?.id);
        if (index !== -1) {
          state.videos[index] = updatedVideo;
        }
        
        if (state.currentVideo?.id === updatedVideo?.id) {
          state.currentVideo = updatedVideo;
        }
      })
      .addCase(updateVideo.rejected, (state, action) => {
        state.operations.updating = false;
        state.error = action.payload?.error || 'Failed to update video';
      })
      
      .addCase(updateVideoStatus.pending, (state) => {
        state.operations.updating = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateVideoStatus.fulfilled, (state, action) => {
        state.operations.updating = false;
        state.success = true;
        state.message = 'Video status updated successfully';
        
        const updatedVideo = action.payload.data;
        const index = state.videos.findIndex(v => v.id === updatedVideo?.id);
        if (index !== -1) {
          state.videos[index] = updatedVideo;
        }
        
        if (state.currentVideo?.id === updatedVideo?.id) {
          state.currentVideo = updatedVideo;
        }
      })
      .addCase(updateVideoStatus.rejected, (state, action) => {
        state.operations.updating = false;
        state.error = action.payload?.error || 'Failed to update video status';
      })
      
      // ==========================================
      // 🗑️ Delete Operation
      // ==========================================
      .addCase(deleteVideo.pending, (state) => {
        state.operations.deleting = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteVideo.fulfilled, (state, action) => {
        state.operations.deleting = false;
        state.success = true;
        state.message = action.payload.message || 'Video deleted successfully';
        
        state.videos = state.videos.filter(video => video.id !== action.payload.videoId);
        
        if (state.currentVideo?.id === action.payload.videoId) {
          state.currentVideo = null;
        }
      })
      .addCase(deleteVideo.rejected, (state, action) => {
        state.operations.deleting = false;
        state.error = action.payload?.error || 'Failed to delete video';
      })
      
      // ==========================================
      // 📊 Analytics Operations
      // ==========================================
      .addCase(getVideoStats.pending, (state) => {
        state.operations.gettingStats = true;
        state.error = null;
      })
      .addCase(getVideoStats.fulfilled, (state, action) => {
        state.operations.gettingStats = false;
        state.analytics.stats = action.payload.stats || action.payload.data;
      })
      .addCase(getVideoStats.rejected, (state, action) => {
        state.operations.gettingStats = false;
        state.error = action.payload?.error || 'Failed to fetch video stats';
      })
      
      .addCase(getStatusBreakdown.fulfilled, (state, action) => {
        state.analytics.statusBreakdown = action.payload.data;
      })
      
      // ==========================================
      // 🎬 Video Edit Details Operations
      // ==========================================
      .addCase(saveEditDetails.fulfilled, (state, action) => {
        state.editDetails = action.payload.data;
        state.success = true;
        state.message = 'Edit details saved successfully';
      })
      .addCase(getEditDetails.fulfilled, (state, action) => {
        state.editDetails = action.payload.data;
      })
      .addCase(swapEditDetail.fulfilled, (state, action) => {
        state.editDetails = action.payload.data;
        state.success = true;
        state.message = 'Video swapped successfully';
      });
  },
});

// ==========================================
// 🎬 Actions Export
// ==========================================
export const {
  resetVideoState,
  clearCurrentVideo,
  clearUploadData,
  clearVideos,
  setFilters,
  clearFilters,
  setPagination,
  updateVideoInList,
  updateVideoStatusLocally,
  clearAnalytics,
  setCurrentVideoWithSignedUrls,
  clearEditDetails,
} = videoSlice.actions;

// ==========================================
// 🎬 Selectors
// ==========================================

// Basic selectors
export const selectVideos = (state) => state.video.videos;
export const selectCurrentVideo = (state) => state.video.currentVideo;
export const selectVideoLoading = (state) => state.video.loading;
export const selectVideoError = (state) => state.video.error;
export const selectVideoSuccess = (state) => state.video.success;
export const selectVideoMessage = (state) => state.video.message;
export const selectVideoOperations = (state) => state.video.operations;
export const selectVideoFilters = (state) => state.video.filters;
export const selectVideoPagination = (state) => state.video.pagination;
export const selectUploadData = (state) => state.video.uploadData;
export const selectAnalytics = (state) => state.video.analytics;
export const selectEditDetails = (state) => state.video.editDetails;

// Helper selectors
export const selectVideoById = (videoId) => (state) =>
  state.video.videos.find(video => video.id === videoId) || state.video.currentVideo;

export const selectVideosByStatus = (status) => (state) =>
  state.video.videos.filter(video => video.status === status);

export const selectVideosByShop = (shopId) => (state) =>
  state.video.videos.filter(video => video.shop_id === shopId);

export const selectVideosByBrand = (brandId) => (state) =>
  state.video.videos.filter(video => video.brand_id === brandId);

export const selectVideosByOrder = (orderId) => (state) =>
  state.video.videos.filter(video => video.order_id === orderId);

// Operation status selectors
export const selectIsUploading = (state) => state.video.operations.uploading;
export const selectIsConfirming = (state) => state.video.operations.confirming;
export const selectIsFetching = (state) => state.video.operations.fetching;
export const selectIsUpdating = (state) => state.video.operations.updating;
export const selectIsDeleting = (state) => state.video.operations.deleting;
export const selectIsSearching = (state) => state.video.operations.searching;
export const selectIsGettingStats = (state) => state.video.operations.gettingStats;

// ==========================================
// 🎬 Memoized Selectors
// ==========================================

// Filtered videos selector
export const selectFilteredVideos = createSelector(
  [
    (state) => state.video.videos,
    (state) => state.video.filters
  ],
  (videos, filters) => {
    if (!videos.length) return [];
    
    return videos.filter(video => {
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
        const keywords = filters.keywords.toLowerCase().split(',').map(k => k.trim());
        const videoKeywords = Array.isArray(video.detected_keywords) 
          ? video.detected_keywords.map(k => k.toLowerCase())
          : JSON.parse(video.detected_keywords || '[]').map(k => k.toLowerCase());
        
        return keywords.some(keyword => 
          videoKeywords.some(vk => vk.includes(keyword))
        );
      }
      
      return true;
    });
  }
);

// Derived video stats selector
export const selectDerivedVideoStats = createSelector(
  [(state) => state.video.videos],
  (videos) => {
    if (!videos.length) {
      return {
        total: 0,
        byStatus: {},
        byBrand: {},
        byShop: {},
        byDate: {},
        recentUploads: 0,
      };
    }
    
    const stats = {
      total: videos.length,
      byStatus: {},
      byBrand: {},
      byShop: {},
      byDate: {},
      recentUploads: 0,
    };
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    videos.forEach(video => {
      const status = video.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      
      if (video.brand_id) {
        stats.byBrand[video.brand_id] = (stats.byBrand[video.brand_id] || 0) + 1;
      }
      
      if (video.shop_id) {
        stats.byShop[video.shop_id] = (stats.byShop[video.shop_id] || 0) + 1;
      }
      
      const videoDate = new Date(video.created_at);
      if (videoDate >= sevenDaysAgo) {
        stats.recentUploads++;
      }
      
      const dateKey = videoDate.toISOString().split('T')[0];
      stats.byDate[dateKey] = (stats.byDate[dateKey] || 0) + 1;
    });
    
    stats.byStatusPercentage = {};
    Object.keys(stats.byStatus).forEach(status => {
      stats.byStatusPercentage[status] = Math.round((stats.byStatus[status] / stats.total) * 100);
    });
    
    stats.recentUploadsPercentage = stats.total > 0 
      ? Math.round((stats.recentUploads / stats.total) * 100) 
      : 0;
    
    return stats;
  }
);

// Status distribution selector
export const selectStatusDistribution = createSelector(
  [(state) => state.video.videos],
  (videos) => {
    const distribution = {};
    
    videos.forEach(video => {
      const status = video.status || 'unknown';
      distribution[status] = (distribution[status] || 0) + 1;
    });
    
    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
      percentage: videos.length > 0 ? Math.round((count / videos.length) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }
);

// Dashboard summary selector
export const selectDashboardSummary = createSelector(
  [(state) => state.video.videos],
  (videos) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const isToday = (date) => {
      const videoDate = new Date(date);
      return videoDate.toDateString() === today.toDateString();
    };
    
    const isYesterday = (date) => {
      const videoDate = new Date(date);
      return videoDate.toDateString() === yesterday.toDateString();
    };
    
    const isLastWeek = (date) => {
      const videoDate = new Date(date);
      return videoDate >= lastWeek && videoDate < today;
    };
    
    return {
      total: videos.length,
      uploaded: videos.filter(v => v.status === 'uploaded').length,
      processing: videos.filter(v => v.status === 'processing').length,
      completed: videos.filter(v => v.status === 'completed').length,
      failed: videos.filter(v => v.status === 'failed').length,
      today: videos.filter(v => isToday(v.created_at)).length,
      yesterday: videos.filter(v => isYesterday(v.created_at)).length,
      lastWeek: videos.filter(v => isLastWeek(v.created_at)).length,
    };
  }
);

export default videoSlice.reducer;