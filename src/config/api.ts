import axios from 'axios';
import { NativeModules, Platform } from 'react-native';

const DEV_API_PORT = 5000;

function extractHost(input?: string): string | null {
  if (!input) {
    return null;
  }

  const match = input.match(/^https?:\/\/([^:/]+)(?::\d+)?(?:\/|$)/);
  return match?.[1] ?? null;
}

function normalizeDevHost(host: string): string {
  return host.trim();
}

function uniqueValues(values: string[]): string[] {
  return values.filter((value, index) => value && values.indexOf(value) === index);
}

function getMetroHost(): string | null {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  return extractHost(typeof scriptURL === 'string' ? scriptURL : undefined);
}

function getDevApiHosts(): string[] {
  const metroHost = getMetroHost();
  const hosts: string[] = [];

  if (Platform.OS === 'android') {
    // USB devices use adb reverse, so localhost is the fastest working path.
    // Emulators use 10.0.2.2. Metro/LAN host remains a final fallback.
    hosts.push('localhost', '10.0.2.2');
  } else {
    hosts.push('localhost');
  }

  if (metroHost) {
    hosts.push(normalizeDevHost(metroHost));
  }

  return uniqueValues(hosts);
}

export const DEV_API_HOSTS = getDevApiHosts();
export const DEV_API_HOST = DEV_API_HOSTS[0];
export const PROD_API_HOST = 'api.greenfieldacademy.com';
export const API_HOST = __DEV__ ? DEV_API_HOST : PROD_API_HOST;
export const API_ORIGIN = __DEV__ ? `http://${API_HOST}:${DEV_API_PORT}` : `https://${API_HOST}`;
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const API_BASE_URLS = __DEV__
  ? DEV_API_HOSTS.map(host => `http://${host}:${DEV_API_PORT}/api`)
  : [API_BASE_URL];

const API_TIMEOUT_MS = __DEV__ ? 6000 : 30000;
const MAX_RETRIES = 2;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

api.interceptors.request.use((config) => {
  return config;
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(() => resolve(undefined), ms));

api.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    const config = error?.config as (Record<string, any> & { _retryCount?: number }) | undefined;
    const status = error?.response?.status as number | undefined;
    const method = String(config?.method || 'get').toLowerCase();
    const isNetworkOrTimeout = !error?.response;
    const isServerError = typeof status === 'number' && status >= 500;
    const canRetryMethod = method !== 'post' && method !== 'patch';

    if (config && (isNetworkOrTimeout || (isServerError && canRetryMethod))) {
      config._retryCount = config._retryCount ?? 0;
      if (config._retryCount < MAX_RETRIES) {
        config._retryCount += 1;
        if (isNetworkOrTimeout && __DEV__) {
          const currentBaseURL = String(config.baseURL || API_BASE_URL);
          const currentIndex = API_BASE_URLS.indexOf(currentBaseURL);
          const nextBaseURL = API_BASE_URLS[currentIndex + 1];

          if (nextBaseURL) {
            config.baseURL = nextBaseURL;
          }
        }
        await sleep(__DEV__ ? 150 : 1000);
        return api(config as any);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
