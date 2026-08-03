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
const temperatureChart =
    document.getElementById("temperature-chart");
const temperatureChartDescription =
    document.getElementById("temperature-chart-description");
const temperaturePlotDescription =
    document.getElementById("temperature-plot-description");
const temperatureGrid =
    document.getElementById("temperature-grid");
const temperatureLine =
    document.getElementById("temperature-line");
const temperaturePoints =
    document.getElementById("temperature-points");
const temperatureLabels =
    document.getElementById("temperature-labels");
const temperatureTableBody =
    document.getElementById("temperature-table-body");

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

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
    hideTemperatureChart();
}

function resetReport() {
    resultsTitle.textContent = "No location selected";

    dataStatus.textContent =
        "Choose a location to prepare its report.";

    rainfallSummary.textContent = RAINFALL_PLACEHOLDER;
    temperatureSummary.textContent = TEMPERATURE_PLACEHOLDER;

    hideRainfallChart();
    hideTemperatureChart();
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
    hideTemperatureChart();

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
    showTemperatureChart(report);
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

function showTemperatureChart(report) {
    const validMonths = report.months.filter(
        (month) =>
            Number.isFinite(month.temperature.average_c)
    );

    if (validMonths.length === 0) {
        hideTemperatureChart();
        return;
    }

    const temperatures = validMonths.map(
        (month) => month.temperature.average_c
    );

    const minimumTemperature = Math.min(...temperatures);
    const maximumTemperature = Math.max(...temperatures);

    let scaleMinimum =
        Math.floor(minimumTemperature / 2) * 2;

    let scaleMaximum =
        Math.ceil(maximumTemperature / 2) * 2;

    if (scaleMinimum === minimumTemperature) {
        scaleMinimum -= 2;
    }

    if (scaleMaximum === maximumTemperature) {
        scaleMaximum += 2;
    }

    if (scaleMinimum === scaleMaximum) {
        scaleMinimum -= 2;
        scaleMaximum += 2;
    }

    const coolestMonth = validMonths.reduce(
        (coolest, month) =>
            month.temperature.average_c <
            coolest.temperature.average_c
                ? month
                : coolest
    );

    const warmestMonth = validMonths.reduce(
        (warmest, month) =>
            month.temperature.average_c >
            warmest.temperature.average_c
                ? month
                : warmest
    );

    const coolestValue = temperatureFormatter.format(
        coolestMonth.temperature.average_c
    );

    const warmestValue = temperatureFormatter.format(
        warmestMonth.temperature.average_c
    );

    const description =
        `${report.location.name}'s estimated monthly average ` +
        `temperature ranged from ${coolestValue} °C in ` +
        `${coolestMonth.name} to ${warmestValue} °C in ` +
        `${warmestMonth.name} during ${report.period.year}.`;

    temperatureChartDescription.textContent = description;
    temperaturePlotDescription.textContent = description;

    temperatureGrid.replaceChildren();
    temperaturePoints.replaceChildren();
    temperatureLabels.replaceChildren();
    temperatureTableBody.replaceChildren();

    const width = 960;
    const height = 360;
    const left = 64;
    const right = 24;
    const top = 24;
    const bottom = 60;

    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    const valueToY = (value) =>
        top +
        (
            (scaleMaximum - value) /
            (scaleMaximum - scaleMinimum)
        ) *
        plotHeight;

    for (
        let temperature = scaleMinimum;
        temperature <= scaleMaximum;
        temperature += 2
    ) {
        const y = valueToY(temperature);

        const gridLine = createSvgElement("line", {
            x1: left,
            x2: width - right,
            y1: y,
            y2: y,
            class: "temperature-chart__grid-line",
        });

        const gridLabel = createSvgElement("text", {
            x: left - 12,
            y: y + 5,
            "text-anchor": "end",
            class: "temperature-chart__axis-label",
        });

        gridLabel.textContent = `${temperature}°`;

        temperatureGrid.append(gridLine, gridLabel);
    }

    const pathCommands = [];
    let continuesLine = false;

    report.months.forEach((month, index) => {
        const temperature = month.temperature.average_c;
        const missingDays = month.temperature.missing_days;
        const hasValue = Number.isFinite(temperature);

        const x =
            left +
            index * (plotWidth / (report.months.length - 1));

        const monthLabel = createSvgElement("text", {
            x,
            y: height - bottom + 34,
            "text-anchor": "middle",
            class: "temperature-chart__axis-label",
        });

        monthLabel.textContent = month.name.slice(0, 3);

        temperatureLabels.append(monthLabel);

        const tableRow = document.createElement("tr");
        const tableMonth = document.createElement("th");
        const tableValue = document.createElement("td");
        const tableCoverage = document.createElement("td");

        tableMonth.scope = "row";
        tableMonth.textContent = month.name;

        const expectedDays =
            month.temperature.valid_days + missingDays;

        tableCoverage.textContent =
            `${month.temperature.valid_days} of ` +
            `${expectedDays} days`;

        if (hasValue) {
            const y = valueToY(temperature);
            const command = continuesLine ? "L" : "M";

            pathCommands.push(`${command} ${x} ${y}`);
            continuesLine = true;

            const formattedTemperature =
                temperatureFormatter.format(temperature);

            const point = createSvgElement("circle", {
                cx: x,
                cy: y,
                r: 5,
                class: "temperature-chart__point",
                tabindex: 0,
                role: "img",
            });

            if (missingDays > 0) {
                point.classList.add(
                    "temperature-chart__point--partial"
                );
            }

            const pointDescription =
                `${month.name}: ${formattedTemperature} degrees ` +
                `Celsius, based on ` +
                `${month.temperature.valid_days} valid days and ` +
                `${missingDays} missing days.`;

            point.setAttribute(
                "aria-label",
                pointDescription
            );

            const pointTitle = createSvgElement("title");
            pointTitle.textContent = pointDescription;
            point.append(pointTitle);

            temperaturePoints.append(point);

            tableValue.textContent =
                `${formattedTemperature} °C`;
        } else {
            continuesLine = false;
            tableValue.textContent = "No data";
        }

        tableRow.append(
            tableMonth,
            tableValue,
            tableCoverage
        );

        temperatureTableBody.append(tableRow);
    });

    temperatureLine.setAttribute(
        "d",
        pathCommands.join(" ")
    );

    temperatureChart.hidden = false;
}

function hideTemperatureChart() {
    temperatureChart.hidden = true;
    temperatureGrid.replaceChildren();
    temperaturePoints.replaceChildren();
    temperatureLabels.replaceChildren();
    temperatureTableBody.replaceChildren();
    temperatureLine.setAttribute("d", "");
}

function createSvgElement(tagName, attributes = {}) {
    const element = document.createElementNS(
        SVG_NAMESPACE,
        tagName
    );

    Object.entries(attributes).forEach(
        ([name, value]) => {
            element.setAttribute(name, String(value));
        }
    );

    return element;
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
    hideTemperatureChart();
}

handleLocationChange();