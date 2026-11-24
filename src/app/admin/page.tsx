'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Remera, Collection, Profile, Order } from '@/types/database';
import { formatCurrency, buildWhatsAppLink, sanitizeWhatsAppPhone } from '@/lib/utils';
import {
  ShieldCheck,
  Package,
  ShoppingBag,
  Users,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Truck,
  MessageCircle,
  Download,
  DollarSign,
  TrendingUp,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  Filter,
  X,
  Copy,
  AlertCircle
} from 'lucide-react';

export default function AdminPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'ventas' | 'remeras' | 'clientes' | 'colecciones'>('ventas');
  const [loading, setLoading] = useState(true);

  // Datos principales
  const [orders, setOrders] = useState<any[]>([]);
  const [remeras, setRemeras] = useState<Remera[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);

  // Filtros de Ventas
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('todos');
  const [periodFilter, setPeriodFilter] = useState<'mes_actual' | 'mes_anterior' | 'historico'>('historico');

  // Modal Nueva Colección
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionBio, setNewCollectionBio] = useState('');
  const [newCollectionInstagram, setNewCollectionInstagram] = useState('');
  const [newCollectionAvatar, setNewCollectionAvatar] = useState('');

  // Formulario Remera (Crear / Editar)
  const [editingRemera, setEditingRemera] = useState<Remera | null>(null);
  const [remeraTitle, setRemeraTitle] = useState('');
  const [remeraCategory, setRemeraCategory] = useState('Corte Clásico');
  const [remeraCollection, setRemeraCollection] = useState('');
  const [remeraPrice, setRemeraPrice] = useState('28000');
  const [remeraStock, setRemeraStock] = useState('10');
  const [remeraSizes, setRemeraSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [remeraColors, setRemeraColors] = useState<string[]>(['Negro', 'Blanco Crudo']);
  const [remeraDesc, setRemeraDesc] = useState('');
  const [remeraImageUrl, setRemeraImageUrl] = useState('');
  const [remeraImageFile, setRemeraImageFile] = useState<File | null>(null);
  const [savingRemera, setSavingRemera] = useState(false);

  // Formulario Cliente Asistido por Maris
  const [clientFullName, setClientFullName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientTempPass, setClientTempPass] = useState('123456');
  const [createdClientResult, setCreatedClientResult] = useState<any>(null);
  const [creatingClient, setCreatingClient] = useState(false);

  // Búsqueda en tablas
  const [searchClient, setSearchClient] = useState('');

  const quickCategories = ['Oversize', 'Corte Clásico', 'Edición Especial', 'Musculosas'];
  const allSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const allColors = ['Negro', 'Blanco Crudo', 'Bordó', 'Gris Melange', 'Azul Noche'];

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar Órdenes
      const resOrders = await fetch('/api/admin/orders');
      const dataOrders = await resOrders.json();
      if (dataOrders.orders) setOrders(dataOrders.orders);

      // Cargar Remeras
      const resRemeras = await fetch('/api/admin/remeras');
      const dataRemeras = await resRemeras.json();
      if (dataRemeras.remeras) setRemeras(dataRemeras.remeras);

      // Cargar Colecciones
      const resColl = await fetch('/api/admin/collections');
      const dataColl = await resColl.json();
      if (dataColl.collections) setCollections(dataColl.collections);

      // Cargar Clientes
      const resClients = await fetch('/api/admin/users');
      const dataClients = await resClients.json();
      if (dataClients.profiles) setClients(dataClients.profiles);
    } catch (err) {
      console.error('Error cargando datos de admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // FILTRADO DE ÓRDENES POR PERÍODO Y ESTADO
  const filteredOrders = orders.filter((ord) => {
    // Filtro por Estado
    const matchesStatus = orderStatusFilter === 'todos' || ord.status === orderStatusFilter;

    // Filtro por Período
    const orderDate = new Date(ord.created_at);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let matchesPeriod = true;
    if (periodFilter === 'mes_actual') {
      matchesPeriod = orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    } else if (periodFilter === 'mes_anterior') {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      matchesPeriod = orderDate.getMonth() === prevMonth && orderDate.getFullYear() === prevYear;
    }

    return matchesStatus && matchesPeriod;
  });

  // MÉTRICAS FINANCIERAS
  const approvedOrders = filteredOrders.filter((o) => o.status === 'approved' || o.status === 'delivered');
  const totalRevenue = approvedOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  const totalUnitsSold = approvedOrders.reduce((sum, o) => sum + Number(o.quantity || 1), 0);
  const pendingOrdersCount = filteredOrders.filter((o) => o.status === 'pending').length;

  // Remera más vendida
  const salesCountByRemera: { [title: string]: number } = {};
  approvedOrders.forEach((o) => {
    const title = o.remera?.title || 'Remera Tango';
    salesCountByRemera[title] = (salesCountByRemera[title] || 0) + Number(o.quantity || 1);
  });
  const topRemeraEntry = Object.entries(salesCountByRemera).sort((a, b) => b[1] - a[1])[0];
  const topRemeraTitle = topRemeraEntry ? `${topRemeraEntry[0]} (${topRemeraEntry[1]} u.)` : 'Sin ventas aún';

  // EXPORTAR A CSV / EXCEL
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No hay ventas para exportar en este período.');
      return;
    }

    const headers = ['ID Pedido', 'Fecha', 'Cliente', 'WhatsApp', 'Email', 'Remera', 'Talle', 'Color', 'Cantidad', 'Total ARS', 'Entrega', 'Dirección', 'Estado', 'Comprobante'];
    const rows = filteredOrders.map((o) => [
      o.id,
      new Date(o.created_at).toISOString().split('T')[0],
      `"${o.profile?.full_name || ''}"`,
      `"${o.profile?.phone || ''}"`,
      `"${o.profile?.email || ''}"`,
      `"${o.remera?.title || ''}"`,
      o.selected_size,
      o.selected_color || '',
      o.quantity,
      o.total_price,
      o.delivery_type,
      `"${o.shipping_address || ''}"`,
      o.status,
      `"${o.payment_notification?.reference_code || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ventas-mujeres-del-tango-${periodFilter}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ACCIÓN DE PEDIDOS: Aprobar, Entregar, Rechazar
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, currentRemeraId: string, quantity: number) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus, currentRemeraId, quantity }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar pedido');

      // Si hay link de WhatsApp, abrirlo para enviar el mensaje listo
      if (data.whatsAppLink) {
        window.open(data.whatsAppLink, '_blank');
      }

      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar pedido');
    }
  };

  // GUARDAR / EDITAR REMERA
  const handleSaveRemera = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingRemera(true);

      const formData = new FormData();
      if (editingRemera) formData.append('id', editingRemera.id);
      formData.append('title', remeraTitle);
      formData.append('category', remeraCategory);
      formData.append('collection_name', remeraCollection);
      formData.append('price', remeraPrice);
      formData.append('stock', remeraStock);
      formData.append('sizes', JSON.stringify(remeraSizes));
      formData.append('colors', JSON.stringify(remeraColors));
      formData.append('description', remeraDesc);
      formData.append('is_active', 'true');

      if (remeraImageFile) {
        formData.append('file', remeraImageFile);
      } else if (remeraImageUrl) {
        formData.append('image_url', remeraImageUrl);
      }

      const method = editingRemera ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/remeras', {
        method,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar remera');

      // Limpiar formulario
      setEditingRemera(null);
      setRemeraTitle('');
      setRemeraPrice('28000');
      setRemeraStock('10');
      setRemeraDesc('');
      setRemeraImageUrl('');
      setRemeraImageFile(null);

      await loadData();
      alert('¡Remera guardada con éxito!');
    } catch (err: any) {
      alert(err.message || 'Error al procesar remera');
    } finally {
      setSavingRemera(false);
    }
  };

  const handleEditClick = (r: Remera) => {
    setEditingRemera(r);
    setRemeraTitle(r.title);
    setRemeraCategory(r.category);
    setRemeraCollection(r.collection_name || '');
    setRemeraPrice(String(r.price));
    setRemeraStock(String(r.stock));
    setRemeraSizes(r.sizes || ['S', 'M', 'L', 'XL']);
    setRemeraColors(r.colors || ['Negro', 'Blanco Crudo']);
    setRemeraDesc(r.description || '');
    setRemeraImageUrl(r.image_url || '');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleToggleActiveRemera = async (r: Remera) => {
    try {
      await fetch('/api/admin/remeras', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, is_active: !r.is_active }),
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRemera = async (id: string) => {
    if (!confirm('¿Seguro que deseás eliminar esta remera del catálogo?')) return;
    try {
      await fetch(`/api/admin/remeras?id=${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // CREAR NUEVA COLECCIÓN
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCollectionName,
          bio: newCollectionBio,
          instagram: newCollectionInstagram,
          avatar_url: newCollectionAvatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear colección');

      setShowNewCollectionModal(false);
      setRemeraCollection(newCollectionName);
      setNewCollectionName('');
      setNewCollectionBio('');
      setNewCollectionInstagram('');
      setNewCollectionAvatar('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al crear colección');
    }
  };

  // CREAR CLIENTE ASISTIDO
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingClient(true);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: clientFullName,
          email: clientEmail,
          phone: clientPhone,
          address: clientAddress,
          temp_password: clientTempPass,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar cliente');

      setCreatedClientResult(data);
      setClientFullName('');
      setClientEmail('');
      setClientPhone('');
      setClientAddress('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al registrar cliente');
    } finally {
      setCreatingClient(false);
    }
  };

  // RESETEAR CONTRASEÑA DE CLIENTE
  const handleResetClientPass = async (userId: string) => {
    if (!confirm('¿Deseás resetear la contraseña de este cliente a "123456"?')) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, temp_password: '123456' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.whatsAppLink) {
        window.open(data.whatsAppLink, '_blank');
      } else {
        alert('Contraseña reseteada con éxito a: 123456');
      }
    } catch (err: any) {
      alert(err.message || 'Error al resetear contraseña');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Cabecera del Panel */}
        <div className="bg-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-rose-950">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-rose-900/60 border border-rose-500/30 flex items-center justify-center text-3xl shadow-inner">
              🌹
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-rose-400">
                  Panel de Maris
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
                  Administradora General
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-0.5">
                Mujeres del Tango · Gestión Central
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              title="Refrescar datos"
              className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* MÉTRICAS FINANCIERAS PARA MARIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-stone-600">Recaudación Confirmada</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold font-serif text-stone-900 mt-2">
              {formatCurrency(totalRevenue)}
            </p>
            <span className="text-[11px] text-stone-600 mt-1 block">
              {approvedOrders.length} pedido{approvedOrders.length === 1 ? '' : 's'} aprobado{approvedOrders.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-stone-600">Prendas Vendidas</span>
              <ShoppingBag className="w-4 h-4 text-rose-800" />
            </div>
            <p className="text-2xl font-bold font-serif text-stone-900 mt-2">
              {totalUnitsSold} unidades
            </p>
            <span className="text-[11px] text-stone-600 mt-1 block">
              En el período seleccionado
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-stone-600">Pedidos Pendientes</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold font-serif text-amber-700 mt-2">
              {pendingOrdersCount} por revisar
            </p>
            <span className="text-[11px] text-stone-600 mt-1 block">
              Avisos de pago a conciliar
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-stone-600">Remera Más Elegida</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-stone-900 mt-2 truncate" title={topRemeraTitle}>
              {topRemeraTitle}
            </p>
            <span className="text-[11px] text-stone-600 mt-1 block">
              Homenaje más pedido
            </span>
          </div>
        </div>

        {/* NAVEGACIÓN DE PESTAÑAS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-300">
          <button
            onClick={() => setActiveTab('ventas')}
            className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ventas'
                ? 'bg-rose-900 text-white shadow-md'
                : 'bg-white text-stone-600 hover:bg-stone-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ventas y Pedidos</span>
            {pendingOrdersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-stone-950 font-black">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('remeras')}
            className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'remeras'
                ? 'bg-rose-900 text-white shadow-md'
                : 'bg-white text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Cargar / Gestionar Remeras ({remeras.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clientes')}
            className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'clientes'
                ? 'bg-rose-900 text-white shadow-md'
                : 'bg-white text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes y WhatsApp ({clients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('colecciones')}
            className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'colecciones'
                ? 'bg-rose-900 text-white shadow-md'
                : 'bg-white text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Colecciones y Homenajes ({collections.length})</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PESTAÑA 1: VENTAS Y PEDIDOS POR WHATSAPP */}
        {/* ========================================================================= */}
        {activeTab === 'ventas' && (
          <div className="space-y-6">
            {/* Barra de Filtros de Ventas */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase font-bold text-stone-600">Estado:</span>
                {['todos', 'pending', 'approved', 'delivered', 'rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                      orderStatusFilter === st
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {st === 'pending'
                      ? 'Pendientes'
                      : st === 'approved'
                      ? 'Aprobados'
                      : st === 'delivered'
                      ? 'Entregados'
                      : st === 'rejected'
                      ? 'Rechazados'
                      : 'Todos'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={periodFilter}
                  onChange={(e: any) => setPeriodFilter(e.target.value)}
                  className="py-1.5 px-3 rounded-xl border border-stone-300 text-xs text-stone-800 bg-stone-50"
                >
                  <option value="historico">Histórico Completo</option>
                  <option value="mes_actual">Este Mes</option>
                  <option value="mes_anterior">Mes Anterior</option>
                </select>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Excel / CSV</span>
                </button>
              </div>
            </div>

            {/* Tabla de Pedidos */}
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-100/80 text-[11px] uppercase font-bold text-stone-600 border-b border-stone-200">
                    <tr>
                      <th className="py-3 px-4">Cliente / Contacto</th>
                      <th className="py-3 px-4">Remera & Talle</th>
                      <th className="py-3 px-4">Total & Entrega</th>
                      <th className="py-3 px-4">Comprobante Pago</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acción WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-stone-600">
                          No hay pedidos registrados con estos criterios.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => {
                        const clientName = ord.profile?.full_name || 'Comprador/a';
                        const clientPhone = ord.profile?.phone || '';
                        const remeraTitle = ord.remera?.title || 'Remera Tango';

                        return (
                          <tr key={ord.id} className="hover:bg-stone-50 transition-colors">
                            {/* Cliente */}
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-stone-900 text-sm">{clientName}</p>
                              <p className="text-[11px] text-stone-600">{ord.profile?.email}</p>
                              {clientPhone && (
                                <p className="text-[11px] text-emerald-800 font-mono flex items-center gap-1 mt-0.5">
                                  <span>WA: {clientPhone}</span>
                                </p>
                              )}
                            </td>

                            {/* Prenda */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <img
                                  src={ord.remera?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                                  alt=""
                                  className="w-9 h-11 object-cover rounded-md bg-stone-100 border border-stone-200"
                                />
                                <div>
                                  <p className="font-semibold text-stone-900 leading-tight">{remeraTitle}</p>
                                  <div className="flex items-center gap-2 text-[11px] text-stone-600 mt-0.5">
                                    <span className="font-bold text-rose-800">Talle {ord.selected_size}</span>
                                    {ord.selected_color && <span>({ord.selected_color})</span>}
                                    <span>x{ord.quantity}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Total & Entrega */}
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-stone-900">{formatCurrency(Number(ord.total_price))}</p>
                              <p className="text-[11px] text-stone-600 mt-0.5">
                                {ord.delivery_type === 'envio' ? `Envío: ${ord.shipping_address || 'A convenir'}` : 'Punto de Retiro'}
                              </p>
                              {ord.notes && <p className="text-[10px] text-amber-700 italic mt-0.5">"{ord.notes}"</p>}
                            </td>

                            {/* Comprobante */}
                            <td className="py-3.5 px-4">
                              {ord.payment_notification?.reference_code ? (
                                <span className="px-2 py-1 rounded bg-stone-100 border border-stone-300 font-mono text-[11px] font-bold text-stone-800">
                                  #{ord.payment_notification.reference_code}
                                </span>
                              ) : (
                                <span className="text-[11px] text-stone-600 italic">Sin código</span>
                              )}
                              <p className="text-[10px] text-stone-600 mt-1">
                                {new Date(ord.created_at).toLocaleDateString('es-AR')}
                              </p>
                            </td>

                            {/* Estado */}
                            <td className="py-3.5 px-4">
                              {ord.status === 'approved' && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Aprobado
                                </span>
                              )}
                              {ord.status === 'delivered' && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                  Entregado
                                </span>
                              )}
                              {ord.status === 'pending' && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Pendiente
                                </span>
                              )}
                              {ord.status === 'rejected' && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                  Rechazado
                                </span>
                              )}
                            </td>

                            {/* Acciones */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {ord.status === 'pending' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'approved', ord.remera_id, ord.quantity)}
                                    title="Aprobar pago, descontar stock y avisar por WhatsApp"
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Aprobar & WhatsApp</span>
                                  </button>
                                )}

                                {ord.status === 'approved' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'delivered', ord.remera_id, ord.quantity)}
                                    title="Marcar como entregado y avisar"
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors"
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                    <span>Entregar</span>
                                  </button>
                                )}

                                {ord.status !== 'rejected' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'rejected', ord.remera_id, ord.quantity)}
                                    title="Rechazar pago"
                                    className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-700 transition-colors"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 2: CARGAR Y GESTIONAR REMERAS */}
        {/* ========================================================================= */}
        {activeTab === 'remeras' && (
          <div className="space-y-8">
            {/* Formulario de Alta / Edición de Remera */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-200">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                    {editingRemera ? 'Editar Remera' : 'Cargar Nueva Remera al Catálogo'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Definí título, medidas, precio, talle, stock y foto de la prenda.
                  </p>
                </div>
                {editingRemera && (
                  <button
                    onClick={() => {
                      setEditingRemera(null);
                      setRemeraTitle('');
                      setRemeraPrice('28000');
                    }}
                    className="text-xs text-rose-800 font-semibold hover:underline"
                  >
                    Cancelar Edición
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveRemera} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Título */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Nombre de la Remera / Modelo <span className="text-rose-600">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Remera Ada Falcón - Misterio & Pasión"
                      value={remeraTitle}
                      onChange={(e) => setRemeraTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                    />
                  </div>

                  {/* Categoría con Datalist y Chips rápidos */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Categoría:
                    </label>
                    <input
                      type="text"
                      list="categories-list"
                      placeholder="Ej: Corte Clásico"
                      value={remeraCategory}
                      onChange={(e) => setRemeraCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                    />
                    <datalist id="categories-list">
                      {quickCategories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {quickCategories.map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setRemeraCategory(c)}
                          className="px-2 py-0.5 rounded text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colección / Homenaje */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                        Colección / Homenaje:
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNewCollectionModal(true)}
                        className="text-[11px] text-rose-800 font-bold hover:underline"
                      >
                        + Nueva Colección...
                      </button>
                    </div>
                    <select
                      value={remeraCollection}
                      onChange={(e) => setRemeraCollection(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900 bg-white"
                    >
                      <option value="">(Sin colección asignada)</option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Precio y Stock */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Precio ($ ARS) <span className="text-rose-600">*</span>:
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="100"
                      value={remeraPrice}
                      onChange={(e) => setRemeraPrice(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Stock Disponible (unidades) <span className="text-rose-600">*</span>:
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={remeraStock}
                      onChange={(e) => setRemeraStock(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                    />
                  </div>

                  {/* Talles Disponibles (Botones interactivos) */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                      Talles Habilitados:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allSizes.map((sz) => {
                        const isSelected = remeraSizes.includes(sz);
                        return (
                          <button
                            type="button"
                            key={sz}
                            onClick={() => {
                              if (isSelected) {
                                setRemeraSizes(remeraSizes.filter((s) => s !== sz));
                              } else {
                                setRemeraSizes([...remeraSizes, sz]);
                              }
                            }}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-rose-900 text-white shadow-xs'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''} Talle {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Colores Disponibles */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                      Colores Disponibles:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allColors.map((col) => {
                        const isSelected = remeraColors.includes(col);
                        return (
                          <button
                            type="button"
                            key={col}
                            onClick={() => {
                              if (isSelected) {
                                setRemeraColors(remeraColors.filter((c) => c !== col));
                              } else {
                                setRemeraColors([...remeraColors, col]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-stone-900 text-white shadow-xs'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''} {col}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Foto de la Remera (Subida a Supabase Storage o URL) */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                        Subir Archivo de Foto (Storage):
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setRemeraImageFile(e.target.files[0]);
                          }
                        }}
                        className="w-full text-xs text-stone-700 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-900 file:text-white hover:file:bg-rose-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                        O bien pegar URL de imagen:
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={remeraImageUrl}
                        onChange={(e) => setRemeraImageUrl(e.target.value)}
                        className="w-full p-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Descripción y Medidas */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                      Descripción de Confección & Medidas en cm:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="100% Algodón peinado 24/1. Talle S: 50cm ancho x 68cm largo..."
                      value={remeraDesc}
                      onChange={(e) => setRemeraDesc(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingRemera}
                    className="py-3 px-8 rounded-xl bg-rose-900 hover:bg-rose-800 disabled:bg-stone-400 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2"
                  >
                    {savingRemera ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>{editingRemera ? 'Actualizar Remera' : 'Publicar Remera'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Grilla de Gestión de Remeras Existentes */}
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Inventario de Remeras ({remeras.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {remeras.map((rem) => (
                  <div
                    key={rem.id}
                    className={`bg-white rounded-2xl overflow-hidden border transition-all ${
                      rem.is_active ? 'border-stone-200 shadow-sm' : 'border-stone-300 opacity-60 bg-stone-50'
                    }`}
                  >
                    <div className="relative h-48 bg-stone-100">
                      <img
                        src={rem.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-stone-900/90 text-white">
                          {formatCurrency(Number(rem.price))}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-900/80 text-stone-200">
                          Stock: {rem.stock} u.
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        {rem.collection_name && (
                          <p className="text-[10px] font-bold uppercase text-rose-800">
                            {rem.collection_name}
                          </p>
                        )}
                        <h4 className="font-bold text-stone-900 text-sm leading-tight">{rem.title}</h4>
                        <p className="text-[11px] text-stone-600 mt-1">Talles: {rem.sizes?.join(', ')}</p>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                        <button
                          onClick={() => handleToggleActiveRemera(rem)}
                          className={`text-xs font-semibold flex items-center gap-1 ${
                            rem.is_active ? 'text-emerald-700' : 'text-stone-500'
                          }`}
                        >
                          {rem.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{rem.is_active ? 'Activa' : 'Pausada'}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditClick(rem)}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                            title="Editar remera"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRemera(rem.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                            title="Eliminar remera"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 3: CLIENTES Y GESTIÓN POR WHATSAPP */}
        {/* ========================================================================= */}
        {activeTab === 'clientes' && (
          <div className="space-y-8">
            {/* Formulario de Creación Asistida */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200">
              <div className="pb-4 mb-6 border-b border-stone-200">
                <span className="text-[10px] uppercase font-bold tracking-widest text-rose-800">
                  Modelo Maris / WhatsApp
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
                  Alta Asistida de Compradora
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Maris crea la cuenta del cliente con clave provisoria ("123456") y le envía las credenciales listas por WhatsApp en 1 clic.
                </p>
              </div>

              {createdClientResult && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>¡Cuenta creada con éxito para {createdClientResult.user?.full_name}!</span>
                  </div>
                  <div className="text-xs text-stone-700 bg-white p-3 rounded-xl border border-emerald-100 space-y-1">
                    <p><strong>Email de acceso:</strong> {createdClientResult.user?.email}</p>
                    <p><strong>Contraseña temporal:</strong> {createdClientResult.tempPassword}</p>
                  </div>
                  {createdClientResult.whatsAppLink && (
                    <a
                      href={createdClientResult.whatsAppLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp - Enviar Credenciales</span>
                    </a>
                  )}
                </div>
              )}

              <form onSubmit={handleCreateClient} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Nombre Completo <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Laura Martínez"
                    value={clientFullName}
                    onChange={(e) => setClientFullName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    WhatsApp / Celular <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 11 4050 6070"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Correo Electrónico (opcional, se autogenera si está vacío):
                  </label>
                  <input
                    type="email"
                    placeholder="laura.martinez@mujeresdeltango.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Dirección por defecto para envíos:
                  </label>
                  <input
                    type="text"
                    placeholder="Av. Corrientes 1500, CABA"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={creatingClient}
                    className="py-3 px-6 rounded-xl bg-rose-900 hover:bg-rose-800 disabled:bg-stone-400 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2"
                  >
                    {creatingClient ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        <span>Crear Cuenta & Preparar WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Listado de Clientes Registrados */}
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="p-4 border-b border-stone-200 flex items-center justify-between gap-4">
                <h4 className="font-serif font-bold text-stone-900 text-lg">
                  Directorio de Clientes ({clients.length})
                </h4>
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-100 text-[11px] uppercase font-bold text-stone-600 border-b border-stone-200">
                    <tr>
                      <th className="py-3 px-4">Nombre</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">WhatsApp</th>
                      <th className="py-3 px-4">Dirección</th>
                      <th className="py-3 px-4">Rol / Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {clients
                      .filter(
                        (c) =>
                          !searchClient ||
                          c.full_name?.toLowerCase().includes(searchClient.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchClient.toLowerCase()) ||
                          c.phone?.includes(searchClient)
                      )
                      .map((c) => {
                        const whatsAppDirect = c.phone
                          ? buildWhatsAppLink(
                              c.phone,
                              `¡Hola ${c.full_name}! Te saluda Maris de Mujeres del Tango 🌹 ¿Cómo estás?`
                            )
                          : null;

                        return (
                          <tr key={c.id} className="hover:bg-stone-50">
                            <td className="py-3 px-4 font-bold text-stone-900">{c.full_name || 'Sin nombre'}</td>
                            <td className="py-3 px-4">{c.email}</td>
                            <td className="py-3 px-4 font-mono">{c.phone || '-'}</td>
                            <td className="py-3 px-4 max-w-[200px] truncate">{c.address || '-'}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  c.role === 'admin'
                                    ? 'bg-rose-100 text-rose-900'
                                    : 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {c.role}
                              </span>
                              {c.must_change_password && (
                                <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800">
                                  Clave provisoria
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {whatsAppDirect && (
                                  <a
                                    href={whatsAppDirect}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    title="Chatear por WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleResetClientPass(c.id)}
                                  className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium"
                                  title="Resetear clave a 123456"
                                >
                                  Reset Clave
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 4: COLECCIONES Y HOMENAJES */}
        {/* ========================================================================= */}
        {activeTab === 'colecciones' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                  Homenajes & Colecciones de Grandes Mujeres
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Tita Merello, Eladia Blázquez, Ada Falcón, Nelly Omar y más figuras de nuestra cultura.
                </p>
              </div>

              <button
                onClick={() => setShowNewCollectionModal(true)}
                className="px-4 py-2 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Homenaje</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((coll) => {
                const count = remeras.filter((r) => r.collection_name === coll.name).length;

                return (
                  <div
                    key={coll.id}
                    className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm flex flex-col justify-between"
                  >
                    <div className="relative h-44 bg-stone-900">
                      <img
                        src={coll.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}
                        alt={coll.name}
                        className="w-full h-full object-cover opacity-85"
                      />
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-rose-300">
                          {count} remera{count === 1 ? '' : 's'} en catálogo
                        </span>
                        <h4 className="font-serif font-bold text-lg leading-tight mt-0.5 drop-shadow">
                          {coll.name}
                        </h4>
                      </div>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                        {coll.bio || 'Homenaje a una destacada mujer del tango.'}
                      </p>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                        <span>{coll.instagram || '@mujeresdeltango'}</span>
                        <button
                          onClick={async () => {
                            if (!confirm(`¿Eliminar la colección "${coll.name}"?`)) return;
                            await fetch(`/api/admin/collections?id=${coll.id}`, { method: 'DELETE' });
                            await loadData();
                          }}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded"
                          title="Eliminar homenaje"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODAL NUEVA COLECCIÓN */}
        {showNewCollectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h4 className="font-serif font-bold text-stone-900 text-lg">
                  Agregar Nueva Colección / Homenaje
                </h4>
                <button
                  onClick={() => setShowNewCollectionModal(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCollection} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Nombre de la Artista / Colección <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Virginia Luque - La Estrella Porteña"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Semblanza o Biografía Breve:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Reseña histórica del legado de la artista..."
                    value={newCollectionBio}
                    onChange={(e) => setNewCollectionBio(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Instagram o Redes:
                  </label>
                  <input
                    type="text"
                    placeholder="@mujeresdeltango"
                    value={newCollectionInstagram}
                    onChange={(e) => setNewCollectionInstagram(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    URL de Foto de la Artista:
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newCollectionAvatar}
                    onChange={(e) => setNewCollectionAvatar(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewCollectionModal(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Guardar Homenaje
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
