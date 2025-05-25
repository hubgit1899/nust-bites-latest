import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "../globals.css"; // Assuming globals.css contains your theme styles (e.g., [data-theme="cupcake"] {...})
import AuthProvider from "../context/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "../context/ThemeProvider"; // User's path
import { CartProvider } from "../context/CartContext";
import Navbar from "../ui/Navbar";
import Footer from "../ui/Footer";
import Breadcrumbs from "../ui/Breadcrumbs";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { DEFAULT_LIGHT, DEFAULT_DARK } from "@/lib/theme";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000", // Consider making this dynamic with theme changes if possible, though this is static.
};

export const metadata: Metadata = {
  title: "nustbites",
  description: "Your campus food delivery platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "nustbites",
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

// Function to generate the blocking theme script string (New Approach)
const getBlockingThemeScript_LocalStorageThenDefault = (
  fallbackLight: string,
  fallbackDark: string
) => `
(function() {
  const THEME_KEY = "theme";
  // These are fallbacks if localStorage is empty/inaccessible or has no 'theme' key
  const FALLBACK_LIGHT_THEME_NAME = "${fallbackLight}"; // e.g., "cupcake"
  const FALLBACK_DARK_THEME_NAME = "${fallbackDark}";   // e.g., "night"

  let chosenTheme = null;

  try {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme && typeof storedTheme === 'string' && storedTheme.trim() !== '') { // If there's any non-empty theme string
      chosenTheme = storedTheme.trim(); // Tentatively use it
    }
  } catch (e) {
    // localStorage access might be restricted
    console.warn("Could not access localStorage for theme preference:", e);
  }

  if (!chosenTheme) { // If localStorage was empty, inaccessible, or 'theme' key missing
    // Fallback to system preference using the provided default names
    chosenTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? FALLBACK_DARK_THEME_NAME : FALLBACK_LIGHT_THEME_NAME;
  }

  // Apply the chosen theme
  // This assumes CSS for 'chosenTheme' (e.g., "dim", "cupcake", "night") is globally available
  document.documentElement.setAttribute("data-theme", chosenTheme);
  // It's generally good practice for theme names to be valid CSS class names too.
  document.documentElement.classList.add(chosenTheme);
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Generate the script string with your actual default theme names
  const blockingScript = getBlockingThemeScript_LocalStorageThenDefault(
    DEFAULT_LIGHT,
    DEFAULT_DARK
  );

  return (
    // Add suppressHydrationWarning to the <html> tag
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Add the blocking script here */}
        <script dangerouslySetInnerHTML={{ __html: blockingScript }} />
        {/* Next.js will manage other head elements like those from `metadata` */}
      </head>
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
