// src/lib/permissions.tsx
import React from 'react';
import type { User } from './types';

// Permission mapping from page names to permission keys
export const PAGE_PERMISSIONS_MAP = {
  'payments': 'payments',
  'financials': 'financials', 
  'pledges': 'pledges',
  'inventory': 'inventory',
  'purchases': 'purchases',
  'rooms': 'rooms',
  'room-allocations': 'room_allocations',
  'food': 'food',
  'food-allocations': 'food_allocations',
  'registrations': 'registrations'
} as const;

// Navigation items with their permission requirements
export interface NavItem {
  label: string;
  to: string;
  permission: string;
  icon: React.ReactNode;
}

// Check if user has permission for a specific page
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;

  user.page_permissions?.push('dashboard');
  
  // Camp managers have access to all pages
  if (user.role === 'camp_manager') return true;
  
  // Volunteers need specific permissions
  if (user.role === 'volunteer') {
    return user.page_permissions?.includes(permission) ?? false;
  }
  
  return false;
};

// Check if user can access registrations
export const canAccessRegistrations = (user: User | null): boolean => {
  if (!user) return false;
  
  // Camp managers can always access registrations
  if (user.role === 'camp_manager') return true;
  
  // Volunteers need registrations permission
  if (user.role === 'volunteer') {
    return user.page_permissions?.includes('registrations') ?? false;
  }
  
  return false;
};

// Get the first allowed page for a user (for redirects)
export const getFirstAllowedPage = (user: User | null, campId: string): string => {
  if (!user) return '/login';
  
  // Camp managers default to dashboard
  if (user.role === 'camp_manager') {
    return `/camps/${campId}`;
  }
  
  // For volunteers, find the first page they have permission for
  if (user.role === 'volunteer' && user.page_permissions) {
    const permissionToPageMap = {
      'payments': `/camps/${campId}/payments`,
      'financials': `/camps/${campId}/financials`,
      'pledges': `/camps/${campId}/pledges`,
      'inventory': `/camps/${campId}/inventory`,
      'purchases': `/camps/${campId}/purchases`,
      'rooms': `/camps/${campId}/rooms`,
      'room_allocations': `/camps/${campId}/room-allocations`,
      'food': `/camps/${campId}/food`,
      'food_allocations': `/camps/${campId}/food-allocations`,
      'registrations': `/camps/${campId}`
    };
    
    // Return the first page they have permission for
    for (const permission of user.page_permissions) {
      if (permissionToPageMap[permission as keyof typeof permissionToPageMap]) {
        return permissionToPageMap[permission as keyof typeof permissionToPageMap];
      }
    }
  }
  
  // Fallback to camps page if no specific permissions
  return `/camps/${campId}`;
};

// Filter navigation items based on user permissions
export const getFilteredNavItems = (user: User | null, campId: string): NavItem[] => {
  const allNavItems: NavItem[] = [
    {
      label: "Dashboard",
      to: `/camps/${campId}`,
      permission: 'dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 8h2v-2H7v2zm0-4h2v-2H7v2zm0-4h2V7H7v2zm4 8h2v-2h-2v2zm0-4h2v-2h-2v2zm0-4h2V7h-2v2zm4 8h2v-2h-2v2zm0-4h2v-2h-2v2zm0-4h2V7h-2v2z" />
        </svg>
      ),
    },
    {
      label: "Payments",
      to: `/camps/${campId}/payments`,
      permission: 'payments',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="7" width="20" height="10" rx="2" />
          <path d="M2 9h20" />
        </svg>
      ),
    },
    {
      label: "Financials",
      to: `/camps/${campId}/financials`,
      permission: 'financials',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: "Pledges",
      to: `/camps/${campId}/pledges`,
      permission: 'pledges',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Inventory",
      to: `/camps/${campId}/inventory`,
      permission: 'inventory',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      label: "Purchases",
      to: `/camps/${campId}/purchases`,
      permission: 'purchases',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      label: "Rooms",
      to: `/camps/${campId}/rooms`,
      permission: 'rooms',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9,22 9,12 15,12 15,22" />
        </svg>
      ),
    },
    {
      label: "Room Allocations",
      to: `/camps/${campId}/room-allocations`,
      permission: 'room_allocations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <path d="M20 8v6M23 11h-6" />
        </svg>
      ),
    },
    {
      label: "Food",
      to: `/camps/${campId}/food`,
      permission: 'food',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      ),
    },
    {
      label: "Food Allocations",
      to: `/camps/${campId}/food-allocations`,
      permission: 'food_allocations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4" />
          <path d="M21 12c.552 0 1-.448 1-1V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v3c0 .552.448 1 1 1h16z" />
          <path d="M3 12v4a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-4" />
        </svg>
      ),
    },
  ];

  if (!user) return [];

  // Camp managers see all items
  if (user.role === 'camp_manager') {
    return allNavItems;
  }

  // Volunteers see only items they have permission for
  return allNavItems.filter(item => hasPermission(user, item.permission));
};
