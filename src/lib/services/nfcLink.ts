export const NFC_LINK_MAX_LENGTH = 1024;

const HTTP_SCHEME = /^https?:\/\//i;
const EXPLICIT_SCHEME = /^([a-z][a-z0-9+.-]*):(?!\d)/i;
const URL_PATTERN = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

/**
 * Normalizes user input into an absolute web link.
 * Links without a scheme are assumed to be HTTPS.
 */
export function normalizeNfcLink(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (HTTP_SCHEME.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

/**
 * Returns a user-facing validation error, or null when the input is a valid
 * http(s) link that can be encoded as an NDEF URI record.
 */
export function getNfcLinkError(input: string): string | null {
  const trimmed = input.trim();

  if (!trimmed) {
    return "Enter a link to write to the tag.";
  }

  const scheme = EXPLICIT_SCHEME.exec(trimmed)?.[1]?.toLowerCase();
  if (scheme && scheme !== "http" && scheme !== "https") {
    return "Only http:// and https:// links are supported.";
  }

  if (trimmed.length > NFC_LINK_MAX_LENGTH) {
    return `Link is too long (max ${NFC_LINK_MAX_LENGTH} characters).`;
  }

  const url = normalizeNfcLink(trimmed);
  if (/\s/.test(url)) {
    return "Links cannot contain spaces.";
  }
  if (!URL_PATTERN.test(url)) {
    return "Enter a valid link, for example https://example.com.";
  }

  return null;
}
