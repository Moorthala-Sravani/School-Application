import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';

interface PaymentState {
  loading: boolean;
  error: string | null;
  receipt: any | null;
}

const initialState: PaymentState = {
  loading: false,
  error: null,
  receipt: null,
};

export const processPayment = createAsyncThunk(
  'payments/processPayment',
  async (paymentData: { amount: number; payment_method: string; card_details?: string; transaction_id?: string; fee_ids?: string[] }, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/pay', paymentData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Payment failed');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearReceipt(state) {
      state.receipt = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(processPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.receipt = action.payload;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearReceipt } = paymentSlice.actions;
export default paymentSlice.reducer;
