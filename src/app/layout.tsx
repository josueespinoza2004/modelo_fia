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
  title: 'AURA • Specialty Coffee Roasters | Café de Origen & Tueste Artesanal',
  description:
    'Microlotes exclusivos de café de especialidad con puntuación SCA superior a 86 puntos. Conoce a Don Aurelio, nuestro maestro barista que te guía para preparar tu taza ideal.',
  keywords: [
    'café de especialidad',
    'specialty coffee',
    'geisha panama',
    'bourbon rosado huila',
    'v60',
    'chemex',
    'barista artesanal',
    'tostaduría de café',
  ],
  authors: [{ name: 'AURA Coffee Roasters' }],
  openGraph: {
    title: 'AURA • Specialty Coffee Roasters | Café de Origen & Tueste Artesanal',
    description: 'Microlotes de estricta altura y guía de preparación de café de especialidad.',
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
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fbf9f5] text-[#29211b] font-sans selection:bg-[#edd8be] selection:text-[#382618]">
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
