export const APP_CONFIG = {
  NAME: 'Bread Bakery',
  VERSION: '1.0.0',
  SUPPORTED_LANGUAGES: ['he', 'en'],
  DEFAULT_LANGUAGE: 'he',
  RTL_LANGUAGES: ['he', 'ar']
};

export const COLLECTIONS = {
  BREADS: 'breads',
  USERS: 'users',
  CONFIG: 'config',
  ORDERS_HISTORY: 'ordersHistory'
};

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  SUPPLIED: 'supplied',
  PAID: 'paid',
  CANCELLED: 'cancelled'
};

export const BREAD_TYPES = {
  REGULAR: 'regular',
  FOCACCIA: 'focaccia'
};

export const UI_CONSTANTS = {
  TOAST_DURATION: 3000,
  MODAL_ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
  MAX_QUANTITY: 999,
  MIN_QUANTITY: 1
};

export const VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PHONE_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 200,
  PRICE_MIN: 0,
  PRICE_MAX: 999.99
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.'
};

export const SUCCESS_MESSAGES = {
  ORDER_PLACED: 'Order placed successfully!',
  ORDER_UPDATED: 'Order updated successfully!',
  ORDER_CANCELLED: 'Order cancelled successfully!',
  BREAD_ADDED: 'Bread added successfully!',
  BREAD_UPDATED: 'Bread updated successfully!',
  BREAD_DELETED: 'Bread deleted successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  SALE_ENDED: 'Sale ended successfully!'
};
