import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";

describe("app.js", () => {
  it("n'ouvre aucun port a l'import", async () => {
    const listenSpy = vi.spyOn(express.application, "listen");
    await import("../../app.js");
    expect(listenSpy).not.toHaveBeenCalled();
    listenSpy.mockRestore();
  });

  it("GET /api/v1/health repond 200 { status: 'ok' }", async () => {
    const { app } = await import("../../app.js");
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
