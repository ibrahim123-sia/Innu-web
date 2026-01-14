// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import brandReducer from './slices/brandSlice';
import districtReducer from './slices/districtSlice';
import orderReducer from './slices/orderSlice';
import shopReducer from './slices/shopSlice';
import userReducer from './slices/userSlice';
import videoReducer from './slices/videoSlice';
import videoEditReducer from './slices/videoEditSlice';

const rootReducer = combineReducers({
  brand: brandReducer,
  district: districtReducer,
  order: orderReducer,
  shop: shopReducer,
  user: userReducer,
  video: videoReducer,
  videoEdit: videoEditReducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;