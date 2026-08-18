import {
    hideRainfallChart,
    showRainfallChart,
} from "./rainfall-chart.js";

import {
    hideTemperatureChart,
    showTemperatureChart,
} from "./temperature-chart.js";

const locationSelect = document.getElementById("location");
const yearSelect = document.getElementById("report-year");
const viewConditionsButton =
    document.getElementById("view-conditions");
const resultsSection = document.getElementById("results");
const resultsTitle = document.getElementById("results-title");
const dataStatus = document.getElementById("data-status");
const reportActions = document.getElementById("report-actions");
const copyReportLinkButton =
    document.getElementById("copy-report-link");
const downloadReportCsvButton =
    document.getElementById("download-report-csv");
const copyLinkStatus =
    document.getElementById("copy-link-status");
const rainfallSummary =
    document.getElementById("rainfall-summary");
const temperatureSummary =
    document.getElementById("temperature-summary");

const reportDetailsStatus =
    document.getElementById("report-details-status");
const reportMetadata =
    document.getElementById("report-metadata");
const reportPeriod =
    document.getElementById("report-period");
const reportCoordinates =
    document.getElementById("report-coordinates");
const reportElevation =
    document.getElementById("report-elevation");
const reportMeasurements =
    document.getElementById("report-measurements");
const reportSource =
    document.getElementById("report-source");
const reportTimeStandard =
    document.getElementById("report-time-standard");
const reportCoverage =
    document.getElementById("report-coverage");
const reportLimitation =
    document.getElementById("report-limitation");
const yearComparison = document.getElementById("year-comparison");
const yearComparisonDescription = document.getElementById("year-comparison-description");
const rainfallComparison = document.getElementById("rainfall-comparison");
const temperatureComparison = document.getElementById("temperature-comparison");

const RAINFALL_PLACEHOLDER =
    "Monthly rainfall totals will appear here in millimetres.";

const TEMPERATURE_PLACEHOLDER =
    "Monthly temperature information will appear here in degrees Celsius.";

const REPORT_YEARS = ["2025", "2024", "2023"];

const annualRainfallFormatter = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
});

const temperatureFormatter = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
});

let currentReport = null;

viewConditionsButton.addEventListener(
    "click",
    () => loadSelectedReport()
);

window.addEventListener(
    "popstate",
    restoreReportFromUrl
);

locationSelect.addEventListener(
    "change",
    handleLocationChange
);

yearSelect.addEventListener(
    "change",
    handleLocationChange
);

copyReportLinkButton.addEventListener("click", copyReportLink);
downloadReportCsvButton.addEventListener("click", downloadReportCsv);

function handleLocationChange() {
    if (!locationSelect.value) {
        resetReport();
        return;
    }

    const selectedOption =
        locationSelect.options[locationSelect.selectedIndex];

    const locationName = selectedOption.textContent.trim();
    const reportYear = yearSelect.value;

    resultsTitle.textContent = `${locationName}, ${reportYear} selected`;

    dataStatus.textContent =
        `Select View conditions to load the ${locationName} ` +
        `${reportYear} report.`;

    rainfallSummary.textContent = RAINFALL_PLACEHOLDER;
    temperatureSummary.textContent = TEMPERATURE_PLACEHOLDER;

    showReportDetailsPlaceholder(
        "Load the report to see its source and coverage details."
    );

    hideCharts();
}

function resetReport() {
    resultsTitle.textContent = "No location selected";

    dataStatus.textContent =
        "Choose a location to prepare its report.";

    rainfallSummary.textContent = RAINFALL_PLACEHOLDER;
    temperatureSummary.textContent = TEMPERATURE_PLACEHOLDER;

    showReportDetailsPlaceholder(
        "Choose a location to see its period, coordinates and source."
    );

    hideCharts();
}

