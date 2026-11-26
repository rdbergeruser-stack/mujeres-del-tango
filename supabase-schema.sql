-- ==============================================================================
-- 🌹 MUJERES DEL TANGO - ESQUEMA DE BASE DE DATOS ADAPTADO (PREFIJO tango_)
-- Totalmente compatible para convivir en un proyecto de Supabase ya existente.
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA tango_profiles
CREATE TABLE IF NOT EXISTS public.tango_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FUNCIÓN HELPER: tango_is_admin()
CREATE OR REPLACE FUNCTION public.tango_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tango_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER: tango_handle_new_user()
CREATE OR REPLACE FUNCTION public.tango_handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
  is_maris BOOLEAN;
  is_tango_app BOOLEAN;
  assigned_role TEXT;
  assigned_name TEXT;
BEGIN
  SELECT (COUNT(*) = 0) INTO is_first_user FROM public.tango_profiles;
  is_maris := (LOWER(NEW.email) LIKE '%maris%');
  is_tango_app := (COALESCE(NEW.raw_user_meta_data->>'app', '') = 'mujeres_del_tango');

  -- Solo registrar en tango_profiles si es de esta app, contiene "maris" o es la primera cuenta
  IF is_first_user OR is_maris OR is_tango_app THEN
    IF is_first_user OR is_maris THEN
      assigned_role := 'admin';
      assigned_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Maris');
    ELSE
      assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
      assigned_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    END IF;

    INSERT INTO public.tango_profiles (
      id,
      email,
      full_name,
      phone,
      address,
      role,
      must_change_password
    ) VALUES (
      NEW.id,
      NEW.email,
      assigned_name,
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      COALESCE(NEW.raw_user_meta_data->>'address', ''),
      assigned_role,
      COALESCE((NEW.raw_user_meta_data->>'must_change_password')::BOOLEAN, false)
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.tango_profiles.full_name),
      phone = COALESCE(EXCLUDED.phone, public.tango_profiles.phone),
      address = COALESCE(EXCLUDED.address, public.tango_profiles.address);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_tango ON auth.users;
CREATE TRIGGER on_auth_user_created_tango
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.tango_handle_new_user();


-- 3. TABLA tango_collections (COLECCIONES / HOMENAJES A GRANDES MUJERES DEL TANGO)
CREATE TABLE IF NOT EXISTS public.tango_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  bio TEXT,
  instagram TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 4. TABLA tango_remeras (CATÁLOGO DE PRODUCTOS)
CREATE TABLE IF NOT EXISTS public.tango_remeras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  category TEXT NOT NULL DEFAULT 'Corte Clásico',
  collection_name TEXT REFERENCES public.tango_collections(name) ON UPDATE CASCADE ON DELETE SET NULL,
  sizes TEXT[] NOT NULL DEFAULT ARRAY['S', 'M', 'L', 'XL', 'XXL']::TEXT[],
  colors TEXT[] NOT NULL DEFAULT ARRAY['Negro', 'Blanco Crudo', 'Bordó']::TEXT[],
  stock INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  gallery_urls TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 5. TABLA tango_orders (PEDIDOS Y VENTAS)
CREATE TABLE IF NOT EXISTS public.tango_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.tango_profiles(id) ON DELETE CASCADE,
  remera_id UUID NOT NULL REFERENCES public.tango_remeras(id) ON DELETE RESTRICT,
  selected_size TEXT NOT NULL,
  selected_color TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('envio', 'retiro')),
  shipping_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'delivered')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 6. TABLA tango_payment_notifications (AVISOS DE TRANSFERENCIA)
CREATE TABLE IF NOT EXISTS public.tango_payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.tango_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.tango_profiles(id) ON DELETE CASCADE,
  reference_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 7. SEGURIDAD: ROW LEVEL SECURITY (RLS)
ALTER TABLE public.tango_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tango_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tango_remeras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tango_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tango_payment_notifications ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS tango_profiles
DROP POLICY IF EXISTS "Tango_profiles: usuarios leen su perfil" ON public.tango_profiles;
CREATE POLICY "Tango_profiles: usuarios leen su perfil"
  ON public.tango_profiles FOR SELECT
  USING (auth.uid() = id OR public.tango_is_admin());

DROP POLICY IF EXISTS "Tango_profiles: usuarios editan su propio perfil" ON public.tango_profiles;
CREATE POLICY "Tango_profiles: usuarios editan su propio perfil"
  ON public.tango_profiles FOR UPDATE
  USING (auth.uid() = id OR public.tango_is_admin())
  WITH CHECK (auth.uid() = id OR public.tango_is_admin());

