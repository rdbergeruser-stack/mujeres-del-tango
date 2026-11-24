'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Remera, Collection, Profile } from '@/types/database';
import { formatCurrency, buildWhatsAppLink } from '@/lib/utils';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Copy,
  Info,
  X,
  CreditCard,
  Truck,
  MapPin,
  Heart,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [remeras, setRemeras] = useState<Remera[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedCollection, setSelectedCollection] = useState<string>('Todas');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal de Artista / Colección
  const [activeCollectionModal, setActiveCollectionModal] = useState<Collection | null>(null);

  // Modal de Compra
  const [checkoutRemera, setCheckoutRemera] = useState<Remera | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [deliveryType, setDeliveryType] = useState<'envio' | 'retiro'>('envio');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  // Feedback copiar datos bancarios
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedCbu, setCopiedCbu] = useState(false);

  const bankAlias = process.env.NEXT_PUBLIC_BANK_ALIAS || 'mujeres.del.tango';
  const bankCbu = process.env.NEXT_PUBLIC_BANK_CBU || '0000003100012345678901';
  const bankHolder = process.env.NEXT_PUBLIC_BANK_HOLDER || 'Maris - Mujeres del Tango';
  const bankName = process.env.NEXT_PUBLIC_BANK_NAME || 'Banco de la Nación Argentina / Mercado Pago';

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);

        // 1. Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        if (user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (prof) {
            setUserProfile(prof as Profile);
            setShippingAddress((prof as any).address || '');
          }
        }

        // 2. Cargar remeras activas
        const { data: remerasData, error: remerasError } = await supabase
          .from('remeras')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (remerasError) console.error('Error cargando remeras:', remerasError);
        else setRemeras(remerasData || []);

        // 3. Cargar colecciones
        const { data: collectionsData, error: collError } = await supabase
          .from('collections')
          .select('*')
          .order('name', { ascending: true });

        if (collError) console.error('Error cargando colecciones:', collError);
        else setCollections(collectionsData || []);
      } catch (err) {
        console.error('Error general:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Extraer categorías únicas
  const categories = ['Todos', ...Array.from(new Set(remeras.map((r) => r.category).filter(Boolean)))];
  const sizeOptions = ['Todos', 'S', 'M', 'L', 'XL', 'XXL'];

  // Filtrar catálogo
  const filteredRemeras = remeras.filter((item) => {
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    const matchesCollection = selectedCollection === 'Todas' || item.collection_name === selectedCollection;
    const matchesSize = selectedSizeFilter === 'Todos' || item.sizes.includes(selectedSizeFilter);
    const matchesQuery =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.collection_name && item.collection_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesCollection && matchesSize && matchesQuery;
  });

  const handleOpenCheckout = (remera: Remera) => {
    if (!currentUser) {
      router.push('/login?redirect=/');
      return;
    }
    setCheckoutRemera(remera);
    setSelectedSize(remera.sizes[0] || 'M');
    setSelectedColor(remera.colors[0] || 'Negro');
    setQuantity(1);
    setReferenceCode('');
    setOrderNotes('');
    setOrderSuccess(null);
  };

  const handleCopy = (text: string, type: 'alias' | 'cbu') => {
    navigator.clipboard.writeText(text);
    if (type === 'alias') {
      setCopiedAlias(true);
      setTimeout(() => setCopiedAlias(false), 2000);
    } else {
      setCopiedCbu(true);
      setTimeout(() => setCopiedCbu(false), 2000);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutRemera || !selectedSize || !referenceCode.trim()) {
      alert('Por favor completá el talle y el código de comprobante de pago.');
      return;
    }

    try {
      setSubmittingOrder(true);
      const res = await fetch('/api/notify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remera_id: checkoutRemera.id,
          selected_size: selectedSize,
          selected_color: selectedColor,
          quantity,
          delivery_type: deliveryType,
          shipping_address: deliveryType === 'envio' ? shippingAddress : null,
          reference_code: referenceCode,
          notes: orderNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar pedido');
      }

      setOrderSuccess(data);
    } catch (err: any) {
      alert(err.message || 'Ocurrió un error al registrar el pedido.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 text-stone-100 py-16 sm:py-24 border-b border-rose-950">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#9f1239_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge Destacado */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950/80 border border-rose-600/40 text-rose-300 text-xs sm:text-sm font-medium mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Diseño Independiente & 100% Algodón Premium</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-white mb-6">
            Mujeres del Tango
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-xl text-stone-300 font-light leading-relaxed mb-8">
            Remeras de diseño independiente que rinden homenaje a las grandes voces, letristas y figuras de nuestro tango.
          </p>

          {/* Iconos de Colección Rápida */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-stone-400">
            <span className="px-3 py-1 rounded-full bg-stone-900/80 border border-stone-800">🌹 Tita Merello</span>
            <span className="px-3 py-1 rounded-full bg-stone-900/80 border border-stone-800">🎹 Eladia Blázquez</span>
            <span className="px-3 py-1 rounded-full bg-stone-900/80 border border-stone-800">🖤 Ada Falcón</span>
            <span className="px-3 py-1 rounded-full bg-stone-900/80 border border-stone-800">✨ Nelly Omar</span>
          </div>
        </div>
      </section>

      {/* FILTROS DINÁMICOS & BUSCADOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200/80 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Buscador */}
            <div className="md:col-span-6 relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar remera por nombre, estampa o cantante..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-900/30 focus:border-rose-900 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Selector de Colección */}
            <div className="md:col-span-3">
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-900/30 focus:border-rose-900"
              >
                <option value="Todas">Todas las Colecciones</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Talle */}
            <div className="md:col-span-3">
              <select
                value={selectedSizeFilter}
                onChange={(e) => setSelectedSizeFilter(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-900/30 focus:border-rose-900"
              >
                {sizeOptions.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz === 'Todos' ? 'Cualquier Talle' : `Talle: ${sz}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chips de Categorías */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 mr-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Categorías:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-rose-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Chips de Artistas con Modal Emergente */}
          {collections.length > 0 && (
            <div className="pt-2 border-t border-stone-100 flex items-center gap-2 overflow-x-auto text-xs text-stone-600">
              <span className="font-medium text-stone-600 whitespace-nowrap">Homenajes:</span>
              {collections.map((coll) => (
                <button
                  key={coll.id}
                  onClick={() => setActiveCollectionModal(coll)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 text-rose-900 hover:bg-rose-100 transition-colors whitespace-nowrap font-medium"
                >
                  <span>{coll.name}</span>
                  <Info className="w-3.5 h-3.5 text-rose-700" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CATÁLOGO DE REMERAS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              Nuestra Colección de Remeras
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              Mostrando {filteredRemeras.length} modelo{filteredRemeras.length === 1 ? '' : 's'} disponible{filteredRemeras.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse space-y-4">
                <div className="w-full h-72 bg-stone-200 rounded-xl" />
                <div className="h-4 bg-stone-200 rounded w-3/4" />
                <div className="h-4 bg-stone-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredRemeras.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-3xl mb-4">
              🥀
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-800">No encontramos remeras con esos filtros</h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 mb-6">
              Probá restableciendo los filtros o buscando con otro término.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Todos');
                setSelectedCollection('Todas');
                setSelectedSizeFilter('Todos');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-900 transition-colors"
            >
              Ver todas las remeras
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredRemeras.map((remera) => (
              <div
                key={remera.id}
                className="group bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Imagen con Zoom Suave */}
                <div className="relative w-full h-80 overflow-hidden bg-stone-100">
                  <img
                    src={remera.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                    alt={remera.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-900/90 text-white shadow-md">
                      {formatCurrency(Number(remera.price))}
                    </span>
                  </div>

                  {/* Badge de Stock */}
                  <div className="absolute bottom-3 left-3">
                    {remera.stock <= 3 && remera.stock > 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/90 text-stone-950 backdrop-blur-sm">
                        ¡Últimas {remera.stock} disponibles!
                      </span>
                    ) : remera.stock === 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-900/90 text-white">
                        Sin stock momentáneo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-900/60 text-stone-200 backdrop-blur-sm">
                        Stock: {remera.stock} u.
                      </span>
                    )}
                  </div>
                </div>

                {/* Info de la Remera */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {remera.collection_name && (
                      <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800 mb-1">
                        {remera.collection_name}
                      </p>
                    )}
                    <h3 className="font-serif font-bold text-stone-900 text-lg leading-snug group-hover:text-rose-900 transition-colors">
                      {remera.title}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2 mt-2 leading-relaxed">
                      {remera.description || '100% Algodón peinado 24/1. Estampa serigráfica de máxima resistencia.'}
                    </p>

                    {/* Chips de Talles */}
                    <div className="mt-4 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-semibold text-stone-600 mr-1">Talles:</span>
                      {remera.sizes?.map((size) => (
                        <span
                          key={size}
                          className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[11px] font-semibold"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Botón de Compra */}
                  <div className="mt-6 pt-4 border-t border-stone-100">
                    {remera.stock === 0 ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-stone-200 text-stone-400 text-xs font-semibold cursor-not-allowed uppercase tracking-wider"
                      >
                        Agotado
                      </button>
                    ) : currentUser ? (
                      <button
                        onClick={() => handleOpenCheckout(remera)}
                        className="w-full py-2.5 px-4 rounded-xl bg-rose-900 hover:bg-rose-800 active:scale-[0.99] text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Comprar / Notificar Pago</span>
                      </button>
                    ) : (
                      <a
                        href="/login?redirect=/"
                        className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-semibold text-center block transition-all uppercase tracking-wider"
                      >
                        Iniciá sesión para comprar
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL FICHA DE ARTISTA / COLECCIÓN */}
      {activeCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200">
            <div className="relative h-48 bg-stone-900">
              <img
                src={activeCollectionModal.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}
                alt={activeCollectionModal.name}
                className="w-full h-full object-cover opacity-80"
              />
              <button
                onClick={() => setActiveCollectionModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-stone-900/80 text-white hover:bg-stone-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <span className="text-xs uppercase font-bold tracking-widest text-rose-800">
                Homenaje Oficial
              </span>
              <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1 mb-3">
                {activeCollectionModal.name}
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                {activeCollectionModal.bio || 'Una de las grandes figuras de nuestra historia tanguera.'}
              </p>
              {activeCollectionModal.instagram && (
                <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span>Instagram: {activeCollectionModal.instagram}</span>
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedCollection(activeCollectionModal.name);
                    setActiveCollectionModal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-900 text-white text-xs font-semibold hover:bg-rose-800 transition-colors"
                >
                  Filtrar remeras de esta colección
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CHECKOUT Y TRANSFERENCIA */}
      {checkoutRemera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full my-8 overflow-hidden shadow-2xl border border-stone-200">
            {/* Encabezado */}
            <div className="bg-stone-900 text-white p-6 relative">
              <button
                onClick={() => setCheckoutRemera(null)}
                className="absolute top-5 right-5 p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400">
                Checkout por Transferencia Bancaria
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold mt-1">
                {checkoutRemera.title}
              </h3>
              <p className="text-rose-200 font-semibold text-lg mt-1">
                {formatCurrency(Number(checkoutRemera.price) * quantity)}
              </p>
            </div>

            {orderSuccess ? (
              // VISTA DE PEDIDO REGISTRADO CON ÉXITO
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-serif text-2xl font-bold text-stone-900">
                    ¡Aviso de Pedido Enviado!
                  </h4>
                  <p className="text-sm text-stone-600 mt-2 max-w-md mx-auto leading-relaxed">
                    Maris verificará la acreditación de tu transferencia y te confirmará la preparación de tu remera a la brevedad.
                  </p>
                </div>

                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs text-stone-700 space-y-1">
                  <p><strong>Prenda:</strong> {checkoutRemera.title} (Talle {selectedSize})</p>
                  <p><strong>Comprobante:</strong> {referenceCode}</p>
                  <p><strong>Modalidad:</strong> {deliveryType === 'envio' ? `Envío a: ${shippingAddress}` : 'Retiro en punto de encuentro'}</p>
                  <p><strong>Total:</strong> {formatCurrency(Number(checkoutRemera.price) * quantity)}</p>
                </div>

                <div className="space-y-3 pt-2">
                  <a
                    href={buildWhatsAppLink(
                      '5491100000000',
                      `¡Hola Maris! 🌹 Acabo de notificar el pago para la remera '${checkoutRemera.title}' (Talle ${selectedSize}). Mi comprobante es: ${referenceCode}. ¡Quedo a la espera de tu confirmación!`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <span>Avisarle a Maris por WhatsApp ahora</span>
                  </a>

                  <button
                    onClick={() => {
                      setCheckoutRemera(null);
                      router.push('/mis-compras');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 font-medium text-sm hover:bg-stone-50 transition-colors"
                  >
                    Ver mis pedidos en "Mis Compras"
                  </button>
                </div>
              </div>
            ) : (
              // FORMULARIO DE CHECKOUT
              <form onSubmit={handleSubmitOrder} className="p-6 space-y-6">
                {/* 1. Selección de Talle y Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                      Talle:
                    </label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full py-2.5 px-3 rounded-xl border border-stone-300 bg-stone-50 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                    >
                      {checkoutRemera.sizes.map((sz) => (
                        <option key={sz} value={sz}>
                          Talle {sz}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                      Color:
                    </label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full py-2.5 px-3 rounded-xl border border-stone-300 bg-stone-50 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                    >
                      {checkoutRemera.colors.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Modalidad de Entrega */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Modalidad de entrega:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('envio')}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold transition-all ${
                        deliveryType === 'envio'
                          ? 'border-rose-900 bg-rose-50/50 text-rose-950'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <Truck className="w-4 h-4 text-rose-800" />
                      <span>Envío a Domicilio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('retiro')}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold transition-all ${
                        deliveryType === 'retiro'
                          ? 'border-rose-900 bg-rose-50/50 text-rose-950'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-rose-800" />
                      <span>Punto de Retiro</span>
                    </button>
                  </div>

                  {deliveryType === 'envio' && (
                    <div className="mt-3">
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Dirección completa de entrega:
                      </label>
                      <input
                        type="text"
                        required={deliveryType === 'envio'}
                        placeholder="Calle, número, piso, depto, localidad y código postal"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                      />
                    </div>
                  )}
                </div>

                {/* 3. DATOS BANCARIOS DESTACADOS CON COPIAR EN 1 CLIC */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900">
                    <CreditCard className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Datos para la Transferencia:
                    </span>
                  </div>

                  <div className="text-xs text-stone-700 space-y-1.5">
                    <p><strong>Titular:</strong> {bankHolder}</p>
                    <p><strong>Entidad:</strong> {bankName}</p>

                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-amber-200/80">
                      <div>
                        <span className="text-[10px] uppercase text-stone-600 block">Alias CBU:</span>
                        <span className="font-mono font-bold text-stone-900">{bankAlias}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankAlias, 'alias')}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center gap-1 transition-colors"
                      >
                        {copiedAlias ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedAlias ? '¡Copiado!' : 'Copiar'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-amber-200/80">
                      <div>
                        <span className="text-[10px] uppercase text-stone-600 block">CBU:</span>
                        <span className="font-mono text-xs text-stone-900">{bankCbu}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankCbu, 'cbu')}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center gap-1 transition-colors"
                      >
                        {copiedCbu ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCbu ? '¡Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Número de comprobante */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    N° de Comprobante u Operación de Pago <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 19482746 o Código de transferencia bancaria"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                  />
                  <p className="text-[11px] text-stone-600 mt-1">
                    Ingresá el número que figura en tu comprobante para que Maris pueda conciliar la transferencia rápidamente.
                  </p>
                </div>

                {/* 5. Notas opcionales */}
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Aclaraciones o notas (opcional):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Timbre A, entregar por la tarde, etc."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                  />
                </div>

                {/* Botón de Confirmación */}
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full py-3.5 px-4 rounded-xl bg-rose-900 hover:bg-rose-800 disabled:bg-stone-400 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {submittingOrder ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Pedido y Enviar Comprobante</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
