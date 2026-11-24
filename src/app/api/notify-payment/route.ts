import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { OFFICIAL_REMERAS } from '@/lib/constants';

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

// POST /api/notify-payment - Registrar pedido y aviso de transferencia en tablas tango_
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión con tu usuario para confirmar la compra.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    let {
      remera_id,
      selected_size,
      selected_color,
      quantity = 1,
      delivery_type = 'envio',
      shipping_address,
      reference_code,
      notes,
    } = body;

    if (!remera_id || !selected_size || !reference_code || !reference_code.trim()) {
      return NextResponse.json(
        { error: 'Por favor completá el talle, color y número de comprobante.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    let remera: any = null;

    // 1. Si viene con un UUID válido, buscarlo directamente en la base de datos
    if (isUUID(remera_id)) {
      const { data, error } = await (adminClient as any)
        .from('tango_remeras')
        .select('*')
        .eq('id', remera_id)
        .maybeSingle();

      if (data && !error) {
        remera = data;
      }
    }

    // 2. Si no es UUID o no se encontró, resolver por título a través de OFFICIAL_REMERAS
    if (!remera) {
      const officialItem = OFFICIAL_REMERAS.find(
        (r) => r.id === remera_id || r.title.toLowerCase() === String(remera_id).toLowerCase()
      );

      const targetTitle = officialItem ? officialItem.title : remera_id;

      // Buscar por título en la tabla de la base de datos
      const { data: byTitle } = await (adminClient as any)
        .from('tango_remeras')
        .select('*')
        .ilike('title', targetTitle)
        .maybeSingle();

      if (byTitle) {
        remera = byTitle;
      } else if (officialItem) {
        // Si no existe aún en la base de datos, insertarla automáticamente para generar un UUID real
        const { data: created, error: insertErr } = await (adminClient as any)
          .from('tango_remeras')
          .insert({
            title: officialItem.title,
            description: officialItem.description,
            price: officialItem.price,
            category: officialItem.category,
            collection_name: officialItem.collection_name,
            sizes: officialItem.sizes,
            colors: officialItem.colors,
            stock: officialItem.stock,
            image_url: officialItem.image_url,
            gallery_urls: officialItem.gallery_urls,
            is_active: true,
          })
          .select()
          .single();

        if (created && !insertErr) {
          remera = created;
        }
      }
    }

    if (!remera) {
      return NextResponse.json(
        { error: 'No se pudo vincular la remera seleccionada. Por favor recargá la página e intentalo de nuevo.' },
        { status: 404 }
      );
    }

    const unit_price = Number(remera.price);
    const total_price = unit_price * quantity;

    // Actualizar dirección del perfil si se ingresó una nueva
    if (delivery_type === 'envio' && shipping_address) {
      await (adminClient as any)
        .from('tango_profiles')
        .update({ address: shipping_address })
        .eq('id', user.id);
    }

    // 1. Crear el pedido
    const { data: order, error: orderInsertError } = await (adminClient as any)
      .from('tango_orders')
      .insert({
        user_id: user.id,
        remera_id: remera.id, // UUID real garantizado
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

    if (orderInsertError) {
      console.error('Error al insertar orden:', orderInsertError);
      return NextResponse.json(
        { error: 'Ocurrió un error al registrar el pedido en la base de datos.' },
        { status: 500 }
      );
    }

    // 2. Crear la notificación de pago vinculada
    const { data: notification, error: notifError } = await (adminClient as any)
      .from('tango_payment_notifications')
      .insert({
        order_id: (order as any).id,
        user_id: user.id,
        reference_code: reference_code.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (notifError) {
      console.error('Error al insertar notificación:', notifError);
    }

    return NextResponse.json({
      success: true,
      order,
      notification,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error en /api/notify-payment:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar el comprobante de pago.' },
      { status: 500 }
    );
  }
}
