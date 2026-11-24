import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const bombing = localFont({
  src: '../fonts/BOMBING.ttf',
  variable: '--font-bombing',
  display: 'swap',
});

const montserrat = localFont({
  src: '../fonts/Montserrat-SemiBold.ttf',
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mujeres del Tango | Tienda Oficial de Remeras',
  description:
    'Tienda oficial de Mujeres del Tango. Remeras temáticas y homenajes a las grandes figuras de la música ciudadana: Tita Merello, Paquita Bernardo, María Nieves y más.',
  icons: {
    icon: '/images/logo-hat.png',
    shortcut: '/images/logo-hat.png',
    apple: '/images/logo-hat.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${bombing.variable} ${montserrat.variable}`}>
      <body className="font-sans bg-zinc-950 text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-[#FF00FF] selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
