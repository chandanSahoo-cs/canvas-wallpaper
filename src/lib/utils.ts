import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function newId(): string {
  return Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
