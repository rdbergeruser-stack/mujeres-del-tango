import React from 'react';
import { Instagram, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Identidad con Logo */}
          <div className="md:col-span-2 space-y-3">
            <img
              src="/images/logo-horizontal.png"
              alt="Mujeres del Tango"
              className="h-10 w-auto object-contain"
            />
            <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
              Tienda oficial de remeras temáticas inspiradas en las pioneras, letristas, cantantes, músicas y bailarinas de nuestra cultura ciudadana.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-[#FF00FF] animate-pulse" />
              <span>Diseños exclusivos y de colección</span>
            </div>
          </div>

          {/* Maris & Envíos */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Atención & Envíos
            </h4>
            <div className="flex flex-col gap-1 text-xs text-zinc-400">
              <span>Administrado por Maris</span>
              <span>Envíos a todo el país</span>
              <span>Punto de retiro a coordinar</span>
              <span>Transferencia bancaria directa</span>
            </div>
          </div>

          {/* Contacto & Redes */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Contacto Oficial
            </h4>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://instagram.com/mujeresdeltango"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-lg bg-zinc-900 text-zinc-300 hover:text-[#FF00FF] hover:border-[#FF00FF] border border-zinc-800 transition-colors"
                title="Instagram @mujeresdeltango"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/5493435439216"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-lg bg-zinc-900 text-zinc-300 hover:text-[#199DD0] hover:border-[#199DD0] border border-zinc-800 transition-colors"
                title="WhatsApp Maris"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[11px] text-zinc-500 pt-1">
              WhatsApp: 343 543-9216
            </p>
          </div>
        </div>

        <div className="border-t border-zinc-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 gap-2">
          <p>© {new Date().getFullYear()} Mujeres del Tango. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-[#FF00FF]">#FF00FF Magenta</span>
            <span className="text-[#199DD0]">#199DD0 Celeste</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
