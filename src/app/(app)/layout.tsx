import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "../globals.css";
import AuthProvider from "../context/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "../context/ThemeProvider";
import { CartProvider } from "../context/CartContext";
import Navbar from "../ui/Navbar";
import Footer from "../ui/Footer";
import Breadcrumbs from "../ui/Breadcrumbs";
import { SpeedInsights } from "@vercel/speed-insights/next";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"], // All available weights
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "NUST Bites",
  description: "Your campus food delivery platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NUST Bites",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <AuthProvider>
        <body
          className={`${poppins.variable} flex flex-col min-h-screen antialiased`}
        >
          <ThemeProvider>
            <CartProvider>
              <Navbar />
              <div
                className="w-full px-4 sm:px-6 lg:px-14 xl:px-20 max-w-[1600px] flex-grow mx-auto relative"
                style={{ marginTop: "var(--navbar-height)" }}
              >
                <Toaster richColors />
                {/* Ensure breadcrumbs are always accessible */}
                <div className="relative z-30 w-full pointer-events-auto">
                  <Breadcrumbs />
                </div>
                <main className="relative z-10">
                  {children}
                  <SpeedInsights />
                </main>
              </div>
              <Footer />
            </CartProvider>
          </ThemeProvider>
        </body>
      </AuthProvider>
    </html>
  );
}
