'use client';

import React from 'react';
import { AddressData, PROVINCIAS_ARGENTINAS } from '@/lib/utils';
import { MapPin } from 'lucide-react';

interface AddressFormProps {
  value: AddressData;
  onChange: (data: AddressData) => void;
  required?: boolean;
  compact?: boolean;
}

export default function AddressForm({
  value,
  onChange,
  required = false,
  compact = false,
}: AddressFormProps) {
  const handleChange = (field: keyof AddressData, val: string) => {
    onChange({
      ...value,
      [field]: val,
    });
  };

  const inputClass = compact
    ? 'w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white'
    : 'w-full p-2.5 rounded-lg border border-zinc-300 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white';

  const labelClass = 'block text-[11px] font-semibold text-zinc-700 mb-1';

  return (
    <div className="space-y-3 p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70">
      <div className="flex items-center gap-1.5 text-zinc-800 font-semibold text-xs border-b border-zinc-200 pb-2">
        <MapPin className="w-3.5 h-3.5 text-zinc-600" />
        <span>Dirección de Envío</span>
        {!required && <span className="text-[10px] text-zinc-400 font-normal">(Opcional)</span>}
      </div>

      {/* Calle y Altura */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-8">
          <label className={labelClass}>
            Calle {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            required={required}
            placeholder="Ej: Piedra Buena, Corrientes, etc."
            value={value.street}
            onChange={(e) => handleChange('street', e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="col-span-4">
          <label className={labelClass}>
            Número / Altura {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            required={required}
            placeholder="Ej: 57 o 1234"
            value={value.number}
            onChange={(e) => handleChange('number', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Piso / Depto y Código Postal */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <label className={labelClass}>Piso / Depto / Unidad</label>
          <input
            type="text"
            placeholder="Ej: 2° B, PB, etc. (Opcional)"
            value={value.floorApartment || ''}
            onChange={(e) => handleChange('floorApartment', e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="col-span-6">
          <label className={labelClass}>
            Código Postal {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            required={required}
            placeholder="Ej: 3100 o 1425"
            value={value.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Ciudad / Localidad y Provincia */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <label className={labelClass}>
            Ciudad / Localidad {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            required={required}
            placeholder="Ej: Paraná, Rosario, CABA"
            value={value.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="col-span-6">
          <label className={labelClass}>
            Provincia {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={value.province || 'Entre Ríos'}
            onChange={(e) => handleChange('province', e.target.value)}
            className={inputClass}
          >
            {PROVINCIAS_ARGENTINAS.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Observaciones o entre calles */}
      <div>
        <label className={labelClass}>Entre calles / Referencias de entrega</label>
        <input
          type="text"
          placeholder="Ej: Timbre blanco, entre Calles Belgrano y San Martín"
          value={value.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          className={inputClass}
        />
        <span className="text-[10px] text-zinc-400 mt-0.5 block">
          Información útil para el repartidor o correo.
        </span>
      </div>
    </div>
  );
}
