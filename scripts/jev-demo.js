import { jevConfig, jevDecision } from "../src/server/jev.ts";

const report = {
  ticket_number: "LPK-DEMO0001",
  description_redacted:
    "Ada lubang besar di jalan depan [ALAMAT], Kecamatan Lowokwaru. Sudah 2 minggu dan membahayakan pengendara.",
  lokasi: { kecamatan: "Lowokwaru", kelurahan: "Tulusrejo" },
  kanal: "web",
};

const config = jevConfig();
console.log(`Jev decision via ${config.baseUrl} (${config.model})`);
const decision = await jevDecision(report);
console.log(JSON.stringify(decision, null, 2));