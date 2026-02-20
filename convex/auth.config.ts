import type { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://funky-fox-83.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
