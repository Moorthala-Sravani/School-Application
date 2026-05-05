import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

interface BusState {
  busData: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: BusState = {
  busData: null,
  loading: false,
  error: null,
};

export const fetchBusRoute = createAsyncThunk(
  'bus/fetchBusRoute',
  async (routeNumber: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/buses?routeNumber=${routeNumber}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bus route');
    }
  }
);

const busSlice = createSlice({
  name: 'bus',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBusRoute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBusRoute.fulfilled, (state, action) => {
        state.loading = false;
        state.busData = action.payload;
      })
      .addCase(fetchBusRoute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default busSlice.reducer;
