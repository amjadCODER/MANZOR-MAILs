import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'MANZOR Mail',
  description: 'Internal email management by MANZOR TECH',
  icons: {
    icon: '/manzor-tech-logo.png',
    shortcut: '/manzor-tech-logo.png',
    apple: '/manzor-tech-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
