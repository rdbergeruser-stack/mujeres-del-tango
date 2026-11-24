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
 * Sanitiza números de teléfono para generar URLs directas de WhatsApp
 * Ej: 11 2345 6789 -> 5491123456789
 */
export function sanitizeWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');

  // Si arranca con 15 (típico de celulares en Argentina), remover el 15
  if (clean.startsWith('15') && clean.length === 10) {
    clean = clean.substring(2);
  }

  // Si no tiene código de país, agregar prefijo argentino 549
  if (!clean.startsWith('54')) {
    if (clean.startsWith('9')) {
      clean = '54' + clean;
    } else {
      clean = '549' + clean;
    }
  } else if (clean.startsWith('54') && !clean.startsWith('549')) {
    // Si tiene 54 pero le falta el 9 para celulares
    clean = '549' + clean.substring(2);
  }

  return clean;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanNumber = sanitizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}
