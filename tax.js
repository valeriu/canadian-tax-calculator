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

const I18N = {
	en: {
		title: "Canadian Tax Calculator",
		languageLabel: "Language",
		priceLabel: "Price (CAD)",
		pricePlaceholder: "e.g. 100.00",
		provinceLabel: "Province or territory",
		gstLine: "Federal GST/HST",
		pstLine: "Provincial tax (PST/QST/RST)",
		totalTaxLine: "Total taxes",
		finalPriceLine: "Price after taxes",
		errorUnknownProvince: "Unknown province selected.",
		errorInvalidNumber: "Enter a valid non-negative number.",
		provinces: {
			alberta: "Alberta",
			british_columbia: "British Columbia",
			manitoba: "Manitoba",
			new_brunswick: "New Brunswick",
			newfoundland_labrador: "Newfoundland and Labrador",
			northwest_territories: "Northwest Territories",
			nova_scotia: "Nova Scotia",
			nunavut: "Nunavut",
			ontario: "Ontario",
			prince_edward_island: "Prince Edward Island",
			quebec: "Quebec",
			saskatchewan: "Saskatchewan",
			yukon: "Yukon"
		}
	},
	fr: {
		title: "Calculateur de taxes canadiennes",
		languageLabel: "Langue",
		priceLabel: "Prix (CAD)",
		pricePlaceholder: "ex. 100,00",
		provinceLabel: "Province ou territoire",
		gstLine: "TPS/TVH federale",
		pstLine: "Taxe provinciale (TVP/TVQ)",
		totalTaxLine: "Taxes totales",
		finalPriceLine: "Prix apres taxes",
		errorUnknownProvince: "Province inconnue selectionnee.",
		errorInvalidNumber: "Entrez un nombre valide positif ou nul.",
		provinces: {
			alberta: "Alberta",
			british_columbia: "Colombie-Britannique",
			manitoba: "Manitoba",
			new_brunswick: "Nouveau-Brunswick",
			newfoundland_labrador: "Terre-Neuve-et-Labrador",
			northwest_territories: "Territoires du Nord-Ouest",
			nova_scotia: "Nouvelle-Ecosse",
			nunavut: "Nunavut",
			ontario: "Ontario",
			prince_edward_island: "Ile-du-Prince-Edouard",
			quebec: "Quebec",
			saskatchewan: "Saskatchewan",
			yukon: "Yukon"
		}
	}
};

const priceInput = document.getElementById("price");
const provinceSelect = document.getElementById("province");
const languageSelect = document.getElementById("language");
const errorEl = document.getElementById("error");
const gstEl = document.getElementById("gst");
const pstEl = document.getElementById("pst");
const totalTaxEl = document.getElementById("total-tax");
const finalPriceEl = document.getElementById("final-price");

let currentLanguage = "en";
let cadFormatter = buildCurrencyFormatter(currentLanguage);

function buildCurrencyFormatter(language) {
	const locale = language === "fr" ? "fr-CA" : "en-CA";
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency: "CAD"
	});
}

function t(key) {
	return I18N[currentLanguage][key] || I18N.en[key] || key;
}

function formatMoney(value) {
	return cadFormatter.format(value);
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

	const provinces = I18N[currentLanguage].provinces || I18N.en.provinces;
	for (const option of provinceSelect.options) {
		option.textContent = provinces[option.value] || option.value;
	}
}

function setLanguage(language) {
	currentLanguage = I18N[language] ? language : "en";
	cadFormatter = buildCurrencyFormatter(currentLanguage);
	languageSelect.value = currentLanguage;
	localStorage.setItem("language", currentLanguage);
	applyTranslations();
	calculate();
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
		errorEl.textContent = t("errorUnknownProvince");
		gstEl.textContent = formatMoney(0);
		pstEl.textContent = formatMoney(0);
		totalTaxEl.textContent = formatMoney(0);
		finalPriceEl.textContent = formatMoney(0);
		return;
	}

	if (!parsed.isValid) {
		errorEl.textContent = t("errorInvalidNumber");
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
languageSelect.addEventListener("change", (event) => {
	setLanguage(event.target.value);
});

const savedLanguage = localStorage.getItem("language");
setLanguage(savedLanguage || "en");
