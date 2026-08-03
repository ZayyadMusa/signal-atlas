const rainfallChart =
    document.getElementById("rainfall-chart");
const rainfallChartDescription =
    document.getElementById("rainfall-chart-description");
const rainfallScaleMaximum =
    document.getElementById("rainfall-scale-maximum");
const rainfallBars =
    document.getElementById("rainfall-bars");

const rainfallFormatter = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 1,
});

export function showRainfallChart(report) {
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

    const wettestValue = rainfallFormatter.format(
        wettestMonth.rainfall.total_mm
    );

    rainfallChartDescription.textContent =
        `${report.location.name}'s wettest month in ` +
        `${report.period.year} was ${wettestMonth.name}, with an ` +
        `estimated ${wettestValue} mm of rainfall.`;

    rainfallScaleMaximum.textContent =
        rainfallFormatter.format(scaleMaximum);

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
                rainfallFormatter.format(rainfall);

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

export function hideRainfallChart() {
    rainfallChart.hidden = true;
    rainfallBars.replaceChildren();
}
