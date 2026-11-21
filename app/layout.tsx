import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Folio | Shaba News Tamil',
  description: 'A photographic Tamil magazine from Shaba News Tamil.',
  icons: { icon: '/shaba-mark.webp' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="ta"><body>{children}</body></html>;
}
