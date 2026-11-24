import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { buildWhatsAppLink } from '@/lib/utils';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('tango_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return (profile as any)?.role === 'admin' || user.email?.toLowerCase().includes('maris');
}

// GET /api/admin/orders - Listar todos los pedidos de Mujeres del Tango
export async function GET() {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: orders, error } = await (adminClient as any)
      .from('tango_orders')
      .select(`
        *,
        profile:tango_profiles(id, full_name, email, phone, address),
        remera:tango_remeras(id, title, image_url, price, stock),
        payment_notification:tango_payment_notifications(id, reference_code, status, created_at)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al cargar órdenes' }, { status: 500 });
  }
}

// PATCH /api/admin/orders - Aprobar, entregar o rechazar pedido
export async function PATCH(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const body = await req.json();
    const { orderId, newStatus, currentRemeraId, quantity = 1 } = body;

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    // 1. Obtener la orden completa
    const { data: order, error: orderFetchError } = await (adminClient as any)
      .from('tango_orders')
      .select('*, profile:tango_profiles(*), remera:tango_remeras(*)')
      .eq('id', orderId)
      .single();

    if (orderFetchError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const previousStatus = (order as any).status;

    // 2. Si pasa a 'approved', descontar stock de la remera
    if (newStatus === 'approved' && previousStatus !== 'approved' && previousStatus !== 'delivered') {
      const targetRemeraId = currentRemeraId || (order as any).remera_id;
      const { data: remeraData } = await (adminClient as any)
        .from('tango_remeras')
        .select('stock')
        .eq('id', targetRemeraId)
        .single();

      if (remeraData) {
        const updatedStock = Math.max(0, (remeraData.stock || 0) - ((order as any).quantity || quantity || 1));
        await (adminClient as any)
          .from('tango_remeras')
          .update({ stock: updatedStock })
          .eq('id', targetRemeraId);
      }

      // También actualizar el aviso de pago a 'approved'
      await (adminClient as any)
        .from('tango_payment_notifications')
        .update({ status: 'approved' })
        .eq('order_id', orderId);
    } else if (newStatus === 'rejected') {
      await (adminClient as any)
        .from('tango_payment_notifications')
        .update({ status: 'rejected' })
        .eq('order_id', orderId);
    }

    // 3. Actualizar estado del pedido
    const { data: updatedOrder, error: updateError } = await (adminClient as any)
      .from('tango_orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 4. Preparar el mensaje de WhatsApp para Maris
    const clientName = (order as any).profile?.full_name || 'Comprador/a';
    const clientPhone = (order as any).profile?.phone || '';
    const remeraTitle = (order as any).remera?.title || 'Remera Tango';
    const size = (order as any).selected_size;
    const deliveryTypeStr = (order as any).delivery_type === 'envio' ? 'Envío a tu domicilio' : 'Retiro en punto convenido';

    let message = '';
    if (newStatus === 'approved') {
      message = `¡Hola ${clientName}! Te saluda Maris de Mujeres del Tango. Confirmamos la recepción de tu pago para la remera '${remeraTitle}' en Talle ${size}. Ya estamos preparando tu paquete para ${deliveryTypeStr}. ¡Muchas gracias por tu compra!`;
    } else if (newStatus === 'delivered') {
      message = `¡Hola ${clientName}! Te saluda Maris de Mujeres del Tango. Tu remera '${remeraTitle}' (Talle ${size}) ya se encuentra en camino / lista para entrega. ¡Que la disfrutes!`;
    }

    const whatsAppLink = clientPhone ? buildWhatsAppLink(clientPhone, message) : null;

    return NextResponse.json({
      order: updatedOrder,
      whatsAppLink,
      message,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar pedido' }, { status: 500 });
  }
}

// DELETE /api/admin/orders - Eliminar pedido
export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const adminClient = createAdminClient();
    const { error } = await adminClient.from('tango_orders').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar pedido' }, { status: 500 });
  }
}
