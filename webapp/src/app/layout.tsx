import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getProviderBranding } from "@/lib/branding";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getProviderBranding();
  return {
    title: `${branding.companyName} — Customer Portal`,
    description: "Colocation customer self-service portal: visitors, incidents, maintenance, service requests, billing and more.",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const branding = await getProviderBranding();
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
