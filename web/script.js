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

const RAINFALL_PLACEHOLDER =
    "Monthly rainfall totals will appear here in millimetres.";

const TEMPERATURE_PLACEHOLDER =
    "Monthly temperature information will appear here in degrees Celsius.";

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

viewConditionsButton.addEventListener(
    "click",
    loadSelectedReport
);

locationSelect.addEventListener(
    "change",
    handleLocationChange
);

yearSelect.addEventListener(
    "change",
    handleLocationChange
);

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

async function loadSelectedReport() {
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
    resultsSection.scrollIntoView();

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

handleLocationChange();
