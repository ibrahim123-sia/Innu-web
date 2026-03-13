import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { createSelector } from "@reduxjs/toolkit";

const API = axios.create({
  baseURL: "https://innu-api-112488489004.us-central1.run.app/api",
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

export const getEditDetailsByBrand = createAsyncThunk(
  "videoEdit/getEditDetailsByBrand",
  async (brand_id, { rejectWithValue }) => {
    try {
      const response = await API.get(
        `/video-edit-detail/stats/edit-video-by-brand/${brand_id}`,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

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
  message: "",
  lastFetched: {},
};

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
      .addCase(createEditVideo.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createEditVideo.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message || "Edit video created successfully";

        if (action.payload.data) {
          const videoId = action.payload.data.video_id;
          if (!state.editDetails[videoId]) state.editDetails[videoId] = [];
          state.editDetails[videoId].push(action.payload.data);
        }
      })
      .addCase(createEditVideo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to create edit video";
      })

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
        state.error = action.payload?.error || "Failed to fetch all edit details";
      })

      .addCase(getEditDetailsByBrand.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEditDetailsByBrand.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.data && Array.isArray(action.payload.data)) {
          state.brandEditDetails = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          state.brandEditDetails = action.payload;
        } else {
          state.brandEditDetails = [];
        }
      })
      .addCase(getEditDetailsByBrand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch brand edit details";
        state.brandEditDetails = [];
      })

      .addCase(getEditDetailsByShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEditDetailsByShop.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.data) {
          state.shopEditDetails = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          state.shopEditDetails = action.payload;
        } else {
          state.shopEditDetails = [];
        }
      })
      .addCase(getEditDetailsByShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch shop edit details";
        state.shopEditDetails = [];
      })

      .addCase(getEditDetailsByDistrict.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEditDetailsByDistrict.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.data) {
          state.districtEditDetails = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          state.districtEditDetails = action.payload;
        } else {
          state.districtEditDetails = [];
        }
      })
      .addCase(getEditDetailsByDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch district edit details";
        state.districtEditDetails = [];
      })

      .addCase(getEditDetailsByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEditDetailsByUser.fulfilled, (state, action) => {
        state.loading = false;
        const userId = action.payload.user_id;
        
        let userEdits = [];
        if (action.payload?.data && Array.isArray(action.payload.data)) {
          userEdits = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          userEdits = action.payload;
        }
        
        state.userEditDetails = state.userEditDetails.filter(
          edit => edit.selected_by !== userId && edit.created_by !== userId
        );
        
        state.userEditDetails = [...state.userEditDetails, ...userEdits];
        state.lastFetched[userId] = Date.now();
      })
      .addCase(getEditDetailsByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch user edit details";
      })
  },
});

export const { resetVideoEditState, clearEditDetails, clearUserEditDetails } = videoEditSlice.actions;

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

export const selectEditDetailsByVideoId = (videoId) => (state) =>
  state.videoEdit.editDetails[videoId] || [];

export const selectEditDetailsByUserId = (userId) => (state) => {
  if (!userId) return [];
  const allEdits = state.videoEdit.userEditDetails || [];
  return allEdits.filter(edit => edit.selected_by === userId);
};

export const selectAllUserEdits = (userId) => (state) => {
  if (!userId) return [];
  const allEdits = state.videoEdit.userEditDetails || [];
  return allEdits.filter(edit => edit.selected_by === userId || edit.created_by === userId);
};

export const selectEditCountByBrand = createSelector(
  [selectBrandEditDetails],
  (brandDetails) => brandDetails?.length || 0,
);

export const selectEditCountByShop = createSelector(
  [selectShopEditDetails],
  (shopDetails) => shopDetails?.length || 0,
);

export const selectEditCountByDistrict = createSelector(
  [selectDistrictEditDetails],
  (districtDetails) => districtDetails?.length || 0,
);

export const selectEditCountByUser = createSelector(
  [selectUserEditDetails],
  (userDetails) => userDetails?.length || 0,
);

export const selectTotalEditCount = createSelector(
  [selectEditDetailsList],
  (editList) => editList?.length || 0,
);

export const selectUniqueVideosWithEditsByUser = (userId) => createSelector(
  [(state) => selectEditDetailsByUserId(userId)(state)],
  (userEdits) => {
    const uniqueVideoIds = new Set();
    userEdits.forEach(edit => {
      if (edit.video_id) uniqueVideoIds.add(edit.video_id);
    });
    return Array.from(uniqueVideoIds);
  }
);

export default videoEditSlice.reducer;