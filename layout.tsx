import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Velvet Cafe & Grill | Luxury Dining, QR Ordering & POS',
  description:
    'Velvet Cafe & Grill — Artisan charcoal grill, signature burgers, specialty brews, QR table ordering & instant Pakistani digital payments.',
};

const themeInitScript = `
  try {
    if (localStorage.getItem('velvet-theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-[#6B132E] selection:text-[#FFFDF9]">
        {children}
      </body>
    </html>
  );
}
