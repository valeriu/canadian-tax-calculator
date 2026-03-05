const I18N = window.TAX_I18N || {};
const TAX_CONFIG = window.TAX_CONFIG || { lastUpdated: "N/A", rates: {} };
const PROVINCE_LABELS = window.PROVINCE_LABELS || { en: {}, fr: {} };
const TAX_TYPE_LABELS = window.TAX_TYPE_LABELS || { en: {}, fr: {} };

const priceInput = document.getElementById("price");
const provinceSelect = document.getElementById("province");
const languageSelect = document.getElementById("language");
const errorEl = document.getElementById("error");
const basePriceEl = document.getElementById("base-price");
const gstEl = document.getElementById("gst");
const pstEl = document.getElementById("pst");
const totalTaxEl = document.getElementById("total-tax");
const finalPriceEl = document.getElementById("final-price");
const resetButton = document.getElementById("reset");
const taxModelEl = document.getElementById("tax-model");
const ratesNoteEl = document.getElementById("rates-note");
const federalTaxLabelEl = document.getElementById("federal-tax-label");
const provincialTaxLabelEl = document.getElementById("provincial-tax-label");

let currentLanguage = "en";
let cadFormatter = buildCurrencyFormatter(currentLanguage);

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sanitizePriceInput(rawValue) {
  return rawValue.replace(/[^\d.,\s-]/g, "");
}

function parseLocalizedPrice(rawValue) {
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

function calculateTaxBreakdown(basePrice, rates) {
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

function buildCurrencyFormatter(language) {
  const locale = language === "fr" ? "fr-CA" : "en-CA";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CAD"
  });
}

function t(key) {
  const langData = I18N[currentLanguage] || I18N.en || {};
  const enData = I18N.en || {};
  return langData[key] || enData[key] || key;
}

function formatMoney(value) {
  return cadFormatter.format(value);
}

function getCurrentRates() {
  return TAX_CONFIG.rates[provinceSelect.value] || null;
}

function renderProvinceOptions(selectedValue) {
  const labels = PROVINCE_LABELS[currentLanguage] || PROVINCE_LABELS.en || {};
  const provinceKeys = Object.keys(TAX_CONFIG.rates);
  const activeValue = selectedValue && TAX_CONFIG.rates[selectedValue] ? selectedValue : "ontario";

  provinceSelect.innerHTML = "";
  for (const key of provinceKeys) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = labels[key] || (PROVINCE_LABELS.en && PROVINCE_LABELS.en[key]) || key;
    option.selected = key === activeValue;
    provinceSelect.appendChild(option);
  }
}

function updateRatesNote() {
  ratesNoteEl.textContent = `${t("ratesNotePrefix")}: ${TAX_CONFIG.lastUpdated}.`;
}

function updateRateLabels(rates) {
  if (!rates) {
    federalTaxLabelEl.textContent = `${t("federalTaxPrefix")} (GST/HST)`;
    provincialTaxLabelEl.textContent = `${t("provincialTaxPrefix")} (${t("noneProvincial")})`;
    taxModelEl.textContent = "";
    return;
  }

  const typeLabels = TAX_TYPE_LABELS[currentLanguage] || TAX_TYPE_LABELS.en || {};
  const federalType = typeLabels[rates.federalType] || rates.federalType;
  const provincialType = typeLabels[rates.provincialType] || rates.provincialType;

  federalTaxLabelEl.textContent = `${t("federalTaxPrefix")} (${federalType})`;
  provincialTaxLabelEl.textContent = `${t("provincialTaxPrefix")} (${provincialType})`;

  const isHstOnly = rates.federalType === "HST" && rates.provincialType === "NONE";
  taxModelEl.textContent = isHstOnly ? t("modelHstOnly") : t("modelSplit");
}

function applyTranslations() {
  const textNodes = document.querySelectorAll("[data-i18n]");
  for (const node of textNodes) {
    const key = node.getAttribute("data-i18n");
    node.textContent = t(key);
  }

  const placeholderNodes = document.querySelectorAll("[data-i18n-placeholder]");
  for (const node of placeholderNodes) {
    const key = node.getAttribute("data-i18n-placeholder");
    node.setAttribute("placeholder", t(key));
  }

  renderProvinceOptions(provinceSelect.value);
  updateRateLabels(getCurrentRates());
  updateRatesNote();
}

function setLanguage(language) {
  currentLanguage = I18N[language] ? language : "en";
  cadFormatter = buildCurrencyFormatter(currentLanguage);
  languageSelect.value = currentLanguage;
  localStorage.setItem("language", currentLanguage);
  applyTranslations();
  calculate();
}

function clearResults() {
  basePriceEl.textContent = formatMoney(0);
  gstEl.textContent = formatMoney(0);
  pstEl.textContent = formatMoney(0);
  totalTaxEl.textContent = formatMoney(0);
  finalPriceEl.textContent = formatMoney(0);
}

function calculate() {
  const rates = getCurrentRates();
  const parsed = parseLocalizedPrice(priceInput.value);

  if (!rates) {
    errorEl.textContent = t("errorUnknownProvince");
    updateRateLabels(null);
    clearResults();
    return;
  }

  updateRateLabels(rates);

  if (!parsed.isValid) {
    errorEl.textContent = t("errorInvalidNumber");
    clearResults();
    return;
  }

  errorEl.textContent = "";
  const breakdown = calculateTaxBreakdown(parsed.value, rates);
  basePriceEl.textContent = formatMoney(breakdown.basePrice);
  gstEl.textContent = formatMoney(breakdown.federalTax);
  pstEl.textContent = formatMoney(breakdown.provincialTax);
  totalTaxEl.textContent = formatMoney(breakdown.totalTax);
  finalPriceEl.textContent = formatMoney(breakdown.finalPrice);
}

function resetForm() {
  priceInput.value = "";
  provinceSelect.value = "ontario";
  errorEl.textContent = "";
  calculate();
}

priceInput.addEventListener("input", () => {
  const sanitized = sanitizePriceInput(priceInput.value);
  if (sanitized !== priceInput.value) {
    priceInput.value = sanitized;
  }
  calculate();
});

provinceSelect.addEventListener("change", calculate);
languageSelect.addEventListener("change", (event) => {
  setLanguage(event.target.value);
});
resetButton.addEventListener("click", resetForm);

function init() {
  renderProvinceOptions("ontario");
  const savedLanguage = localStorage.getItem("language");
  setLanguage(savedLanguage || "en");
}

init();
