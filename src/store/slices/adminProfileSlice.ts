import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { updateProfile } from './authSlice';
import { API_BASE_URL } from '../../config/api';

export interface AdminProfileState {
  firstname: string;
  lastname: string;
  email: string;
  mobile_number: string;
  
  
  profile_pic: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AdminProfileState = {
  firstname: '',
  lastname: '',
  email: '',
  mobile_number: '',
  
  
  profile_pic: null,
  loading: false,
  error: null,
};

export const fetchAdminProfile = createAsyncThunk(
  'AdminProfile/fetchProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`${API_BASE_URL}/profile/admin`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch profile');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAdminProfile = createAsyncThunk(
  'AdminProfile/updateProfile',
  async (profileData: any, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`${API_BASE_URL}/profile/admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify(profileData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update profile');
      
      // Keep auth slice in sync
      dispatch(updateProfile({ firstName: profileData.firstname, lastName: profileData.lastname }));
      
      return profileData;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const AdminProfileSlice = createSlice({
  name: 'AdminProfile',
  initialState,
  reducers: {
    clearAdminProfile: (state) => {
      Object.assign(state, initialState);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.firstname = action.payload.firstname;
        state.lastname = action.payload.lastname;
        state.email = action.payload.email;
        state.mobile_number = action.payload.mobile_number;
        
        
        state.profile_pic = action.payload.profile_pic;
      })
      .addCase(fetchAdminProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateAdminProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdminProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.firstname = action.payload.firstname;
        state.lastname = action.payload.lastname;
        state.email = action.payload.email;
        state.mobile_number = action.payload.mobile_number;
        
        
        state.profile_pic = action.payload.profile_pic;
      })
      .addCase(updateAdminProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAdminProfile } = AdminProfileSlice.actions;
export default AdminProfileSlice.reducer;
