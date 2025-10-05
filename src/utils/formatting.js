// Date formatting utilities
export const formatDate = (date, locale = 'he-IL') => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (date, locale = 'he-IL') => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Hebrew day names
export const getHebrewDay = (dateString) => {
  const daysHebrew = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"];
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return daysHebrew[date.getDay()];
};

// Number formatting
export const formatPrice = (price, locale = 'he-IL') => {
  const numPrice = Number(price);
  if (isNaN(numPrice)) return '0.00';
  
  return numPrice.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatQuantity = (quantity) => {
  const numQuantity = Number(quantity);
  if (isNaN(numQuantity)) return '0';
  
  return numQuantity.toLocaleString();
};

// Currency formatting
export const formatCurrency = (amount, currency = 'ILS', locale = 'he-IL') => {
  const numAmount = Number(amount);
  if (isNaN(numAmount)) return '₪0.00';
  
  return numAmount.toLocaleString(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Text formatting
export const capitalizeFirst = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Phone number formatting
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('05')) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return phone;
};
