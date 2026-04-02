const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"])

function firstHeaderValue(value: string | null): string | null {
  return value?.split(",", 1)[0]?.trim() || null
}

function parseHostHeader(value: string | null): URL | null {
  const host = firstHeaderValue(value)
  if (!host) return null

  try {
    return new URL(`http://${host}`)
  } catch {
    return null
  }
}

function parseOriginHeader(value: string | null): URL | null {
  const origin = firstHeaderValue(value)
  if (!origin) return null

  try {
    return new URL(origin)
  } catch {
    return null
  }
}

export function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname.toLowerCase())
}

export function requireLocalMutation(request: Request): Response | null {
  const host = parseHostHeader(request.headers.get("x-forwarded-host") ?? request.headers.get("host"))
  const origin = parseOriginHeader(request.headers.get("origin"))

  if (!host || !isLoopbackHost(host.hostname)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!origin || origin.protocol !== "http:" && origin.protocol !== "https:") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  if (origin.host !== host.host || !isLoopbackHost(origin.hostname)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  return null
}
