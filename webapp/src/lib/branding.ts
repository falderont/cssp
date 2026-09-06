import { prisma } from "./prisma";

export type ProviderBranding = {
  id: string;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string;
  supportPhone: string;
  address: string | null;
};

const FALLBACK: ProviderBranding = {
  id: "singleton",
  companyName: "CSSP Colocation",
  logoUrl: null,
  primaryColor: "#2563eb",
  secondaryColor: "#0f172a",
  supportEmail: "support@example.com",
  supportPhone: "+1 000 000 0000",
  address: null,
};

export async function getProviderBranding(): Promise<ProviderBranding> {
  const settings = await prisma.providerSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) return FALLBACK;
  return settings;
}
