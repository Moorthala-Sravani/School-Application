import api from '../config/api';

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export const fetchBooks = (token: string, classGroup?: string) =>
  api.get('/books' + (classGroup ? `?class=${encodeURIComponent(classGroup)}` : ''), authHeader(token));

export const fetchMyBookRequests = (token: string) =>
  api.get('/books/requests/my', authHeader(token));

export const submitBookRequest = (token: string, book_ids: number[], special_request?: string) =>
  api.post('/books/requests', { book_ids, special_request }, authHeader(token));

export const fetchPendingRequests = (token: string, class_group?: string, status?: string) => {
  const params: string[] = [];
  if (class_group) params.push(`class_group=${encodeURIComponent(class_group)}`);
  if (status) params.push(`status=${encodeURIComponent(status)}`);
  return api.get('/books/requests/pending' + (params.length ? '?' + params.join('&') : ''), authHeader(token));
};

export const updateBookRequestStatus = (token: string, requestId: number, status: string, notes?: string) =>
  api.put(`/books/requests/${requestId}/status`, { status, approval_notes: notes }, authHeader(token));

export const fetchInventory = (token: string) =>
  api.get('/books/inventory', authHeader(token));

export const fetchAllRequests = (token: string, status?: string, class_group?: string) => {
  const params: string[] = [];
  if (status) params.push(`status=${encodeURIComponent(status)}`);
  if (class_group) params.push(`class_group=${encodeURIComponent(class_group)}`);
  return api.get('/books/requests/all' + (params.length ? '?' + params.join('&') : ''), authHeader(token));
};

export const createBook = (token: string, data: any) =>
  api.post('/books', data, authHeader(token));

export const updateBook = (token: string, id: number, data: any) =>
  api.put(`/books/${id}`, data, authHeader(token));
