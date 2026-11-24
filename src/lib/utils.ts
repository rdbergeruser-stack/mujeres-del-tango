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

/**
 * Estructura para direcciones de envío específicas
 */
export interface AddressData {
  street: string;          // Calle
  number: string;          // Altura / Número
  floorApartment?: string; // Piso / Depto / Unidad (opcional)
  city: string;            // Localidad / Ciudad
  province: string;        // Provincia
  postalCode: string;      // Código Postal
  notes?: string;          // Observaciones / Entre calles / Indicaciones
}

export const PROVINCIAS_ARGENTINAS = [
  'CABA',
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
  'Otra / Exterior',
] as const;

export function getEmptyAddress(): AddressData {
  return {
    street: '',
    number: '',
    floorApartment: '',
    city: '',
    province: 'Entre Ríos',
    postalCode: '',
    notes: '',
  };
}

export function formatDetailedAddress(addr: Partial<AddressData>): string {
  if (!addr) return '';
  const parts: string[] = [];

  let streetLine = (addr.street || '').trim();
  if (addr.number?.trim()) {
    streetLine += ` ${addr.number.trim()}`;
  }
  if (addr.floorApartment?.trim()) {
    streetLine += `, ${addr.floorApartment.trim()}`;
  }
  if (streetLine) parts.push(streetLine);

  if (addr.city?.trim()) parts.push(addr.city.trim());
  if (addr.province?.trim()) parts.push(addr.province.trim());
  if (addr.postalCode?.trim()) parts.push(`CP ${addr.postalCode.trim()}`);
  if (addr.notes?.trim()) parts.push(`(Ref: ${addr.notes.trim()})`);

  return parts.join(', ');
}

export function parseDetailedAddress(addressStr?: string | null): AddressData {
  const base = getEmptyAddress();
  if (!addressStr || !addressStr.trim()) return base;

  try {
    if (addressStr.startsWith('{') && addressStr.endsWith('}')) {
      const parsed = JSON.parse(addressStr);
      return { ...base, ...parsed };
    }
  } catch {}

  let text = addressStr.trim();
  let notes = '';
  const notesMatch = text.match(/\((?:Ref:\s*)?([^)]+)\)/);
  if (notesMatch) {
    notes = notesMatch[1];
    text = text.replace(notesMatch[0], '').trim();
  }

  let postalCode = '';
  const cpMatch = text.match(/CP\s*([0-9a-zA-Z]+)/i);
  if (cpMatch) {
    postalCode = cpMatch[1];
    text = text.replace(cpMatch[0], '').trim();
  }

  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
  let street = parts[0] || '';
  let number = '';
  let floorApartment = '';
  let city = parts[1] || '';
  let province = parts[2] || '';

  const streetNumMatch = street.match(/^(.+?)\s+(\d+)\s*(.*)$/);
  if (streetNumMatch) {
    street = streetNumMatch[1];
    number = streetNumMatch[2];
    if (streetNumMatch[3]) {
      floorApartment = streetNumMatch[3];
    }
  }

  return {
    street,
    number,
    floorApartment,
    city,
    province: (PROVINCIAS_ARGENTINAS as readonly string[]).includes(province) ? province : (province || 'Entre Ríos'),
    postalCode,
    notes,
  };
}
