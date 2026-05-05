import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import CSSImports from "@/components/CSSImports";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: "MeetVerse",
  description: "Modern video conferencing for everyone",
  icons: { icon: '/icons/logo.svg' }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} font-poppins antialiased`}
        style={{ background: '#F5F0FF', color: '#1E1B4B' }}
      >
        <ClerkProvider
          appearance={{
            layout: {
              logoImageUrl: '/icons/logo.png',
              socialButtonsVariant: 'iconButton'
            },
            variables: {
              colorText: '#1E1B4B',
              colorPrimary: '#4F46E5',
              colorBackground: '#FFFFFF',
              colorInputBackground: '#F5F0FF',
              colorInputText: '#1E1B4B',
              borderRadius: '0.875rem',
            }
          }}
        >
          <CSSImports />
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ClerkProvider>
      </body>
    </html>
  );
}
