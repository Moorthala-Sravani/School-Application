import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';
import { RootState } from '../index';

interface FeeState {
  fees: any[];
  loading: boolean;
  error: string | null;
}

const initialState: FeeState = {
  fees: [],
  loading: false,
  error: null,
};

export const fetchFees = createAsyncThunk(
  'fees/fetchFees',
  async (studentId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/fees/${studentId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch fees');
    }
  }
);

const feeSlice = createSlice({
  name: 'fees',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFees.fulfilled, (state, action) => {
        state.loading = false;
        state.fees = action.payload;
      })
      .addCase(fetchFees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default feeSlice.reducer;
