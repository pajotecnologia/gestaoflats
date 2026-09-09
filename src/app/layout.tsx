import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Gestão de Imóveis para Locação SaaS",
    template: "%s | Gestão de Imóveis para Locação",
  },
  description: "Sistema completo de gestão de imóveis para locação, contratos, vistorias com fotos e financeiro.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <title>Gestão de Imóveis para Locação SaaS</title>
        <meta name="title" content="Gestão de Imóveis para Locação SaaS" />
      </head>
      <body className={`${inter.className} ${inter.variable} antialiased min-h-screen selection:bg-blue-600 selection:text-white transition-colors duration-200`}>
        {children}
      </body>
    </html>
  );
}
