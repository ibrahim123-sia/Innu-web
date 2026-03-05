import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
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

const createFormDataRequest = (url, data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  });
  return API.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const login = createAsyncThunk(
  "user/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await API.post("/users/login", credentials);

      if (response.data.data?.token) {
        localStorage.setItem("token", response.data.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.data.user));
        localStorage.setItem("is_first_login", response.data.data.is_first_login || false);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const createUser = createAsyncThunk(
  "user/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      let response;
      if (userData instanceof FormData) {
        response = await API.post("/users/createUser", userData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await API.post("/users/createUser", userData);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const updateFirstTimePassword = createAsyncThunk(
  "user/updateFirstTimePassword",
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await API.post("/users/update-first-password", {
        currentPassword,
        newPassword,
      });

      if (response.data.success) {
        localStorage.setItem("is_first_login", "false");
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          user.is_first_login = false;
          localStorage.setItem("user", JSON.stringify(user));
        }
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const requestPasswordReset = createAsyncThunk(
  "user/requestPasswordReset",
  async (email, { rejectWithValue }) => {
    try {
      const response = await API.post("/users/request-password-reset", { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const resetPasswordWithOTP = createAsyncThunk(
  "user/resetPasswordWithOTP",
  async ({ email, otp, newPassword }, { rejectWithValue }) => {
    try {
      const response = await API.post("/users/reset-password", {
        email,
        otp,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const changePassword = createAsyncThunk(
  "user/changePassword",
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await API.post("/users/change-password", {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const resendOTP = createAsyncThunk(
  "user/resendOTP",
  async (email, { rejectWithValue }) => {
    try {
      const response = await API.post("/users/resend-otp", { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const validateOTP = createAsyncThunk(
  "user/validateOTP",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await API.post("/users/validate-otp", { email, otp });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getUserProfile = createAsyncThunk(
  "user/getUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/users/profile");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  "user/updateUserProfile",
  async ({ userId, profileData }, { rejectWithValue, getState }) => {
    try {
      const actualUserId = userId || getState().user.currentUser?.id;
      if (!actualUserId) return rejectWithValue({ error: "User ID is required" });

      const response = await API.put(`/users/updateUser/${actualUserId}`, profileData, {
        headers: { "Content-Type": "application/json" },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getPasswordSystemStatus = createAsyncThunk(
  "user/getPasswordSystemStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/users/password-system/status");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const sendFirstLoginReminders = createAsyncThunk(
  "user/sendFirstLoginReminders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.post("/users/send-first-login-reminders");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getUserById = createAsyncThunk(
  "user/getUserById",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/users/getUsers/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const updateUser = createAsyncThunk(
  "user/updateUser",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      let response;
      if (data instanceof FormData) {
        response = await API.put(`/users/updateUser/${id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await API.put(`/users/updateUser/${id}`, data);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/users/deleteUser/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getUserByEmail = createAsyncThunk(
  "user/getUserByEmail",
  async (email, { rejectWithValue }) => {
    try {
      const response = await API.get(`/users/getUserByEmail/${email}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getUsersByShopId = createAsyncThunk(
  "user/getUsersByShopId",
  async (shop_id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/users/users/shop/${shop_id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getUsersByRole = createAsyncThunk(
  "user/getUsersByRole",
  async (role, { rejectWithValue }) => {
    try {
      const response = await API.get(`/users/users/role/${role}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getAllUsers = createAsyncThunk(
  "user/getAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/users/users");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const toggleUserActiveStatus = createAsyncThunk(
  "user/toggleUserActiveStatus",
  async ({ userId, is_active }, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/users/users/${userId}/toggle-status`, { is_active });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getAdminUsers = createAsyncThunk(
  "user/getAdminUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/users/admin/users");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getBrandUsers = createAsyncThunk(
  "user/getBrandUsers",
  async (brandId, { rejectWithValue }) => {
    try {
      const response = await API.get(`users/users/brand/${brandId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getDistrictUsers = createAsyncThunk(
  "user/getDistrictUsers",
  async (districtId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/users/users/district/${districtId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getUsersByBrand = createAsyncThunk(
  "user/getUsersByBrand",
  async (brandId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/users/users/brand/${brandId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const getUsersByDistrict = createAsyncThunk(
  "user/getUsersByDistrict",
  async (districtId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/users/users/district/${districtId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

const getInitialState = () => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const isFirstLogin = localStorage.getItem("is_first_login") === "true";

  let user = null;
  let isAuthenticated = false;

  if (token && userStr) {
    try {
      user = JSON.parse(userStr);
      isAuthenticated = true;
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("is_first_login");
    }
  }

  return {
    currentUser: user,
    users: [],
    usersByShop: [],
    usersByRole: {},
    filteredUsers: [],
    loading: false,
    error: null,
    success: false,
    message: "",
    isAuthenticated,
    isFirstLogin,
    token: token || null,
    passwordReset: {
      loading: false,
      success: false,
      error: null,
      otpSent: false,
      otpVerified: false,
      email: null,
      otpExpiresAt: null,
    },
    profile: {
      loading: false,
      success: false,
      error: null,
    },
    systemStatus: null,
    filters: {
      role: "",
      brand_id: null,
      shop_id: null,
      district_id: null,
      is_active: true,
      search: "",
      password_status: "",
    },
    statistics: {
      total: 0,
      active: 0,
      inactive: 0,
      byRole: {},
      byShop: {},
      byBrand: {},
      passwordStats: {
        with_password: 0,
        with_ft_password: 0,
        first_login_pending: 0,
      },
    },
  };
};

const userSlice = createSlice({
  name: "user",
  initialState: getInitialState(),
  reducers: {
    resetUserState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = "";
      state.passwordReset.loading = false;
      state.passwordReset.success = false;
      state.passwordReset.error = null;
      state.profile.loading = false;
      state.profile.success = false;
      state.profile.error = null;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.token = null;
      state.isFirstLogin = false;
    },
    clearUsersByShop: (state) => {
      state.usersByShop = [];
    },
    clearUsersByRole: (state) => {
      state.usersByRole = {};
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        role: "",
        brand_id: null,
        shop_id: null,
        district_id: null,
        is_active: true,
        search: "",
        password_status: "",
      };
      state.filteredUsers = [];
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.token = null;
      state.isFirstLogin = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("is_first_login");
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    updateCurrentUser: (state, action) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.currentUser));
      }
    },
    setIsFirstLogin: (state, action) => {
      state.isFirstLogin = action.payload;
      localStorage.setItem("is_first_login", action.payload);
    },
    resetPasswordState: (state) => {
      state.passwordReset = {
        loading: false,
        success: false,
        error: null,
        otpSent: false,
        otpVerified: false,
        email: null,
        otpExpiresAt: null,
      };
    },
    setOtpVerified: (state, action) => {
      state.passwordReset.otpVerified = action.payload;
    },
    filterUsers: (state, action) => {
      const {
        role, brand_id, shop_id, district_id, is_active, search, password_status
      } = action.payload;

      state.filteredUsers = state.users.filter((user) => {
        let matches = true;
        if (role && user.role !== role) matches = false;
        if (brand_id && user.brand_id !== brand_id) matches = false;
        if (shop_id && user.shop_id !== shop_id) matches = false;
        if (district_id && user.district_id !== district_id) matches = false;
        if (is_active !== undefined && user.is_active !== is_active) matches = false;

        if (password_status) {
          if (password_status === "has_password" && !user.password) matches = false;
          if (password_status === "first_login" &&
            (!user.ft_password || user.password || user.is_first_login === false))
            matches = false;
          if (password_status === "no_password" && (user.password || user.ft_password))
            matches = false;
        }

        if (search) {
          const searchLower = search.toLowerCase();
          const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
          const email = user.email.toLowerCase();
          if (!fullName.includes(searchLower) && !email.includes(searchLower)) matches = false;
        }

        return matches;
      });
    },
    sortUsers: (state, action) => {
      const { field, direction = "asc" } = action.payload;
      const usersToSort = state.filteredUsers?.length ? state.filteredUsers : state.users;

      const sortedUsers = [...usersToSort].sort((a, b) => {
        if (["created_at", "updated_at", "password_updated_at"].includes(field)) {
          return direction === "asc"
            ? new Date(a[field]) - new Date(b[field])
            : new Date(b[field]) - new Date(a[field]);
        }

        if (field === "name") {
          const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
          const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
          return direction === "asc" ? (nameA > nameB ? 1 : -1) : (nameA < nameB ? 1 : -1);
        }

        return direction === "asc" ? (a[field] > b[field] ? 1 : -1) : (a[field] < b[field] ? 1 : -1);
      });

      if (state.filteredUsers?.length) {
        state.filteredUsers = sortedUsers;
      } else {
        state.users = sortedUsers;
      }
    },
    updateUserInList: (state, action) => {
      const updatedUser = action.payload;
      const index = state.users.findIndex((user) => user.id === updatedUser.id);
      if (index !== -1) state.users[index] = { ...state.users[index], ...updatedUser };

      if (state.usersByShop.length) {
        const shopIndex = state.usersByShop.findIndex((user) => user.id === updatedUser.id);
        if (shopIndex !== -1) state.usersByShop[shopIndex] = { ...state.usersByShop[shopIndex], ...updatedUser };
      }

      if (state.usersByRole[updatedUser.role]) {
        const roleIndex = state.usersByRole[updatedUser.role].findIndex((user) => user.id === updatedUser.id);
        if (roleIndex !== -1) {
          state.usersByRole[updatedUser.role][roleIndex] = {
            ...state.usersByRole[updatedUser.role][roleIndex],
            ...updatedUser,
          };
        }
      }

      if (state.filteredUsers?.length) {
        const filteredIndex = state.filteredUsers.findIndex((user) => user.id === updatedUser.id);
        if (filteredIndex !== -1) state.filteredUsers[filteredIndex] = { ...state.filteredUsers[filteredIndex], ...updatedUser };
      }

      if (state.currentUser?.id === updatedUser.id) {
        state.currentUser = { ...state.currentUser, ...updatedUser };
        localStorage.setItem("user", JSON.stringify(state.currentUser));
      }
    },
    updateStatistics: (state) => {
      const users = state.users;
      const stats = {
        total: users.length,
        active: users.filter((user) => user.is_active).length,
        inactive: users.filter((user) => !user.is_active).length,
        byRole: {},
        byShop: {},
        byBrand: {},
        passwordStats: {
          with_password: users.filter((user) => user.password && !user.ft_password).length,
          with_ft_password: users.filter((user) => user.ft_password && !user.password).length,
          first_login_pending: users.filter(
            (user) => user.ft_password && !user.password && user.is_active &&
              (user.is_first_login === true || user.is_first_login === undefined)
          ).length,
        },
      };

      users.forEach((user) => {
        if (!stats.byRole[user.role]) {
          stats.byRole[user.role] = { total: 0, active: 0, inactive: 0, first_login_pending: 0 };
        }
        stats.byRole[user.role].total++;
        if (user.is_active) stats.byRole[user.role].active++;
        else stats.byRole[user.role].inactive++;

        if (user.ft_password && !user.password && user.is_active &&
          (user.is_first_login === true || user.is_first_login === undefined)) {
          stats.byRole[user.role].first_login_pending++;
        }

        if (user.shop_id) {
          if (!stats.byShop[user.shop_id]) {
            stats.byShop[user.shop_id] = { name: user.shop_name || `Shop ${user.shop_id}`, total: 0, active: 0, inactive: 0 };
          }
          stats.byShop[user.shop_id].total++;
          if (user.is_active) stats.byShop[user.shop_id].active++;
          else stats.byShop[user.shop_id].inactive++;
        }

        if (user.brand_id) {
          if (!stats.byBrand[user.brand_id]) {
            stats.byBrand[user.brand_id] = { name: user.brand_name || `Brand ${user.brand_id}`, total: 0, active: 0, inactive: 0 };
          }
          stats.byBrand[user.brand_id].total++;
          if (user.is_active) stats.byBrand[user.brand_id].active++;
          else stats.byBrand[user.brand_id].inactive++;
        }
      });

      state.statistics = stats;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.currentUser = action.payload.data.user;
        state.isAuthenticated = true;
        state.isFirstLogin = action.payload.data.is_first_login || false;
        state.token = action.payload.data.token;
        state.message = action.payload.message;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Login failed";
        state.isAuthenticated = false;
        state.currentUser = null;
        state.token = null;
        state.isFirstLogin = false;
      })

      .addCase(updateFirstTimePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateFirstTimePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.isFirstLogin = false;
        state.message = action.payload.message;

        if (state.currentUser) {
          state.currentUser.is_first_login = false;
          localStorage.setItem("user", JSON.stringify(state.currentUser));
        }

        if (state.currentUser?.id) {
          const userIndex = state.users.findIndex((u) => u.id === state.currentUser.id);
          if (userIndex !== -1) {
            state.users[userIndex] = {
              ...state.users[userIndex],
              is_first_login: false,
              password: "exists",
              ft_password: null,
            };
          }
        }

        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(updateFirstTimePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to update password";
      })

      .addCase(requestPasswordReset.pending, (state) => {
        state.passwordReset.loading = true;
        state.passwordReset.error = null;
        state.passwordReset.success = false;
      })
      .addCase(requestPasswordReset.fulfilled, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.success = true;
        state.passwordReset.otpSent = true;
        state.passwordReset.email = action.payload.data?.email;
        state.passwordReset.otpExpiresAt = action.payload.data?.otp_expires_at;
        state.message = action.payload.message;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.error = action.payload?.error || "Failed to send OTP";
      })

      .addCase(resetPasswordWithOTP.pending, (state) => {
        state.passwordReset.loading = true;
        state.passwordReset.error = null;
        state.passwordReset.success = false;
      })
      .addCase(resetPasswordWithOTP.fulfilled, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.success = true;
        state.passwordReset.otpVerified = false;
        state.message = action.payload.message;
      })
      .addCase(resetPasswordWithOTP.rejected, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.error = action.payload?.error || "Failed to reset password";
      })

      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to change password";
      })

      .addCase(resendOTP.pending, (state) => {
        state.passwordReset.loading = true;
        state.passwordReset.error = null;
      })
      .addCase(resendOTP.fulfilled, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.otpSent = true;
        state.passwordReset.otpExpiresAt = action.payload.data?.otp_expires_at;
        state.message = action.payload.message;
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.error = action.payload?.error || "Failed to resend OTP";
      })

      .addCase(validateOTP.pending, (state) => {
        state.passwordReset.loading = true;
        state.passwordReset.error = null;
      })
      .addCase(validateOTP.fulfilled, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.otpVerified = true;
        state.message = action.payload.message;
      })
      .addCase(validateOTP.rejected, (state, action) => {
        state.passwordReset.loading = false;
        state.passwordReset.error = action.payload?.error || "Invalid OTP";
        state.passwordReset.otpVerified = false;
      })

      .addCase(getUserProfile.pending, (state) => {
        state.profile.loading = true;
        state.profile.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.profile.loading = false;
        state.profile.success = true;
        state.currentUser = action.payload.data;
        localStorage.setItem("user", JSON.stringify(action.payload.data));
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.profile.loading = false;
        state.profile.error = action.payload?.error || "Failed to get profile";
      })

      .addCase(updateUserProfile.pending, (state) => {
        state.profile.loading = true;
        state.profile.error = null;
        state.profile.success = false;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profile.loading = false;
        state.profile.success = true;
        state.currentUser = { ...state.currentUser, ...action.payload.data };
        localStorage.setItem("user", JSON.stringify(state.currentUser));
        state.message = action.payload.message;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profile.loading = false;
        state.profile.error = action.payload?.error || "Failed to update profile";
      })

      .addCase(getPasswordSystemStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPasswordSystemStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.systemStatus = action.payload.data;
      })
      .addCase(getPasswordSystemStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to get system status";
      })

      .addCase(sendFirstLoginReminders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendFirstLoginReminders.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;
      })
      .addCase(sendFirstLoginReminders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to send reminders";
      })

      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const newUser = action.payload.data;
        const enhancedUser = {
          ...newUser,
          is_first_login: true,
          password_type: "ft_password",
          ft_password: "exists",
          password: null,
        };
        state.users.unshift(enhancedUser);
        state.message = action.payload.message;
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to create user";
      })

      .addCase(getUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentUser?.id === action.payload.data?.id) {
          state.currentUser = action.payload.data;
          localStorage.setItem("user", JSON.stringify(action.payload.data));
        }
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch user";
      })

      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedUser = action.payload.data;
        userSlice.caseReducers.updateUserInList(state, { payload: updatedUser });
        state.message = action.payload.message;
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to update user";
      })

      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const deletedUserId = action.payload.data?.id;
        state.users = state.users.filter((user) => user.id !== deletedUserId);
        state.usersByShop = state.usersByShop.filter((user) => user.id !== deletedUserId);

        Object.keys(state.usersByRole).forEach((role) => {
          state.usersByRole[role] = state.usersByRole[role].filter((user) => user.id !== deletedUserId);
        });

        if (state.filteredUsers?.length) {
          state.filteredUsers = state.filteredUsers.filter((user) => user.id !== deletedUserId);
        }

        state.message = action.payload.message;
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to delete user";
      })

      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data.map((user) => ({
          ...user,
          is_first_login: user.ft_password && !user.password ? true : user.is_first_login || false,
        }));
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch users";
      })

      .addCase(getUsersByShopId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUsersByShopId.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data.map((user) => ({
          ...user,
          is_first_login: user.ft_password && !user.password ? true : user.is_first_login || false,
        }));
        state.usersByShop = state.users;
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(getUsersByShopId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch users by shop";
      })

      .addCase(toggleUserActiveStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(toggleUserActiveStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedUser = action.payload.data;
        userSlice.caseReducers.updateUserInList(state, { payload: updatedUser });
        state.message = action.payload.message;
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(toggleUserActiveStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to toggle user status";
      })

      .addCase(getUsersByRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUsersByRole.fulfilled, (state, action) => {
        state.loading = false;
        const role = action.meta.arg;
        state.usersByRole[role] = action.payload.data.map((user) => ({
          ...user,
          is_first_login: user.ft_password && !user.password ? true : user.is_first_login || false,
        }));
      })
      .addCase(getUsersByRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch users by role";
      })

      .addCase(getBrandUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBrandUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data.map((user) => ({
          ...user,
          is_first_login: user.ft_password && !user.password ? true : user.is_first_login || false,
        }));
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(getBrandUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch brand users";
      })

      .addCase(getUsersByDistrict.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUsersByDistrict.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data.map((user) => ({
          ...user,
          is_first_login: user.ft_password && !user.password ? true : user.is_first_login || false,
        }));
        userSlice.caseReducers.updateStatistics(state);
      })
      .addCase(getUsersByDistrict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch users by district";
      });
  },
});

export const {
  resetUserState,
  clearCurrentUser,
  clearUsersByShop,
  clearUsersByRole,
  setFilters,
  clearFilters,
  logout,
  setCurrentUser,
  updateCurrentUser,
  setIsFirstLogin,
  resetPasswordState,
  setOtpVerified,
  filterUsers,
  sortUsers,
  updateUserInList,
  updateStatistics,
} = userSlice.actions;

export const selectCurrentUser = (state) => state.user.currentUser;
export const selectAllUsers = (state) => state.user.users;
export const selectFilteredUsers = (state) => state.user.filteredUsers || [];
export const selectUsersByShop = (state) => state.user.usersByShop;
export const selectUsersByRole = (state) => state.user.usersByRole;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;
export const selectUserSuccess = (state) => state.user.success;
export const selectUserMessage = (state) => state.user.message;
export const selectIsAuthenticated = (state) => state.user.isAuthenticated;
export const selectIsFirstLogin = (state) => state.user.isFirstLogin;
export const selectToken = (state) => state.user.token;
export const selectUserFilters = (state) => state.user.filters;
export const selectUserStatistics = (state) => state.user.statistics;
export const selectPasswordReset = (state) => state.user.passwordReset;
export const selectOtpSent = (state) => state.user.passwordReset.otpSent;
export const selectOtpVerified = (state) => state.user.passwordReset.otpVerified;
export const selectOtpEmail = (state) => state.user.passwordReset.email;
export const selectOtpExpiresAt = (state) => state.user.passwordReset.otpExpiresAt;
export const selectProfileLoading = (state) => state.user.profile.loading;
export const selectProfileError = (state) => state.user.profile.error;
export const selectProfileSuccess = (state) => state.user.profile.success;
export const selectSystemStatus = (state) => state.user.systemStatus;

export const selectActiveUsers = (state) => state.user.users.filter((user) => user.is_active);
export const selectInactiveUsers = (state) => state.user.users.filter((user) => !user.is_active);
export const selectUsersWithPassword = (state) => state.user.users.filter((user) => user.password && !user.ft_password);
export const selectUsersWithFtPassword = (state) => state.user.users.filter((user) => user.ft_password && !user.password);
export const selectFirstLoginPendingUsers = (state) =>
  state.user.users.filter(
    (user) => user.ft_password && !user.password && user.is_active &&
      (user.is_first_login === true || user.is_first_login === undefined)
  );

export const selectUserById = (userId) => (state) =>
  state.user.users.find((user) => user.id === userId);

export const selectUsersByRoleName = (role) => (state) =>
  state.user.users.filter((user) => user.role === role);

export const selectUsersByBrandId = (brandId) => (state) =>
  state.user.users.filter((user) => user.brand_id === brandId);

export const selectUsersByShopId = (shopId) => (state) =>
  state.user.users.filter((user) => user.shop_id === shopId);

export const selectUsersByDistrictId = (districtId) => (state) =>
  state.user.users.filter((user) => user.district_id === districtId);

export const selectUsersBySearch = (searchTerm) => (state) => {
  if (!searchTerm) return state.user.users;
  const searchLower = searchTerm.toLowerCase();
  return state.user.users.filter((user) => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = user.email.toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });
};

export const selectPasswordStrength = (password) => {
  if (!password) return 0;
  return [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
};

export const selectRolesUserCanCreate = (state) => {
  const currentUserRole = state.user.currentUser?.role;
  const creationHierarchy = {
    super_admin: ["brand_admin"],
    brand_admin: ["district_manager", "shop_manager"],
    district_manager: ["shop_manager"],
    shop_manager: ["technician"],
    technician: [],
  };
  return creationHierarchy[currentUserRole] || [];
};

export const selectIsUserFirstLogin = (userId) => (state) => {
  const user = state.user.users.find((u) => u.id === userId);
  if (!user) return false;
  return user.is_first_login === true || (user.ft_password && !user.password && user.is_active) || false;
};

export const selectUserPasswordType = (userId) => (state) => {
  const user = state.user.users.find((u) => u.id === userId);
  if (!user) return "none";
  if (user.password) return "regular";
  if (user.ft_password) return "temporary";
  return "none";
};

export const selectBrandAdmins = (brandId) => (state) => {
  return state.user.users.filter((user) => user.role === "brand_admin" && user.brand_id === brandId);
};

export const selectIsOtpValid = (state) => {
  const { otpExpiresAt } = state.user.passwordReset;
  if (!otpExpiresAt) return false;
  return new Date(otpExpiresAt) > new Date();
};

export const selectOtpTimeRemaining = (state) => {
  const { otpExpiresAt } = state.user.passwordReset;
  if (!otpExpiresAt) return 0;
  const diffMs = new Date(otpExpiresAt) - new Date();
  return Math.max(0, Math.floor(diffMs / 1000));
};

export default userSlice.reducer;