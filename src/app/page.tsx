'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Remera, Collection, Profile } from '@/types/database';
import { formatCurrency, buildWhatsAppLink, formatDetailedAddress, parseDetailedAddress, getEmptyAddress, AddressData } from '@/lib/utils';
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
  MapPin
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
  const [shippingAddressData, setShippingAddressData] = useState<AddressData>(getEmptyAddress());
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
  const bankName = process.env.NEXT_PUBLIC_BANK_NAME || 'Banco Nación / Mercado Pago';

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        if (user) {
          const { data: prof } = await supabase
            .from('tango_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (prof) {
            setUserProfile(prof as Profile);
            const addr = (prof as any).address || '';
            setShippingAddress(addr);
            setShippingAddressData(parseDetailedAddress(addr));
          }
        }

        const { data: remerasData, error: remerasError } = await supabase
          .from('tango_remeras')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (remerasError) console.error('Error cargando remeras:', remerasError);
        else setRemeras(remerasData || []);

        const { data: collectionsData, error: collError } = await supabase
          .from('tango_collections')
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
    if (!checkoutRemera || !selectedSize || !referenceCode.trim()) {
      alert('Por favor completá el talle y el código de comprobante de pago.');
      return;
    }

    if (deliveryType === 'envio' && (!shippingAddressData.street.trim() || !shippingAddressData.number.trim())) {
      alert('Por favor completá al menos la calle y el número para el envío.');
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
      alert(err.message || 'Ocurrió un error al registrar el pedido.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* HERO SECTION NEUTRAL */}
      <section className="bg-white border-b border-zinc-200 py-12 sm:py-16 text-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-medium mb-4">
            Catálogo Oficial de Remeras
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 mb-4">
            Mujeres del Tango
          </h1>

          <p className="max-w-2xl mx-auto text-base text-zinc-600 leading-relaxed mb-6">
            Remeras de diseño inspiradas en las grandes voces, letristas y figuras de la música ciudadana.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-600">
            <span className="px-3 py-1 rounded-md bg-zinc-100 border border-zinc-200">Tita Merello</span>
            <span className="px-3 py-1 rounded-md bg-zinc-100 border border-zinc-200">Eladia Blázquez</span>
            <span className="px-3 py-1 rounded-md bg-zinc-100 border border-zinc-200">Ada Falcón</span>
            <span className="px-3 py-1 rounded-md bg-zinc-100 border border-zinc-200">Nelly Omar</span>
          </div>
        </div>
      </section>

      {/* FILTROS Y BUSCADOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-xl shadow-xs border border-zinc-200 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Buscador */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar remera por nombre o estampa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
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
                className="w-full py-2 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900"
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
                className="w-full py-2 px-3 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900"
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
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
            <span className="text-xs font-semibold text-zinc-500 mr-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Categorías:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Chips de Artistas */}
          {collections.length > 0 && (
            <div className="pt-2 border-t border-zinc-100 flex items-center gap-2 overflow-x-auto text-xs text-zinc-600">
              <span className="font-medium text-zinc-500">Colecciones:</span>
              {collections.map((coll) => (
                <button
                  key={coll.id}
                  onClick={() => setActiveCollectionModal(coll)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors font-medium"
                >
                  <span>{coll.name}</span>
                  <Info className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CATÁLOGO DE REMERAS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">
              Catálogo de Remeras
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {filteredRemeras.length} producto{filteredRemeras.length === 1 ? '' : 's'} disponible{filteredRemeras.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-xl p-4 border border-zinc-200 animate-pulse space-y-4">
                <div className="w-full h-64 bg-zinc-200 rounded-lg" />
                <div className="h-4 bg-zinc-200 rounded w-3/4" />
                <div className="h-4 bg-zinc-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredRemeras.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-zinc-200">
            <h3 className="text-base font-bold text-zinc-800">No encontramos remeras con esos filtros</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">
              Probá restableciendo los filtros.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Todos');
                setSelectedCollection('Todas');
                setSelectedSizeFilter('Todos');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800"
            >
              Ver todas las remeras
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRemeras.map((remera) => (
              <div
                key={remera.id}
                className="bg-white rounded-xl overflow-hidden border border-zinc-200 flex flex-col justify-between"
              >
                <div className="relative w-full h-72 bg-zinc-100">
                  <img
                    src={remera.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                    alt={remera.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-zinc-900 text-white">
                      {formatCurrency(Number(remera.price))}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2">
                    {remera.stock <= 3 && remera.stock > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-900 text-white">
                        Últimas {remera.stock} disponibles
                      </span>
                    ) : remera.stock === 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-300 text-zinc-700">
                        Sin stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/90 text-zinc-800">
                        Stock: {remera.stock} u.
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {remera.collection_name && (
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        {remera.collection_name}
                      </p>
                    )}
                    <h3 className="font-bold text-zinc-900 text-base leading-snug">
                      {remera.title}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1.5 leading-relaxed">
                      {remera.description || '100% Algodón peinado.'}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 mr-1">Talles:</span>
                      {remera.sizes?.map((size) => (
                        <span
                          key={size}
                          className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-medium"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-100">
                    {remera.stock === 0 ? (
                      <button
                        disabled
                        className="w-full py-2 rounded-lg bg-zinc-100 text-zinc-400 text-xs font-semibold cursor-not-allowed"
                      >
                        Agotado
                      </button>
                    ) : currentUser ? (
                      <button
                        onClick={() => handleOpenCheckout(remera)}
                        className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Comprar / Notificar Pago</span>
                      </button>
                    ) : (
                      <a
                        href="/login?redirect=/"
                        className="w-full py-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold text-center block transition-colors"
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

      {/* MODAL ARTISTA / COLECCIÓN */}
      {activeCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden border border-zinc-200">
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  Colección / Homenaje
                </span>
                <button
                  onClick={() => setActiveCollectionModal(null)}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                {activeCollectionModal.name}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {activeCollectionModal.bio || 'Homenaje a una destacada figura de nuestra cultura.'}
              </p>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedCollection(activeCollectionModal.name);
                    setActiveCollectionModal(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800"
                >
                  Filtrar remeras de esta serie
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CHECKOUT */}
      {checkoutRemera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full my-8 overflow-hidden border border-zinc-200">
            <div className="bg-zinc-900 text-white p-5 relative">
              <button
                onClick={() => setCheckoutRemera(null)}
                className="absolute top-4 right-4 p-1 rounded text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="text-[10px] uppercase font-bold text-zinc-400">
                Pago por Transferencia
              </span>
              <h3 className="text-lg font-bold mt-0.5">
                {checkoutRemera.title}
              </h3>
              <p className="text-sm font-semibold text-zinc-300 mt-1">
                Total: {formatCurrency(Number(checkoutRemera.price) * quantity)}
              </p>
            </div>

            {orderSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-zinc-900">
                    Pedido Registrado
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Maris verificará tu transferencia y te confirmará la preparación del pedido.
                  </p>
                </div>

                <div className="p-3 bg-zinc-50 rounded-lg text-left text-xs text-zinc-700 space-y-1 border border-zinc-200">
                  <p><strong>Remera:</strong> {checkoutRemera.title} (Talle {selectedSize})</p>
                  <p><strong>Comprobante informado:</strong> {referenceCode}</p>
                  <p><strong>Entrega:</strong> {deliveryType === 'envio' ? shippingAddress : 'Punto de Retiro'}</p>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={buildWhatsAppLink(
                      '5491100000000',
                      `Hola Maris, acabo de realizar la compra de la remera '${checkoutRemera.title}' (Talle ${selectedSize}). Mi comprobante de pago es: ${referenceCode}.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <span>Notificar a Maris por WhatsApp</span>
                  </a>

                  <button
                    onClick={() => {
                      setCheckoutRemera(null);
                      router.push('/mis-compras');
                    }}
                    className="w-full py-2 px-4 rounded-lg border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50"
                  >
                    Ver mis pedidos
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Talle:
                    </label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full py-2 px-2.5 rounded-lg border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    >
                      {checkoutRemera.sizes.map((sz) => (
                        <option key={sz} value={sz}>
                          Talle {sz}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Color:
                    </label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full py-2 px-2.5 rounded-lg border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    >
                      {checkoutRemera.colors.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Modalidad de entrega:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('envio')}
                      className={`p-2 rounded-lg border text-left flex items-center gap-1.5 text-xs font-medium ${
                        deliveryType === 'envio'
                          ? 'border-zinc-900 bg-zinc-100 text-zinc-900 font-bold'
                          : 'border-zinc-200 text-zinc-600'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Envío</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('retiro')}
                      className={`p-2 rounded-lg border text-left flex items-center gap-1.5 text-xs font-medium ${
                        deliveryType === 'retiro'
                          ? 'border-zinc-900 bg-zinc-100 text-zinc-900 font-bold'
                          : 'border-zinc-200 text-zinc-600'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Retiro</span>
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
                <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2 text-xs text-zinc-700">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Datos Bancarios para Transferencia:</span>
                  </div>
                  <p><strong>Titular:</strong> {bankHolder}</p>
                  <p><strong>Entidad:</strong> {bankName}</p>

                  <div className="flex items-center justify-between bg-white p-2 rounded border border-zinc-200">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Alias:</span>
                      <span className="font-mono font-bold text-zinc-900">{bankAlias}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankAlias, 'alias')}
                      className="px-2 py-1 text-[11px] font-semibold rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 flex items-center gap-1"
                    >
                      {copiedAlias ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2 rounded border border-zinc-200">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">CBU:</span>
                      <span className="font-mono text-zinc-900">{bankCbu}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankCbu, 'cbu')}
                      className="px-2 py-1 text-[11px] font-semibold rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 flex items-center gap-1"
                    >
                      {copiedCbu ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    N° de Comprobante / Código de Operación <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 19482746"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-300 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">
                    Aclaraciones (opcional):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Timbre, depto o preferencia horaria..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  {submittingOrder ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Confirmar Pedido y Enviar Comprobante</span>
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
