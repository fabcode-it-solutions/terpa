import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "@/lib/bullmq";
import { APP_TITLE } from "@/lib/constants/app";
import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * Force the application to render dynamically on each request
 */
export const dynamic = "force-dynamic";

/**
 * Metadata
 */
export const metadata: Metadata = {
  title: {
    default: APP_TITLE,
    template: `%s • ${APP_TITLE}`,
  },
  manifest: "/manifest.webmanifest",
};

/**
 * Viewport
 */
export const viewport: Viewport = {
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/**
 * The root layout of the application.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="overflow-y-scroll">
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            themes={["light", "dark", "system"]}
          >
            {children}
          </ThemeProvider>
        </QueryProvider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
