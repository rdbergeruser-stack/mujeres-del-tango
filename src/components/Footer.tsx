import React from 'react';
import { Instagram, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-zinc-900 text-zinc-300 border-t border-zinc-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Identidad */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Mujeres del Tango
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Venta de remeras temáticas inspiradas en figuras, letristas, cantantes y compositoras de nuestra música ciudadana.
            </p>
          </div>

          {/* Maris & Atención */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Atención & Envíos
            </h4>
            <div className="flex flex-col gap-1 text-xs text-zinc-400">
              <span>Administrado por Maris</span>
              <span>Envíos a todo el país y puntos de retiro</span>
              <span>Pagos por transferencia bancaria directa</span>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Contacto
            </h4>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/5491100000000"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                title="WhatsApp Maris"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Mujeres del Tango.</p>
          <p className="mt-2 sm:mt-0">Administrado por Maris</p>
        </div>
      </div>
    </footer>
  );
}
