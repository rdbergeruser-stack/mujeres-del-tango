import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/notify-payment - Registrar pedido y aviso de transferencia
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para realizar una compra' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      remera_id,
      selected_size,
      selected_color,
      quantity = 1,
      delivery_type = 'envio',
      shipping_address,
      reference_code,
      notes,
    } = body;

    if (!remera_id || !selected_size || !reference_code) {
      return NextResponse.json(
        { error: 'Remera, talle y número de comprobante/referencia son obligatorios' },
        { status: 400 }
      );
    }

    // Consultar precio y detalles de la remera
    const adminClient = createAdminClient();
    const { data: remera, error: remeraError } = await (adminClient as any)
      .from('remeras')
      .select('*')
      .eq('id', remera_id)
      .single();

    if (remeraError || !remera) {
      return NextResponse.json({ error: 'Remera no encontrada' }, { status: 404 });
    }

    const unit_price = Number(remera.price);
    const total_price = unit_price * quantity;

    // Actualizar dirección del perfil si se ingresó una nueva
    if (delivery_type === 'envio' && shipping_address) {
      await (adminClient as any)
        .from('profiles')
        .update({ address: shipping_address })
        .eq('id', user.id);
    }

    // 1. Crear el pedido
    const { data: order, error: orderInsertError } = await (adminClient as any)
      .from('orders')
      .insert({
        user_id: user.id,
        remera_id,
        selected_size,
        selected_color: selected_color || null,
        quantity,
        unit_price,
        total_price,
        delivery_type,
        shipping_address: delivery_type === 'envio' ? shipping_address : 'Retiro en punto de encuentro',
        status: 'pending',
        notes: notes || null,
      })
      .select()
      .single();

    if (orderInsertError) throw orderInsertError;

    // 2. Crear la notificación de pago vinculada
    const { data: notification, error: notifError } = await (adminClient as any)
      .from('payment_notifications')
      .insert({
        order_id: (order as any).id,
        user_id: user.id,
        reference_code: reference_code.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (notifError) throw notifError;

    return NextResponse.json({
      success: true,
      order,
      notification,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al registrar el pedido y pago' },
      { status: 500 }
    );
  }
}
