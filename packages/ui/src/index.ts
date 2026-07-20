// Export UI modules and theme helpers

export type AppTheme = 'dark' | 'light' | 'glass-cyan' | 'glass-emerald' | 'glass-gold';

export const setTheme = (theme: AppTheme): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  // Set theme attribute
  root.setAttribute('data-theme', theme);
  
  // Persist choice
  localStorage.setItem('financeos-theme', theme);
};

export const getSavedTheme = (): AppTheme => {
  if (typeof window === 'undefined') return 'glass-cyan';
  const saved = localStorage.getItem('financeos-theme') as AppTheme;
  return saved || 'glass-cyan';
};
