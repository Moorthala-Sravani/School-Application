import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

interface SalaryState {
  salaryData: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: SalaryState = {
  salaryData: null,
  loading: false,
  error: null,
};

export const fetchSalary = createAsyncThunk(
  'salary/fetchSalary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/salary');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch salary');
    }
  }
);

const salarySlice = createSlice({
  name: 'salary',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalary.fulfilled, (state, action) => {
        state.loading = false;
        state.salaryData = action.payload;
      })
      .addCase(fetchSalary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default salarySlice.reducer;
