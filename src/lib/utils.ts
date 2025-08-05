// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency for display
export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'GH₵0.00';
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(num);
}

// Format date for display
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

// Format date for input fields (YYYY-MM-DD)
export function formatDateForInput(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

// Calculate age from date of birth
export function calculateAge(birthDate: string | Date): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Validate Ghana phone number
export function isValidGhanaPhone(phone: string): boolean {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Check if it matches Ghana phone patterns
  return /^(233|0)[2-9]\d{8}$/.test(digits);
}

// Format Ghana phone number
export function formatGhanaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.startsWith('233')) {
    return `+${digits}`;
  } else if (digits.startsWith('0') && digits.length === 10) {
    return `+233${digits.slice(1)}`;
  }
  
  return phone;
}