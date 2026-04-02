import { describe, expect, it } from "vitest"
import { isLoopbackHost, requireLocalMutation } from "@/lib/api-auth"

describe("isLoopbackHost", () => {
  it("accepts known loopback names", () => {
    expect(isLoopbackHost("localhost")).toBe(true)
    expect(isLoopbackHost("127.0.0.1")).toBe(true)
    expect(isLoopbackHost("::1")).toBe(true)
  })

  it("rejects non-loopback hosts", () => {
    expect(isLoopbackHost("example.com")).toBe(false)
  })
})

describe("requireLocalMutation", () => {
  it("rejects requests without a loopback host", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: {
        host: "example.com",
        origin: "http://example.com",
      },
    })

    const response = requireLocalMutation(request)

    expect(response?.status).toBe(403)
    await expect(response?.json()).resolves.toEqual({ error: "Forbidden" })
  })

  it("rejects requests without a matching local origin", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "https://example.com",
      },
    })

    const response = requireLocalMutation(request)

    expect(response?.status).toBe(403)
    await expect(response?.json()).resolves.toEqual({ error: "Forbidden" })
  })

  it("allows loopback requests with matching origin", () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
    })

    expect(requireLocalMutation(request)).toBeNull()
  })
})
