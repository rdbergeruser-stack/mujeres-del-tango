'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShoppingBag, User, LogOut, ShieldCheck, Menu, X, Sparkles, Heart } from 'lucide-react';

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
            .from('profiles')
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
    <nav className="sticky top-0 z-50 bg-stone-900/95 backdrop-blur-md text-stone-100 border-b border-rose-950/60 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo y Nombre */}
          <a href="/" className="flex items-center gap-3 group">
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-800 to-rose-950 border border-rose-500/30 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform duration-200">
              🌹
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-rose-100 group-hover:text-rose-300 transition-colors">
                Mujeres del Tango
              </span>
              <span className="text-[10px] tracking-widest uppercase text-rose-300/80 -mt-1 font-sans">
                Remeras & Homenaje Porteño
              </span>
            </div>
          </a>

          {/* Menú Desktop */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <a
              href="/"
              className={`transition-colors py-1 ${
                pathname === '/' ? 'text-rose-400 font-semibold' : 'text-stone-300 hover:text-white'
              }`}
            >
              Catálogo
            </a>

            {user && (
              <a
                href="/mis-compras"
                className={`flex items-center gap-1.5 transition-colors py-1 ${
                  pathname === '/mis-compras'
                    ? 'text-rose-400 font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-rose-400" />
                <span>Mis Compras</span>
              </a>
            )}

            {isAdmin && (
              <a
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-900/40 border border-rose-700/60 transition-all ${
                  pathname.startsWith('/admin')
                    ? 'bg-rose-900 text-white shadow-sm'
                    : 'text-rose-300 hover:bg-rose-850 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Panel de Maris</span>
              </a>
            )}

            {/* Estado de Usuario */}
            <div className="flex items-center space-x-3 pl-4 border-l border-stone-800">
              {loading ? (
                <div className="w-20 h-8 bg-stone-800 animate-pulse rounded-full" />
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden lg:block">
                    <p className="text-xs font-semibold text-stone-200">
                      {profile?.full_name || 'Amiga/o del Tango'}
                    </p>
                    <p className="text-[11px] text-stone-400 truncate max-w-[140px]">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    title="Cerrar sesión"
                    className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-rose-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <a
                    href="/login"
                    className="px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded-full bg-rose-900 hover:bg-rose-800 text-white shadow-sm hover:shadow transition-all"
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
              className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú desplegable Móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-stone-900 border-b border-rose-950 px-4 pt-2 pb-6 space-y-3">
          <a
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-stone-200 hover:bg-stone-800"
          >
            Catálogo de Remeras
          </a>

          {user && (
            <a
              href="/mis-compras"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-stone-200 hover:bg-stone-800"
            >
              <ShoppingBag className="w-5 h-5 text-rose-400" />
              <span>Mis Compras</span>
            </a>
          )}

          {isAdmin && (
            <a
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-rose-300 bg-rose-950/60 border border-rose-900"
            >
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Panel de Maris (Admin)</span>
            </a>
          )}

          <div className="pt-4 border-t border-stone-800">
            {user ? (
              <div className="space-y-3">
                <div className="px-3">
                  <p className="text-sm font-semibold text-stone-200">
                    {profile?.full_name || 'Compradora'}
                  </p>
                  <p className="text-xs text-stone-400">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-stone-800 text-rose-300 hover:bg-stone-700 text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <a
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full px-4 py-2.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-white font-medium text-sm"
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
