import type { Metadata } from 'next';
import './globals.scss';

export const metadata: Metadata = {
  title: 'Todo List',
  description: 'Prosta aplikacja do zarządzania zadaniami',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