DROP POLICY IF EXISTS "Tango_profiles: admin inserta y borra" ON public.tango_profiles;
CREATE POLICY "Tango_profiles: admin inserta y borra"
  ON public.tango_profiles FOR ALL
  USING (public.tango_is_admin());

-- POLÍTICAS tango_collections
DROP POLICY IF EXISTS "Tango_collections: lectura pública" ON public.tango_collections;
CREATE POLICY "Tango_collections: lectura pública"
  ON public.tango_collections FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Tango_collections: admin gestiona todo" ON public.tango_collections;
CREATE POLICY "Tango_collections: admin gestiona todo"
  ON public.tango_collections FOR ALL
  USING (public.tango_is_admin());

-- POLÍTICAS tango_remeras
DROP POLICY IF EXISTS "Tango_remeras: lectura pública de activas o admin todo" ON public.tango_remeras;
CREATE POLICY "Tango_remeras: lectura pública de activas o admin todo"
  ON public.tango_remeras FOR SELECT
  TO public
  USING (is_active = true OR public.tango_is_admin());

DROP POLICY IF EXISTS "Tango_remeras: admin gestiona todo" ON public.tango_remeras;
CREATE POLICY "Tango_remeras: admin gestiona todo"
  ON public.tango_remeras FOR ALL
  USING (public.tango_is_admin());

-- POLÍTICAS tango_orders
DROP POLICY IF EXISTS "Tango_orders: usuarios ven sus propios pedidos o admin ve todos" ON public.tango_orders;
CREATE POLICY "Tango_orders: usuarios ven sus propios pedidos o admin ve todos"
  ON public.tango_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.tango_is_admin());

DROP POLICY IF EXISTS "Tango_orders: usuarios crean sus propios pedidos" ON public.tango_orders;
CREATE POLICY "Tango_orders: usuarios crean sus propios pedidos"
  ON public.tango_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Tango_orders: admin modifica pedidos (aprobar/entregar/rechazar)" ON public.tango_orders;
CREATE POLICY "Tango_orders: admin modifica pedidos (aprobar/entregar/rechazar)"
  ON public.tango_orders FOR UPDATE
  TO authenticated
  USING (public.tango_is_admin())
  WITH CHECK (public.tango_is_admin());

DROP POLICY IF EXISTS "Tango_orders: admin elimina pedidos" ON public.tango_orders;
CREATE POLICY "Tango_orders: admin elimina pedidos"
  ON public.tango_orders FOR DELETE
  TO authenticated
  USING (public.tango_is_admin());

-- POLÍTICAS tango_payment_notifications
DROP POLICY IF EXISTS "Tango_payment_notifications: usuarios ven sus propios avisos o admin todos" ON public.tango_payment_notifications;
CREATE POLICY "Tango_payment_notifications: usuarios ven sus propios avisos o admin todos"
  ON public.tango_payment_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.tango_is_admin());

DROP POLICY IF EXISTS "Tango_payment_notifications: usuarios crean avisos para sus pedidos" ON public.tango_payment_notifications;
CREATE POLICY "Tango_payment_notifications: usuarios crean avisos para sus pedidos"
  ON public.tango_payment_notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Tango_payment_notifications: admin actualiza estado de avisos" ON public.tango_payment_notifications;
CREATE POLICY "Tango_payment_notifications: admin actualiza estado de avisos"
  ON public.tango_payment_notifications FOR UPDATE
  TO authenticated
  USING (public.tango_is_admin())
  WITH CHECK (public.tango_is_admin());


-- 8. CONFIGURACIÓN DEL STORAGE BUCKET: tango-remeras-images
INSERT INTO storage.buckets (id, name, public)
VALUES ('tango-remeras-images', 'tango-remeras-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage aisladas
DROP POLICY IF EXISTS "Storage: lectura pública de imágenes de remeras tango" ON storage.objects;
CREATE POLICY "Storage: lectura pública de imágenes de remeras tango"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'tango-remeras-images');

DROP POLICY IF EXISTS "Storage: administradores pueden subir imágenes tango" ON storage.objects;
CREATE POLICY "Storage: administradores pueden subir imágenes tango"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tango-remeras-images' AND public.tango_is_admin());

