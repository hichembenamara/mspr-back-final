import { NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8000";

function buildBackendUrl(pathParts: string[]) {
  const upstreamPath = pathParts.map(encodeURIComponent).join("/");
  return `${BACKEND_BASE_URL}/api/${upstreamPath}`;
}

async function forward(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const url = new URL(req.url);
  const upstreamUrl = buildBackendUrl(path);

  const headers = new Headers(req.headers);
  headers.set("host", new URL(BACKEND_BASE_URL).host);

  // Let upstream decide content encoding.
  headers.delete("accept-encoding");

  const hasBody = !["GET", "HEAD"].includes(req.method);
  const upstreamRes = await fetch(`${upstreamUrl}${url.search}`, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const resHeaders = new Headers(upstreamRes.headers);
  // Avoid leaking upstream host redirects to the browser.
  resHeaders.delete("location");

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const OPTIONS = forward;