async function loadSelectedReport({
    updateHistory = true,
    scrollToResults = true,
} = {}) {
    const locationSlug = locationSelect.value;
    const reportYear = yearSelect.value;

    if (!locationSlug) {
        dataStatus.textContent =
            "Choose a location before viewing its conditions.";

        locationSelect.focus();
        return;
    }

    const selectedOption =
        locationSelect.options[locationSelect.selectedIndex];

    const locationName = selectedOption.textContent.trim();

    showLoadingState(locationName, reportYear);

    if (scrollToResults) {
        resultsSection.scrollIntoView();
    }

    try {
        const response = await fetch(
            `data/${locationSlug}-${reportYear}.json`
        );

        if (!response.ok) {
            throw new Error(
                `The report request returned ${response.status}.`
            );
        }

        const report = await response.json();

        showReport(report);
        await loadYearComparison(report, locationSlug, reportYear);

        if (updateHistory) {
            updateReportUrl(locationSlug, reportYear);
        }
    } catch (error) {
        console.error(
            `Could not load the ${locationName} report.`,
            error
        );

        showErrorState(locationName);
    } finally {
        resultsSection.setAttribute("aria-busy", "false");
        locationSelect.disabled = false;
        yearSelect.disabled = false;
        viewConditionsButton.disabled = false;
        viewConditionsButton.textContent = "View conditions";
    }
}

function updateReportUrl(locationSlug, reportYear) {
    const url = new URL(window.location.href);

    url.searchParams.set("location", locationSlug);
    url.searchParams.set("year", reportYear);

    if (url.href !== window.location.href) {
        window.history.pushState(null, "", url);
    }
}

function selectHasValue(select, value) {
    return Array.from(select.options).some(
        (option) => option.value === value
    );
}

async function restoreReportFromUrl() {
    const url = new URL(window.location.href);
    const locationSlug = url.searchParams.get("location");
    const reportYear = url.searchParams.get("year");
    let urlChanged = false;

    if (reportYear && selectHasValue(yearSelect, reportYear)) {
        yearSelect.value = reportYear;
    } else if (reportYear) {
        url.searchParams.delete("year");
        urlChanged = true;
    }

    if (locationSlug && selectHasValue(locationSelect, locationSlug)) {
        locationSelect.value = locationSlug;
    } else {
        locationSelect.value = "";

        if (locationSlug) {
            url.searchParams.delete("location");
            urlChanged = true;
        }
    }

    if (urlChanged) {
        window.history.replaceState(null, "", url);
    }

    handleLocationChange();

    if (locationSelect.value) {
        await loadSelectedReport({
            updateHistory: false,
            scrollToResults: true,
        });
    }
}

function showLoadingState(locationName, reportYear) {
    resultsSection.setAttribute("aria-busy", "true");

    resultsTitle.textContent =
        `Loading ${locationName} ${reportYear} report`;

    dataStatus.textContent =
        `Retrieving the historical report for ${locationName}.`;

    rainfallSummary.textContent =
        "Loading rainfall data...";

    temperatureSummary.textContent =
        "Loading temperature data...";

    showReportDetailsPlaceholder(
        `Loading report details for ${locationName}...`
    );

    hideCharts();

    locationSelect.disabled = true;
    yearSelect.disabled = true;
    viewConditionsButton.disabled = true;
    viewConditionsButton.textContent = "Loading...";
}

