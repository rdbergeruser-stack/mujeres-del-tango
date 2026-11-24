'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShoppingBag, LogOut, ShieldCheck, Menu, X } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data: prof } = await supabase
            .from('tango_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setProfile(prof);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    }

    getUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          getUserData();
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/');
    router.refresh();
  };

  const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase().includes('maris');

  return (
    <nav className="sticky top-0 z-50 bg-white text-zinc-900 border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre */}
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
              MT
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-zinc-900">
                Mujeres del Tango
              </span>
              <span className="text-[10px] tracking-wider uppercase text-zinc-500 font-medium -mt-0.5">
                Tienda de Remeras
              </span>
            </div>
          </a>

          {/* Menú Desktop */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <a
              href="/"
              className={`transition-colors py-1 ${
                pathname === '/' ? 'text-zinc-900 font-semibold' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Catálogo
            </a>

            {user && (
              <a
                href="/mis-compras"
                className={`flex items-center gap-1.5 transition-colors py-1 ${
                  pathname === '/mis-compras'
                    ? 'text-zinc-900 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-zinc-700" />
                <span>Mis Compras</span>
              </a>
            )}

            {isAdmin && (
              <a
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  pathname.startsWith('/admin')
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                    : 'bg-zinc-100 text-zinc-800 border-zinc-200 hover:bg-zinc-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Panel Admin (Maris)</span>
              </a>
            )}

            {/* Estado de Usuario */}
            <div className="flex items-center space-x-3 pl-4 border-l border-zinc-200">
              {loading ? (
                <div className="w-20 h-8 bg-zinc-100 animate-pulse rounded-lg" />
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden lg:block">
                    <p className="text-xs font-semibold text-zinc-900">
                      {profile?.full_name || 'Usuario'}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate max-w-[140px]">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    title="Cerrar sesión"
                    className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <a
                    href="/login"
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white transition-all"
                  >
                    Ingresar
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Botón Móvil */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú desplegable Móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 px-4 pt-2 pb-6 space-y-3">
          <a
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Catálogo de Remeras
          </a>

          {user && (
            <a
              href="/mis-compras"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-zinc-800 hover:bg-zinc-100"
            >
              <ShoppingBag className="w-5 h-5 text-zinc-700" />
              <span>Mis Compras</span>
            </a>
          )}

          {isAdmin && (
            <a
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-zinc-900 bg-zinc-100 border border-zinc-200"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Panel Admin (Maris)</span>
            </a>
          )}

          <div className="pt-4 border-t border-zinc-200">
            {user ? (
              <div className="space-y-3">
                <div className="px-3">
                  <p className="text-sm font-semibold text-zinc-900">
                    {profile?.full_name || 'Usuario'}
                  </p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 text-zinc-800 hover:bg-zinc-200 text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <a
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm"
              >
                Iniciar Sesión / Registrarse
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
