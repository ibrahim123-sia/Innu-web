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

// Async Thunks

// Upload Operations
export const getUploadUrl = createAsyncThunk(
  'video/getUploadUrl',
  async ({ orderId }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/videos/orders/${orderId}/upload-url`);
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

// Read Operations
export const getAllVideos = createAsyncThunk(
  'video/getAllVideos',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/videos');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
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

// ADD THIS NEW THUNK FOR GETTING VIDEOS BY SHOP
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

// Update Operations
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

// Delete Operation
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

// Analytics Operations - USE THE CORRECT ENDPOINT
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

// ADD THIS FOR STATUS BREAKDOWN IF NEEDED
export const getStatusBreakdown = createAsyncThunk(
  'video/getStatusBreakdown',
  async (_, { rejectWithValue }) => {
    try {
      // If you have a separate endpoint for status breakdown
      const response = await API.get('/videos/stats');
      return response.data;
    } catch (error) {
      // Fallback to using derived data if endpoint doesn't exist
      console.log('Using derived status breakdown');
      return rejectWithValue({ error: 'Endpoint not available' });
    }
  }
);

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
};

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
      // Also update current video if it's the same
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
  },
  extraReducers: (builder) => {
    builder
      // Get Upload URL
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
        
        // Add the new video to the list if it's not already there
        if (action.payload.video && !state.videos.find(v => v.id === action.payload.video.id)) {
          state.videos.unshift(action.payload.video);
        }
      })
      .addCase(getUploadUrl.rejected, (state, action) => {
        state.operations.uploading = false;
        state.error = action.payload?.error || 'Failed to generate upload URL';
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
        state.message = 'Upload confirmed successfully';
        
        // Update the video in the list
        const updatedVideo = action.payload.video;
        const index = state.videos.findIndex(v => v.id === updatedVideo.id);
        if (index !== -1) {
          state.videos[index] = updatedVideo;
        }
        
        // Update current video if it's the same
        if (state.currentVideo?.id === updatedVideo.id) {
          state.currentVideo = updatedVideo;
        }
      })
      .addCase(confirmUpload.rejected, (state, action) => {
        state.operations.confirming = false;
        state.error = action.payload?.error || 'Failed to confirm upload';
      })
      
      // Get All Videos
      .addCase(getAllVideos.pending, (state) => {
        state.operations.fetching = true;
        state.error = null;
      })
      .addCase(getAllVideos.fulfilled, (state, action) => {
        state.operations.fetching = false;
        state.videos = action.payload.data;
        state.pagination.total = action.payload.count;
      })
      .addCase(getAllVideos.rejected, (state, action) => {
        state.operations.fetching = false;
        state.error = action.payload?.error || 'Failed to fetch videos';
      })
      
      // Get Video By ID
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
      
      // Get Videos By Status
      .addCase(getVideosByStatus.pending, (state) => {
        state.operations.fetching = true;
        state.error = null;
      })
      .addCase(getVideosByStatus.fulfilled, (state, action) => {
        state.operations.fetching = false;
        state.videos = action.payload.data;
        state.pagination.total = action.payload.count;
      })
      .addCase(getVideosByStatus.rejected, (state, action) => {
        state.operations.fetching = false;
        state.error = action.payload?.error || 'Failed to fetch videos by status';
      })
      
      // Get Videos By Order ID
      .addCase(getVideosByOrderId.pending, (state) => {
        state.operations.fetching = true;
        state.error = null;
      })
      .addCase(getVideosByOrderId.fulfilled, (state, action) => {
        state.operations.fetching = false;
        state.videos = action.payload.data;
        state.pagination.total = action.payload.count;
      })
      .addCase(getVideosByOrderId.rejected, (state, action) => {
        state.operations.fetching = false;
        state.error = action.payload?.error || 'Failed to fetch videos by order';
      })
      
      // Get Videos By Shop (NEW)
      .addCase(getVideosByShop.pending, (state) => {
        state.operations.fetching = true;
        state.error = null;
      })
      .addCase(getVideosByShop.fulfilled, (state, action) => {
        state.operations.fetching = false;
        state.videos = action.payload.data;
        state.pagination.total = action.payload.count;
      })
      .addCase(getVideosByShop.rejected, (state, action) => {
        state.operations.fetching = false;
        state.error = action.payload?.error || 'Failed to fetch videos by shop';
      })
      
      // Search Videos
      .addCase(searchVideos.pending, (state) => {
        state.operations.searching = true;
        state.error = null;
      })
      .addCase(searchVideos.fulfilled, (state, action) => {
        state.operations.searching = false;
        state.videos = action.payload.data;
        state.pagination.total = action.payload.count;
      })
      .addCase(searchVideos.rejected, (state, action) => {
        state.operations.searching = false;
        state.error = action.payload?.error || 'Failed to search videos';
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
        state.message = 'Video updated successfully';
        
        // Update in videos list
        const updatedVideo = action.payload.data;
        const index = state.videos.findIndex(v => v.id === updatedVideo?.id);
        if (index !== -1) {
          state.videos[index] = updatedVideo;
        }
        
        // Update current video if it's the same
        if (state.currentVideo?.id === updatedVideo?.id) {
          state.currentVideo = updatedVideo;
        }
      })
      .addCase(updateVideo.rejected, (state, action) => {
        state.operations.updating = false;
        state.error = action.payload?.error || 'Failed to update video';
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
        state.message = 'Video status updated successfully';
        
        // Update in videos list
        const updatedVideo = action.payload.data;
        const index = state.videos.findIndex(v => v.id === updatedVideo?.id);
        if (index !== -1) {
          state.videos[index] = updatedVideo;
        }
        
        // Update current video if it's the same
        if (state.currentVideo?.id === updatedVideo?.id) {
          state.currentVideo = updatedVideo;
        }
      })
      .addCase(updateVideoStatus.rejected, (state, action) => {
        state.operations.updating = false;
        state.error = action.payload?.error || 'Failed to update video status';
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
        state.message = action.payload.message || 'Video deleted successfully';
        
        // Remove from videos list
        state.videos = state.videos.filter(video => video.id !== action.payload.videoId);
        
        // Clear current video if it's the deleted one
        if (state.currentVideo?.id === action.payload.videoId) {
          state.currentVideo = null;
        }
      })
      .addCase(deleteVideo.rejected, (state, action) => {
        state.operations.deleting = false;
        state.error = action.payload?.error || 'Failed to delete video';
      })
      
      // Get Video Stats
      .addCase(getVideoStats.pending, (state) => {
        state.operations.gettingStats = true;
        state.error = null;
      })
      .addCase(getVideoStats.fulfilled, (state, action) => {
        state.operations.gettingStats = false;
        state.analytics.stats = action.payload.data;
      })
      .addCase(getVideoStats.rejected, (state, action) => {
        state.operations.gettingStats = false;
        state.error = action.payload?.error || 'Failed to fetch video stats';
      })
      
      // Get Status Breakdown
      .addCase(getStatusBreakdown.pending, (state) => {
        state.operations.gettingStats = true;
        state.error = null;
      })
      .addCase(getStatusBreakdown.fulfilled, (state, action) => {
        state.operations.gettingStats = false;
        state.analytics.statusBreakdown = action.payload.data;
      })
      .addCase(getStatusBreakdown.rejected, (state, action) => {
        state.operations.gettingStats = false;
        // Don't set error for missing stats endpoint, we'll use derived data
        if (action.payload?.error !== 'Endpoint not available') {
          state.error = action.payload?.error || action.payload?.message || 'Failed to fetch status breakdown';
        }
      });
  },
});

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
} = videoSlice.actions;

// Selectors
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

// Memoized selectors using createSelector
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
        filterTo.setHours(23, 59, 59, 999); // End of day
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

// Operation status selectors
export const selectIsUploading = (state) => state.video.operations.uploading;
export const selectIsConfirming = (state) => state.video.operations.confirming;
export const selectIsFetching = (state) => state.video.operations.fetching;
export const selectIsUpdating = (state) => state.video.operations.updating;
export const selectIsDeleting = (state) => state.video.operations.deleting;
export const selectIsSearching = (state) => state.video.operations.searching;
export const selectIsGettingStats = (state) => state.video.operations.gettingStats;

// Derived analytics selectors - Memoized versions
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
      // By status
      const status = video.status || 'unknown';
      if (!stats.byStatus[status]) {
        stats.byStatus[status] = 0;
      }
      stats.byStatus[status]++;
      
      // By brand
      if (video.brand_id) {
        if (!stats.byBrand[video.brand_id]) {
          stats.byBrand[video.brand_id] = 0;
        }
        stats.byBrand[video.brand_id]++;
      }
      
      // By shop
      if (video.shop_id) {
        if (!stats.byShop[video.shop_id]) {
          stats.byShop[video.shop_id] = 0;
        }
        stats.byShop[video.shop_id]++;
      }
      
      // Recent uploads (last 7 days)
      const videoDate = new Date(video.created_at);
      if (videoDate >= sevenDaysAgo) {
        stats.recentUploads++;
      }
      
      // By date (group by day)
      const dateKey = videoDate.toISOString().split('T')[0];
      if (!stats.byDate[dateKey]) {
        stats.byDate[dateKey] = 0;
      }
      stats.byDate[dateKey]++;
    });
    
    // Calculate percentages
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

// Status distribution selector - Memoized version
export const selectStatusDistribution = createSelector(
  [(state) => state.video.videos],
  (videos) => {
    const distribution = {};
    
    videos.forEach(video => {
      const status = video.status || 'unknown';
      if (!distribution[status]) {
        distribution[status] = 0;
      }
      distribution[status]++;
    });
    
    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
      percentage: videos.length > 0 ? Math.round((count / videos.length) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }
);

// Dashboard summary selector - Memoized version
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
    
    const uploadedVideos = videos.filter(v => v.status === 'uploaded');
    const processingVideos = videos.filter(v => v.status === 'processing');
    const completedVideos = videos.filter(v => v.status === 'completed');
    const failedVideos = videos.filter(v => v.status === 'failed');
    
    return {
      total: videos.length,
      uploaded: uploadedVideos.length,
      processing: processingVideos.length,
      completed: completedVideos.length,
      failed: failedVideos.length,
      today: videos.filter(v => isToday(v.created_at)).length,
      yesterday: videos.filter(v => isYesterday(v.created_at)).length,
      lastWeek: videos.filter(v => isLastWeek(v.created_at)).length,
    };
  }
);

export default videoSlice.reducer;