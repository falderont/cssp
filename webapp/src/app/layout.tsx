import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getProviderBranding } from "@/lib/branding";
import { getErrorCatalog } from "@/lib/error-catalog";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getProviderBranding();
  return {
    title: `${branding.companyName} — Customer Portal`,
    description: "Colocation customer self-service portal: visitors, incidents, maintenance, service requests, billing and more.",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [branding, errorCatalog] = await Promise.all([getProviderBranding(), getErrorCatalog()]);
  return (
    <html
      lang="en"
      style={
        {
          "--brand-primary": branding.primaryColor,
          "--brand-primary-dark": branding.primaryColor,
          "--brand-secondary": branding.secondaryColor,
        } as React.CSSProperties
      }
    >
      <body>
        <Providers errorCatalog={errorCatalog}>{children}</Providers>
      </body>
    </html>
  );
}
