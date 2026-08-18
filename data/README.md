# Data

The files in `raw/` are unmodified responses from the NASA POWER Daily API.

## Locations

| Location | Latitude | Longitude |
| --- | ---: | ---: |
| Abuja | 9.0765 | 7.3986 |
| Kaduna | 10.5105 | 7.4165 |
| Lagos | 6.5244 | 3.3792 |
| Port Harcourt | 4.8156 | 7.0498 |

## Coverage

- Periods: 1 January–31 December 2023, 2024 and 2025
- Time standard: Local Solar Time
- Community: Agroclimatology
- API version: v2.9.6
- Source: MERRA-2
- Accessed: 3 August 2026 (2025 data) and 18 August 2026 (2023–2024 data)

## Measurements

- `T2M`: Daily temperature at two metres, measured in degrees Celsius.
- `PRECTOTCORR`: Corrected daily precipitation, measured in millimetres per day.

## Limitations

NASA POWER provides gridded regional estimates. These values are not
measurements from a weather station or individual farm.

Signal Atlas uses the data to explain broad historical patterns. It does
not provide forecasts, crop recommendations or professional agricultural
advice.

## Attribution

The data was obtained from the NASA Langley Research Center Prediction
Of Worldwide Energy Resources (POWER) project, funded through the NASA
Earth Science Division.

## Processed reports

`scripts/process_power_data.py` reads the original daily files and creates
smaller reports in `web/data/`.

For each month:

- Temperature is the average of the valid daily temperature values.
- Rainfall is the sum of the valid daily rainfall values.
- NASA POWER's `-999` fill value is treated as missing data.
- Valid and missing day counts are included in the output.

The processing script does not modify the original files in `data/raw/`.
