import { NextRequest, NextResponse } from "next/server";

const INTERNAL_API_BASE_URL =
  normalizeInternalApiBaseUrl(process.env.FANFUEL_INTERNAL_API_BASE_URL) ??
  normalizeInternalApiBaseUrl(process.env.API_BASE_URL) ??
  normalizeInternalApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL) ??
  "http://localhost:8080";

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "idempotency-key"
];

const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]);

export const dynamic = "force-dynamic";

type ProxyContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxyApiRequest(request: NextRequest, context: ProxyContext) {
  const { path } = await context.params;
  const upstreamUrl = new URL(
    `${INTERNAL_API_BASE_URL}/api/v1/${path.map(encodeURIComponent).join("/")}`
  );

  request.nextUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value);
  });

  const requestHeaders = new Headers();
  for (const header of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(header);
    if (value) {
      requestHeaders.set(header, value);
    }
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers: requestHeaders,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
    redirect: "manual"
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  for (const header of HOP_BY_HOP_RESPONSE_HEADERS) {
    responseHeaders.delete(header);
  }

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders
  });
}

function normalizeInternalApiBaseUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
}

export const GET = proxyApiRequest;
export const POST = proxyApiRequest;
export const PUT = proxyApiRequest;
export const PATCH = proxyApiRequest;
export const DELETE = proxyApiRequest;
export const OPTIONS = proxyApiRequest;
export const HEAD = proxyApiRequest;
