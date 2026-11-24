'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get('redirect') || '/';

  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Campos Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Campos Registro
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('tango_profiles')
          .select('role, must_change_password')
          .eq('id', data.user.id)
          .single();

        if ((profile as any)?.must_change_password) {
          router.push('/cambiar-clave');
          return;
        }

        if ((profile as any)?.role === 'admin' || data.user.email?.toLowerCase().includes('maris')) {
          router.push('/admin');
        } else {
          router.push(redirectPath);
        }
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión. Verificá tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: regFullName,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          address: regAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear la cuenta');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: regEmail.trim(),
        password: regPassword,
      });

      if (signInError) {
        alert('Cuenta creada exitosamente. Por favor iniciá sesión.');
        setActiveTab('login');
      } else {
        router.push(redirectPath);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
      {/* Cabecera */}
      <div className="bg-gradient-to-br from-stone-900 to-rose-950 p-8 text-center text-white relative">
        <span className="w-12 h-12 rounded-full bg-rose-900/50 border border-rose-500/30 flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner">
          🌹
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
          Mujeres del Tango
        </h2>
        <p className="text-xs text-rose-300 mt-1 uppercase tracking-widest font-sans">
          Acceso a la Tienda & Compras
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 text-sm font-semibold">
        <button
          onClick={() => {
            setActiveTab('login');
            setErrorMessage(null);
          }}
          className={`flex-1 py-3.5 text-center transition-colors ${
            activeTab === 'login'
              ? 'text-rose-900 border-b-2 border-rose-900 bg-rose-50/30'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          onClick={() => {
            setActiveTab('register');
            setErrorMessage(null);
          }}
          className={`flex-1 py-3.5 text-center transition-colors ${
            activeTab === 'register'
              ? 'text-rose-900 border-b-2 border-rose-900 bg-rose-50/30'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Crear Cuenta
        </button>
      </div>

      <div className="p-8">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
            <span>{errorMessage}</span>
          </div>
        )}

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-rose-900 hover:bg-rose-800 disabled:bg-stone-400 text-white font-semibold text-sm shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Ingresar</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-xs text-stone-600 pt-3">
              ¿Maris te creó una cuenta por WhatsApp? Ingresá con el correo y contraseña provisoria recibidos.
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Nombre Completo <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Tu nombre y apellido"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Correo Electrónico <span className="text-rose-600">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="tu@correo.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                WhatsApp / Teléfono
              </label>
              <input
                type="tel"
                placeholder="Ej: 11 2345 6789"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Dirección para Envíos
              </label>
              <input
                type="text"
                placeholder="Calle, número, depto, ciudad"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Contraseña (mínimo 6 caracteres) <span className="text-rose-600">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-900"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-rose-900 hover:bg-rose-800 disabled:bg-stone-400 text-white font-semibold text-sm shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Crear mi Cuenta</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-stone-600 text-sm">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