function showReport(report) {
    currentReport = report;
    const location = report.location;
    const period = report.period;
    const summary = report.annual_summary;

    const missingTemperatureDays = report.months.reduce(
        (total, month) =>
            total + month.temperature.missing_days,
        0
    );

    const missingRainfallDays = report.months.reduce(
        (total, month) =>
            total + month.rainfall.missing_days,
        0
    );

    const expectedDays = report.months.reduce(
        (total, month) =>
            total +
            month.temperature.valid_days +
            month.temperature.missing_days,
        0
    );

    resultsTitle.textContent = `${location.name} report`;

    if (summary.total_rainfall_mm === null) {
        rainfallSummary.textContent =
            "There is not enough valid rainfall data for this period.";
    } else {
        const rainfall = annualRainfallFormatter.format(
            summary.total_rainfall_mm
        );

        rainfallSummary.textContent =
            `The estimated rainfall total across ${period.year} ` +
            `was about ${rainfall} mm.`;
    }

    if (summary.average_temperature_c === null) {
        temperatureSummary.textContent =
            "There is not enough valid temperature data for this period.";
    } else {
        const temperature = temperatureFormatter.format(
            summary.average_temperature_c
        );

        temperatureSummary.textContent =
            `The estimated average temperature across ${period.year} ` +
            `was ${temperature} °C.`;
    }

    if (
        missingTemperatureDays === 0 &&
        missingRainfallDays === 0
    ) {
        dataStatus.textContent =
            `${report.source.provider} estimates for the area around ` +
            `${location.name} in ${period.year}. All ${expectedDays} ` +
            "daily records are present for both measurements.";
    } else {
        dataStatus.textContent =
            `${report.source.provider} estimates for the area around ` +
            `${location.name} in ${period.year}. Missing daily records: ` +
            `${missingTemperatureDays} temperature and ` +
            `${missingRainfallDays} rainfall.`;
    }

    showReportDetails(report, expectedDays);
    showRainfallChart(report);
    showTemperatureChart(report);
    reportActions.hidden = false;
    copyLinkStatus.textContent = "";
}

function downloadReportCsv() {
    if (!currentReport) return;

    const headers = [
        "Month",
        "Average temperature (°C)",
        "Temperature valid days",
        "Temperature missing days",
        "Total rainfall (mm)",
        "Rainfall valid days",
        "Rainfall missing days",
    ];
    const rows = currentReport.months.map((month) => [
        month.name,
        month.temperature.average_c ?? "",
        month.temperature.valid_days,
        month.temperature.missing_days,
        month.rainfall.total_mm ?? "",
        month.rainfall.valid_days,
        month.rainfall.missing_days,
    ]);
    const csv = [headers, ...rows]
        .map((row) => row.map(escapeCsvValue).join(","))
        .join("\r\n");
    const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download =
        `${currentReport.location.slug}-${currentReport.period.year}` +
        "-monthly-climate.csv";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
}

