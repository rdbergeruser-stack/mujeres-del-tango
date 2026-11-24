'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Remera, Collection, Profile } from '@/types/database';
import { formatCurrency, buildWhatsAppLink, formatDetailedAddress, parseDetailedAddress, getEmptyAddress, AddressData, deduplicateRemeras } from '@/lib/utils';
import { OFFICIAL_REMERAS, OFFICIAL_COLLECTIONS } from '@/lib/constants';
import AddressForm from '@/components/AddressForm';
import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  CheckCircle2,
  Copy,
  Info,
  X,
  CreditCard,
  Truck,
  MapPin,
  Sparkles,
  ChevronRight,
  Heart,
  AlertCircle
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [remeras, setRemeras] = useState<Remera[]>(OFFICIAL_REMERAS);
  const [collections, setCollections] = useState<Collection[]>(OFFICIAL_COLLECTIONS);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedCollection, setSelectedCollection] = useState<string>('Todas');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Previsualización de color y talle por tarjeta
  const [cardSelectedColor, setCardSelectedColor] = useState<Record<string, string>>({});
  const [cardSelectedSize, setCardSelectedSize] = useState<Record<string, string>>({});

  // Modal Colección
  const [activeCollectionModal, setActiveCollectionModal] = useState<Collection | null>(null);

  // Modal de Compra
  const [checkoutRemera, setCheckoutRemera] = useState<Remera | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedColor, setSelectedColor] = useState<string>('Blanco');
  const [quantity, setQuantity] = useState<number>(1);
  const [deliveryType, setDeliveryType] = useState<'envio' | 'retiro'>('envio');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [shippingAddressData, setShippingAddressData] = useState<AddressData>(getEmptyAddress());
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Feedback copiar datos bancarios
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedCbu, setCopiedCbu] = useState(false);

  const bankAlias = process.env.NEXT_PUBLIC_BANK_ALIAS || 'mujeres.del.tango';
  const bankCbu = process.env.NEXT_PUBLIC_BANK_CBU || '0000003100012345678901';
  const bankHolder = process.env.NEXT_PUBLIC_BANK_HOLDER || 'Maris - Mujeres del Tango';
  const bankName = process.env.NEXT_PUBLIC_BANK_NAME || 'Banco Nación / Mercado Pago';

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);

        // Carga concurrente y en paralelo para máxima velocidad inicial
        const [userRes, remerasRes, collectionsRes] = await Promise.all([
          supabase.auth.getUser().catch(() => ({ data: { user: null } })),
          fetch('/api/remeras').then((r) => r.json()).catch(() => ({ remeras: OFFICIAL_REMERAS })),
          supabase.from('tango_collections').select('*').order('name', { ascending: true }),
        ]);

        const user = userRes?.data?.user;
        setCurrentUser(user);

        if (user) {
          supabase
            .from('tango_profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()
            .then(({ data: prof }) => {
              if (prof) {
                setUserProfile(prof as Profile);
                const addr = (prof as any).address || '';
                setShippingAddress(addr);
                setShippingAddressData(parseDetailedAddress(addr));
              }
            });
        }

        if (remerasRes?.remeras && remerasRes.remeras.length > 0) {
          setRemeras(deduplicateRemeras(remerasRes.remeras));
        } else {
          setRemeras(deduplicateRemeras(OFFICIAL_REMERAS));
        }

        if (collectionsRes?.data && collectionsRes.data.length > 0) {
          setCollections(collectionsRes.data);
        } else {
          setCollections(OFFICIAL_COLLECTIONS);
        }
      } catch (err) {
        console.error('Error general cargando catálogo:', err);
        setRemeras(deduplicateRemeras(OFFICIAL_REMERAS));
        setCollections(OFFICIAL_COLLECTIONS);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  const categories = ['Todos', ...Array.from(new Set(remeras.map((r) => r.category).filter(Boolean)))];
  const sizeOptions = ['Todos', 'S', 'M', 'L', 'XL', 'XXL'];

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

  const getRemeraImageForColor = (item: Remera, color?: string): string => {
    const activeColor = color || cardSelectedColor[item.id] || item.colors[0];
    if (activeColor?.toLowerCase().includes('negro')) {
      const blackImg = item.gallery_urls?.find(u => u.toLowerCase().includes('negra') || u.toLowerCase().includes('negro'));
      if (blackImg) return blackImg;
    }
    if (activeColor?.toLowerCase().includes('amarill')) {
      const yellowImg = item.gallery_urls?.find(u => u.toLowerCase().includes('amarill'));
      if (yellowImg) return yellowImg;
    }
    return item.image_url || '/images/hero-banner.jpg';
  };

  const handleOpenCheckout = (remera: Remera, initialColor?: string, initialSize?: string) => {
    if (!currentUser) {
      router.push('/login?redirect=/');
      return;
    }
    const chosenColor = initialColor || cardSelectedColor[remera.id] || remera.colors[0] || 'Blanco';
    const chosenSize = initialSize || cardSelectedSize[remera.id] || remera.sizes[0] || 'M';
    setCheckoutRemera(remera);
    setSelectedSize(chosenSize);
    setSelectedColor(chosenColor);
    setQuantity(1);
    setReferenceCode('');
    setOrderNotes('');
    setOrderSuccess(null);
    setCheckoutError(null);
    if (userProfile?.address) {
      setShippingAddress(userProfile.address);
      setShippingAddressData(parseDetailedAddress(userProfile.address));
    }
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
    setCheckoutError(null);

    if (!checkoutRemera || !selectedSize || !referenceCode.trim()) {
      setCheckoutError('Por favor completá el talle y el código de comprobante de pago.');
      return;
    }

    if (deliveryType === 'envio' && (!shippingAddressData.street.trim() || !shippingAddressData.number.trim())) {
      setCheckoutError('Por favor completá al menos la calle y el número para el envío.');
      return;
    }

    const finalShippingAddress = deliveryType === 'envio'
      ? (formatDetailedAddress(shippingAddressData) || shippingAddress)
      : null;

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
          shipping_address: finalShippingAddress,
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
      setCheckoutError(err.message || 'Ocurrió un error al registrar el pedido.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 selection:bg-[#FF00FF] selection:text-white">
      {/* HERO SECTION DE LA MARCA */}
      <section className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 py-16 sm:py-24 text-center">
        {/* Glow de fondo con colores oficiales */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#FF00FF]/15 via-[#9900CC]/10 to-[#199DD0]/15 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700/60 text-xs font-semibold text-zinc-300 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#FF00FF] animate-pulse" />
            <span>Tienda Oficial • Remeras de Colección</span>
          </div>

          <div className="flex justify-center mb-4">
            <img
              src="/images/logo-horizontal.png"
              alt="Mujeres del Tango"
              className="h-20 sm:h-28 w-auto object-contain drop-shadow-[0_4px_24px_rgba(255,0,255,0.35)]"
            />
          </div>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed mb-8">
            Remeras de autor inspiradas en las voces, letristas, bandoneonistas y bailarinas que hicieron historia en la música ciudadana.
          </p>

          {/* Chips con las figuras homenajeadas */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            {collections.map((coll) => (
              <button
                key={coll.name}
                onClick={() => setActiveCollectionModal(coll)}
                className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-900/80 border border-zinc-800 hover:border-[#199DD0] hover:text-[#199DD0] transition-all flex items-center gap-1.5"
              >
                <span>{coll.name}</span>
                <Info className="w-3 h-3 text-zinc-500" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FILTROS Y BUSCADOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-zinc-800 p-4 sm:p-5 shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Buscador */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por artista (Tita, Paquita, María Nieves...) o modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#199DD0] transition-colors"
              />
            </div>

            {/* Filtro Colección */}
            <div className="md:col-span-3">
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#199DD0]"
              >
                <option value="Todas">Todas las Colecciones</option>
                {collections.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Talle */}
            <div className="md:col-span-3">
              <select
                value={selectedSizeFilter}
                onChange={(e) => setSelectedSizeFilter(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#199DD0]"
              >
                {sizeOptions.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz === 'Todos' ? 'Todos los Talles' : `Talle ${sz}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Categorías Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
            <span className="text-zinc-500 text-[11px] font-semibold uppercase shrink-0 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Categoría:</span>
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-[#FF00FF] to-[#199DD0] text-white font-bold shadow-[0_0_12px_rgba(255,0,255,0.4)]'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CATÁLOGO DE REMERAS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Remeras Oficiales</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[#199DD0] font-mono">
                {filteredRemeras.length} modelos
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Elegí tu modelo, talle y color. Transferí y Maris te prepara el pedido con envío inmediato.
            </p>
          </div>
        </div>

        {filteredRemeras.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-zinc-800/80 p-8">
            <p className="text-sm text-zinc-400">
              No encontramos remeras con los filtros seleccionados.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Todos');
                setSelectedCollection('Todas');
                setSelectedSizeFilter('Todos');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#199DD0] text-white text-xs font-bold"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredRemeras.map((item) => {
              const currentCardColor = cardSelectedColor[item.id] || item.colors[0] || 'Blanco';
              const displayImage = getRemeraImageForColor(item, currentCardColor);

              return (
                <div
                  key={item.id}
                  className="group bg-zinc-900/90 rounded-2xl overflow-hidden border border-zinc-800/90 hover:border-[#199DD0] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(25,157,208,0.2)] flex flex-col"
                >
                  {/* IMAGEN MOCKUP OFICIAL */}
                  <div className="relative aspect-square w-full bg-zinc-950 overflow-hidden">
                    <img
                      src={displayImage}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Badge de Categoría */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-950/80 backdrop-blur-md text-[#FF00FF] border border-[#FF00FF]/30">
                        {item.category}
                      </span>
                    </div>

                    {/* Colección / Figura */}
                    {item.collection_name && (
                      <button
                        onClick={() => {
                          const coll = collections.find((c) => c.name === item.collection_name);
                          if (coll) setActiveCollectionModal(coll);
                        }}
                        className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-medium bg-zinc-950/80 backdrop-blur-md text-zinc-300 hover:text-white border border-zinc-800 hover:border-[#199DD0] transition-colors flex items-center gap-1"
                      >
                        <span>{item.collection_name}</span>
                        <Info className="w-3 h-3 text-[#199DD0]" />
                      </button>
                    )}
                  </div>

                  {/* DETALLES */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug group-hover:text-[#199DD0] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* SELECTOR DE COLORES DISPONIBLES EN LA TARJETA */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>Color disponible:</span>
                        <span className="font-semibold text-zinc-300">{currentCardColor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.colors.map((col) => {
                          const isSelected = currentCardColor === col;
                          return (
                            <button
                              key={col}
                              type="button"
                              onClick={() => {
                                setCardSelectedColor({
                                  ...cardSelectedColor,
                                  [item.id]: col,
                                });
                              }}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                                isSelected
                                  ? 'border-[#FF00FF] bg-[#FF00FF]/20 text-white font-bold'
                                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {col}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* TALLES */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>Elegí tu talle:</span>
                        <span className="font-semibold text-[#199DD0]">Talle {cardSelectedSize[item.id] || item.sizes[0] || 'M'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.sizes.map((s) => {
                          const isSelected = (cardSelectedSize[item.id] || item.sizes[0]) === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setCardSelectedSize({
                                  ...cardSelectedSize,
                                  [item.id]: s,
                                });
                              }}
                              className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border transition-all ${
                                isSelected
                                  ? 'border-[#199DD0] bg-[#199DD0]/25 text-white shadow-sm'
                                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700'
                              }`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* PRECIO Y ACCIÓN */}
                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Precio por transferencia:</span>
                        <span className="text-xl font-bold text-white tracking-tight">
                          {formatCurrency(item.price)}
                        </span>
                      </div>

                      {currentUser ? (
                        <button
                          onClick={() => handleOpenCheckout(item, currentCardColor, cardSelectedSize[item.id] || item.sizes[0])}
                          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#199DD0] hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Comprar</span>
                        </button>
                      ) : (
                        <a
                          href="/login?redirect=/"
                          className="py-2.5 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold block text-center transition-colors"
                        >
                          Ingresá para comprar
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL COLECCIÓN / HOMENAJE */}
      {activeCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-2xl max-w-md w-full overflow-hidden border border-zinc-700 shadow-2xl">
            {activeCollectionModal.avatar_url && (
              <div className="h-44 w-full bg-zinc-950 overflow-hidden relative">
                <img
                  src={activeCollectionModal.avatar_url}
                  alt={activeCollectionModal.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
              </div>
            )}
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#FF00FF] tracking-wider">
                  Figura Homenajeada
                </span>
                <button
                  onClick={() => setActiveCollectionModal(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-2xl font-bold text-white">
                {activeCollectionModal.name}
              </h3>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {activeCollectionModal.bio}
              </p>

              <div className="pt-4 flex justify-between items-center border-t border-zinc-800">
                <span className="text-xs text-zinc-500">{activeCollectionModal.instagram}</span>
                <button
                  onClick={() => {
                    setSelectedCollection(activeCollectionModal.name);
                    setActiveCollectionModal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#199DD0] text-white text-xs font-bold"
                >
                  Ver sus remeras
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT & TRANSFERENCIA */}
      {checkoutRemera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-zinc-900 rounded-2xl max-w-lg w-full overflow-hidden border border-zinc-700 shadow-2xl my-8">
            {/* Header Modal */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-3">
                <img
                  src={getRemeraImageForColor(checkoutRemera, selectedColor)}
                  alt={checkoutRemera.title}
                  loading="lazy"
                  decoding="async"
                  className="w-12 h-12 rounded-lg object-cover border border-zinc-800"
                />
                <div>
                  <h4 className="font-bold text-white text-sm">
                    {checkoutRemera.title}
                  </h4>
                  <p className="text-xs text-[#FF00FF] font-semibold">
                    {formatCurrency(checkoutRemera.price * quantity)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutRemera(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderSuccess ? (
              <div className="p-6 space-y-4 text-center">
                <div className="w-14 h-14 bg-gradient-to-r from-[#FF00FF] to-[#199DD0] rounded-full flex items-center justify-center mx-auto text-white shadow-[0_0_20px_rgba(255,0,255,0.4)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">¡Aviso de Compra Enviado!</h3>
                <p className="text-xs text-zinc-300">
                  Registramos tu pedido correctamente. Maris verificará la transferencia y preparará tu remera.
                </p>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs text-left space-y-1.5 text-zinc-300">
                  <p><strong>Comprobante:</strong> <span className="font-mono text-[#199DD0]">{referenceCode}</span></p>
                  <p><strong>Modelo:</strong> {checkoutRemera.title}</p>
                  <p><strong>Talle:</strong> {selectedSize} | <strong>Color:</strong> {selectedColor}</p>
                  <p><strong>Total:</strong> {formatCurrency(checkoutRemera.price * quantity)}</p>
                  <p><strong>Entrega:</strong> {deliveryType === 'envio' ? (shippingAddress || formatDetailedAddress(shippingAddressData)) : 'Punto de Retiro'}</p>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={buildWhatsAppLink(
                      '5493435439216',
                      `Hola Maris, acabo de realizar la compra de la remera '${checkoutRemera.title}' (Talle ${selectedSize}, Color ${selectedColor}). Mi comprobante de pago es: ${referenceCode}.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#199DD0] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,0,255,0.4)]"
                  >
                    <span>Notificar a Maris por WhatsApp</span>
                  </a>

                  <button
                    onClick={() => {
                      setCheckoutRemera(null);
                      router.push('/mis-compras');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700"
                  >
                    Ver mis pedidos
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} className="p-5 space-y-4">
                {/* Talle y Color Interactivo */}
                <div className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-zinc-300">
                        Elegí tu Talle:
                      </label>
                      <span className="text-xs font-bold text-[#199DD0]">Talle {selectedSize}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {checkoutRemera.sizes.map((sz) => {
                        const isSelected = selectedSize === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSize(sz)}
                            className={`flex-1 min-w-[50px] py-2 px-3 rounded-xl border font-mono text-xs font-bold transition-all ${
                              isSelected
                                ? 'border-[#199DD0] bg-[#199DD0]/25 text-white shadow-[0_0_10px_rgba(25,157,208,0.3)] ring-1 ring-[#199DD0]'
                                : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-zinc-300">
                        Elegí el Color:
                      </label>
                      <span className="text-xs font-bold text-[#FF00FF]">{selectedColor}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {checkoutRemera.colors.map((col) => {
                        const isSelected = selectedColor === col;
                        return (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setSelectedColor(col)}
                            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                              isSelected
                                ? 'border-[#FF00FF] bg-[#FF00FF]/25 text-white shadow-[0_0_10px_rgba(255,0,255,0.3)] ring-1 ring-[#FF00FF]'
                                : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700'
                            }`}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Modalidad de entrega */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Modalidad de entrega:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('envio')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold ${
                        deliveryType === 'envio'
                          ? 'border-[#FF00FF] bg-[#FF00FF]/15 text-white'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      <Truck className="w-4 h-4 text-[#FF00FF]" />
                      <span>Envío a Domicilio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('retiro')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold ${
                        deliveryType === 'retiro'
                          ? 'border-[#199DD0] bg-[#199DD0]/15 text-white'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-[#199DD0]" />
                      <span>Punto de Retiro</span>
                    </button>
                  </div>

                  {deliveryType === 'envio' && (
                    <div className="mt-3">
                      <AddressForm
                        value={shippingAddressData}
                        onChange={(data) => {
                          setShippingAddressData(data);
                          setShippingAddress(formatDetailedAddress(data));
                        }}
                        required
                        compact
                      />
                    </div>
                  )}
                </div>

                {/* Datos bancarios */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5 text-xs text-zinc-300">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <CreditCard className="w-4 h-4 text-[#FF00FF]" />
                    <span>Datos Bancarios para Transferencia:</span>
                  </div>
                  <p><strong>Titular:</strong> {bankHolder}</p>
                  <p><strong>Entidad:</strong> {bankName}</p>

                  <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                    <span className="font-mono text-zinc-300">Alias: <strong>{bankAlias}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankAlias, 'alias')}
                      className="text-xs text-[#199DD0] hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedAlias ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                    <span className="font-mono text-zinc-300">CBU: <strong>{bankCbu}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankCbu, 'cbu')}
                      className="text-xs text-[#199DD0] hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedCbu ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Código de comprobante */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Número de Comprobante / Referencia de Transferencia <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 123456789 o código de operación"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#199DD0]"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Pegá el número de comprobante emitido por tu banco o billetera virtual.
                  </span>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Aclaraciones para Maris (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Si podés entregármela un sábado a la tarde"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                {/* Error Banner */}
                {checkoutError && (
                  <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-700/80 text-red-200 text-xs flex items-center gap-2.5 shadow-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span className="leading-relaxed">{checkoutError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#199DD0] hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,0,255,0.4)] transition-all"
                >
                  {submittingOrder ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Compra ({formatCurrency(checkoutRemera.price * quantity)})</span>
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
