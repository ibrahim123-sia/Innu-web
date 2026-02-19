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

// Create edit video (user selects educational video)
export const createEditVideo = createAsyncThunk(
  'videoEdit/createEditVideo',
  async ({ videoId, user_selected_vid, problem_label, feedback_reason }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/video-edit-detail/createEditVideo`, {
        videoId,
        user_selected_vid,
        problem_label,
        feedback_reason
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get edit details for a specific video
export const getEditDetailsByVideoId = createAsyncThunk(
  'videoEdit/getEditDetailsByVideoId',
  async (videoId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/video-edit-detail/videos/${videoId}/edit-details`);
      return { videoId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get all edit details
export const getAllEditDetails = createAsyncThunk(
  'videoEdit/getAllEditDetails',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/video-edit-detail/edit-details/all');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// FIXED: Get edit details by brand - returns array directly
export const getEditDetailsByBrand = createAsyncThunk(
  'videoEdit/getEditDetailsByBrand',
  async (brand_id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/video-edit-detail/stats/edit-video-by-brand/${brand_id}`);
      console.log('Raw API response for edits by brand:', response.data);
      
      // Return the data array directly, not wrapped
      return response.data.data || [];
    } catch (error) {
      console.error('Error in getEditDetailsByBrand:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get edit details by shop
export const getEditDetailsByShop = createAsyncThunk(
  'videoEdit/getEditDetailsByShop',
  async (shop_id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/video-edit-detail/stats/edit-video-by-shop/${shop_id}`);
      return { shop_id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get edit details by district
export const getEditDetailsByDistrict = createAsyncThunk(
  'videoEdit/getEditDetailsByDistrict',
  async (district_id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/video-edit-detail/stats/edit-video-by-district/${district_id}`);
      return { district_id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get edit details by user
export const getEditDetailsByUser = createAsyncThunk(
  'videoEdit/getEditDetailsByUser',
  async (user_id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/video-edit-detail/stats/edit-video-by-user/${user_id}`);
      return { user_id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ========== INITIAL STATE ==========

const initialState = {
  editDetails: {},
  editDetailsList: [],
  brandEditDetails: [],
  shopEditDetails: [],
  districtEditDetails: [],
  userEditDetails: [],
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
    clearEditDetails: (state) => {
      state.editDetails = {};
      state.editDetailsList = [];
      state.brandEditDetails = [];
      state.shopEditDetails = [];
      state.districtEditDetails = [];
      state.userEditDetails = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // ========== CREATE EDIT VIDEO ==========
      .addCase(createEditVideo.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createEditVideo.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message || 'Edit video created successfully';
        
        if (action.payload.data) {
          const videoId = action.payload.data.video_id;
          if (!state.editDetails[videoId]) {
            state.editDetails[videoId] = [];
          }
          state.editDetails[videoId].push(action.payload.data);
        }
      })
      .addCase(createEditVideo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to create edit video';
      })
      
      // ========== GET EDIT DETAILS BY VIDEO ID ==========
      .addCase(getEditDetailsByVideoId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEditDetailsByVideoId.fulfilled, (state, action) => {
        state.loading = false;
        state.editDetails[action.payload.videoId] = action.payload.data || [];
      })
      .addCase(getEditDetailsByVideoId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch edit details';
      })
      
      // ========== GET ALL EDIT DETAILS ==========
      .addCase(getAllEditDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllEditDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.editDetailsList = action.payload.data || [];
      })
      .addCase(getAllEditDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch all edit details';
      })
      
      // ========== GET EDIT DETAILS BY BRAND ==========
      .addCase(getEditDetailsByBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEditDetailsByBrand.fulfilled, (state, action) => {
        state.loading = false;
        // Store in brandEditDetails for selectors, but component will use the returned data directly
        state.brandEditDetails = action.payload || [];
      })
      .addCase(getEditDetailsByBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch brand edit details';
      })
      
      // ========== GET EDIT DETAILS BY SHOP ==========
      .addCase(getEditDetailsByShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEditDetailsByShop.fulfilled, (state, action) => {
        state.loading = false;
        state.shopEditDetails = action.payload.data || [];
      })
      .addCase(getEditDetailsByShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch shop edit details';
      })
      
      // ========== GET EDIT DETAILS BY DISTRICT ==========
      .addCase(getEditDetailsByDistrict.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEditDetailsByDistrict.fulfilled, (state, action) => {
        state.loading = false;
        state.districtEditDetails = action.payload.data || [];
      })
      .addCase(getEditDetailsByDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch district edit details';
      })
      
      // ========== GET EDIT DETAILS BY USER ==========
      .addCase(getEditDetailsByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEditDetailsByUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userEditDetails = action.payload.data || [];
      })
      .addCase(getEditDetailsByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch user edit details';
      });
  },
});

// ========== ACTIONS ==========
export const {
  resetVideoEditState,
  clearEditDetails,
} = videoEditSlice.actions;

// ========== SELECTORS ==========

// Base selectors
export const selectVideoEditState = (state) => state.videoEdit;
export const selectEditDetails = (state) => state.videoEdit.editDetails;
export const selectEditDetailsList = (state) => state.videoEdit.editDetailsList;
export const selectBrandEditDetails = (state) => state.videoEdit.brandEditDetails;
export const selectShopEditDetails = (state) => state.videoEdit.shopEditDetails;
export const selectDistrictEditDetails = (state) => state.videoEdit.districtEditDetails;
export const selectUserEditDetails = (state) => state.videoEdit.userEditDetails;
export const selectVideoEditLoading = (state) => state.videoEdit.loading;
export const selectVideoEditError = (state) => state.videoEdit.error;
export const selectVideoEditSuccess = (state) => state.videoEdit.success;
export const selectVideoEditMessage = (state) => state.videoEdit.message;

// Helper selector to get edit details for a specific video
export const selectEditDetailsByVideoId = (videoId) => (state) => 
  state.videoEdit.editDetails[videoId] || [];

// ========== MEMOIZED SELECTORS ==========

// Get edit count by brand
export const selectEditCountByBrand = createSelector(
  [selectBrandEditDetails],
  (brandDetails) => {
    return (brandDetails || []).length;
  }
);

// Get edit count by shop
export const selectEditCountByShop = createSelector(
  [selectShopEditDetails],
  (shopDetails) => {
    return (shopDetails || []).length;
  }
);

// Get edit count by district
export const selectEditCountByDistrict = createSelector(
  [selectDistrictEditDetails],
  (districtDetails) => {
    return (districtDetails || []).length;
  }
);

// Get edit count by user
export const selectEditCountByUser = createSelector(
  [selectUserEditDetails],
  (userDetails) => {
    return (userDetails || []).length;
  }
);

// Get total edit count
export const selectTotalEditCount = createSelector(
  [selectEditDetailsList],
  (editList) => {
    return (editList || []).length;
  }
);

export default videoEditSlice.reducer;