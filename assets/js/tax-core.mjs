export function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function sanitizePriceInput(rawValue) {
  return rawValue.replace(/[^\d.,\s-]/g, "");
}

export function parseLocalizedPrice(rawValue) {
  const sanitized = sanitizePriceInput(rawValue).replace(/\s/g, "");
  if (sanitized === "") {
    return { value: 0, isValid: true };
  }

  const lastDot = sanitized.lastIndexOf(".");
  const lastComma = sanitized.lastIndexOf(",");
  const decimalIndex = Math.max(lastDot, lastComma);

  let normalized = sanitized;
  if (decimalIndex >= 0) {
    const integerPart = sanitized.slice(0, decimalIndex).replace(/[.,]/g, "");
    const fractionPart = sanitized.slice(decimalIndex + 1).replace(/[.,]/g, "");
    normalized = `${integerPart}.${fractionPart}`;
  } else {
    normalized = sanitized.replace(/[.,]/g, "");
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return { value: 0, isValid: false };
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: 0, isValid: false };
  }

  return { value: parsed, isValid: true };
}

export function calculateTaxBreakdown(basePrice, rates) {
  if (!rates) {
    return null;
  }

  const federalTax = roundCurrency(basePrice * rates.federal);
  const provincialTax = roundCurrency(basePrice * rates.provincial);
  const totalTax = roundCurrency(federalTax + provincialTax);
  const finalPrice = roundCurrency(basePrice + totalTax);

  return {
    basePrice: roundCurrency(basePrice),
    federalTax,
    provincialTax,
    totalTax,
    finalPrice
  };
}
