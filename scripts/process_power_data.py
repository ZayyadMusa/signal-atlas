import calendar
import json
from datetime import datetime
from pathlib import Path


YEAR = 2025

LOCATION_SLUGS = (
    "abuja",
    "kaduna",
    "lagos",
    "port-harcourt",
)

TEMPERATURE_PARAMETER = "T2M"
RAINFALL_PARAMETER = "PRECTOTCORR"
DATE_FORMAT = "%Y%m%d"


def load_payload(input_path):
    try:
        with input_path.open("r", encoding="utf-8") as input_file:
            return json.load(input_file)

    except FileNotFoundError as error:
        raise SystemExit(
            f"Could not find {input_path}."
        ) from error

    except json.JSONDecodeError as error:
        raise SystemExit(
            f"{input_path.name} does not contain valid JSON."
        ) from error


def collect_monthly_values(records, fill_value, parameter_name):
    values_by_month = {
        month_number: []
        for month_number in range(1, 13)
    }

    for date_text, value in records.items():
        try:
            record_date = datetime.strptime(
                date_text,
                DATE_FORMAT,
            )
        except ValueError as error:
            raise SystemExit(
                f"{parameter_name} contains an invalid date: {date_text}"
            ) from error

        if record_date.year != YEAR:
            raise SystemExit(
                f"{parameter_name} contains data outside {YEAR}."
            )

        if value == fill_value:
            continue

        values_by_month[record_date.month].append(float(value))

    return values_by_month


def calculate_average(values):
    if not values:
        return None

    return round(sum(values) / len(values), 2)


def calculate_total(values):
    if not values:
        return None

    return round(sum(values), 2)


def format_date(date_text):
    return datetime.strptime(
        str(date_text),
        DATE_FORMAT,
    ).date().isoformat()


def build_report(payload, slug):
    header = payload.get("header", {})
    parameter_information = payload.get("parameters", {})
    parameter_data = (
        payload
        .get("properties", {})
        .get("parameter", {})
    )
    coordinates = (
        payload
        .get("geometry", {})
        .get("coordinates", [])
    )

    required_parameters = (
        TEMPERATURE_PARAMETER,
        RAINFALL_PARAMETER,
    )

    missing_parameters = [
        parameter
        for parameter in required_parameters
        if parameter not in parameter_data
    ]

    if missing_parameters:
        raise SystemExit(
            "Missing parameters: "
            + ", ".join(missing_parameters)
        )

    if len(coordinates) < 2:
        raise SystemExit(
            f"The data for {slug} has invalid coordinates."
        )

    fill_value = header.get("fill_value", -999)

    temperature_by_month = collect_monthly_values(
        parameter_data[TEMPERATURE_PARAMETER],
        fill_value,
        TEMPERATURE_PARAMETER,
    )

    rainfall_by_month = collect_monthly_values(
        parameter_data[RAINFALL_PARAMETER],
        fill_value,
        RAINFALL_PARAMETER,
    )

    months = []

    for month_number in range(1, 13):
        temperature_values = temperature_by_month[month_number]
        rainfall_values = rainfall_by_month[month_number]

        expected_days = calendar.monthrange(
            YEAR,
            month_number,
        )[1]

        months.append(
            {
                "number": month_number,
                "name": calendar.month_name[month_number],
                "temperature": {
                    "average_c": calculate_average(
                        temperature_values
                    ),
                    "valid_days": len(temperature_values),
                    "missing_days": (
                        expected_days - len(temperature_values)
                    ),
                },
                "rainfall": {
                    "total_mm": calculate_total(
                        rainfall_values
                    ),
                    "valid_days": len(rainfall_values),
                    "missing_days": (
                        expected_days - len(rainfall_values)
                    ),
                },
            }
        )

    all_temperature_values = [
        value
        for monthly_values in temperature_by_month.values()
        for value in monthly_values
    ]

    all_rainfall_values = [
        value
        for monthly_values in rainfall_by_month.values()
        for value in monthly_values
    ]

    api_information = header.get("api", {})

    return {
        "location": {
            "name": slug.replace("-", " ").title(),
            "slug": slug,
            "latitude": coordinates[1],
            "longitude": coordinates[0],
            "elevation_m": (
                coordinates[2]
                if len(coordinates) > 2
                else None
            ),
        },
        "period": {
            "year": YEAR,
            "start": format_date(header["start"]),
            "end": format_date(header["end"]),
        },
        "annual_summary": {
            "average_temperature_c": calculate_average(
                all_temperature_values
            ),
            "total_rainfall_mm": calculate_total(
                all_rainfall_values
            ),
            "temperature_days": len(all_temperature_values),
            "rainfall_days": len(all_rainfall_values),
        },
        "source": {
            "provider": "NASA POWER",
            "api_name": api_information.get("name"),
            "api_version": api_information.get("version"),
            "datasets": header.get("sources", []),
            "time_standard": header.get("time_standard"),
            "parameters": {
                TEMPERATURE_PARAMETER: parameter_information.get(
                    TEMPERATURE_PARAMETER,
                    {},
                ),
                RAINFALL_PARAMETER: parameter_information.get(
                    RAINFALL_PARAMETER,
                    {},
                ),
            },
        },
        "months": months,
    }


def save_report(report, output_path):
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8") as output_file:
        json.dump(report, output_file, indent=2)
        output_file.write("\n")


def main():
    project_root = Path(__file__).resolve().parents[1]
    raw_directory = project_root / "data" / "raw"
    output_directory = project_root / "web" / "data"

    for slug in LOCATION_SLUGS:
        input_path = raw_directory / f"{slug}-{YEAR}.json"
        output_path = output_directory / f"{slug}-{YEAR}.json"

        payload = load_payload(input_path)
        report = build_report(payload, slug)
        save_report(report, output_path)

        print(
            f"Processed {input_path.name} -> "
            f"{output_path.relative_to(project_root)}"
        )


if __name__ == "__main__":
    main()