import type { OcrOutcome, OcrServicePort } from "../../core/ports/ocr.port";

const VENDORS = ["Padaria Pão Dourado", "Posto Shell", "Mercado São Jorge", "Uber", "Restaurante Sabor Caseiro", "Farmacia DrogaVida"];
const CURRENCIES = ["BRL", "USD"];

const LOW_CONFIDENCE_THRESHOLD = 0.9;
const FAIL_RATE = 0.05;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockOcrService implements OcrServicePort {
  private readonly rng: () => number;

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
  }

  async process(_image: Uint8Array): Promise<OcrOutcome> {
    const rng = this.rng;
    const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

    await delay(randInt(800, 2000));

    if (rng() < FAIL_RATE) {
      return { ok: false, reason: "OCR engine failed to read the image" };
    }

    const vendor = VENDORS[randInt(0, VENDORS.length - 1)];
    const today = new Date();
    const date = new Date(today.getTime() - randInt(0, 14) * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const amount = randInt(10, 1500) + rng();

    const random = rng();
    const confidence = random < 0.1 ? Math.round((0.55 + rng() * 0.2) * 100) / 100 : 0.95 + rng() * 0.049;

    return {
      ok: true,
      result: {
        vendor,
        date,
        amount: Math.round(amount * 100) / 100,
        currency: CURRENCIES[randInt(0, 1)],
        confidence: Math.min(1, confidence),
      },
    };
  }

  isLowConfidence(outcome: OcrOutcome): boolean {
    return outcome.ok && outcome.result.confidence < LOW_CONFIDENCE_THRESHOLD;
  }
}