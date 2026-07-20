export interface GlobalDateRange {
  startDate: string | null;
  endDate: string | null;
  label: string;
}

export const filterByDateRange = <T>(
  items: T[], 
  dateRange: GlobalDateRange, 
  dateExtractor: (item: T) => string
): T[] => {
  if (!dateRange.startDate && !dateRange.endDate) {
    return items; // All Time
  }

  const start = dateRange.startDate ? new Date(dateRange.startDate).getTime() : 0;
  const end = dateRange.endDate ? new Date(dateRange.endDate + 'T23:59:59.999Z').getTime() : Infinity;

  return items.filter(item => {
    const itemDateStr = dateExtractor(item);
    if (!itemDateStr) return false;
    
    const time = new Date(itemDateStr).getTime();
    if (isNaN(time)) return false;

    return time >= start && time <= end;
  });
};
