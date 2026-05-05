import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import homeworkReducer from './slices/homeworkSlice';
import profileReducer from './slices/profileSlice';
import messageReducer from './slices/messageSlice';
import feeReducer from './slices/feeSlice';
import eventReducer from './slices/eventSlice';
import reportReducer from './slices/reportSlice';
import busReducer from './slices/busSlice';
import teacherProfileReducer from './slices/teacherProfileSlice';
import adminProfileReducer from './slices/adminProfileSlice';
import attendanceReducer from './slices/attendanceSlice';
import paymentReducer from './slices/paymentSlice';
import uniformReducer from './slices/uniformSlice';
import salaryReducer from './slices/salarySlice';
import timetableReducer from './slices/timetableSlice';

const profilePersistConfig = {
  key: 'profile',
  storage: AsyncStorage,
  blacklist: ['profile_pic'], // Do not persist large base64 strings to avoid 2MB limit
};

const teacherProfilePersistConfig = {
  key: 'teacherProfile',
  storage: AsyncStorage,
  blacklist: ['profile_pic'], // Do not persist large base64 strings to avoid 2MB limit
};

const adminProfilePersistConfig = {
  key: 'adminProfile',
  storage: AsyncStorage,
  blacklist: ['profile_pic'], // Do not persist large base64 strings to avoid 2MB limit
};

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  blacklist: ['loading', 'error'], // NEVER persist loading states
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  homework: homeworkReducer,
  profile: persistReducer(profilePersistConfig, profileReducer),
  teacherProfile: persistReducer(teacherProfilePersistConfig, teacherProfileReducer),
  adminProfile: persistReducer(adminProfilePersistConfig, adminProfileReducer),
  messages: messageReducer,
  fees: feeReducer,
  events: eventReducer,
  reports: reportReducer,
  bus: busReducer,
  attendance: attendanceReducer,
  payments: paymentReducer,
  uniform: uniformReducer,
  salary: salaryReducer,
  timetable: timetableReducer,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['profile', 'teacherProfile', 'adminProfile'], // Only persist profiles at root level
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
