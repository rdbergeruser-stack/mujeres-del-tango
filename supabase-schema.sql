-- ==============================================================================
-- 🌹 MUJERES DEL TANGO - ESQUEMA DE BASE DE DATOS (SUPABASE POSTGRESQL + RLS)
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FUNCIÓN HELPER: is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER: handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
  is_maris BOOLEAN;
  assigned_role TEXT;
  assigned_name TEXT;
BEGIN
  SELECT (COUNT(*) = 0) INTO is_first_user FROM public.profiles;
  is_maris := (LOWER(NEW.email) LIKE '%maris%');

  IF is_first_user OR is_maris THEN
    assigned_role := 'admin';
    assigned_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Maris');
  ELSE
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
    assigned_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  END IF;

  INSERT INTO public.profiles (
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
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    address = COALESCE(EXCLUDED.address, public.profiles.address);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. TABLA COLLECTIONS (COLECCIONES / HOMENAJES A GRANDES MUJERES DEL TANGO)
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  bio TEXT,
  instagram TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 4. TABLA REMERAS (CATÁLOGO DE PRODUCTOS)
CREATE TABLE IF NOT EXISTS public.remeras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  category TEXT NOT NULL DEFAULT 'Corte Clásico',
  collection_name TEXT REFERENCES public.collections(name) ON UPDATE CASCADE ON DELETE SET NULL,
  sizes TEXT[] NOT NULL DEFAULT ARRAY['S', 'M', 'L', 'XL', 'XXL']::TEXT[],
  colors TEXT[] NOT NULL DEFAULT ARRAY['Negro', 'Blanco Crudo', 'Bordó']::TEXT[],
  stock INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  gallery_urls TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 5. TABLA ORDERS (PEDIDOS Y VENTAS)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  remera_id UUID NOT NULL REFERENCES public.remeras(id) ON DELETE RESTRICT,
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


-- 6. TABLA PAYMENT_NOTIFICATIONS (AVISOS DE TRANSFERENCIA)
CREATE TABLE IF NOT EXISTS public.payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reference_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 7. SEGURIDAD: ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remeras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PROFILES
CREATE POLICY "Profiles: usuarios leen su perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles: usuarios editan su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles: admin inserta y borra"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- POLÍTICAS COLLECTIONS
CREATE POLICY "Collections: lectura pública"
  ON public.collections FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Collections: admin gestiona todo"
  ON public.collections FOR ALL
  USING (public.is_admin());

-- POLÍTICAS REMERAS
CREATE POLICY "Remeras: lectura pública de activas o admin todo"
  ON public.remeras FOR SELECT
  TO public
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Remeras: admin gestiona todo"
  ON public.remeras FOR ALL
  USING (public.is_admin());

-- POLÍTICAS ORDERS
CREATE POLICY "Orders: usuarios ven sus propios pedidos o admin ve todos"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Orders: usuarios crean sus propios pedidos"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Orders: admin modifica pedidos (aprobar/entregar/rechazar)"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Orders: admin elimina pedidos"
  ON public.orders FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- POLÍTICAS PAYMENT_NOTIFICATIONS
CREATE POLICY "Payment_notifications: usuarios ven sus propios avisos o admin todos"
  ON public.payment_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Payment_notifications: usuarios crean avisos para sus pedidos"
  ON public.payment_notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Payment_notifications: admin actualiza estado de avisos"
  ON public.payment_notifications FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- 8. CONFIGURACIÓN DEL STORAGE BUCKET: remeras-images
INSERT INTO storage.buckets (id, name, public)
VALUES ('remeras-images', 'remeras-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
CREATE POLICY "Storage: lectura pública de imágenes de remeras"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'remeras-images');

CREATE POLICY "Storage: administradores pueden subir imágenes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'remeras-images' AND public.is_admin());

CREATE POLICY "Storage: administradores pueden actualizar y borrar imágenes"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'remeras-images' AND public.is_admin());

CREATE POLICY "Storage: administradores pueden eliminar imágenes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'remeras-images' AND public.is_admin());


-- 9. DATOS SEMILLA (HOMENAJES Y REMERAS DE EJEMPLO)
INSERT INTO public.collections (name, bio, instagram, avatar_url)
VALUES
  (
    'Homenaje a Tita Merello',
    'Actriz, cantante y mito popular argentino. Pionera del tango con una voz inconfundible y letras llenas de carácter, picardía y coraje.',
    '@mujeresdeltango',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
  ),
  (
    'Eladia Blázquez - Poesía Urbana',
    'Poetisa, pianista y compositora excelsa. Renovó la poética del tango con himnos eternos como "Honrar la vida" y "El corazón al sur".',
    '@mujeresdeltango',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80'
  ),
  (
    'Ada Falcón - Misterio & Pasión',
    'La emperatriz del tango de los años 30. Voz dramática, personalidad magnética y un mito que trascendió generaciones.',
    '@mujeresdeltango',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80'
  ),
  (
    'Nelly Omar - La Voz Gardeliana',
    'Cantora nacional de fuerza inquebrantable y fidelidad a sus raíces criollas y milongueras.',
    '@mujeresdeltango',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
  )
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.remeras (
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
    'Remera Oversize "Se dice de mí" - Tita Merello',
    'Confeccionada en 100% algodón peinado 24/1 premium de tacto ultra suave. Estampa serigráfica artesanal al agua con ilustración vintage de Tita. Cuello redondo cerrado reforzado y calce oversize amplio.',
    28500.00,
    'Oversize',
    'Homenaje a Tita Merello',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Negro', 'Blanco Crudo', 'Bordó'],
    15,
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80'],
    true
  ),
  (
    'Remera Clásica "Honrar la Vida" - Eladia Blázquez',
    'Remera de corte clásico entallado en algodón peinado jersey 24/1. Tipografía tipográfica serigrafiada en dorado mate con estrofa histórica de Eladia. Costuras dobles reforzadas en cuello y mangas.',
    26000.00,
    'Corte Clásico',
    'Eladia Blázquez - Poesía Urbana',
    ARRAY['S', 'M', 'L', 'XL'],
    ARRAY['Bordó', 'Negro', 'Gris Melange'],
    12,
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80'],
    true
  ),
  (
    'Remera "Yo no sé qué me han hecho tus ojos" - Ada Falcón',
    'Edición especial coleccionable. Algodón con lavado vintage pre-encogido. Retrato grabado al estilo linograbado porteño en tintas ecológicas. Muy suave y de caída pesada.',
    31000.00,
    'Edición Especial',
    'Ada Falcón - Misterio & Pasión',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['Negro', 'Blanco Crudo'],
    8,
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80'],
    true
  ),
  (
    'Musculosa Rib Milonguera - Nelly Omar',
    'Musculosa tipo musculosa morley de algodón y elastano premium. Calce al cuerpo con estampa mínima sutil en pecho del fileteado porteño y la firma de Nelly Omar.',
    22500.00,
    'Musculosas',
    'Nelly Omar - La Voz Gardeliana',
    ARRAY['S', 'M', 'L'],
    ARRAY['Negro', 'Bordó'],
    10,
    'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=800&q=80',
    ARRAY[]::TEXT[],
    true
  )
ON CONFLICT DO NOTHING;
