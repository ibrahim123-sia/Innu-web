import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { createSelector } from "@reduxjs/toolkit";

// Create axios instance with base URL
const API = axios.create({
  baseURL: "https://innu-api-112488489004.us-central1.run.app/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========== ASYNC THUNKS ==========

// Create edit video (user selects educational video)
export const createEditVideo = createAsyncThunk(
  "videoEdit/createEditVideo",
  async (
    { videoId, user_selected_vid, problem_label, feedback_reason },
    { rejectWithValue },
  ) => {
    try {
      const response = await API.post(`/video-edit-detail/createEditVideo`, {
        videoId,
        user_selected_vid,
        problem_label,
        feedback_reason,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Get edit details for a specific video
export const getEditDetailsByVideoId = createAsyncThunk(
  "videoEdit/getEditDetailsByVideoId",
  async (videoId, { rejectWithValue }) => {
    try {
      const response = await API.get(
        `/video-edit-detail/videos/${videoId}/edit-details`,
      );
      return { videoId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Get all edit details
export const getAllEditDetails = createAsyncThunk(
  "videoEdit/getAllEditDetails",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/video-edit-detail/edit-details/all");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Get edit details by brand
export const getEditDetailsByBrand = createAsyncThunk(
  "videoEdit/getEditDetailsByBrand",
  async (brand_id, { rejectWithValue }) => {
    try {
      const response = await API.get(
        `/video-edit-detail/stats/edit-video-by-brand/${brand_id}`,
      );
      console.log("Raw API response for edits by brand:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in getEditDetailsByBrand:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Get edit details by shop
export const getEditDetailsByShop = createAsyncThunk(
  "videoEdit/getEditDetailsByShop",
  async (shop_id, { rejectWithValue }) => {
    try {
      const response = await API.get(
        `/video-edit-detail/stats/edit-video-by-shop/${shop_id}`,
      );
      return { shop_id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Get edit details by district
export const getEditDetailsByDistrict = createAsyncThunk(
  "videoEdit/getEditDetailsByDistrict",
  async (district_id, { rejectWithValue }) => {
    try {
      const response = await API.get(
        `/video-edit-detail/stats/edit-video-by-district/${district_id}`,
      );
      return { district_id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Get edit details by user
export const getEditDetailsByUser = createAsyncThunk(
  "videoEdit/getEditDetailsByUser",
  async (user_id, { rejectWithValue }) => {
    try {
      const response = await API.get(
        `/video-edit-detail/stats/edit-video-by-user/${user_id}`,
      );
      return { user_id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// ========== INITIAL STATE ==========

const initialState = {
  editDetails: {},
  editDetailsList: [],
  brandEditDetails: [],
  shopEditDetails: [],
  districtEditDetails: [],
  userEditDetails: [], // This will store ALL user edits fetched
  loading: false,
  error: null,
  success: false,
  message: "",
  lastFetched: {}, // Track when each user was last fetched
};

// ========== SLICE ==========

const videoEditSlice = createSlice({
  name: "videoEdit",
  initialState,
  reducers: {
    resetVideoEditState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = "";
    },
    clearEditDetails: (state) => {
      state.editDetails = {};
      state.editDetailsList = [];
      state.brandEditDetails = [];
      state.shopEditDetails = [];
      state.districtEditDetails = [];
      state.userEditDetails = [];
      state.lastFetched = {};
    },
    clearUserEditDetails: (state) => {
      state.userEditDetails = [];
      state.lastFetched = {};
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
        state.message =
          action.payload.message || "Edit video created successfully";

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
        state.error = action.payload?.error || "Failed to create edit video";
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
        state.error = action.payload?.error || "Failed to fetch edit details";
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
        state.error =
          action.payload?.error || "Failed to fetch all edit details";
      })

      // ========== GET EDIT DETAILS BY BRAND ==========
      .addCase(getEditDetailsByBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEditDetailsByBrand.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.data && Array.isArray(action.payload.data)) {
          state.brandEditDetails = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          state.brandEditDetails = action.payload;
        } else {
          state.brandEditDetails = [];
        }
      })
      .addCase(getEditDetailsByBrand.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.error || "Failed to fetch brand edit details";
        state.brandEditDetails = [];
      })

      // ========== GET EDIT DETAILS BY SHOP ==========
      .addCase(getEditDetailsByShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEditDetailsByShop.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.data) {
          state.shopEditDetails = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          state.shopEditDetails = action.payload;
        } else {
          state.shopEditDetails = [];
        }
      })
      .addCase(getEditDetailsByShop.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.error || "Failed to fetch shop edit details";
        state.shopEditDetails = [];
      })

      // ========== GET EDIT DETAILS BY DISTRICT ==========
      .addCase(getEditDetailsByDistrict.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEditDetailsByDistrict.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.data) {
          state.districtEditDetails = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          state.districtEditDetails = action.payload;
        } else {
          state.districtEditDetails = [];
        }
      })
      .addCase(getEditDetailsByDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.error || "Failed to fetch district edit details";
        state.districtEditDetails = [];
      })

      // ========== GET EDIT DETAILS BY USER ==========
      .addCase(getEditDetailsByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEditDetailsByUser.fulfilled, (state, action) => {
        state.loading = false;
        const userId = action.payload.user_id;
        
        // FIXED: Extract the data array from the response
        let userEdits = [];
        if (action.payload && action.payload.data && Array.isArray(action.payload.data)) {
          userEdits = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          userEdits = action.payload;
        }
        
        // Remove any existing edits for this user before adding new ones
        // This prevents duplicates on refresh
        state.userEditDetails = state.userEditDetails.filter(
          edit => edit.selected_by !== userId && edit.created_by !== userId
        );
        
        // Add the new edits
        state.userEditDetails = [...state.userEditDetails, ...userEdits];
        
        // Track when this user was last fetched
        state.lastFetched[userId] = Date.now();
        
        console.log(`✅ Loaded ${userEdits.length} edit details for user ${userId}. Total in store: ${state.userEditDetails.length}`);
      })
      .addCase(getEditDetailsByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch user edit details";
      })
  },
});

// ========== ACTIONS ==========
export const { resetVideoEditState, clearEditDetails, clearUserEditDetails } = videoEditSlice.actions;

// ========== SELECTORS ==========

// Base selectors
export const selectVideoEditState = (state) => state.videoEdit;
export const selectEditDetails = (state) => state.videoEdit.editDetails;
export const selectEditDetailsList = (state) => state.videoEdit.editDetailsList;
export const selectBrandEditDetails = (state) => state.videoEdit.brandEditDetails;
export const selectShopEditDetails = (state) => state.videoEdit.shopEditDetails;
export const selectDistrictEditDetails = (state) => state.videoEdit.districtEditDetails;
export const selectUserEditDetails = (state) => state.videoEdit.userEditDetails;
export const selectLastFetched = (state) => state.videoEdit.lastFetched;
export const selectVideoEditLoading = (state) => state.videoEdit.loading;
export const selectVideoEditError = (state) => state.videoEdit.error;
export const selectVideoEditSuccess = (state) => state.videoEdit.success;
export const selectVideoEditMessage = (state) => state.videoEdit.message;

// Helper selector to get edit details for a specific video
export const selectEditDetailsByVideoId = (videoId) => (state) =>
  state.videoEdit.editDetails[videoId] || [];

// FIXED: Selector to get edit details by user ID
// Based on your Postman response, the field is 'selected_by'
export const selectEditDetailsByUserId = (userId) => (state) => {
  if (!userId) return [];
  
  // Get from userEditDetails array which now contains all fetched edits
  const allEdits = state.videoEdit.userEditDetails || [];
  
  // Filter edits where selected_by matches the userId
  // From your Postman data, the user ID is in the 'selected_by' field
  const filteredEdits = allEdits.filter(edit => edit.selected_by === userId);
  
  return filteredEdits;
};

// Alternative selector that checks both selected_by and created_by
export const selectAllUserEdits = (userId) => (state) => {
  if (!userId) return [];
  
  const allEdits = state.videoEdit.userEditDetails || [];
  
  // Check both fields that might contain the user ID
  return allEdits.filter(edit => 
    edit.selected_by === userId || edit.created_by === userId
  );
};

// ========== MEMOIZED SELECTORS ==========

// Get edit count by brand
export const selectEditCountByBrand = createSelector(
  [selectBrandEditDetails],
  (brandDetails) => {
    return (brandDetails || []).length;
  },
);

// Get edit count by shop
export const selectEditCountByShop = createSelector(
  [selectShopEditDetails],
  (shopDetails) => {
    return (shopDetails || []).length;
  },
);

// Get edit count by district
export const selectEditCountByDistrict = createSelector(
  [selectDistrictEditDetails],
  (districtDetails) => {
    return (districtDetails || []).length;
  },
);

// Get edit count by user
export const selectEditCountByUser = createSelector(
  [selectUserEditDetails],
  (userDetails) => {
    return (userDetails || []).length;
  },
);

// Get total edit count
export const selectTotalEditCount = createSelector(
  [selectEditDetailsList],
  (editList) => {
    return (editList || []).length;
  },
);

// Get unique videos with edits for a user
export const selectUniqueVideosWithEditsByUser = (userId) => createSelector(
  [(state) => selectEditDetailsByUserId(userId)(state)],
  (userEdits) => {
    const uniqueVideoIds = new Set();
    userEdits.forEach(edit => {
      if (edit.video_id) {
        uniqueVideoIds.add(edit.video_id);
      }
    });
    return Array.from(uniqueVideoIds);
  }
);

export default videoEditSlice.reducer;