'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usernameToInternalEmail } from '@/lib/utils';
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
  const [regAddress, setRegAddress] = useState('');

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

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: regFullName,
          username: cleanUser,
          password: regPassword,
          phone: regPhone,
          address: regAddress,
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
    <div className="max-w-md w-full bg-white rounded-xl shadow-xs border border-zinc-200 overflow-hidden">
      <div className="bg-zinc-900 p-6 text-center text-white">
        <h2 className="text-xl font-bold tracking-tight">
          Mujeres del Tango
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Ingreso a la Tienda
        </p>
      </div>

      <div className="flex border-b border-zinc-200 text-xs font-semibold">
        <button
          onClick={() => {
            setActiveTab('login');
            setErrorMessage(null);
          }}
          className={`flex-1 py-3 text-center transition-colors ${
            activeTab === 'login'
              ? 'text-zinc-900 border-b-2 border-zinc-900 bg-zinc-50'
              : 'text-zinc-500 hover:text-zinc-800'
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
              ? 'text-zinc-900 border-b-2 border-zinc-900 bg-zinc-50'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Crear Cuenta
        </button>
      </div>

      <div className="p-6">
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Usuario
              </label>
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="ej: maris o tu_usuario"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Ingresar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Maris o Laura Martínez"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                className="w-full p-2 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Nombre de Usuario <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="ej: maris o laura"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className="w-full p-2 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <span className="text-[10px] text-zinc-400">
                Será tu nombre para ingresar al sitio (sin correos ni confirmaciones).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                WhatsApp / Teléfono
              </label>
              <input
                type="tel"
                placeholder="Ej: 11 2345 6789"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full p-2 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Dirección para Envíos
              </label>
              <input
                type="text"
                placeholder="Calle, número, ciudad"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                className="w-full p-2 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Contraseña (mínimo 6 caracteres) <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full p-2 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
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
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-10">
      <Suspense fallback={<div className="text-zinc-500 text-xs">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
