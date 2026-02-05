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

// ============ NEW STATS THUNKS ============

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

// Swap a video segment
export const swapSegment = createAsyncThunk(
  'videoEdit/swapSegment',
  async ({ editId, user_selected_vid, vid_keywords }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/video-edit-detail/edit-details/swap/${editId}`, {
        newLibraryId: user_selected_vid,
        reason: 'User manual selection'
      });
      return { editId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ========== INITIAL STATE ==========

const initialState = {
  editDetails: {},
  // New stats state
  totalAIVideoRequests: 0,
  aiVideoRequestsByBrand: [],
  aiErrorStats: null,
  brandAIErrorStats: [],
  videoAnalyticsStats: null,
  loading: false,
  error: null,
  success: false,
  message: '',
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
  },
  extraReducers: (builder) => {
    builder
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
        
        // Update individual stats from comprehensive response
        if (action.payload.data) {
          state.totalAIVideoRequests = action.payload.data.total_ai_video_requests?.total_ai_video_requests || 0;
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
} = videoEditSlice.actions;

// ========== SELECTORS ==========

// Base selectors
export const selectVideoEditState = (state) => state.videoEdit;
export const selectTotalAIVideoRequests = (state) => state.videoEdit.totalAIVideoRequests;
export const selectAIVideoRequestsByBrand = (state) => state.videoEdit.aiVideoRequestsByBrand;
export const selectAIErrorStats = (state) => state.videoEdit.aiErrorStats;
export const selectBrandAIErrorStats = (state) => state.videoEdit.brandAIErrorStats;
export const selectVideoAnalyticsStats = (state) => state.videoEdit.videoAnalyticsStats;
export const selectVideoEditLoading = (state) => state.videoEdit.loading;
export const selectVideoEditError = (state) => state.videoEdit.error;

// Memoized selectors
export const selectAIErrorRate = createSelector(
  [selectAIErrorStats],
  (stats) => {
    if (!stats) return 0;
    return parseFloat(stats.ai_error_rate) || 0;
  }
);

export const selectAISuccessRate = createSelector(
  [selectAIErrorStats],
  (stats) => {
    if (!stats) return 0;
    return parseFloat(stats.ai_success_rate) || 0;
  }
);

export const selectTotalManualSelections = createSelector(
  [selectAIErrorStats],
  (stats) => {
    return stats?.total_ai_errors || 0;
  }
);

export const selectManualSelectionRate = createSelector(
  [selectAIErrorStats],
  (stats) => {
    if (!stats?.total_segments) return "0.00";
    return ((stats.total_ai_errors / stats.total_segments) * 100).toFixed(2);
  }
);

export const selectBrandStats = createSelector(
  [selectBrandAIErrorStats],
  (brandStats) => {
    return brandStats.map(brand => ({
      brandId: brand.brand_id,
      brandName: brand.brand_name,
      totalSegments: brand.total_segments || 0,
      aiErrors: brand.ai_errors || 0,
      aiCorrect: brand.ai_correct || 0,
      aiErrorRate: brand.ai_error_rate || 0,
      aiSuccessRate: brand.ai_success_rate || 0,
    }));
  }
);

export const selectAIVideoRequestsByBrandStats = createSelector(
  [selectAIVideoRequestsByBrand],
  (requestsByBrand) => {
    return requestsByBrand.map(brand => ({
      brandId: brand.brand_id,
      brandName: brand.brand_name,
      totalAIVideoRequests: brand.total_ai_video_requests || 0,
    }));
  }
);

export default videoEditSlice.reducer;