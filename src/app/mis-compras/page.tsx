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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-zinc-900 text-white">
            <CheckCircle2 className="w-3 h-3" /> Pago Aprobado
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-zinc-200 text-zinc-800">
            <PackageCheck className="w-3 h-3" /> Entregado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-600">
            <XCircle className="w-3 h-3" /> No Aprobado
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
            <Clock className="w-3 h-3" /> Pendiente de Verificación
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Mis Compras
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Seguimiento de pedidos y estado de transferencias.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-zinc-200 animate-pulse h-28" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-zinc-200">
            <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">
              Aún no registraste ninguna compra
            </h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">
              Explorá nuestro catálogo de remeras disponibles.
            </p>
            <a
              href="/"
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold inline-block"
            >
              Ver Catálogo
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const whatsAppConsultLink = buildWhatsAppLink(
                '5491100000000',
                `Hola Maris, te consulto por mi pedido #${order.id.slice(0, 8)} de la remera '${order.remera?.title || 'Tango'}' (Talle ${order.selected_size}).`
              );

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl p-5 border border-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <img
                      src={order.remera?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                      alt=""
                      className="w-16 h-20 object-cover rounded-md bg-zinc-100 border border-zinc-200 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        <span className="text-xs text-zinc-400">
                          {new Date(order.created_at).toLocaleDateString('es-AR')}
                        </span>
                      </div>

                      <h3 className="font-bold text-zinc-900 text-sm">
                        {order.remera?.title || 'Remera'}
                      </h3>

                      <div className="text-xs text-zinc-600 flex flex-wrap gap-x-3 gap-y-0.5">
                        <span><strong>Talle:</strong> {order.selected_size}</span>
                        {order.selected_color && <span><strong>Color:</strong> {order.selected_color}</span>}
                        <span><strong>Total:</strong> {formatCurrency(Number(order.total_price))}</span>
                      </div>

                      <div className="text-xs text-zinc-500 flex items-center gap-1 pt-0.5">
                        {order.delivery_type === 'envio' ? (
                          <>
                            <Truck className="w-3.5 h-3.5" />
                            <span>Envío: {order.shipping_address || 'A convenir'}</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Retiro en punto de encuentro</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <a
                      href={whatsAppConsultLink}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
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
