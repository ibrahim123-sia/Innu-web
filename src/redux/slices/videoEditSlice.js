// src/redux/slice/videoEditSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Update with your backend URL
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

// Async Thunks
export const getEditDetails = createAsyncThunk(
  'videoEdit/getEditDetails',
  async (videoId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/video-edit/videos/${videoId}/edit-details`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const swapSegment = createAsyncThunk(
  'videoEdit/swapSegment',
  async ({ editId, newLibraryId, reason }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/video-edit/edit-details/${editId}/swap`, {
        newLibraryId,
        reason
      });
      return { editId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const regenerateVideo = createAsyncThunk(
  'videoEdit/regenerateVideo',
  async (videoId, { rejectWithValue }) => {
    try {
      const response = await API.post(`/video-edit/videos/${videoId}/regenerate`);
      return { videoId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  editDetails: {}, // Keyed by videoId
  currentVideoEdit: null,
  loading: false,
  error: null,
  success: false,
  message: '',
  operations: {
    swapping: false,
    regenerating: false,
  },
  swapHistory: [],
};

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
    clearEditDetails: (state, action) => {
      const videoId = action.payload;
      if (videoId) {
        delete state.editDetails[videoId];
      } else {
        state.editDetails = {};
      }
    },
    clearCurrentVideoEdit: (state) => {
      state.currentVideoEdit = null;
    },
    clearSwapHistory: (state) => {
      state.swapHistory = [];
    },
    updateEditSegment: (state, action) => {
      const { videoId, editId, updateData } = action.payload;
      if (state.editDetails[videoId]) {
        const segmentIndex = state.editDetails[videoId].findIndex(segment => segment.edit_id === editId);
        if (segmentIndex !== -1) {
          state.editDetails[videoId][segmentIndex] = {
            ...state.editDetails[videoId][segmentIndex],
            ...updateData
          };
        }
      }
    },
    addSwapToHistory: (state, action) => {
      const swapRecord = {
        ...action.payload,
        timestamp: new Date().toISOString()
      };
      state.swapHistory.unshift(swapRecord);
      // Keep only last 50 swap records
      if (state.swapHistory.length > 50) {
        state.swapHistory.pop();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Edit Details
      .addCase(getEditDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEditDetails.fulfilled, (state, action) => {
        state.loading = false;
        const videoId = action.meta.arg;
        state.editDetails[videoId] = action.payload.data;
      })
      .addCase(getEditDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch edit details';
      })
      
      // Swap Segment
      .addCase(swapSegment.pending, (state) => {
        state.operations.swapping = true;
        state.error = null;
        state.success = false;
      })
      .addCase(swapSegment.fulfilled, (state, action) => {
        state.operations.swapping = false;
        state.success = true;
        const { editId, videoId, newLibraryId, reason } = action.meta.arg;
        
        // Add to swap history
        videoEditSlice.caseReducers.addSwapToHistory(state, {
          payload: {
            editId,
            videoId,
            newLibraryId,
            reason,
            success: true
          }
        });
        
        // Update the specific segment in edit details
        if (state.editDetails[videoId]) {
          const segmentIndex = state.editDetails[videoId].findIndex(segment => segment.edit_id === editId);
          if (segmentIndex !== -1) {
            state.editDetails[videoId][segmentIndex] = {
              ...state.editDetails[videoId][segmentIndex],
              user_selected_vid: newLibraryId,
              active_vid_id: newLibraryId,
              feedback_reason: reason
            };
          }
        }
        
        state.message = action.payload.message;
      })
      .addCase(swapSegment.rejected, (state, action) => {
        state.operations.swapping = false;
        state.error = action.payload?.error || 'Failed to swap segment';
        
        // Add failed swap to history
        if (action.meta.arg) {
          videoEditSlice.caseReducers.addSwapToHistory(state, {
            payload: {
              ...action.meta.arg,
              success: false,
              error: action.payload?.error
            }
          });
        }
      })
      
      // Regenerate Video
      .addCase(regenerateVideo.pending, (state) => {
        state.operations.regenerating = true;
        state.error = null;
        state.success = false;
      })
      .addCase(regenerateVideo.fulfilled, (state, action) => {
        state.operations.regenerating = false;
        state.success = true;
        state.message = action.payload.message;
        
        // You might want to update the video status in the videos slice
        // This would require accessing another slice or dispatching an action
      })
      .addCase(regenerateVideo.rejected, (state, action) => {
        state.operations.regenerating = false;
        state.error = action.payload?.error || 'Failed to regenerate video';
      });
  },
});

export const {
  resetVideoEditState,
  clearEditDetails,
  clearCurrentVideoEdit,
  clearSwapHistory,
  updateEditSegment,
  addSwapToHistory,
} = videoEditSlice.actions;

// Selectors
export const selectEditDetails = (state) => state.videoEdit.editDetails;
export const selectCurrentVideoEdit = (state) => state.videoEdit.currentVideoEdit;
export const selectVideoEditLoading = (state) => state.videoEdit.loading;
export const selectVideoEditError = (state) => state.videoEdit.error;
export const selectVideoEditSuccess = (state) => state.videoEdit.success;
export const selectVideoEditMessage = (state) => state.videoEdit.message;
export const selectVideoEditOperations = (state) => state.videoEdit.operations;
export const selectSwapHistory = (state) => state.videoEdit.swapHistory;

// Helper selectors
export const selectEditDetailsByVideoId = (videoId) => (state) =>
  state.videoEdit.editDetails[videoId] || [];

export const selectSegmentByEditId = (videoId, editId) => (state) =>
  state.videoEdit.editDetails[videoId]?.find(segment => segment.edit_id === editId);

export const selectIsSwapping = (state) => state.videoEdit.operations.swapping;
export const selectIsRegenerating = (state) => state.videoEdit.operations.regenerating;

// Analytics selectors
export const selectSwapStats = (state) => {
  const history = state.videoEdit.swapHistory;
  const stats = {
    total: history.length,
    successful: history.filter(swap => swap.success).length,
    failed: history.filter(swap => !swap.success).length,
    byVideo: {},
    byReason: {},
  };
  
  history.forEach(swap => {
    // By video
    if (swap.videoId) {
      if (!stats.byVideo[swap.videoId]) {
        stats.byVideo[swap.videoId] = {
          total: 0,
          successful: 0,
          failed: 0,
        };
      }
      stats.byVideo[swap.videoId].total++;
      if (swap.success) {
        stats.byVideo[swap.videoId].successful++;
      } else {
        stats.byVideo[swap.videoId].failed++;
      }
    }
    
    // By reason
    if (swap.reason) {
      if (!stats.byReason[swap.reason]) {
        stats.byReason[swap.reason] = 0;
      }
      stats.byReason[swap.reason]++;
    }
  });
  
  return stats;
};

export const selectRecentSwaps = (limit = 10) => (state) =>
  state.videoEdit.swapHistory.slice(0, limit);

export default videoEditSlice.reducer;