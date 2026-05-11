/** @type {import('next').NextConfig} */
const defaultAllowedDevOrigins = ["127.0.0.1", "danechka.com"];

function normalizeDevOrigin(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("*.")) {
    return trimmed;
  }

  try {
    return new URL(trimmed).hostname;
  } catch {
    return trimmed
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .split(":")[0];
  }
}

const extraAllowedDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map(normalizeDevOrigin)
  .filter(Boolean);

const nextConfig = {
  allowedDevOrigins: Array.from(new Set([...defaultAllowedDevOrigins, ...extraAllowedDevOrigins])),
  transpilePackages: ["@fanfuel/i18n", "@fanfuel/types", "@fanfuel/ui"]
};

export default nextConfig;
