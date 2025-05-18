import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "../globals.css";
import AuthProvider from "../context/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "../context/ThemeProvider";
import { CartProvider } from "../context/CartContext";
import Navbar from "../ui/Navbar";
import Footer from "../ui/Footer";
import Breadcrumbs from "../components/ui/Breadcrumbs";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"], // All available weights
});

export const metadata: Metadata = {
  title: "nustbites",
  description: "nustbites",
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
                <main className="relative z-10">{children}</main>
              </div>
              <Footer />
            </CartProvider>
          </ThemeProvider>
        </body>
      </AuthProvider>
    </html>
  );
}
