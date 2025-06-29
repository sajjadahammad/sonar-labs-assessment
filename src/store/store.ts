import { configureStore } from '@reduxjs/toolkit';

// lib/store.js
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {

  },
});

// TypeScript (optional): Define RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;