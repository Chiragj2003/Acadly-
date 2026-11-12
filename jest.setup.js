// Jest setup file for Acadly

// React 19 test environment act flag
// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Test environment default variables
process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mock-test-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key-for-testing';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Native Modal
jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');
  const MockModal = ({ children, visible = true }) => (visible ? children : null);
  MockModal.displayName = 'Modal';
  return {
    __esModule: true,
    default: MockModal,
    Modal: MockModal,
  };
});

// Mock Expo SecureStore
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    getItemAsync: jest.fn(async (key) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key, value) => { store.set(key, value); }),
    deleteItemAsync: jest.fn(async (key) => { store.delete(key); }),
  };
});

// Mock Expo Notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[mock-test-token]' })),
  scheduleNotificationAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock Expo Constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        eas: { projectId: 'test-project-id' },
      },
    },
  },
  expoConfig: {
    extra: {
      eas: { projectId: 'test-project-id' },
    },
  },
}));

// Mock Expo Device
jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Mock Expo Linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `acadly://${path}`),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  getInitialURL: jest.fn(async () => null),
  parse: jest.fn((url) => ({ path: url, queryParams: {} })),
}));

// Mock Expo Router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  setParams: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Link: 'Link',
  Stack: Object.assign(({ children }) => children, { Screen: () => null }),
  Tabs: Object.assign(({ children }) => children, { Screen: () => null }),
}));

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return {
    ...Reanimated,
    configureReanimatedLogger: jest.fn(),
    ReanimatedLogLevel: { warn: 'warn' },
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(() => Promise.resolve()),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

// Mock Lucide icons
jest.mock('lucide-react-native', () => {
  return new Proxy(
    {},
    {
      get: () => () => null,
    }
  );
});

// Silence unnecessary console logs in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Animated:') || args[0].includes('Sending `onAnimatedValueUpdate`'))
  ) {
    return;
  }
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('The current testing environment is not configured to support act') ||
      args[0].includes('Cannot log after tests are done'))
  ) {
    return;
  }
  originalError(...args);
};

export { mockRouter };
