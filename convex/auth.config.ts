import type { AuthConfig } from "convex/server";

const clerkIssuerDomain =
  process.env.CLERK_JWT_ISSUER_DOMAIN ?? process.env.CLERK_FRONTEND_API_URL;

if (!clerkIssuerDomain) {
  throw new Error(
    "Missing CLERK_JWT_ISSUER_DOMAIN (or CLERK_FRONTEND_API_URL) for Convex auth.",
  );
}

function normalizeClerkDomain(frontendApiUrl: string) {
  const withProtocol = frontendApiUrl.startsWith("http")
    ? frontendApiUrl
    : `https://${frontendApiUrl}`;

  return new URL(withProtocol).origin;
}

const authConfig = {
  providers: [
    {
      domain: normalizeClerkDomain(clerkIssuerDomain),
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;

export default authConfig;