DROP POLICY IF EXISTS "Storage: administradores pueden actualizar y borrar imágenes tango" ON storage.objects;
CREATE POLICY "Storage: administradores pueden actualizar y borrar imágenes tango"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tango-remeras-images' AND public.tango_is_admin());

DROP POLICY IF EXISTS "Storage: administradores pueden eliminar imágenes tango" ON storage.objects;
CREATE POLICY "Storage: administradores pueden eliminar imágenes tango"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'tango-remeras-images' AND public.tango_is_admin());


-- 9. DATOS SEMILLA (COLECCIONES Y REMERAS OFICIALES)
INSERT INTO public.tango_collections (name, bio, instagram, avatar_url)
VALUES
  (
    'Tita Merello',
    'Cantante, actriz y símbolo indiscutido de la cultura popular argentina. Dueña de un estilo inconfundible y una voz que desafió las convenciones de su época.',
    '@mujeresdeltango',
    '/remeras/tita-popart-blanca.jpg'
  ),
  (
    'Paquita Bernardo',
    'La primera mujer bandoneonista profesional de la historia del tango (1900-1925). Audaz, virtuosa y popular, derribó la hegemonía del instrumento.',
    '@mujeresdeltango',
    '/remeras/paquita-bernardo-blanca.jpg'
  ),
  (
    'Eloísa D''Herbil',
    'La primera mujer compositora de tangos (1842-1943), con más de 100 obras. Dama aristocrática que venció la prohibición del tango en su medio social.',
    '@mujeresdeltango',
    '/remeras/baronesa-eloisa-negra.jpg'
  ),
  (
    'Rosita Quiroga',
    'Cantante y compositora (1896-1984), primera mujer que cantó tangos en la radiofonía argentina. De estilo reo y pionera en llevar el tango a Japón.',
    '@mujeresdeltango',
    '/remeras/rosita-quiroga-blanca.jpg'
  ),
  (
    'Fermina Maristany',
    'Pianista, acordeonista, bandoneonista y directora de orquesta (1897-1985). Una música arrolladora que conquistó Barracas y los escenarios porteños.',
    '@mujeresdeltango',
    '/remeras/fermina-maristany-negra.jpg'
  ),
  (
    'Nina Miranda',
    'Una de las grandes voces del Río de la Plata (1925-2012). Brilló en la época dorada con Donato Racciatti: "Su interpretación tenía algo que no enseñan en los conservatorios: ALMA".',
    '@mujeresdeltango',
    '/remeras/nina-miranda-blanca.jpg'
  ),
  (
    'María Nieves',
    'Emblemática bailarina, milonguera y coreógrafa (1934-2026), referente indiscutida consagrada con el Día de la Bailarina de Tango (6 de septiembre).',
    '@mujeresdeltango',
    '/remeras/maria-nieves-blanca.jpg'
  )
ON CONFLICT (name) DO UPDATE SET
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url;

