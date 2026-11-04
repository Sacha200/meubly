import { describe, it, expect, vi, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { clientIpDiagnostic } from "../../middlewares/clientIpDiagnostic.js";

/** App minimale : on ne teste que la forme du log, sans IP. */
function appWith(trustProxy) {
  const app = express();
  app.set("trust proxy", trustProxy);
  app.use(clientIpDiagnostic);
  app.get("/x", (req, res) => res.json({ ok: true }));
  return app;
}

describe("diagnostic temporaire de l'IP client", () => {
  afterEach(() => vi.restoreAllMocks());

  it("situe CF-Connecting-IP dans X-Forwarded-For sans jamais logger d'adresse", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await request(appWith(1))
      .get("/x")
      .set("X-Forwarded-For", "203.0.113.7, 198.51.100.20")
      .set("CF-Connecting-IP", "203.0.113.7");

    const line = log.mock.calls.map((c) => c.join(" ")).find((l) => l.includes("[client-ip]"));
    expect(line).toBeDefined();
    const data = JSON.parse(line.slice(line.indexOf("{")));
    expect(data).toEqual({
      xffCount: 2,
      cfIndexFromRight: 1,
      hasCfConnectingIp: true,
      hasTrueClientIp: false,
      hasXRealIp: false,
      reqIpIsCf: false,
    });
    expect(line).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
  });

  it("signale l'absence de CF-Connecting-IP", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await request(appWith(1)).get("/x").set("X-Forwarded-For", "203.0.113.7");

    const line = log.mock.calls.map((c) => c.join(" ")).find((l) => l.includes("[client-ip]"));
    const data = JSON.parse(line.slice(line.indexOf("{")));
    expect(data.hasCfConnectingIp).toBe(false);
    expect(data.cfIndexFromRight).toBe(-1);
  });
});