function escapeCsvValue(value) {
    const text = String(value);
    return /[",\r\n]/.test(text)
        ? `"${text.replaceAll('"', '""')}"`
        : text;
}

async function copyReportLink() {
    copyReportLinkButton.disabled = true;
    copyLinkStatus.textContent = "Copying link...";

    try {
        await navigator.clipboard.writeText(window.location.href);
        copyLinkStatus.textContent = "Report link copied.";
    } catch (error) {
        console.error("Could not copy the report link.", error);
        copyLinkStatus.textContent =
            "The link could not be copied. Copy it from the address bar.";
    } finally {
        copyReportLinkButton.disabled = false;
    }
}

async function loadYearComparison(report, locationSlug, reportYear) {
    const reportYearIndex = REPORT_YEARS.indexOf(reportYear);
    const comparisonYear = reportYearIndex < REPORT_YEARS.length - 1
        ? REPORT_YEARS[reportYearIndex + 1]
        : REPORT_YEARS[reportYearIndex - 1];

    yearComparison.hidden = false;
    yearComparisonDescription.textContent = `Comparing ${reportYear} with ${comparisonYear} for ${report.location.name}.`;
    rainfallComparison.textContent = "Loading comparison...";
    temperatureComparison.textContent = "Loading comparison...";

    try {
        const response = await fetch(`data/${locationSlug}-${comparisonYear}.json`);
        if (!response.ok) throw new Error(`The comparison request returned ${response.status}.`);
        showYearComparison(report, await response.json());
    } catch (error) {
        console.error(`Could not load the ${comparisonYear} comparison.`, error);
        yearComparisonDescription.textContent = `The ${comparisonYear} comparison could not be loaded. The ${reportYear} report above is still available.`;
        rainfallComparison.textContent = "Not available";
        temperatureComparison.textContent = "Not available";
    }
}

function showYearComparison(report, comparisonReport) {
    const reportYear = report.period.year;
    const comparisonYear = comparisonReport.period.year;
    const rainfallDifference = report.annual_summary.total_rainfall_mm - comparisonReport.annual_summary.total_rainfall_mm;
    const temperatureDifference = report.annual_summary.average_temperature_c - comparisonReport.annual_summary.average_temperature_c;

    yearComparisonDescription.textContent = `${reportYear} compared with ${comparisonYear} for ${report.location.name}. These differences describe the two historical years; they are not a forecast.`;
    rainfallComparison.textContent = formatDifference(rainfallDifference, "mm", 0);
    temperatureComparison.textContent = formatDifference(temperatureDifference, "°C", 1);
}

function formatDifference(value, unit, fractionDigits) {
    const formatter = new Intl.NumberFormat("en-NG", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
    const magnitude = formatter.format(Math.abs(value));
    if (value === 0) return `No difference (${magnitude} ${unit})`;
    return `${magnitude} ${unit} ${value > 0 ? "higher" : "lower"}`;
}

function showReportDetails(report, expectedDays) {
    const location = report.location;
    const period = report.period;
    const source = report.source;
    const summary = report.annual_summary;

    reportPeriod.textContent =
        `${formatReportDate(period.start)}–` +
        `${formatReportDate(period.end)}`;

    reportCoordinates.textContent =
        `${formatCoordinate(location.latitude, "N", "S")}, ` +
        `${formatCoordinate(location.longitude, "E", "W")}`;

    reportElevation.textContent =
        location.elevation_m === null
            ? "Not available"
            : `${Math.round(location.elevation_m)} m above sea level`;

    reportMeasurements.textContent =
        "Monthly average temperature (°C) and " +
        "monthly rainfall total (mm)";

    const datasets = source.datasets.join(", ");

    reportSource.textContent =
        `${source.provider}; ${datasets}; ` +
        `${source.api_name} ${source.api_version}`;

    reportTimeStandard.textContent =
        source.time_standard === "LST"
            ? "Local Solar Time (LST)"
            : source.time_standard;

    reportCoverage.textContent =
        `${summary.temperature_days} of ${expectedDays} temperature ` +
        `days and ${summary.rainfall_days} of ${expectedDays} ` +
        "rainfall days";

    reportLimitation.textContent =
        "These are regional gridded estimates for the area around " +
        `${location.name}, not measurements from an individual farm ` +
        "or weather station.";

    reportDetailsStatus.hidden = true;
    reportMetadata.hidden = false;
    reportLimitation.hidden = false;
}

function showReportDetailsPlaceholder(message) {
    reportDetailsStatus.textContent = message;
    reportDetailsStatus.hidden = false;
    reportMetadata.hidden = true;
    reportLimitation.hidden = true;
    yearComparison.hidden = true;
    reportActions.hidden = true;
    copyLinkStatus.textContent = "";
    currentReport = null;
}

function formatReportDate(dateText) {
    return dateFormatter.format(
        new Date(`${dateText}T00:00:00Z`)
    );
}

function formatCoordinate(value, positive, negative) {
    const direction = value >= 0 ? positive : negative;

    return `${Math.abs(value).toFixed(2)}° ${direction}`;
}

function hideCharts() {
    hideRainfallChart();
    hideTemperatureChart();
}

function showErrorState(locationName) {
    resultsTitle.textContent =
        `${locationName} report unavailable`;

    rainfallSummary.textContent =
        "Rainfall data could not be loaded.";

    temperatureSummary.textContent =
        "Temperature data could not be loaded.";

    dataStatus.textContent =
        "Signal Atlas could not load this report. " +
        "Check your connection and try again.";

    showReportDetailsPlaceholder(
        "Report details could not be loaded."
    );

    hideCharts();
}

restoreReportFromUrl();
