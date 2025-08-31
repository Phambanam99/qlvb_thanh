import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ToastProvider } from "@/components/ui/use-toast"
import { AuthProvider } from "@/lib/auth-context"
import { Providers } from "./providers"
import { NotificationsProvider } from "@/lib/notifications-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Hệ thống quản lý công văn",
  description: "Hệ thống quản lý công văn và điều hành",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Providers>
            <ToastProvider>
              <AuthProvider>
                <NotificationsProvider>
                  {children}
                  <Toaster />
                </NotificationsProvider>
              </AuthProvider>
            </ToastProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
