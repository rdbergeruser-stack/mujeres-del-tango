'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function CambiarClavePage() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar contraseña');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un error al guardar tu nueva clave.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12 text-zinc-100">
      <div className="max-w-md w-full bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden">
        <div className="bg-zinc-950 p-6 text-center border-b border-zinc-800">
          <img
            src="/images/logo-horizontal.png"
            alt="Mujeres del Tango"
            className="h-12 mx-auto object-contain mb-3 drop-shadow-[0_2px_12px_rgba(255,0,255,0.3)]"
          />
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-2 text-[#FF00FF]">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">
            Elegí tu Contraseña Definitiva
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            Por tu seguridad, ingresá una contraseña personal para acceder siempre a la tienda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nueva Contraseña (mínimo 6 caracteres):
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF00FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Confirmar Nueva Contraseña:
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Contraseña y Continuar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
