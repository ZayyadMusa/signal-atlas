const REPORT_YEAR = 2025;

const locationSelect = document.getElementById("location");
const viewConditionsButton =
    document.getElementById("view-conditions");
const resultsSection = document.getElementById("results");
const resultsTitle = document.getElementById("results-title");
const dataStatus = document.getElementById("data-status");
const rainfallSummary =
    document.getElementById("rainfall-summary");
const temperatureSummary =
    document.getElementById("temperature-summary");
const rainfallChart =
    document.getElementById("rainfall-chart");
const rainfallChartDescription =
    document.getElementById("rainfall-chart-description");
const rainfallScaleMaximum =
    document.getElementById("rainfall-scale-maximum");
const rainfallBars =
    document.getElementById("rainfall-bars");

const RAINFALL_PLACEHOLDER =
    "Monthly rainfall totals will appear here in millimetres.";

const TEMPERATURE_PLACEHOLDER =
    "Monthly temperature information will appear here in degrees Celsius.";

const annualRainfallFormatter = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
});

const monthlyRainfallFormatter = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 1,
});

const temperatureFormatter = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

viewConditionsButton.addEventListener(
    "click",
    loadSelectedReport
);

locationSelect.addEventListener(
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

    resultsTitle.textContent = `${locationName} selected`;

    dataStatus.textContent =
        `Select View conditions to load the ${locationName} report.`;

    rainfallSummary.textContent = RAINFALL_PLACEHOLDER;
    temperatureSummary.textContent = TEMPERATURE_PLACEHOLDER;

    hideRainfallChart();
}

function resetReport() {
    resultsTitle.textContent = "No location selected";

    dataStatus.textContent =
        "Choose a location to prepare its report.";

    rainfallSummary.textContent = RAINFALL_PLACEHOLDER;
    temperatureSummary.textContent = TEMPERATURE_PLACEHOLDER;

    hideRainfallChart();
}

async function loadSelectedReport() {
    const locationSlug = locationSelect.value;

    if (!locationSlug) {
        dataStatus.textContent =
            "Choose a location before viewing its conditions.";

        locationSelect.focus();
        return;
    }

    const selectedOption =
        locationSelect.options[locationSelect.selectedIndex];

    const locationName = selectedOption.textContent.trim();

    showLoadingState(locationName);
    resultsSection.scrollIntoView();

    try {
        const response = await fetch(
            `data/${locationSlug}-${REPORT_YEAR}.json`
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
        viewConditionsButton.disabled = false;
        viewConditionsButton.textContent = "View conditions";
    }
}

function showLoadingState(locationName) {
    resultsSection.setAttribute("aria-busy", "true");

    resultsTitle.textContent =
        `Loading ${locationName} report`;

    dataStatus.textContent =
        `Retrieving the historical report for ${locationName}.`;

    rainfallSummary.textContent =
        "Loading rainfall data...";

    temperatureSummary.textContent =
        "Loading temperature data...";

    hideRainfallChart();

    locationSelect.disabled = true;
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

    showRainfallChart(report);
}

function showRainfallChart(report) {
    const validMonths = report.months.filter(
        (month) =>
            Number.isFinite(month.rainfall.total_mm)
    );

    if (validMonths.length === 0) {
        hideRainfallChart();
        return;
    }

    const maximumRainfall = Math.max(
        ...validMonths.map(
            (month) => month.rainfall.total_mm
        )
    );

    const scaleMaximum = Math.max(
        50,
        Math.ceil(maximumRainfall / 50) * 50
    );

    const wettestMonth = validMonths.reduce(
        (wettest, month) => {
            if (
                month.rainfall.total_mm >
                wettest.rainfall.total_mm
            ) {
                return month;
            }

            return wettest;
        }
    );

    const wettestValue = monthlyRainfallFormatter.format(
        wettestMonth.rainfall.total_mm
    );

    rainfallChartDescription.textContent =
        `${report.location.name}'s wettest month in ` +
        `${report.period.year} was ${wettestMonth.name}, with an ` +
        `estimated ${wettestValue} mm of rainfall.`;

    rainfallScaleMaximum.textContent =
        monthlyRainfallFormatter.format(scaleMaximum);

    rainfallBars.replaceChildren();

    const chartRows = document.createDocumentFragment();

    report.months.forEach((month) => {
        const rainfall = month.rainfall.total_mm;
        const missingDays = month.rainfall.missing_days;
        const hasValue = Number.isFinite(rainfall);

        const chartRow = document.createElement("li");
        chartRow.className = "rainfall-chart__bar";

        if (missingDays > 0) {
            chartRow.dataset.partial = "true";
        }

        const monthLabel = document.createElement("span");
        monthLabel.className = "rainfall-chart__month";
        monthLabel.textContent = month.name.slice(0, 3);
        monthLabel.setAttribute("aria-hidden", "true");

        const track = document.createElement("span");
        track.className = "rainfall-chart__track";
        track.setAttribute("aria-hidden", "true");

        const fill = document.createElement("span");
        fill.className = "rainfall-chart__fill";

        const valueLabel = document.createElement("span");
        valueLabel.className = "rainfall-chart__value";
        valueLabel.setAttribute("aria-hidden", "true");

        if (hasValue) {
            const width = Math.min(
                (rainfall / scaleMaximum) * 100,
                100
            );

            const formattedRainfall =
                monthlyRainfallFormatter.format(rainfall);

            fill.style.setProperty(
                "--rainfall-width",
                `${width}%`
            );

            valueLabel.textContent =
                `${formattedRainfall} mm`;

            const coverageDescription =
                missingDays > 0
                    ? `, based on ${month.rainfall.valid_days} ` +
                      `valid days and ${missingDays} missing days`
                    : "";

            chartRow.setAttribute(
                "aria-label",
                `${month.name}: ${formattedRainfall} millimetres` +
                `${coverageDescription}.`
            );
        } else {
            fill.style.setProperty(
                "--rainfall-width",
                "0%"
            );

            valueLabel.textContent = "No data";

            chartRow.setAttribute(
                "aria-label",
                `${month.name}: no valid rainfall data.`
            );
        }

        track.append(fill);
        chartRow.append(monthLabel, track, valueLabel);
        chartRows.append(chartRow);
    });

    rainfallBars.append(chartRows);
    rainfallChart.hidden = false;
}

function hideRainfallChart() {
    rainfallChart.hidden = true;
    rainfallBars.replaceChildren();
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

    hideRainfallChart();
}

handleLocationChange();