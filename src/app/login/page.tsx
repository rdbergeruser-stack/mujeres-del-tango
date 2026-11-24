'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usernameToInternalEmail, formatDetailedAddress, getEmptyAddress, AddressData } from '@/lib/utils';
import AddressForm from '@/components/AddressForm';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get('redirect') || '/';

  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Campos Login (Usuario y Contraseña)
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Campos Registro (Usuario, Nombre, WhatsApp, Dirección y Contraseña)
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddressData, setRegAddressData] = useState<AddressData>(getEmptyAddress());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const cleanUser = loginUser.trim().toLowerCase();
      const internalEmail = usernameToInternalEmail(cleanUser);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: internalEmail,
        password: loginPassword,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Usuario o contraseña incorrectos.');
        }
        throw error;
      }

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
      setErrorMessage(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const cleanUser = regUsername.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
      const formattedAddress = formatDetailedAddress(regAddressData);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: regFullName,
          username: cleanUser,
          password: regPassword,
          phone: regPhone,
          address: formattedAddress,
          detailed_address: regAddressData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear la cuenta');

      // Inicio de sesión directo con el email interno
      const internalEmail = usernameToInternalEmail(cleanUser);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: internalEmail,
        password: regPassword,
      });

      if (signInError) {
        alert('Cuenta creada exitosamente. Por favor iniciá sesión con tu usuario y contraseña.');
        setActiveTab('login');
        setLoginUser(cleanUser);
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
    <div className="max-w-md w-full bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden text-zinc-100">
      {/* Header con Logo Oficial */}
      <div className="bg-zinc-950 p-6 text-center border-b border-zinc-800">
        <img
          src="/images/logo-horizontal.png"
          alt="Mujeres del Tango"
          className="h-14 mx-auto object-contain drop-shadow-[0_2px_15px_rgba(255,0,255,0.3)] mb-2"
        />
        <p className="text-xs text-zinc-400">
          Acceso a la Tienda Oficial
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 text-xs font-semibold bg-zinc-950/50">
        <button
          onClick={() => {
            setActiveTab('login');
            setErrorMessage(null);
          }}
          className={`flex-1 py-3 text-center transition-colors ${
            activeTab === 'login'
              ? 'text-white border-b-2 border-[#199DD0] bg-zinc-900 font-bold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          onClick={() => {
            setActiveTab('register');
            setErrorMessage(null);
          }}
          className={`flex-1 py-3 text-center transition-colors ${
            activeTab === 'register'
              ? 'text-white border-b-2 border-[#FF00FF] bg-zinc-900 font-bold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Crear Cuenta
        </button>
      </div>

      <div className="p-6">
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Usuario
              </label>
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="Tu usuario"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#199DD0]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#199DD0]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#199DD0] hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs transition-opacity flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,0,255,0.3)]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Ingresar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nombre Completo <span className="text-[#FF00FF]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nombre y apellido"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF00FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nombre de Usuario <span className="text-[#FF00FF]">*</span>
              </label>
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="Elegí tu nombre de usuario"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-[#FF00FF]"
              />
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                Será tu nombre para ingresar al sitio (sin correos ni spam).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                WhatsApp / Teléfono
              </label>
              <input
                type="tel"
                placeholder="Ej: 11 2345 6789"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF00FF]"
              />
            </div>

            {/* Formulario Detallado de Dirección */}
            <div>
              <AddressForm
                value={regAddressData}
                onChange={setRegAddressData}
                compact
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Contraseña (mínimo 6 caracteres) <span className="text-[#FF00FF]">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF00FF]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#199DD0] hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs transition-opacity flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,0,255,0.3)]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Crear Cuenta</span>
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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-zinc-500 text-xs">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
