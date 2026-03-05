import test from "node:test";
import assert from "node:assert/strict";
import { calculateTaxBreakdown, parseLocalizedPrice, sanitizePriceInput } from "../tax-core.mjs";

const ONTARIO_RATES = { federal: 0.13, provincial: 0.0 };
const QUEBEC_RATES = { federal: 0.05, provincial: 0.09975 };

test("parses english format value", () => {
  const parsed = parseLocalizedPrice("1,234.56");
  assert.equal(parsed.isValid, true);
  assert.equal(parsed.value, 1234.56);
});

test("parses french format value", () => {
  const parsed = parseLocalizedPrice("1 234,56");
  assert.equal(parsed.isValid, true);
  assert.equal(parsed.value, 1234.56);
});

test("rejects negative values", () => {
  const parsed = parseLocalizedPrice("-10");
  assert.equal(parsed.isValid, false);
});

test("sanitizes invalid characters", () => {
  const sanitized = sanitizePriceInput("12a$3,4.5");
  assert.equal(sanitized, "123,4.5");
});

test("calculates ontario HST and rounds each component", () => {
  const breakdown = calculateTaxBreakdown(19.99, ONTARIO_RATES);
  assert.deepEqual(breakdown, {
    basePrice: 19.99,
    federalTax: 2.6,
    provincialTax: 0,
    totalTax: 2.6,
    finalPrice: 22.59
  });
});

test("calculates quebec GST + QST", () => {
  const breakdown = calculateTaxBreakdown(100, QUEBEC_RATES);
  assert.deepEqual(breakdown, {
    basePrice: 100,
    federalTax: 5,
    provincialTax: 9.98,
    totalTax: 14.98,
    finalPrice: 114.98
  });
});
