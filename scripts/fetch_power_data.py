import argparse
import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

LOCATIONS = (
    {
        "name": "Abuja",
        "slug": "abuja",
        "latitude": 9.0765,
        "longitude": 7.3986,
    },
    {
        "name": "Kaduna",
        "slug": "kaduna",
        "latitude": 10.5105,
        "longitude": 7.4165,
    },
    {
        "name": "Lagos",
        "slug": "lagos",
        "latitude": 6.5244,
        "longitude": 3.3792,
    },
    {
        "name": "Port Harcourt",
        "slug": "port-harcourt",
        "latitude": 4.8156,
        "longitude": 7.0498,
    },
)

DEFAULT_YEAR = 2025
PARAMETERS = ("T2M", "PRECTOTCORR")


def build_request_url(location, year):
    query = urlencode(
        {
            "parameters": ",".join(PARAMETERS),
            "community": "AG",
            "longitude": location["longitude"],
            "latitude": location["latitude"],
            "start": f"{year}0101",
            "end": f"{year}1231",
            "format": "JSON",
            "time-standard": "LST",
        }
    )

    return f"{BASE_URL}?{query}"

def download_data(url):
    request = Request(
        url,
        headers={
            "User-Agent": "Signal Atlas educational project",
        },
    )

    try:
        with urlopen(request, timeout=30) as response:
            response_text = response.read().decode("utf-8")

        return json.loads(response_text)

    except HTTPError as error:
        raise SystemExit(
            f"NASA POWER returned HTTP error {error.code}."
        ) from error

    except URLError as error:
        raise SystemExit(
            f"Could not reach NASA POWER: {error.reason}"
        ) from error

    except TimeoutError as error:
        raise SystemExit(
            "The NASA POWER request timed out."
        ) from error

    except json.JSONDecodeError as error:
        raise SystemExit(
            "NASA POWER did not return valid JSON."
        ) from error


def validate_data(payload):
    parameter_data = (
        payload
        .get("properties", {})
        .get("parameter", {})
    )

    missing_parameters = [
        parameter
        for parameter in PARAMETERS
        if parameter not in parameter_data
    ]

    if missing_parameters:
        missing_names = ", ".join(missing_parameters)

        raise SystemExit(
            f"The response is missing these parameters: {missing_names}"
        )

    return parameter_data


def save_data(payload, location, year):
    project_root = Path(__file__).resolve().parents[1]
    output_directory = project_root / "data" / "raw"
    output_directory.mkdir(parents=True, exist_ok=True)

    output_path = (
        output_directory
        / f"{location['slug']}-{year}.json"
    )

    with output_path.open("w", encoding="utf-8") as output_file:
        json.dump(payload, output_file, indent=2)
        output_file.write("\n")

    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Download daily NASA POWER data for Signal Atlas."
    )
    parser.add_argument(
        "--year",
        type=int,
        action="append",
        dest="years",
        help="Year to download. Repeat the option for multiple years.",
    )
    arguments = parser.parse_args()
    years = arguments.years or [DEFAULT_YEAR]

    for year in years:
        for location in LOCATIONS:
            request_url = build_request_url(location, year)

            print(
                f"Requesting NASA POWER data for "
                f"{location['name']} ({year})..."
            )

            payload = download_data(request_url)
            parameter_data = validate_data(payload)
            output_path = save_data(payload, location, year)

            temperature_days = len(parameter_data["T2M"])
            rainfall_days = len(parameter_data["PRECTOTCORR"])

            print(f"Temperature records: {temperature_days}")
            print(f"Rainfall records: {rainfall_days}")
            print(f"Saved data to: {output_path}")
            print()

if __name__ == "__main__":
    main()
