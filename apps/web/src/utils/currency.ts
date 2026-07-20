/**
 * Centralized utility for formatting numbers into Indian Currency format.
 */
export const formatRupee = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    value = 0;
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const parseRupeeToNumber = (value: string): number => {
  if (!value) return 0;
  // Remove all non-numeric characters except dots and minus sign
  const parsed = parseFloat(value.replace(/[^0-9.-]+/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};
