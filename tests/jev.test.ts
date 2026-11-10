import { describe, expect, test } from "bun:test";
import { buildJevRequest, jevConfig } from "../src/server/jev.ts";

describe("Jev integration", () => {
  test("buildJevRequest mengikuti kontrak decisions (state + questions)", () => {
    const req = buildJevRequest(
      { ticket_number: "LPK-ABC123", description_redacted: "Jalan berlubang di [ALAMAT]", lokasi: { kecamatan: "Lowokwaru" } },
      "typesafe/jev-1.13",
    );
    expect(req.model).toBe("typesafe/jev-1.13");
    expect(req.state).toEqual({ laporan: "Jalan berlubang di [ALAMAT]", lokasi: { kecamatan: "Lowokwaru" }, kanal: "web" });
    expect(req.questions.kategori.type).toBe("choice");
    expect(req.questions.kategori_cocok.type).toBe("noul");
    expect(req.questions.dinas.type).toBe("choice");
    expect(req.questions.urgensi.type).toBe("choice");
    expect(req.questions.toxic.type).toBe("noul");
    expect(req.questions.threat.type).toBe("noul");
  });
  test("jevConfig menolak env tanpa kunci", () => {
    expect(() => jevConfig({})).toThrow(/JEV_API_KEY/);
    expect(() => jevConfig({ JEV_API_KEY: "x" })).toThrow(/JEV_BASE_URL/);
  });
});