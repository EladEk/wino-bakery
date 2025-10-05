// Phone number validation for Israeli numbers
export const validateIsraeliPhone = (phone) => {
  const phoneRegex = /^05\d{8}$/;
  return phoneRegex.test(phone);
};

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Name validation (non-empty, trimmed)
export const validateName = (name) => {
  return name && name.trim().length > 0;
};

// Price validation (positive number)
export const validatePrice = (price) => {
  const numPrice = Number(price);
  return !isNaN(numPrice) && numPrice >= 0;
};

// Quantity validation (positive integer)
export const validateQuantity = (quantity) => {
  const numQuantity = Number(quantity);
  return !isNaN(numQuantity) && numQuantity > 0 && Number.isInteger(numQuantity);
};

// Form validation helpers
export const validateBreadForm = (formData) => {
  const errors = {};

  if (!validateName(formData.name)) {
    errors.name = 'Name is required';
  }

  if (!validateQuantity(formData.availablePieces)) {
    errors.availablePieces = 'Available pieces must be a positive integer';
  }

  if (!validatePrice(formData.price)) {
    errors.price = 'Price must be a positive number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateUserProfile = (formData) => {
  const errors = {};

  if (!validateName(formData.name)) {
    errors.name = 'Name is required';
  }

  if (!validateIsraeliPhone(formData.phone)) {
    errors.phone = 'Please enter a valid Israeli phone number (e.g. 0501234567)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
