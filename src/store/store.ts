import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/features/authSlice'



export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// TypeScript (optional): Define RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;