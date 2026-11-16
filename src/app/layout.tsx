import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Velvet Cafe & Grill | Luxury Dining, QR Ordering & POS',
  description:
    'Velvet Cafe & Grill — Artisan charcoal grill, signature burgers, specialty brews, QR table ordering & instant Pakistani digital payments.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased selection:bg-[#6B132E] selection:text-[#FFFDF9]">
        {children}
      </body>
    </html>
  );
}
