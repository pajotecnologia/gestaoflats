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
    default: "IMOB by PAJO Tecnologia | Gestão Inteligente de Imóveis para Locação",
    template: "%s | IMOB by PAJO Tecnologia",
  },
  description: "Administre seus imóveis sem planilhas, papelada e confusão no WhatsApp. Reservas, locatários, contratos, assinatura digital, vistorias com fotos e financeiro completo em uma única plataforma.",
  keywords: [
    "IMOB",
    "PAJO Tecnologia",
    "sistema de gestão de imóveis",
    "gestão de imóveis para locação",
    "sistema para aluguel por temporada",
    "sistema para administradores de imóveis",
    "sistema para flats",
    "sistema para chácaras",
    "gestão de locações",
    "controle de reservas",
    "gestão de contratos de aluguel",
    "vistoria com fotos",
    "assinatura digital imobiliária"
  ],
  authors: [{ name: "PAJO Tecnologia", url: "https://pajotecnologia.com.br" }],
  openGraph: {
    title: "IMOB by PAJO Tecnologia | Gestão Inteligente de Imóveis para Locação",
    description: "Administre seus imóveis sem planilhas, papelada e confusão no WhatsApp. Plataforma completa para administradores, investidores e imobiliárias.",
    url: "https://app.imob.pajotech.com.br",
    siteName: "IMOB by PAJO Tecnologia",
    locale: "pt_BR",
    type: "website",
  },
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
