import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Convierte un nombre de usuario a un email interno para Supabase Auth sin requerir envío de correos.
 * Ej: "maris" -> "maris@mujeresdeltango.com"
 */
export function usernameToInternalEmail(username: string): string {
  if (!username) return '';
  // Si ya es un email que alguien escribió, limpiarlo a formato estándar
  if (username.includes('@')) {
    username = username.split('@')[0];
  }

  const clean = username
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]/g, '.');

  return `${clean}@mujeresdeltango.com`;
}

/**
 * Extrae el nombre de usuario limpio a partir del email interno.
 */
export function extractUsername(emailOrUser?: string | null): string {
  if (!emailOrUser) return '';
  return emailOrUser.replace('@mujeresdeltango.com', '');
}

/**
 * Sanitiza números de teléfono para generar URLs directas de WhatsApp
 */
export function sanitizeWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');

  if (clean.startsWith('15') && clean.length === 10) {
    clean = clean.substring(2);
  }

  if (!clean.startsWith('54')) {
    if (clean.startsWith('9')) {
      clean = '54' + clean;
    } else {
      clean = '549' + clean;
    }
  } else if (clean.startsWith('54') && !clean.startsWith('549')) {
    clean = '549' + clean.substring(2);
  }

  return clean;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanNumber = sanitizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}
