import { Providers } from '@/components/providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Financial Portal System</title>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
