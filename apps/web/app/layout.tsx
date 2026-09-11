import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HabitQuest',
  description: 'Embark on an epic quest of daily habits and legendary achievements',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
