import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Mujeres del Tango | Remeras de Colección & Homenaje Porteño',
  description:
    'Tienda online oficial de Mujeres del Tango. Remeras temáticas de diseño independiente inspiradas en Tita Merello, Eladia Blázquez, Nelly Omar, Ada Falcón y más.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-stone-50 text-stone-900 min-h-screen flex flex-col antialiased selection:bg-rose-900 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
