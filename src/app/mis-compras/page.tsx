'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/types/database';
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
          .from('orders')
          .select(`
            *,
            remera:remeras(id, title, image_url, price, collection_name),
            payment_notification:payment_notifications(id, reference_code, status, created_at)
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
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pago Aprobado
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <PackageCheck className="w-3.5 h-3.5" /> Entregado / En camino
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5" /> No aprobado
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" /> Pago Pendiente de Verificación
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌹</span>
            <h1 className="font-serif text-3xl font-bold text-stone-900">
              Mis Compras
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Seguimiento de tus pedidos y estado de transferencias bancarias en Mujeres del Tango.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 animate-pulse h-36" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-3xl mb-4 text-rose-900">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Aún no registraste ninguna compra
            </h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto mt-2 mb-6 leading-relaxed">
              Descubrí nuestro catálogo de remeras homenajes y llevá la mística del tango con vos.
            </p>
            <a
              href="/"
              className="px-6 py-3 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-semibold uppercase tracking-wider shadow-md transition-all inline-block"
            >
              Explorar Catálogo
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const whatsAppConsultLink = buildWhatsAppLink(
                '5491100000000',
                `¡Hola Maris! 🌹 Quería consultarte por mi pedido #${order.id.slice(0, 8)} de la remera '${order.remera?.title || 'Tango'}' (Talle ${order.selected_size}). ¡Muchas gracias!`
              );

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={order.remera?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                      alt={order.remera?.title || 'Remera'}
                      className="w-20 h-24 object-cover rounded-xl bg-stone-100 border border-stone-200 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(order.status)}
                        <span className="text-xs text-stone-600">
                          {new Date(order.created_at).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                        {order.remera?.title || 'Remera Tango'}
                      </h3>

                      <div className="text-xs text-stone-600 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                        <span><strong>Talle:</strong> {order.selected_size}</span>
                        {order.selected_color && <span><strong>Color:</strong> {order.selected_color}</span>}
                        <span><strong>Cantidad:</strong> {order.quantity}</span>
                        <span><strong>Total:</strong> {formatCurrency(Number(order.total_price))}</span>
                      </div>

                      <div className="text-xs text-stone-600 flex items-center gap-1.5 pt-1">
                        {order.delivery_type === 'envio' ? (
                          <>
                            <Truck className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                            <span>Envío: {order.shipping_address || 'A convenir'}</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                            <span>Retiro en punto convenido</span>
                          </>
                        )}
                      </div>

                      {order.payment_notification?.reference_code && (
                        <p className="text-[11px] text-stone-600 font-mono">
                          Comprobante informado: #{order.payment_notification.reference_code}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="shrink-0 flex flex-col gap-2 w-full md:w-auto">
                    <a
                      href={whatsAppConsultLink}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2 border border-emerald-200 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
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
