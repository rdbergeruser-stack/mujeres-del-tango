'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, buildWhatsAppLink } from '@/lib/utils';
import { ShoppingBag, Truck, MapPin, Clock, CheckCircle2, XCircle, PackageCheck, MessageCircle } from 'lucide-react';

export default function MisComprasPage() {
  const supabase = createClient();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserOrders() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('tango_orders')
          .select(`
            *,
            remera:tango_remeras(id, title, image_url, price, collection_name),
            payment_notification:tango_payment_notifications(id, reference_code, status, created_at)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) console.error('Error cargando órdenes:', error);
        else setOrders(data || []);
      } catch (err) {
        console.error('Error general:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#FF00FF] to-[#199DD0] text-white shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pago Aprobado
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            <PackageCheck className="w-3.5 h-3.5" /> Entregado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-950 text-red-300 border border-red-800">
            <XCircle className="w-3.5 h-3.5" /> No Aprobado
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Pendiente de Verificación
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Mis Compras
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Seguimiento de pedidos y verificación de transferencias con Maris.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 animate-pulse h-28" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-zinc-900 rounded-2xl p-10 text-center border border-zinc-800">
            <div className="w-14 h-14 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
              <ShoppingBag className="w-7 h-7 text-[#FF00FF]" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Aún no registraste ninguna compra
            </h3>
            <p className="text-xs text-zinc-400 mt-1 mb-6 max-w-sm mx-auto">
              Explorá nuestro catálogo oficial de remeras temáticas de Mujeres del Tango.
            </p>
            <a
              href="/"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#199DD0] text-white text-xs font-bold inline-block shadow-[0_0_15px_rgba(255,0,255,0.3)]"
            >
              Ver Catálogo Oficial
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const whatsAppConsultLink = buildWhatsAppLink(
                '5493435439216',
                `Hola Maris, te consulto por mi pedido #${order.id.slice(0, 8)} de la remera '${order.remera?.title || 'Tango'}' (Talle ${order.selected_size}, Color ${order.selected_color || 'Blanco'}).`
              );

              return (
                <div
                  key={order.id}
                  className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {order.remera?.image_url ? (
                      <img
                        src={order.remera.image_url}
                        alt={order.remera?.title}
                        loading="lazy"
                        decoding="async"
                        className="w-16 h-16 rounded-xl object-cover border border-zinc-800 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">
                          {order.remera?.title || 'Remera Tango'}
                        </h4>
                        {getStatusBadge(order.status)}
                      </div>

                      <p className="text-xs text-zinc-400">
                        Talle: <strong className="text-white">{order.selected_size}</strong>
                        {order.selected_color && (
                          <span> | Color: <strong className="text-white">{order.selected_color}</strong></span>
                        )}
                        {' '}| Cantidad: <strong className="text-white">{order.quantity}</strong>
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        {order.delivery_type === 'envio' ? (
                          <span className="flex items-center gap-1 text-[#199DD0]">
                            <Truck className="w-3 h-3" />
                            <span>Envío a: {order.shipping_address}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[#FF00FF]">
                            <MapPin className="w-3 h-3" />
                            <span>Punto de Retiro</span>
                          </span>
                        )}
                      </div>

                      {order.payment_notification?.reference_code && (
                        <p className="text-[11px] text-zinc-500 font-mono">
                          Comprobante: {order.payment_notification.reference_code}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-between w-full md:w-auto gap-2 border-t md:border-t-0 border-zinc-800 pt-3 md:pt-0">
                    <span className="text-lg font-bold text-white">
                      {formatCurrency(order.total_price)}
                    </span>

                    <a
                      href={whatsAppConsultLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-medium transition-colors border border-zinc-700"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#199DD0]" />
                      <span>Consultar a Maris</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
