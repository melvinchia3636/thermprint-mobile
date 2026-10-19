import { describe, it, expect } from "bun:test";
import {
  getNfcLinkError,
  normalizeNfcLink,
  NFC_LINK_MAX_LENGTH,
} from "../nfcLink";

describe("NFC link helpers", () => {
  it("trims input and assumes HTTPS when no scheme is provided", () => {
    expect(normalizeNfcLink("  example.com/path  ")).toBe(
      "https://example.com/path",
    );
    expect(normalizeNfcLink("www.example.com")).toBe(
      "https://www.example.com",
    );
  });

  it("preserves valid http and https links", () => {
    expect(normalizeNfcLink("https://example.com/a?b=1#c")).toBe(
      "https://example.com/a?b=1#c",
    );
    expect(normalizeNfcLink("HTTP://example.com")).toBe(
      "HTTP://example.com",
    );
  });

  it("keeps host and port together", () => {
    expect(normalizeNfcLink("example.com:8080/path")).toBe(
      "https://example.com:8080/path",
    );
    expect(getNfcLinkError("example.com:8080/path")).toBeNull();
  });

  it("rejects empty input", () => {
    expect(getNfcLinkError("")).toBe("Enter a link to write to the tag.");
    expect(getNfcLinkError("   ")).toBe("Enter a link to write to the tag.");
  });

  it("rejects non-web schemes", () => {
    expect(getNfcLinkError("ftp://example.com")).toBe(
      "Only http:// and https:// links are supported.",
    );
    expect(getNfcLinkError("mailto:hello@example.com")).toBe(
      "Only http:// and https:// links are supported.",
    );
  });

  it("rejects links containing whitespace", () => {
    expect(getNfcLinkError("example.com/hello world")).toBe(
      "Links cannot contain spaces.",
    );
  });

  it("rejects invalid links", () => {
    expect(getNfcLinkError("https://")).not.toBeNull();
    expect(getNfcLinkError("not a link")).not.toBeNull();
  });

  it("accepts domains with paths, queries and fragments", () => {
    expect(getNfcLinkError("example.com")).toBeNull();
    expect(getNfcLinkError("https://example.com/path?q=1#section")).toBeNull();
  });

  it("rejects links longer than the maximum length", () => {
    const longLink = `https://example.com/${"a".repeat(NFC_LINK_MAX_LENGTH)}`;
    expect(getNfcLinkError(longLink)).toBe(
      `Link is too long (max ${NFC_LINK_MAX_LENGTH} characters).`,
    );
  });
});
