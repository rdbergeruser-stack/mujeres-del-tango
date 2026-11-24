import React from 'react';
import { Heart, Instagram, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-rose-950/40 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Identidad */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌹</span>
              <span className="font-serif text-2xl font-bold tracking-wide text-rose-100">
                Mujeres del Tango
              </span>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed">
              Tienda de diseño textil autogestivo y homenaje poético a las letristas, cantantes, actrices y compositoras de la historia grande de nuestra música ciudadana.
            </p>
            <p className="text-xs text-rose-300/80 font-serif italic">
              "Honrar la vida, con coraje y poesía."
            </p>
          </div>

          {/* Maris & Atención */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-200">
              Atención & Envíos
            </h4>
            <p className="text-stone-400 text-sm leading-relaxed">
              Atendido con dedicación por <strong>Maris</strong>. Confección en 100% algodón peinado 24/1 premium y serigrafía artesanal duradera.
            </p>
            <div className="flex flex-col gap-1 text-sm text-stone-400">
              <span>📍 Envíos a todo el país & Puntos de entrega en CABA</span>
              <span>💳 Pagos por Transferencia Bancaria Directa</span>
              <span>💬 Confirmación y seguimiento personalizado por WhatsApp</span>
            </div>
          </div>

          {/* Redes y Contacto */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-200">
              Comunidad Tanguera
            </h4>
            <p className="text-stone-400 text-sm">
              Seguinos en nuestras redes o escribinos directamente para consultas de talles especiales o pedidos mayoristas:
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-full bg-stone-900 border border-stone-800 text-rose-300 hover:text-white hover:border-rose-700 transition-colors"
                title="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://wa.me/5491100000000"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-full bg-stone-900 border border-stone-800 text-emerald-400 hover:text-white hover:border-emerald-600 transition-colors"
                title="WhatsApp Maris"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-900 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400">
          <p>© {new Date().getFullYear()} Mujeres del Tango. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Administrado con <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> por Maris
          </p>
        </div>
      </div>
    </footer>
  );
}
