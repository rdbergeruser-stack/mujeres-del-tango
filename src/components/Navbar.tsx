'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { extractUsername } from '@/lib/utils';
import { ShoppingBag, LogOut, ShieldCheck, Menu, X, User } from 'lucide-react';

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
  const displayUsername = user ? extractUsername(user.user_metadata?.username || user.email) : '';

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-md text-white border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* LOGO OFICIAL */}
          <a href="/" className="flex items-center gap-3 group py-2">
            <img
              src="/images/logo-horizontal.png"
              alt="Mujeres del Tango"
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-[0_2px_12px_rgba(255,0,255,0.25)]"
            />
          </a>

          {/* MENÚ ESCRITORIO */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <a
              href="/"
              className={`transition-colors py-1 ${
                pathname === '/'
                  ? 'text-white font-semibold border-b-2 border-[#199DD0]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Catálogo Oficial
            </a>

            {user && (
              <a
                href="/mis-compras"
                className={`flex items-center gap-1.5 transition-colors py-1 ${
                  pathname === '/mis-compras'
                    ? 'text-white font-semibold border-b-2 border-[#199DD0]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-[#FF00FF]" />
                <span>Mis Compras</span>
              </a>
            )}

            {isAdmin && (
              <a
                href="/admin"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                  pathname.startsWith('/admin')
                    ? 'bg-gradient-to-r from-[#FF00FF] to-[#199DD0] text-white shadow-[0_0_15px_rgba(255,0,255,0.4)]'
                    : 'bg-zinc-900 text-zinc-200 border border-zinc-700 hover:border-[#199DD0] hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#FF00FF]" />
                <span>Panel Administrador</span>
              </a>
            )}

            <div className="flex items-center space-x-3 pl-4 border-l border-zinc-800">
              {loading ? (
                <div className="w-20 h-8 bg-zinc-800 animate-pulse rounded-lg" />
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden lg:block">
                    <p className="text-xs font-semibold text-white">
                      {profile?.full_name || displayUsername}
                    </p>
                    <p className="text-[11px] text-[#199DD0] font-mono">
                      @{displayUsername}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    title="Cerrar sesión"
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors border border-zinc-800"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <a
                    href="/login"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#FF00FF] to-[#199DD0] hover:opacity-90 text-white font-bold text-xs transition-opacity shadow-[0_0_12px_rgba(255,0,255,0.3)]"
                  >
                    Ingresar
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* BOTÓN MENÚ MÓVIL */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <span className="text-[11px] text-[#199DD0] font-mono mr-1">
                @{displayUsername}
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MENÚ MÓVIL DESPLEGABLE */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 pt-3 pb-6 space-y-3">
          <a
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-zinc-200 hover:text-white"
          >
            Catálogo Oficial
          </a>

          {user && (
            <a
              href="/mis-compras"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 text-sm font-medium text-zinc-200 hover:text-white"
            >
              <ShoppingBag className="w-4 h-4 text-[#FF00FF]" />
              <span>Mis Compras</span>
            </a>
          )}

          {isAdmin && (
            <a
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 text-sm font-bold text-[#FF00FF]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Panel Administrador</span>
            </a>
          )}

          <div className="pt-3 border-t border-zinc-800">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <User className="w-4 h-4 text-[#199DD0]" />
                  <span>
                    Conectado como <strong className="text-white">@{displayUsername}</strong>
                  </span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-red-400 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <a
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#FF00FF] to-[#199DD0] text-white font-bold text-xs text-center block"
              >
                Ingresar / Crear Cuenta
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
