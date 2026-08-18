import json
import tempfile
import unittest
from pathlib import Path

from scripts.process_power_data import (
    build_report,
    calculate_average,
    calculate_total,
    collect_monthly_values,
    save_report,
)


def make_payload(temperature=None, rainfall=None):
    return {
        "geometry": {
            "type": "Point",
            "coordinates": [7.399, 9.076, 406.97],
        },
        "header": {
            "api": {"name": "POWER Daily API", "version": "test"},
            "fill_value": -999,
            "sources": ["MERRA2"],
            "start": "20250101",
            "end": "20251231",
            "time_standard": "LST",
        },
        "parameters": {
            "T2M": {"units": "C"},
            "PRECTOTCORR": {"units": "mm/day"},
        },
        "properties": {
            "parameter": {
                "T2M": temperature or {},
                "PRECTOTCORR": rainfall or {},
            }
        },
    }


class CalculationTests(unittest.TestCase):
    def test_average_and_total_are_rounded_to_two_decimal_places(self):
        self.assertEqual(calculate_average([1.111, 2.222]), 1.67)
        self.assertEqual(calculate_total([1.111, 2.222]), 3.33)

    def test_empty_measurements_return_none(self):
        self.assertIsNone(calculate_average([]))
        self.assertIsNone(calculate_total([]))


class MonthlyCollectionTests(unittest.TestCase):
    def test_values_are_grouped_by_month_and_fill_values_are_ignored(self):
        result = collect_monthly_values(
            {
                "20250101": 25,
                "20250102": -999,
                "20250201": "27.5",
            },
            -999,
            "T2M",
        )

        self.assertEqual(result[1], [25.0])
        self.assertEqual(result[2], [27.5])
        self.assertTrue(all(result[month] == [] for month in range(3, 13)))

    def test_invalid_date_is_rejected(self):
        with self.assertRaisesRegex(SystemExit, "invalid date"):
            collect_monthly_values({"not-a-date": 25}, -999, "T2M")

    def test_data_outside_2025_is_rejected(self):
        with self.assertRaisesRegex(SystemExit, "outside 2025"):
            collect_monthly_values({"20240101": 25}, -999, "T2M")


class ReportTests(unittest.TestCase):
    def test_report_aggregates_values_and_counts_missing_days(self):
        payload = make_payload(
            temperature={
                "20250101": 20,
                "20250102": 24,
                "20250103": -999,
                "20250201": 30,
            },
            rainfall={
                "20250101": 1.25,
                "20250102": 2.5,
                "20250103": -999,
                "20250201": 0,
            },
        )

        report = build_report(payload, "test-location")
        january = report["months"][0]
        february = report["months"][1]

        self.assertEqual(january["temperature"], {
            "average_c": 22.0,
            "valid_days": 2,
            "missing_days": 29,
        })
        self.assertEqual(january["rainfall"], {
            "total_mm": 3.75,
            "valid_days": 2,
            "missing_days": 29,
        })
        self.assertEqual(february["temperature"]["missing_days"], 27)
        self.assertEqual(report["annual_summary"], {
            "average_temperature_c": 24.67,
            "total_rainfall_mm": 3.75,
            "temperature_days": 3,
            "rainfall_days": 3,
        })

    def test_report_contains_location_period_and_source_metadata(self):
        report = build_report(make_payload(), "port-harcourt")

        self.assertEqual(report["location"], {
            "name": "Port Harcourt",
            "slug": "port-harcourt",
            "latitude": 9.076,
            "longitude": 7.399,
            "elevation_m": 406.97,
        })
        self.assertEqual(report["period"], {
            "year": 2025,
            "start": "2025-01-01",
            "end": "2025-12-31",
        })
        self.assertEqual(report["source"]["provider"], "NASA POWER")
        self.assertEqual(len(report["months"]), 12)

    def test_missing_required_parameter_is_rejected(self):
        payload = make_payload()
        del payload["properties"]["parameter"]["PRECTOTCORR"]

        with self.assertRaisesRegex(SystemExit, "Missing parameters"):
            build_report(payload, "test-location")

    def test_invalid_coordinates_are_rejected(self):
        payload = make_payload()
        payload["geometry"]["coordinates"] = [7.399]

        with self.assertRaisesRegex(SystemExit, "invalid coordinates"):
            build_report(payload, "test-location")

    def test_report_can_be_saved_and_loaded_as_json(self):
        report = build_report(make_payload(), "test-location")

        with tempfile.TemporaryDirectory() as temporary_directory:
            output_path = Path(temporary_directory) / "nested" / "report.json"
            save_report(report, output_path)

            self.assertEqual(json.loads(output_path.read_text("utf-8")), report)
            self.assertTrue(output_path.read_text("utf-8").endswith("\n"))


if __name__ == "__main__":
    unittest.main()
