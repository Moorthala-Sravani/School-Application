import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

interface ReportState {
  report: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  report: null,
  loading: false,
  error: null,
};

export const fetchReport = createAsyncThunk(
  'reports/fetchReport',
  async (studentId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reports/${studentId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch report');
    }
  }
);

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReport.fulfilled, (state, action) => {
        state.loading = false;
        state.report = action.payload;
      })
      .addCase(fetchReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default reportSlice.reducer;
