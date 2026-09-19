// --- SEARCH HISTORY ---
export interface SearchHistoryItem {
  id: string;
  origin: string;
  destination: string;
  travelMode: string;
  searchedAt: string;
  timestamp: number;
}

const SEARCH_HISTORY_KEY = 'saahat_search_history';

export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse search history:', e);
    return [];
  }
}

export function addSearchHistory(origin: string, destination: string, travelMode: string = 'CAB'): SearchHistoryItem[] {
  if (!origin.trim() || !destination.trim()) return getSearchHistory();
  try {
    const cleanOrigin = origin.split('(')[0].trim();
    const cleanDest = destination.split('(')[0].trim();

    const existing = getSearchHistory();
    const filtered = existing.filter(
      item => !(item.origin.toLowerCase() === cleanOrigin.toLowerCase() && item.destination.toLowerCase() === cleanDest.toLowerCase())
    );

    const newItem: SearchHistoryItem = {
      id: `hist-${Date.now()}`,
      origin: cleanOrigin,
      destination: cleanDest,
      travelMode,
      searchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };

    const updated = [newItem, ...filtered].slice(0, 10);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save search history:', e);
    return [];
  }
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (e) {
    console.warn('Failed to clear search history:', e);
  }
}

export function removeSearchHistoryItem(id: string): SearchHistoryItem[] {
  try {
    const existing = getSearchHistory();
    const updated = existing.filter(item => item.id !== id);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to remove search history item:', e);
    return [];
  }
}

import { CheckInStatus, CheckInChannel } from '../types';

// --- SHARED ETA HISTORY ---
export interface SharedETAHistoryItem {
  id: string;
  recipientName: string;
  recipientPhone: string;
  routeName: string;
  durationMinutes: number;
  distanceKm: number;
  expectedArrivalTime: string;
  sharedAt: string;
  timestamp: number;
  checkinStatus?: CheckInStatus;
  customArrivalMessage?: string;
  customMessageReleased?: boolean;
  channelUsed?: CheckInChannel;
  newCheckinTime?: string;
}

const SHARED_ETA_HISTORY_KEY = 'saahat_shared_eta_history';

export function getSharedETAHistory(): SharedETAHistoryItem[] {
  try {
    const raw = localStorage.getItem(SHARED_ETA_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse shared ETA history:', e);
    return [];
  }
}

export function addSharedETAHistory(item: Omit<SharedETAHistoryItem, 'id' | 'sharedAt' | 'timestamp'>): SharedETAHistoryItem[] {
  try {
    const existing = getSharedETAHistory();
    const newItem: SharedETAHistoryItem = {
      ...item,
      id: `eta-hist-${Date.now()}`,
      sharedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };
    const updated = [newItem, ...existing].slice(0, 20);
    localStorage.setItem(SHARED_ETA_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save shared ETA history:', e);
    return [];
  }
}

export function clearSharedETAHistory(): void {
  try {
    localStorage.removeItem(SHARED_ETA_HISTORY_KEY);
  } catch (e) {
    console.warn('Failed to clear shared ETA history:', e);
  }
}

export function removeSharedETAHistoryItem(id: string): SharedETAHistoryItem[] {
  try {
    const existing = getSharedETAHistory();
    const updated = existing.filter(item => item.id !== id);
    localStorage.setItem(SHARED_ETA_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to remove shared ETA item:', e);
    return [];
  }
}

export function updateSharedETAHistoryItem(id: string, updates: Partial<SharedETAHistoryItem>): SharedETAHistoryItem[] {
  try {
    const existing = getSharedETAHistory();
    const updated = existing.map(item => item.id === id ? { ...item, ...updates } : item);
    localStorage.setItem(SHARED_ETA_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to update shared ETA item:', e);
    return [];
  }
}

export function clearAllHistory(): void {
  clearSearchHistory();
  clearSharedETAHistory();
}

