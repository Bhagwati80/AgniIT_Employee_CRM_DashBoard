import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Agniit HRMS",
  description: "Human Resource Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <TooltipProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
            <Toaster />
          </TooltipProvider>
        </AppProvider>
      </body>
    </html>
  );
}
