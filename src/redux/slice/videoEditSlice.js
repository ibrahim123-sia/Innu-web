// src/redux/slice/videoEditSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { createSelector } from '@reduxjs/toolkit';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========== ASYNC THUNKS ==========

// Get edit details for a specific video
export const getEditDetails = createAsyncThunk(
  'videoEdit/getEditDetails',
  async (videoId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/video-edit-detail/videos/${videoId}/edit-details`);
      return { videoId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Save edit details for a video
export const saveEditDetails = createAsyncThunk(
  'videoEdit/saveEditDetails',
  async ({ videoId, problem_label, ai_keywords, ai_selected_vid, order_id }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/video-edit-detail/videos/${videoId}/edit-details`, {
        problem_label,
        ai_keywords,
        ai_selected_vid,
        order_id
      });
      return { videoId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Swap a video segment
export const swapSegment = createAsyncThunk(
  'videoEdit/swapSegment',
  async ({ editId, user_selected_vid, reason = 'User manual selection' }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/video-edit-detail/edit-details/${editId}/swap`, {
        newLibraryId: user_selected_vid,
        reason
      });
      return { editId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Trigger video regeneration
export const regenerateVideo = createAsyncThunk(
  'videoEdit/regenerateVideo',
  async (videoId, { rejectWithValue }) => {
    try {
      const response = await API.post(`/video-edit-detail/videos/${videoId}/regenerate`);
      return { videoId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============ STATS THUNKS ============

// Get total AI video requests
export const getTotalAIVideoRequests = createAsyncThunk(
  'videoEdit/getTotalAIVideoRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/video-edit-detail/stats/total-ai-requests');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get AI video requests by brand
export const getAIVideoRequestsByBrand = createAsyncThunk(
  'videoEdit/getAIVideoRequestsByBrand',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/video-edit-detail/stats/ai-requests-by-brand');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get AI error statistics
export const getAIErrorStats = createAsyncThunk(
  'videoEdit/getAIErrorStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/video-edit-detail/stats/ai-error');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get brand AI error statistics
export const getBrandAIErrorStats = createAsyncThunk(
  'videoEdit/getBrandAIErrorStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/video-edit-detail/stats/ai-error-by-brand');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get comprehensive video analytics
export const getVideoAnalyticsStats = createAsyncThunk(
  'videoEdit/getVideoAnalyticsStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/video-edit-detail/stats/video-analytics');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get all edit details with filters
export const getAllEditDetails = createAsyncThunk(
  'videoEdit/getAllEditDetails',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/video-edit-detail/edit-details/all', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ========== INITIAL STATE ==========

const initialState = {
  editDetails: {},
  editDetailsList: [],
  // Stats state
  totalAIVideoRequests: 0,
  aiVideoRequestsByBrand: [],
  aiErrorStats: null,
  brandAIErrorStats: [],
  videoAnalyticsStats: null,
  loading: false,
  error: null,
  success: false,
  message: '',
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
  },
};

// ========== SLICE ==========

const videoEditSlice = createSlice({
  name: 'videoEdit',
  initialState,
  reducers: {
    resetVideoEditState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = '';
    },
    clearStats: (state) => {
      state.totalAIVideoRequests = 0;
      state.aiVideoRequestsByBrand = [];
      state.aiErrorStats = null;
      state.brandAIErrorStats = [];
      state.videoAnalyticsStats = null;
    },
    clearEditDetails: (state) => {
      state.editDetails = {};
      state.editDetailsList = [];
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // ========== EDIT DETAILS ==========
      
      // Get Edit Details
      .addCase(getEditDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEditDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.editDetails[action.payload.videoId] = action.payload.data || [];
      })
      .addCase(getEditDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch edit details';
      })
      
      // Save Edit Details
      .addCase(saveEditDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(saveEditDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message || 'Edit details saved successfully';
        
        if (action.payload.videoId && action.payload.data) {
          state.editDetails[action.payload.videoId] = [
            ...(state.editDetails[action.payload.videoId] || []),
            action.payload.data
          ];
        }
      })
      .addCase(saveEditDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to save edit details';
      })
      
      // Swap Segment
      .addCase(swapSegment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(swapSegment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message || 'Swap recorded successfully';
        
        Object.keys(state.editDetails).forEach(videoId => {
          const details = state.editDetails[videoId];
          if (Array.isArray(details)) {
            const index = details.findIndex(d => d.edit_id === action.payload.editId);
            if (index !== -1) {
              details[index] = { ...details[index], ...action.payload.data };
            }
          }
        });
      })
      .addCase(swapSegment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to swap segment';
      })
      
      // Regenerate Video
      .addCase(regenerateVideo.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(regenerateVideo.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message || 'Regeneration started successfully';
      })
      .addCase(regenerateVideo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to regenerate video';
      })
      
      // Get All Edit Details
      .addCase(getAllEditDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllEditDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.editDetailsList = action.payload.data || [];
        state.pagination.total = action.payload.count || state.editDetailsList.length;
      })
      .addCase(getAllEditDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch edit details';
      })
      
      // ========== STATS ==========
      
      // Get Total AI Video Requests
      .addCase(getTotalAIVideoRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTotalAIVideoRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.totalAIVideoRequests = action.payload.data?.total_ai_video_requests || 0;
      })
      .addCase(getTotalAIVideoRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch total AI video requests';
      })
      
      // Get AI Video Requests by Brand
      .addCase(getAIVideoRequestsByBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAIVideoRequestsByBrand.fulfilled, (state, action) => {
        state.loading = false;
        state.aiVideoRequestsByBrand = action.payload.data || [];
      })
      .addCase(getAIVideoRequestsByBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch AI video requests by brand';
      })
      
      // Get AI Error Statistics
      .addCase(getAIErrorStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAIErrorStats.fulfilled, (state, action) => {
        state.loading = false;
        state.aiErrorStats = action.payload.data || {};
      })
      .addCase(getAIErrorStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch AI error statistics';
      })
      
      // Get Brand AI Error Statistics
      .addCase(getBrandAIErrorStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBrandAIErrorStats.fulfilled, (state, action) => {
        state.loading = false;
        state.brandAIErrorStats = action.payload.data || [];
      })
      .addCase(getBrandAIErrorStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch brand AI error statistics';
      })
      
      // Get Comprehensive Video Analytics
      .addCase(getVideoAnalyticsStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVideoAnalyticsStats.fulfilled, (state, action) => {
        state.loading = false;
        state.videoAnalyticsStats = action.payload.data || {};
        
        if (action.payload.data) {
          state.totalAIVideoRequests = action.payload.data.total_ai_video_requests || 0;
          state.aiVideoRequestsByBrand = action.payload.data.ai_video_requests_by_brand || [];
          state.aiErrorStats = action.payload.data.ai_error_stats || {};
          state.brandAIErrorStats = action.payload.data.ai_error_by_brand || [];
        }
      })
      .addCase(getVideoAnalyticsStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch video analytics';
      });
  },
});

// ========== ACTIONS ==========
export const {
  resetVideoEditState,
  clearStats,
  clearEditDetails,
  setPagination,
} = videoEditSlice.actions;

// ========== SELECTORS ==========

// Base selectors
export const selectVideoEditState = (state) => state.videoEdit;
export const selectEditDetails = (state) => state.videoEdit.editDetails;
export const selectEditDetailsList = (state) => state.videoEdit.editDetailsList;
export const selectTotalAIVideoRequests = (state) => state.videoEdit.totalAIVideoRequests;
export const selectAIVideoRequestsByBrand = (state) => state.videoEdit.aiVideoRequestsByBrand;
export const selectAIErrorStats = (state) => state.videoEdit.aiErrorStats;
export const selectBrandAIErrorStats = (state) => state.videoEdit.brandAIErrorStats;
export const selectVideoAnalyticsStats = (state) => state.videoEdit.videoAnalyticsStats;
export const selectVideoEditLoading = (state) => state.videoEdit.loading;
export const selectVideoEditError = (state) => state.videoEdit.error;
export const selectVideoEditSuccess = (state) => state.videoEdit.success;
export const selectVideoEditMessage = (state) => state.videoEdit.message;
export const selectVideoEditPagination = (state) => state.videoEdit.pagination;

// Helper selector to get edit details for a specific video
export const selectEditDetailsByVideoId = (videoId) => (state) => 
  state.videoEdit.editDetails[videoId] || [];

// ========== MEMOIZED SELECTORS ==========

// Transformed selector for AI Video Requests by Brand
export const selectAIVideoRequestsByBrandStats = createSelector(
  [selectAIVideoRequestsByBrand],
  (requestsByBrand) => {
    return (requestsByBrand || []).map(brand => ({
      brandId: brand.brand_id,
      brandName: brand.brand_name,
      brandLogo: brand.brand_logo,
      totalAIVideoRequests: brand.total_ai_video_requests || 0,
      videosEdited: brand.videos_edited || 0,
      totalOrders: brand.total_orders || 0,
    }));
  }
);

// Transformed selector for Brand Error Stats
export const selectBrandStats = createSelector(
  [selectBrandAIErrorStats],
  (brandStats) => {
    return (brandStats || []).map(brand => ({
      brandId: brand.brand_id,
      brandName: brand.brand_name,
      brandLogo: brand.brand_logo,
      totalSegments: brand.total_segments || 0,
      totalVideos: brand.total_videos || 0,
      aiErrors: brand.ai_errors || 0,
      aiCorrect: brand.ai_correct || 0,
      aiErrorRate: parseFloat(brand.ai_error_rate || 0),
      aiSuccessRate: parseFloat(brand.ai_success_rate || 0),
    }));
  }
);

// AI Error Rate
export const selectAIErrorRate = createSelector(
  [selectAIErrorStats],
  (stats) => {
    if (!stats) return 0;
    return parseFloat(stats.ai_error_rate) || 0;
  }
);

// AI Success Rate
export const selectAISuccessRate = createSelector(
  [selectAIErrorStats],
  (stats) => {
    if (!stats) return 0;
    return parseFloat(stats.ai_success_rate) || 0;
  }
);

// Total Manual Selections (Swaps)
export const selectTotalManualSelections = createSelector(
  [selectAIErrorStats],
  (stats) => {
    return stats?.total_ai_errors || 0;
  }
);

// Total Segments Processed
export const selectTotalSegmentsProcessed = createSelector(
  [selectAIErrorStats],
  (stats) => {
    return stats?.total_segments || 0;
  }
);

// Total Videos with AI
export const selectTotalVideosWithAI = createSelector(
  [selectAIErrorStats],
  (stats) => {
    return stats?.total_videos || 0;
  }
);

// Manual Selection Rate (Percentage)
export const selectManualSelectionRate = createSelector(
  [selectAIErrorStats],
  (stats) => {
    if (!stats?.total_segments) return 0;
    return parseFloat(((stats.total_ai_errors / stats.total_segments) * 100).toFixed(2));
  }
);

// Top Performing Brand by AI Requests
export const selectTopPerformingBrand = createSelector(
  [selectAIVideoRequestsByBrandStats, selectBrandStats],
  (requestsByBrand, brandErrorStats) => {
    if (!requestsByBrand.length) return null;
    
    const topBrand = requestsByBrand[0];
    const errorStats = brandErrorStats.find(b => b.brandId === topBrand.brandId);
    
    return {
      ...topBrand,
      aiErrorRate: errorStats?.aiErrorRate || 0,
      totalSegments: errorStats?.totalSegments || 0,
    };
  }
);

export default videoEditSlice.reducer;