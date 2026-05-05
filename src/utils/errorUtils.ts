export const getErrorMessage = (error: any): string => {
  if (!error) return 'An unexpected error occurred.';

  const status = error?.response?.status;

  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return "You don't have permission to access this.";
  if (status === 404) return 'The requested data could not be found.';
  if (status === 408) return 'Request timed out. Please try again.';
  if (status === 422) return error?.response?.data?.message || 'Invalid data submitted.';
  if (status >= 500)  return 'Server error. Please try again in a moment.';

  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    return 'Unable to connect. Please check your internet connection.';
  }

  const serverMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  return serverMessage || 'Something went wrong. Please try again.';
};