INSERT INTO public.tango_remeras (
  title,
  description,
  price,
  category,
  collection_name,
  sizes,
  colors,
  stock,
  image_url,
  gallery_urls,
  is_active
) VALUES
  (
    'Tita Merello — Cuadrantes Pop Art',
    'Diseño Pop Art en 4 cuadrantes estilo Andy Warhol con retratos de la gran Tita Merello (1904-2002). Disponible en remera blanca y negra.',
    28000.00,
    'Edición Pop Art',
    'Tita Merello',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Blanco', 'Negro'],
    50,
    '/remeras/tita-popart-blanca.jpg',
    ARRAY['/remeras/tita-popart-blanca.jpg', '/remeras/tita-popart-negra.jpg'],
    true
  ),
  (
    'Paquita Bernardo — La Bandoneonista Hereje',
    'Homenaje a Paquita Bernardo (1900-1925), la primera mujer en tocar profesionalmente el bandoneón en Buenos Aires, derribando los prejuicios de su época con valentía y virtuosismo.',
    28000.00,
    'Pioneras del Tango',
    'Paquita Bernardo',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Blanco'],
    40,
    '/remeras/paquita-bernardo-blanca.jpg',
    ARRAY['/remeras/paquita-bernardo-blanca.jpg'],
    true
  ),
  (
    'La Baronesa Eloísa D''Herbil de Silva',
    'Homenaje a la primera mujer compositora de tangos en la historia (1842-1943), con más de 100 obras compuestas. Dama aristocrática que desafió los mandatos de su clase social.',
    28000.00,
    'Compositoras',
    'Eloísa D''Herbil',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Negro'],
    35,
    '/remeras/baronesa-eloisa-negra.jpg',
    ARRAY['/remeras/baronesa-eloisa-negra.jpg'],
    true
  ),
  (
    'Rosita Quiroga — Primera Voz en Radio',
    'Pionera absoluta (1896-1984), primera mujer en cantar tangos en la radiofonía argentina, de estilo reo y arrabalero con gran proyección internacional.',
    28000.00,
    'Cantantes',
    'Rosita Quiroga',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Blanco'],
    30,
    '/remeras/rosita-quiroga-blanca.jpg',
    ARRAY['/remeras/rosita-quiroga-blanca.jpg'],
    true
  ),
  (
    'Fermina "La Negra" Maristany — Directora de Orquesta',
    'Pianista, acordeonista, bandoneonista y directora de orquesta (1897-1985). Una música arrolladora que conquistó Barracas y los escenarios porteños.',
    28000.00,
    'Directoras & Músicas',
    'Fermina Maristany',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Negro'],
    30,
    '/remeras/fermina-maristany-negra.jpg',
    ARRAY['/remeras/fermina-maristany-negra.jpg'],
    true
  ),
  (
    'Nina Miranda — Alma de Conservatorio',
    '"Su interpretación tenía algo que no enseñan en los conservatorios: ALMA" (1925-2012). Brilló en la época dorada con Donato Racciatti y Lucio Demare.',
    28000.00,
    'Grandes Voces',
    'Nina Miranda',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Blanco', 'Negro'],
    45,
    '/remeras/nina-miranda-blanca.jpg',
    ARRAY['/remeras/nina-miranda-blanca.jpg', '/remeras/nina-miranda-negra.jpg'],
    true
  ),
  (
    'Tita Merello — Sabiduría Popular',
    'Retrato de Tita con sus frases más recordadas: "Me hice un vestido de prepotente para pelear la vida...", "Al machismo no lo conozco... Yo no elegí sino que la vida me ofreció algo y eso es lo que pude ser".',
    28000.00,
    'Frases Célebres',
    'Tita Merello',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Blanco'],
    40,
    '/remeras/tita-frases-blanca.jpg',
    ARRAY['/remeras/tita-frases-blanca.jpg'],
    true
  ),
  (
    'Tita Merello — Muchacha, hacete el Papanicolau',
    'Diseño pop art de Tita Merello junto a su perro con su histórica frase de salud comunitaria y cuidado para todas las mujeres: "Muchacha, hacete el papanicolau".',
    28000.00,
    'Edición Especial',
    'Tita Merello',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Blanco', 'Amarillo'],
    50,
    '/remeras/tita-papanicolau-blanca.jpg',
    ARRAY['/remeras/tita-papanicolau-blanca.jpg', '/remeras/tita-papanicolau-amarilla.jpg'],
    true
  ),
  (
    'María Nieves — Día de la Bailarina de Tango',
    'Emblemática bailarina, milonguera y coreógrafa (1934-2026), consagrada por el Día de la Bailarina de Tango (6 de septiembre). "Cuando se toma una pareja de tango, son dos columnas vertebrales que se hacen una".',
    28000.00,
    'Bailarinas',
    'María Nieves',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Blanco', 'Negro'],
    45,
    '/remeras/maria-nieves-blanca.jpg',
    ARRAY['/remeras/maria-nieves-blanca.jpg', '/remeras/maria-nieves-negra.jpg'],
    true
  )
ON CONFLICT (title) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  collection_name = EXCLUDED.collection_name,
  colors = EXCLUDED.colors,
  image_url = EXCLUDED.image_url,
  gallery_urls = EXCLUDED.gallery_urls;

-- 10. TABLA tango_slider_images (CARRUSEL PRINCIPAL 1.91:1 ADMINISTRABLE)
CREATE TABLE IF NOT EXISTS public.tango_slider_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  linked_remera_title TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tango_slider_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tango_slider_images: lectura pública de activas" ON public.tango_slider_images;
CREATE POLICY "Tango_slider_images: lectura pública de activas"
  ON public.tango_slider_images FOR SELECT
  TO public
  USING (is_active = true OR public.tango_is_admin());

DROP POLICY IF EXISTS "Tango_slider_images: admin gestiona todo" ON public.tango_slider_images;
CREATE POLICY "Tango_slider_images: admin gestiona todo"
  ON public.tango_slider_images FOR ALL
  USING (public.tango_is_admin());
