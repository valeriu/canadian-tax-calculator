"use strict";

const TAX_RATES = {
  alberta: { gst: 0.05, pst: 0.0 },
  british_columbia: { gst: 0.05, pst: 0.07 },
  manitoba: { gst: 0.05, pst: 0.07 },
  new_brunswick: { gst: 0.15, pst: 0.0 },
  newfoundland_labrador: { gst: 0.15, pst: 0.0 },
  northwest_territories: { gst: 0.05, pst: 0.0 },
  nova_scotia: { gst: 0.15, pst: 0.0 },
  nunavut: { gst: 0.05, pst: 0.0 },
  ontario: { gst: 0.13, pst: 0.0 },
  prince_edward_island: { gst: 0.15, pst: 0.0 },
  quebec: { gst: 0.05, pst: 0.09975 },
  saskatchewan: { gst: 0.05, pst: 0.06 },
  yukon: { gst: 0.05, pst: 0.0 }
};

const priceInput = document.getElementById("price");
const provinceSelect = document.getElementById("province");
const errorEl = document.getElementById("error");
const gstEl = document.getElementById("gst");
const pstEl = document.getElementById("pst");
const totalTaxEl = document.getElementById("total-tax");
const finalPriceEl = document.getElementById("final-price");

const cadFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD"
});

function formatMoney(value) {
  return cadFormatter.format(value);
}

function parsePrice(rawValue) {
  const normalized = rawValue.trim().replace(/,/g, "");
  if (normalized === "") {
    return { value: 0, isValid: true };
  }

  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return { value: 0, isValid: false };
  }

  return { value, isValid: true };
}

function calculate() {
  const selectedProvince = provinceSelect.value;
  const rates = TAX_RATES[selectedProvince];
  const parsed = parsePrice(priceInput.value);

  if (!rates) {
    errorEl.textContent = "Unknown province selected.";
    gstEl.textContent = formatMoney(0);
    pstEl.textContent = formatMoney(0);
    totalTaxEl.textContent = formatMoney(0);
    finalPriceEl.textContent = formatMoney(0);
    return;
  }

  if (!parsed.isValid) {
    errorEl.textContent = "Enter a valid non-negative number.";
    gstEl.textContent = formatMoney(0);
    pstEl.textContent = formatMoney(0);
    totalTaxEl.textContent = formatMoney(0);
    finalPriceEl.textContent = formatMoney(0);
    return;
  }

  errorEl.textContent = "";

  const basePrice = parsed.value;
  const gst = basePrice * rates.gst;
  const pst = basePrice * rates.pst;
  const totalTax = gst + pst;
  const finalPrice = basePrice + totalTax;

  gstEl.textContent = formatMoney(gst);
  pstEl.textContent = formatMoney(pst);
  totalTaxEl.textContent = formatMoney(totalTax);
  finalPriceEl.textContent = formatMoney(finalPrice);
}

priceInput.addEventListener("input", calculate);
provinceSelect.addEventListener("change", calculate);

calculate();
