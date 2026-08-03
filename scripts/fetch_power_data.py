import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

LOCATION = {
    "name": "Ibadan",
    "slug": "ibadan",
    "latitude": 7.3775,
    "longitude": 3.9470,
}

YEAR = 2025
PARAMETERS = ("T2M", "PRECTOTCORR")


def build_request_url():
    query = urlencode(
        {
            "parameters": ",".join(PARAMETERS),
            "community": "AG",
            "longitude": LOCATION["longitude"],
            "latitude": LOCATION["latitude"],
            "start": f"{YEAR}0101",
            "end": f"{YEAR}1231",
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


def save_data(payload):
    project_root = Path(__file__).resolve().parents[1]
    output_directory = project_root / "data" / "raw"
    output_directory.mkdir(parents=True, exist_ok=True)

    output_path = (
        output_directory
        / f"{LOCATION['slug']}-{YEAR}.json"
    )

    with output_path.open("w", encoding="utf-8") as output_file:
        json.dump(payload, output_file, indent=2)
        output_file.write("\n")

    return output_path


def main():
    request_url = build_request_url()

    print(f"Requesting NASA POWER data for {LOCATION['name']}...")

    payload = download_data(request_url)
    parameter_data = validate_data(payload)
    output_path = save_data(payload)

    temperature_days = len(parameter_data["T2M"])
    rainfall_days = len(parameter_data["PRECTOTCORR"])

    print(f"Temperature records: {temperature_days}")
    print(f"Rainfall records: {rainfall_days}")
    print(f"Saved data to: {output_path}")


if __name__ == "__main__":
    main()