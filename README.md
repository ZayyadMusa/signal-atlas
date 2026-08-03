# Signal Atlas

> A clear visual explanation of historical rainfall and temperature patterns for selected locations in Nigeria.

## Why I am building this

I am building Signal Atlas because I want to contribute to agriculture and environmental sustainability in Nigeria. Agriculture matters to me because it supports human survival, food security and the health of our environment. I want to build a system that helps people understand conditions that may affect growing seasons before those conditions become serious obstacles. Environmental data should be clear enough for people to read, understand and use with confidence. This project is also how I am learning to build a complete system from the ground up and explain the decisions behind it.

## What Signal Atlas does

Signal Atlas currently allows users to:

- Select a Nigerian location.
- View its estimated total rainfall and average temperature for 2025.
- Explore monthly rainfall using a bar chart.
- Follow monthly temperature changes using a line chart.
- Open a table containing the exact monthly temperature values.
- Check the period, coordinates, elevation, source and data coverage.
- See notices when data is missing.
- Use the report on desktop and mobile.

## Locations

The current locations are:

- Abuja
- Kaduna
- Lagos
- Port Harcourt

Each location represents a regional point. It does not represent every address, farm or weather station within that area.

## Data source

Signal Atlas uses historical meteorological data from the [NASA POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/).

The current dataset covers 1 January to 31 December 2025 and contains:

- `T2M`: Daily temperature at two metres.
- `PRECTOTCORR`: Corrected daily precipitation.
- MERRA-2 meteorological data.
- Local Solar Time.

The original API responses are stored in `data/raw/`. More information about the files, coordinates, access date and attribution is available in [`data/README.md`](data/README.md).

## How the data is processed

The data moves through the project in four stages:

1. `scripts/fetch_power_data.py` requests daily data from NASA POWER.
2. The original responses are saved in `data/raw/`.
3. `scripts/process_power_data.py` converts the daily values into monthly reports.
4. The processed files are saved in `web/data/` and displayed by the website.

For each month:

- Temperature is calculated as the average of the valid daily temperature values.
- Rainfall is calculated by adding the valid daily rainfall values.
- NASA POWER's `-999` fill value is treated as missing data.
- Valid and missing day counts are kept in the processed report.

The original files are not modified during processing.

## Data limitations

NASA POWER provides gridded regional estimates rather than measurements from an individual farm or weather station. Its meteorological data has a spatial resolution of approximately 0.5 Ã— 0.625 degrees, or roughly 50 kilometres.

Selecting precise coordinates in the future will help identify the correct regional grid, but it will not turn the result into address-level weather data.

Signal Atlas currently describes historical conditions. It does not provide:

- Weather forecasts
- Crop recommendations
- Planting instructions
- Professional agricultural advice
- Exact farm-level measurements

See the [NASA POWER data-service guidance](https://power.larc.nasa.gov/docs/services/) for more information about resolution and data updates.

## Project structure

- `data/raw/` â€” original NASA POWER responses
- `scripts/fetch_power_data.py` â€” downloads daily data
- `scripts/process_power_data.py` â€” creates monthly reports
- `web/data/` â€” processed reports used by the website
- `web/index.html` â€” page content and report structure
- `web/styles.css` â€” page foundation and layout
- `web/charts.css` â€” rainfall and temperature chart styles
- `web/script.js` â€” location selection, loading and report state
- `web/rainfall-chart.js` â€” monthly rainfall rendering
- `web/temperature-chart.js` â€” temperature plot and data table
- `DESIGN.md` â€” visual and interface decisions

## Run the website locally

Clone the repository and enter its directory:

```powershell
git clone https://github.com/ZayyadMusa/signal-atlas.git
cd signal-atlas
```

Start a local web server:

```powershell
python -m http.server 8000 --directory web
```

Then open:

```text
http://localhost:8000
```

A local server is required because the website loads JSON files and JavaScript modules. Opening `index.html` directly through a `file:///` address may not work.

## Regenerate the data

Download the raw 2025 data:

```powershell
python .\scripts\fetch_power_data.py
```

Create the monthly reports:

```powershell
python .\scripts\process_power_data.py
```

Both scripts use Python's standard library, so no additional Python packages are currently required.

## Accessibility

Signal Atlas currently uses:

- Semantic HTML landmarks and headings
- Native form controls
- Keyboard-visible focus indicators
- A live status message
- Loading and error states
- Text summaries alongside charts
- Keyboard-accessible temperature points
- A table containing exact temperature values
- Missing-data notices

## Future plans

Possible later additions include:

- Detecting the user's current location with permission
- Searching for an address or selecting a point on a map
- A backend for requesting and caching coordinate-based reports
- Weekly and daily detail views
- More locations and years
- Automated tests
- Deployment as a public website

Current-location and address support will be added after the fixed-location data pipeline and report have been fully tested.

## Learning goals

Through this project, I am developing practical skills in:

- HTML, CSS and JavaScript
- Accessible data visualisation
- Git and GitHub
- Python and data analysis
- Working with external APIs
- Data validation and documentation
- Full-stack application design
- Testing and technical decision-making

## Project status

**Working historical-data report**

The data download and processing pipeline is working. The website can load and explain monthly rainfall and temperature data for four locations. Development is continuing incrementally so that each part is understood before more complexity is added.

## Licence

The Signal Atlas source code is licensed under the MIT Licence.

NASA POWER data is credited separately and is not presented as original Signal Atlas data.