const HTTP_PROTOCOL_RE = /^https?:\/\//i;

function hasAllowedHostname(urlString: string, baseDomain: string): boolean {
  const hostname = new URL(urlString).hostname.toLowerCase();
  return hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
}

export function normalizeExternalLink(link?: string | null): string | null {
  const trimmedLink = link?.trim();
  if (!trimmedLink) return null;

  const candidate = HTTP_PROTOCOL_RE.test(trimmedLink)
    ? trimmedLink
    : `https://${trimmedLink}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function getGithubProfileLink(link?: string | null): string | null {
  const normalizedLink = normalizeExternalLink(link);
  if (!normalizedLink) return null;
  return hasAllowedHostname(normalizedLink, "github.com")
    ? normalizedLink
    : null;
}

export function getLinkedinProfileLink(link?: string | null): string | null {
  const normalizedLink = normalizeExternalLink(link);
  if (!normalizedLink) return null;
  return hasAllowedHostname(normalizedLink, "linkedin.com")
    ? normalizedLink
    : null;
}

export function formatExternalLinkLabel(link: string): string {
  return link.replace(HTTP_PROTOCOL_RE, "").replace(/\/$/, "");
}
