import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URLS } from '../../config/api';

export type Role = 'Parent' | 'Student' | 'Teacher' | 'Admin' | null;

interface AuthState {
  id: number | null;
  firstName: string;
  lastName: string;
  mobile: string;
  role: Role;
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  id: null,
  firstName: '',
  lastName: '',
  mobile: '',
  role: null,
  isAuthenticated: false,
  token: null,
  loading: false,
  error: null,
};

const AUTH_BASE_URLS = API_BASE_URLS.map(baseUrl => `${baseUrl}/auth`);
const REQUEST_TIMEOUT_MS = 6000;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchFirstAvailable(path: string, options: RequestInit = {}) {
  const errors: string[] = [];

  for (const baseUrl of AUTH_BASE_URLS) {
    const url = `${baseUrl}${path}`;

    try {
      return await fetchWithTimeout(url, options);
    } catch (error) {
      errors.push(`${url}: ${toErrorMessage(error, 'Network request failed')}`);
    }
  }

  throw new Error(`Unable to reach backend API. Tried: ${errors.join(' | ')}`);
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Server returned an invalid response. Please try again.');
  }
}

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return 'Request timed out. Please check your network and try again.';
    }
    return error.message || fallbackMessage;
  }
  return fallbackMessage;
}

// --- Async Thunks ---

// Register Thunk
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await fetchFirstAvailable('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (error: unknown) {
      return rejectWithValue(toErrorMessage(error, 'Registration failed'));
    }
  }
);

// Login Thunk
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (userData: { mobile: string; password: string; role: Role }, { rejectWithValue }) => {
    try {
      const response = await fetchFirstAvailable('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Invalid mobile number or password');
      }

      if (!data.token) {
        throw new Error('Login response did not include a session token');
      }

      return {
        token: data.token,
        id: data.id ?? data.user_id ?? data.parent_id ?? data.teacher_id ?? null,
        mobile: userData.mobile,
        role: userData.role,
        firstName: data.firstname,
        lastName: data.lastname,
      };
    } catch (error: unknown) {
      return rejectWithValue(toErrorMessage(error, 'Login failed'));
    }
  }
);

// Reset Password Thunk
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await fetchFirstAvailable('/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      return data;
    } catch (error: unknown) {
      return rejectWithValue(toErrorMessage(error, 'Password reset failed'));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.mobile = '';
      state.id = null;
      state.role = null;
      state.isAuthenticated = false;
      state.token = null;
      state.firstName = '';
      state.lastName = '';
    },
    updateProfile: (state, action: PayloadAction<{ firstName: string; lastName: string }>) => {
      state.firstName = action.payload.firstName;
      state.lastName = action.payload.lastName;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Register ---
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // --- Login ---
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.id = action.payload.id;
        state.mobile = action.payload.mobile;
        state.role = action.payload.role;
        state.firstName = action.payload.firstName;
        state.lastName = action.payload.lastName;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, updateProfile, clearError } = authSlice.actions;
export default authSlice.reducer;
