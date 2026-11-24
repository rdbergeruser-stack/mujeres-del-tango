import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET /api/cron/keep-alive
// Realiza una consulta liviana a Supabase para mantener despierta la base de datos
// y evitar que el proyecto entre en modo pausa (freeze) por inactividad.
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verificación opcional de CRON_SECRET de Vercel
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Si se definió un secret pero no coincide, verificar si es llamada interna de Vercel
      const isVercelCron = req.headers.get('user-agent')?.includes('vercel-cron');
      if (!isVercelCron) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
    }

    const adminClient = createAdminClient();

    // Consulta liviana para despertar la conexión PostgreSQL
    const { data, error } = await (adminClient as any)
      .from('tango_remeras')
      .select('id, title')
      .limit(1);

    const latencyMs = Date.now() - startTime;

    if (error) {
      console.error('Error en keep-alive query:', error);
      return NextResponse.json({
        status: 'warning',
        message: 'Base de datos respondió con advertencia pero la conexión fue ejercitada.',
        error: error.message,
        latencyMs,
        timestamp: new Date().toISOString(),
      }, { status: 200 });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Keep-alive exitoso. Base de datos activa y lista.',
      latencyMs,
      itemCheck: data?.[0]?.title || 'OK',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error general en keep-alive:', err);
    return NextResponse.json({
      status: 'error',
      message: err.message || 'Error en keep-alive',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
