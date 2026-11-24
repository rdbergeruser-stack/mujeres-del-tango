'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Remera, Collection, Profile } from '@/types/database';
import { formatCurrency, buildWhatsAppLink, extractUsername } from '@/lib/utils';
import {
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
  X
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
  const [clientUsername, setClientUsername] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientTempPass, setClientTempPass] = useState('123456');
  const [createdClientResult, setCreatedClientResult] = useState<any>(null);
  const [creatingClient, setCreatingClient] = useState(false);

  // Edición de Cliente
  const [editingClient, setEditingClient] = useState<Profile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [savingClientEdit, setSavingClientEdit] = useState(false);

  // Búsqueda en tablas
  const [searchClient, setSearchClient] = useState('');

  const quickCategories = ['Oversize', 'Corte Clásico', 'Edición Especial', 'Musculosas'];
  const allSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const allColors = ['Negro', 'Blanco Crudo', 'Bordó', 'Gris Melange', 'Azul Noche'];

  const loadData = async () => {
    try {
      setLoading(true);

      const resOrders = await fetch('/api/admin/orders');
      const dataOrders = await resOrders.json();
      if (dataOrders.orders) setOrders(dataOrders.orders);

      const resRemeras = await fetch('/api/admin/remeras');
      const dataRemeras = await resRemeras.json();
      if (dataRemeras.remeras) setRemeras(dataRemeras.remeras);

      const resColl = await fetch('/api/admin/collections');
      const dataColl = await resColl.json();
      if (dataColl.collections) setCollections(dataColl.collections);

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

  // FILTRADO DE ÓRDENES
  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = orderStatusFilter === 'todos' || ord.status === orderStatusFilter;

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

  const approvedOrders = filteredOrders.filter((o) => o.status === 'approved' || o.status === 'delivered');
  const totalRevenue = approvedOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  const totalUnitsSold = approvedOrders.reduce((sum, o) => sum + Number(o.quantity || 1), 0);
  const pendingOrdersCount = filteredOrders.filter((o) => o.status === 'pending').length;

  const salesCountByRemera: { [title: string]: number } = {};
  approvedOrders.forEach((o) => {
    const title = o.remera?.title || 'Remera';
    salesCountByRemera[title] = (salesCountByRemera[title] || 0) + Number(o.quantity || 1);
  });
  const topRemeraEntry = Object.entries(salesCountByRemera).sort((a, b) => b[1] - a[1])[0];
  const topRemeraTitle = topRemeraEntry ? `${topRemeraEntry[0]} (${topRemeraEntry[1]} u.)` : 'Sin ventas aún';

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No hay ventas para exportar en este período.');
      return;
    }

    const headers = ['ID Pedido', 'Fecha', 'Cliente', 'WhatsApp', 'Usuario', 'Remera', 'Talle', 'Color', 'Cantidad', 'Total ARS', 'Entrega', 'Dirección', 'Estado', 'Comprobante'];
    const rows = filteredOrders.map((o) => [
      o.id,
      new Date(o.created_at).toISOString().split('T')[0],
      `"${o.profile?.full_name || ''}"`,
      `"${o.profile?.phone || ''}"`,
      `"${extractUsername(o.profile?.email)}"`,
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
    link.setAttribute('download', `ventas-${periodFilter}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, currentRemeraId: string, quantity: number) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus, currentRemeraId, quantity }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar pedido');

      if (data.whatsAppLink) {
        window.open(data.whatsAppLink, '_blank');
      }

      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar pedido');
    }
  };

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

      setEditingRemera(null);
      setRemeraTitle('');
      setRemeraPrice('28000');
      setRemeraStock('10');
      setRemeraDesc('');
      setRemeraImageUrl('');
      setRemeraImageFile(null);

      await loadData();
      alert('Remera guardada con éxito');
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
    window.scrollTo({ top: 350, behavior: 'smooth' });
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
    if (!confirm('¿Seguro que deseás eliminar esta remera?')) return;
    try {
      await fetch(`/api/admin/remeras?id=${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingClient(true);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: clientFullName,
          username: clientUsername,
          phone: clientPhone,
          address: clientAddress,
          temp_password: clientTempPass,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar cliente');

      setCreatedClientResult(data);
      setClientFullName('');
      setClientUsername('');
      setClientPhone('');
      setClientAddress('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al registrar cliente');
    } finally {
      setCreatingClient(false);
    }
  };

  const handleOpenEditClient = (c: Profile) => {
    setEditingClient(c);
    setEditFullName(c.full_name || '');
    setEditUsername(extractUsername(c.email));
    setEditPhone(c.phone || '');
    setEditAddress(c.address || '');
  };

  const handleSaveClientEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      setSavingClientEdit(true);
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingClient.id,
          full_name: editFullName,
          username: editUsername,
          phone: editPhone,
          address: editAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar usuario');

      setEditingClient(null);
      await loadData();
      alert('Cliente actualizado con éxito');
    } catch (err: any) {
      alert(err.message || 'Error al actualizar cliente');
    } finally {
      setSavingClientEdit(false);
    }
  };

  const handleDeleteClient = async (userId: string, username: string) => {
    if (!confirm(`¿Estás segura de eliminar permanentemente al usuario "@${username}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario');

      await loadData();
      alert(`Usuario "@${username}" eliminado correctamente.`);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar usuario');
    }
  };

  const handleResetClientPass = async (userId: string) => {
    if (!confirm('¿Resetear contraseña de este cliente a "123456"?')) return;
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
        alert('Contraseña reseteada a: 123456');
      }
    } catch (err: any) {
      alert(err.message || 'Error al resetear contraseña');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabecera */}
        <div className="bg-zinc-900 rounded-xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-zinc-400">
                Panel de Administración
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                Maris
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-1">
              Mujeres del Tango · Gestión
            </h1>
          </div>

          <button
            onClick={loadData}
            title="Refrescar datos"
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* MÉTRICAS FINANCIERAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">Recaudación Confirmada</span>
              <DollarSign className="w-4 h-4 text-zinc-700" />
            </div>
            <p className="text-xl font-bold text-zinc-900 mt-1">
              {formatCurrency(totalRevenue)}
            </p>
            <span className="text-[11px] text-zinc-500 mt-0.5 block">
              {approvedOrders.length} pedido{approvedOrders.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">Prendas Vendidas</span>
              <ShoppingBag className="w-4 h-4 text-zinc-700" />
            </div>
            <p className="text-xl font-bold text-zinc-900 mt-1">
              {totalUnitsSold} unidades
            </p>
            <span className="text-[11px] text-zinc-500 mt-0.5 block">
              En el período seleccionado
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">Pedidos Pendientes</span>
              <Clock className="w-4 h-4 text-zinc-700" />
            </div>
            <p className="text-xl font-bold text-zinc-900 mt-1">
              {pendingOrdersCount}
            </p>
            <span className="text-[11px] text-zinc-500 mt-0.5 block">
              Por conciliar
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">Remera Más Elegida</span>
              <TrendingUp className="w-4 h-4 text-zinc-700" />
            </div>
            <p className="text-xs font-bold text-zinc-900 mt-1 truncate" title={topRemeraTitle}>
              {topRemeraTitle}
            </p>
            <span className="text-[11px] text-zinc-500 mt-0.5 block">
              Prenda destacada
            </span>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-200">
          <button
            onClick={() => setActiveTab('ventas')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ventas'
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Ventas y Pedidos</span>
            {pendingOrdersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-zinc-200 text-zinc-900 font-bold">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('remeras')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'remeras'
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Remeras ({remeras.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clientes')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'clientes'
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Directorio de Clientes ({clients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('colecciones')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'colecciones'
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Colecciones ({collections.length})</span>
          </button>
        </div>

        {/* TAB 1: VENTAS */}
        {activeTab === 'ventas' && (
          <div className="space-y-4">
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-500">Estado:</span>
                {['todos', 'pending', 'approved', 'delivered', 'rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-2.5 py-1 rounded text-xs font-medium capitalize ${
                      orderStatusFilter === st
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
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

              <div className="flex items-center gap-2">
                <select
                  value={periodFilter}
                  onChange={(e: any) => setPeriodFilter(e.target.value)}
                  className="py-1 px-2.5 rounded-lg border border-zinc-300 text-xs text-zinc-800 bg-white"
                >
                  <option value="historico">Histórico Completo</option>
                  <option value="mes_actual">Este Mes</option>
                  <option value="mes_anterior">Mes Anterior</option>
                </select>

                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-700">
                  <thead className="bg-zinc-50 text-[11px] uppercase font-bold text-zinc-500 border-b border-zinc-200">
                    <tr>
                      <th className="py-2.5 px-3">Cliente</th>
                      <th className="py-2.5 px-3">Remera & Talle</th>
                      <th className="py-2.5 px-3">Total & Entrega</th>
                      <th className="py-2.5 px-3">Comprobante</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500">
                          No hay pedidos registrados en este filtro.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => {
                        const clientName = ord.profile?.full_name || 'Comprador/a';
                        const clientPhone = ord.profile?.phone || '';
                        const remeraTitle = ord.remera?.title || 'Remera';

                        return (
                          <tr key={ord.id} className="hover:bg-zinc-50">
                            <td className="py-3 px-3">
                              <p className="font-bold text-zinc-900">{clientName}</p>
                              <p className="text-[11px] text-zinc-500 font-mono">@{extractUsername(ord.profile?.email)}</p>
                              {clientPhone && <p className="text-[10px] text-zinc-400">Tel: {clientPhone}</p>}
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={ord.remera?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                                  alt=""
                                  className="w-8 h-10 object-cover rounded bg-zinc-100"
                                />
                                <div>
                                  <p className="font-semibold text-zinc-900">{remeraTitle}</p>
                                  <p className="text-[11px] text-zinc-500">
                                    Talle {ord.selected_size} {ord.selected_color ? `(${ord.selected_color})` : ''} x{ord.quantity}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <p className="font-bold text-zinc-900">{formatCurrency(Number(ord.total_price))}</p>
                              <p className="text-[10px] text-zinc-500">
                                {ord.delivery_type === 'envio' ? `Envío: ${ord.shipping_address || 'A convenir'}` : 'Retiro'}
                              </p>
                            </td>

                            <td className="py-3 px-3">
                              {ord.payment_notification?.reference_code ? (
                                <span className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-[11px] font-bold text-zinc-800">
                                  #{ord.payment_notification.reference_code}
                                </span>
                              ) : (
                                <span className="text-zinc-400 italic text-[11px]">Sin código</span>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-800">
                                {ord.status}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {ord.status === 'pending' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'approved', ord.remera_id, ord.quantity)}
                                    title="Aprobar y abrir WhatsApp"
                                    className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Aprobar & WA</span>
                                  </button>
                                )}

                                {ord.status === 'approved' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'delivered', ord.remera_id, ord.quantity)}
                                    className="px-2.5 py-1 rounded bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-medium flex items-center gap-1"
                                  >
                                    <Truck className="w-3 h-3" />
                                    <span>Entregar</span>
                                  </button>
                                )}

                                {ord.status !== 'rejected' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'rejected', ord.remera_id, ord.quantity)}
                                    className="p-1 rounded text-zinc-400 hover:text-red-600"
                                    title="Rechazar"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
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

        {/* TAB 2: REMERAS */}
        {activeTab === 'remeras' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-5 border border-zinc-200">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200">
                <h3 className="text-base font-bold text-zinc-900">
                  {editingRemera ? 'Editar Remera' : 'Cargar Nueva Remera'}
                </h3>
                {editingRemera && (
                  <button
                    onClick={() => {
                      setEditingRemera(null);
                      setRemeraTitle('');
                      setRemeraPrice('28000');
                    }}
                    className="text-xs text-zinc-500 hover:underline"
                  >
                    Cancelar Edición
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveRemera} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Nombre / Modelo:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Remera Tita Merello - Clásica"
                      value={remeraTitle}
                      onChange={(e) => setRemeraTitle(e.target.value)}
                      className="w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Categoría:
                    </label>
                    <input
                      type="text"
                      list="cat-list"
                      placeholder="Corte Clásico"
                      value={remeraCategory}
                      onChange={(e) => setRemeraCategory(e.target.value)}
                      className="w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                    <datalist id="cat-list">
                      {quickCategories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-zinc-700">Colección:</label>
                      <button
                        type="button"
                        onClick={() => setShowNewCollectionModal(true)}
                        className="text-[11px] text-zinc-600 hover:underline"
                      >
                        + Nueva...
                      </button>
                    </div>
                    <select
                      value={remeraCollection}
                      onChange={(e) => setRemeraCollection(e.target.value)}
                      className="w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900 bg-white"
                    >
                      <option value="">(Sin colección)</option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Precio ($ ARS):</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="100"
                      value={remeraPrice}
                      onChange={(e) => setRemeraPrice(e.target.value)}
                      className="w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Stock (unidades):</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={remeraStock}
                      onChange={(e) => setRemeraStock(e.target.value)}
                      className="w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Talles Habilitados:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {allSizes.map((sz) => {
                        const isSelected = remeraSizes.includes(sz);
                        return (
                          <button
                            type="button"
                            key={sz}
                            onClick={() => {
                              if (isSelected) setRemeraSizes(remeraSizes.filter((s) => s !== sz));
                              else setRemeraSizes([...remeraSizes, sz]);
                            }}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              isSelected
                                ? 'bg-zinc-900 text-white'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                            }`}
                          >
                            Talle {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Subir Archivo de Foto:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setRemeraImageFile(e.target.files[0]);
                          }
                        }}
                        className="w-full text-xs text-zinc-700 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-zinc-900 file:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">O pegar URL de imagen:</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={remeraImageUrl}
                        onChange={(e) => setRemeraImageUrl(e.target.value)}
                        className="w-full p-1.5 rounded border border-zinc-300 text-xs text-zinc-900"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Descripción:</label>
                    <textarea
                      rows={2}
                      placeholder="Composición, corte y medidas en cm..."
                      value={remeraDesc}
                      onChange={(e) => setRemeraDesc(e.target.value)}
                      className="w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingRemera}
                    className="py-2 px-5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-medium text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingRemera ? 'Actualizar' : 'Guardar Remera'}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {remeras.map((rem) => (
                <div
                  key={rem.id}
                  className={`bg-white rounded-xl overflow-hidden border ${
                    rem.is_active ? 'border-zinc-200' : 'border-zinc-300 opacity-60'
                  }`}
                >
                  <div className="relative h-44 bg-zinc-100">
                    <img
                      src={rem.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-zinc-900 text-white">
                        {formatCurrency(Number(rem.price))}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-white text-zinc-800 font-medium">
                        Stock: {rem.stock} u.
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2">
                    <div>
                      <h4 className="font-bold text-zinc-900 text-xs leading-tight">{rem.title}</h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Talles: {rem.sizes?.join(', ')}</p>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleActiveRemera(rem)}
                        className={`text-xs font-medium flex items-center gap-1 ${
                          rem.is_active ? 'text-zinc-800' : 'text-zinc-400'
                        }`}
                      >
                        {rem.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{rem.is_active ? 'Activa' : 'Pausada'}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditClick(rem)}
                          className="p-1 rounded text-zinc-500 hover:text-zinc-900"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRemera(rem.id)}
                          className="p-1 rounded text-zinc-400 hover:text-red-600"
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
        )}

        {/* TAB 3: CLIENTES Y DIRECTORIO */}
        {activeTab === 'clientes' && (
          <div className="space-y-6">
            {/* Formulario Alta */}
            <div className="bg-white rounded-xl p-5 border border-zinc-200">
              <h3 className="text-base font-bold text-zinc-900 mb-1">
                Alta Asistida de Comprador/a
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                Creá la cuenta con clave temporal "123456" y enviá los datos por WhatsApp.
              </p>

              {createdClientResult && (
                <div className="mb-4 p-3 rounded-lg bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 space-y-2">
                  <p><strong>Usuario creado:</strong> {createdClientResult.user?.username}</p>
                  <p><strong>Clave provisoria:</strong> {createdClientResult.tempPassword}</p>
                  {createdClientResult.whatsAppLink && (
                    <a
                      href={createdClientResult.whatsAppLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 text-white font-medium"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp - Enviar Credenciales</span>
                    </a>
                  )}
                </div>
              )}

              <form onSubmit={handleCreateClient} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    required
                    placeholder="Laura Martínez"
                    value={clientFullName}
                    onChange={(e) => setClientFullName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Usuario (opcional, se autogenera):</label>
                  <input
                    type="text"
                    placeholder="laura o laura.martinez"
                    value={clientUsername}
                    onChange={(e) => setClientUsername(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">WhatsApp / Tel:</label>
                  <input
                    type="tel"
                    required
                    placeholder="11 4050 6070"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Dirección de entrega:</label>
                  <input
                    type="text"
                    placeholder="Calle, número, ciudad"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={creatingClient}
                    className="py-2 px-5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-medium text-xs flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Crear Cuenta & WhatsApp</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Directorio de Clientes con Edición y Eliminación */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="p-3 border-b border-zinc-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm">Directorio de Clientes ({clients.length})</h4>
                  <p className="text-[11px] text-zinc-500">Editá datos personales o eliminá usuarios del sistema.</p>
                </div>
                <div className="relative w-56">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 rounded border border-zinc-300 text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-700">
                  <thead className="bg-zinc-50 text-[11px] uppercase font-bold text-zinc-500 border-b border-zinc-200">
                    <tr>
                      <th className="py-2.5 px-3">Nombre</th>
                      <th className="py-2.5 px-3">Usuario</th>
                      <th className="py-2.5 px-3">WhatsApp</th>
                      <th className="py-2.5 px-3">Dirección</th>
                      <th className="py-2.5 px-3">Rol</th>
                      <th className="py-2.5 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {clients
                      .filter(
                        (c) =>
                          !searchClient ||
                          c.full_name?.toLowerCase().includes(searchClient.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchClient.toLowerCase()) ||
                          c.phone?.includes(searchClient)
                      )
                      .map((c) => {
                        const username = extractUsername(c.email);
                        const whatsAppDirect = c.phone
                          ? buildWhatsAppLink(
                              c.phone,
                              `Hola ${c.full_name}, te saluda Maris de Mujeres del Tango.`
                            )
                          : null;

                        return (
                          <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-zinc-900">{c.full_name || 'Sin nombre'}</td>
                            <td className="py-2.5 px-3 font-mono text-zinc-600">@{username}</td>
                            <td className="py-2.5 px-3 font-mono">{c.phone || '-'}</td>
                            <td className="py-2.5 px-3 max-w-[180px] truncate text-zinc-500">{c.address || '-'}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  c.role === 'admin' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700'
                                }`}
                              >
                                {c.role}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {whatsAppDirect && (
                                  <a
                                    href={whatsAppDirect}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
                                    title="Contactar por WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                )}

                                <button
                                  onClick={() => handleOpenEditClient(c)}
                                  className="p-1.5 rounded hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
                                  title="Editar cliente"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleResetClientPass(c.id)}
                                  className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px]"
                                  title="Resetear clave a 123456"
                                >
                                  Reset
                                </button>

                                <button
                                  onClick={() => handleDeleteClient(c.id, username)}
                                  className="p-1.5 rounded hover:bg-red-50 text-zinc-400 hover:text-red-600"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

        {/* MODAL EDITAR CLIENTE */}
        {editingClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <h4 className="font-bold text-zinc-900 text-sm">
                  Editar Datos de Cliente (@{extractUsername(editingClient.email)})
                </h4>
                <button onClick={() => setEditingClient(null)}>
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              <form onSubmit={handleSaveClientEdit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Usuario (para iniciar sesión):</label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">WhatsApp / Teléfono:</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Dirección de entrega:</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-300 text-xs text-zinc-900"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingClient(null)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-700 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingClientEdit}
                    className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium"
                  >
                    {savingClientEdit ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: COLECCIONES */}
        {activeTab === 'colecciones' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 text-base">Colecciones & Homenajes</h3>
              <button
                onClick={() => setShowNewCollectionModal(true)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Colección</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((coll) => (
                <div key={coll.id} className="bg-white rounded-xl overflow-hidden border border-zinc-200 p-4 space-y-2">
                  <h4 className="font-bold text-zinc-900 text-sm">{coll.name}</h4>
                  <p className="text-xs text-zinc-500 line-clamp-3">{coll.bio || 'Semblanza de la figura homenajeadas.'}</p>
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                    <span>{coll.instagram || '@mujeresdeltango'}</span>
                    <button
                      onClick={async () => {
                        if (!confirm(`¿Eliminar colección "${coll.name}"?`)) return;
                        await fetch(`/api/admin/collections?id=${coll.id}`, { method: 'DELETE' });
                        await loadData();
                      }}
                      className="text-zinc-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL NUEVA COLECCIÓN */}
        {showNewCollectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <h4 className="font-bold text-zinc-900 text-sm">Agregar Nueva Colección</h4>
                <button onClick={() => setShowNewCollectionModal(false)}>
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              <form onSubmit={handleCreateCollection} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nombre:</label>
                  <input
                    type="text"
                    required
                    placeholder="Virginia Luque"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Semblanza:</label>
                  <textarea
                    rows={2}
                    placeholder="Reseña breve..."
                    value={newCollectionBio}
                    onChange={(e) => setNewCollectionBio(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-300 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewCollectionModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-700 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium"
                  >
                    Guardar
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
