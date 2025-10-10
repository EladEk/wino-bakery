/**
 * Utility functions for calculating pricing with discounts and surcharges
 */

/**
 * Calculate the final price for a single bread item considering kibbutz discounts and surcharges
 * @param {number} basePrice - The base price of the bread
 * @param {Object} order - The order object containing pricing information
 * @param {boolean} includePerOrderSurcharge - Whether to include per-order surcharges (default: false)
 * @returns {number} - The final price after applying discounts/surcharges
 */
export const calculateFinalPrice = (basePrice, order, includePerOrderSurcharge = false) => {
  if (!order || basePrice == null) return basePrice || 0;
  
  let finalPrice = basePrice;
  
  // Apply discount if present
  if (order.discountPercentage && order.discountPercentage > 0) {
    const discount = order.discountPercentage / 100;
    finalPrice = finalPrice * (1 - discount);
  }
  
  // Apply surcharge if present
  if (order.surchargeType && order.surchargeType !== 'none' && order.surchargeValue > 0) {
    if (order.surchargeType === 'percentage') {
      finalPrice = finalPrice * (1 + order.surchargeValue / 100);
    } else if (order.surchargeType === 'fixedPerBread') {
      finalPrice = finalPrice + order.surchargeValue;
    } else if (order.surchargeType === 'fixedPerOrder' && includePerOrderSurcharge) {
      // For per-order surcharges, we need to know the total quantity to distribute the surcharge
      // This is handled in calculateOrderTotal
      // No change to finalPrice here, handled in total calculation
    }
  }
  
  
  return finalPrice;
};

/**
 * Calculate the display price for a single bread item (for showing in tables)
 * This applies per-bread discounts and surcharges, but not per-order surcharges
 * @param {number} basePrice - The base price of the bread
 * @param {Object} order - The order object containing pricing information
 * @returns {Object} - { displayPrice: number, originalPrice: number, hasDiscount: boolean }
 */
export const calculateDisplayPrice = (basePrice, order) => {
  if (!order || basePrice == null) {
    return { displayPrice: basePrice || 0, originalPrice: basePrice || 0, hasDiscount: false };
  }
  
  const originalPrice = basePrice;
  let displayPrice = basePrice;
  let hasDiscount = false;
  
  // Apply discount if present
  if (order.discountPercentage && order.discountPercentage > 0) {
    const discount = order.discountPercentage / 100;
    displayPrice = displayPrice * (1 - discount);
    hasDiscount = true;
  }
  
  // Apply per-bread surcharges only (not per-order)
  if (order.surchargeType && order.surchargeType !== 'none' && order.surchargeValue > 0) {
    if (order.surchargeType === 'percentage') {
      displayPrice = displayPrice * (1 + order.surchargeValue / 100);
    } else if (order.surchargeType === 'fixedPerBread') {
      displayPrice = displayPrice + order.surchargeValue;
    }
    // Note: fixedPerOrder surcharges are not included in display price
  }
  
  return { displayPrice, originalPrice, hasDiscount };
};

/**
 * Calculate the total cost for an order (quantity * final price)
 * @param {number} basePrice - The base price of the bread
 * @param {Object} order - The order object containing pricing information
 * @returns {number} - The total cost for this order
 */
export const calculateOrderTotal = (basePrice, order) => {
  if (!order || basePrice == null) return 0;
  
  const finalPrice = calculateFinalPrice(basePrice, order);
  const quantity = order.quantity || 0;
  
  let total = finalPrice * quantity;
  
  // Apply per-order surcharge if present
  if (order.surchargeType === 'fixedPerOrder' && order.surchargeValue > 0 && quantity > 0) {
    total = total + order.surchargeValue;
  }
  
  
  return total;
};

/**
 * Calculate total revenue from all orders, accounting for discounts and surcharges
 * @param {Array} breads - Array of bread objects with claimedBy orders
 * @returns {number} - Total revenue considering all pricing adjustments
 */
export const calculateTotalRevenue = (breads) => {
  return breads.reduce((totalRevenue, bread) => {
    const breadRevenue = (bread.claimedBy || []).reduce((breadTotal, order) => {
      return breadTotal + calculateOrderTotal(bread.price, order);
    }, 0);
    return totalRevenue + breadRevenue;
  }, 0);
};
