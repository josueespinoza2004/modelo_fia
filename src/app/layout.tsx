import type { Metadata } from 'next';
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { SommelierModal } from '@/components/sommelier/SommelierModal';
import { SommelierWidget } from '@/components/sommelier/SommelierWidget';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AURA • Specialty Coffee Roasters | Tostaduría de Autor & Sommelier Virtual',
  description:
    'Microlotes de café de especialidad con puntuación SCA superior a 86 puntos. Conoce a Don Aurelio, nuestro sommelier virtual con IA que te ayuda a elegir y preparar el café ideal.',
  keywords: [
    'café de especialidad',
    'specialty coffee',
    'geisha panama',
    'bourbon rosado huila',
    'v60',
    'chemex',
    'sommelier café',
    'tostaduría artesanal',
  ],
  authors: [{ name: 'AURA Coffee Roasters' }],
  openGraph: {
    title: 'AURA • Specialty Coffee Roasters | Sommelier Virtual con IA',
    description: 'Descubre tu café de especialidad ideal con nuestro sommelier inteligente.',
    type: 'website',
    locale: 'es_ES',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0d0a09] text-zinc-100 font-sans selection:bg-amber-500 selection:text-zinc-950">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <SommelierModal />
          <SommelierWidget />
        </CartProvider>
      </body>
    </html>
  );
}
