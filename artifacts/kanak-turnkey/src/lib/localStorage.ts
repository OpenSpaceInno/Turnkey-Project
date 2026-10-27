/**
 * Local Storage Utility
 * Provides type-safe localStorage access with error handling
 */

const STORAGE_PREFIX = 'turnkey_';

// Storage keys
export const STORAGE_KEYS = {
  // User preferences
  THEME: `${STORAGE_PREFIX}theme`,
  SIDEBAR_COLLAPSED: `${STORAGE_PREFIX}sidebar_collapsed`,
  TABLE_PAGE_SIZE: `${STORAGE_PREFIX}table_page_size`,
  
  // Form drafts
  DOCUMENT_DRAFT: `${STORAGE_PREFIX}document_draft`,
  LEAD_DRAFT: `${STORAGE_PREFIX}lead_draft`,
  PROJECT_DRAFT: `${STORAGE_PREFIX}project_draft`,
  TASK_DRAFT: `${STORAGE_PREFIX}task_draft`,
  
  // Filters and search
  LAST_PROJECT_FILTER: `${STORAGE_PREFIX}last_project_filter`,
  LAST_LEAD_FILTER: `${STORAGE_PREFIX}last_lead_filter`,
  SEARCH_HISTORY: `${STORAGE_PREFIX}search_history`,
  
  // Upload state
  LAST_UPLOAD_CATEGORY: `${STORAGE_PREFIX}last_upload_category`,
  LAST_UPLOAD_STATUS: `${STORAGE_PREFIX}last_upload_status`,
} as const;

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get item from localStorage with type safety
 */
export function getItem<T>(key: string, defaultValue?: T): T | null {
  if (!isLocalStorageAvailable()) {
    return defaultValue ?? null;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue ?? null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue ?? null;
  }
}

/**
 * Set item in localStorage with type safety
 */
export function setItem<T>(key: string, value: T): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeItem(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Clear all items with our prefix
 */
export function clearAll(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

/**
 * Get all items with our prefix
 */
export function getAllItems(): Record<string, unknown> {
  if (!isLocalStorageAvailable()) {
    return {};
  }

  try {
    const items: Record<string, unknown> = {};
    const keys = Object.keys(localStorage);
    
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            items[key] = JSON.parse(item);
          } catch {
            items[key] = item;
          }
        }
      }
    });
    
    return items;
  } catch (error) {
    console.error('Error getting all items from localStorage:', error);
    return {};
  }
}

/**
 * Save form draft
 */
export function saveDraft<T extends Record<string, unknown>>(
  formType: string,
  data: T
): boolean {
  const key = `${STORAGE_PREFIX}draft_${formType}`;
  return setItem(key, {
    data,
    savedAt: new Date().toISOString(),
  });
}

/**
 * Get form draft
 */
export function getDraft<T extends Record<string, unknown>>(
  formType: string
): { data: T; savedAt: string } | null {
  const key = `${STORAGE_PREFIX}draft_${formType}`;
  return getItem<{ data: T; savedAt: string }>(key);
}

/**
 * Clear form draft
 */
export function clearDraft(formType: string): boolean {
  const key = `${STORAGE_PREFIX}draft_${formType}`;
  return removeItem(key);
}

/**
 * Add to search history
 */
export function addToSearchHistory(query: string, maxItems = 10): boolean {
  if (!query.trim()) return false;
  
  const history = getItem<string[]>(STORAGE_KEYS.SEARCH_HISTORY, []);
  if (!history) return false;
  
  // Remove duplicate if exists
  const filtered = history.filter((item) => item !== query);
  
  // Add to beginning
  filtered.unshift(query);
  
  // Keep only maxItems
  const limited = filtered.slice(0, maxItems);
  
  return setItem(STORAGE_KEYS.SEARCH_HISTORY, limited);
}

/**
 * Get search history
 */
export function getSearchHistory(): string[] {
  return getItem<string[]>(STORAGE_KEYS.SEARCH_HISTORY, []) || [];
}

/**
 * Clear search history
 */
export function clearSearchHistory(): boolean {
  return removeItem(STORAGE_KEYS.SEARCH_HISTORY);
}
