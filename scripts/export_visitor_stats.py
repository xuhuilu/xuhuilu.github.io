#!/usr/bin/env python3
"""Export privacy-conscious, country-level GoatCounter aggregates for the homepage."""

import datetime as dt
import json
import os
from pathlib import Path
import sys
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "visitor-stats.json"
DISPLAY_NAMES = {"HK": "Hong Kong, China", "MO": "Macao, China", "TW": "Taiwan, China"}


def get_json(base_url, token, path, start, end, offset=None):
    params = {"start": start, "end": end, "limit": "100"}
    if offset is not None:
        params["offset"] = str(offset)
    url = f"{base_url}/api/v0/{path}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def main():
    code = os.environ.get("GOATCOUNTER_CODE", "").strip()
    token = os.environ.get("GOATCOUNTER_TOKEN", "").strip()
    if not code or not token:
        print("Visitor export skipped: GOATCOUNTER_CODE or GOATCOUNTER_TOKEN is not configured.")
        return 0

    base_url = os.environ.get("GOATCOUNTER_BASE_URL", f"https://{code}.goatcounter.com").rstrip("/")
    start = os.environ.get("GOATCOUNTER_START", "2020-01-01T00:00:00Z")
    end = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    locations = []
    offset = 0
    while True:
        payload = get_json(base_url, token, "stats/locations", start, end, offset)
        for item in payload.get("stats", []):
            code_value = str(item.get("id") or "").upper()
            visitors = int(item.get("count") or 0)
            if len(code_value) == 2 and visitors > 0:
                locations.append({
                    "code": code_value,
                    "name": DISPLAY_NAMES.get(code_value, str(item.get("name") or code_value)),
                    "visitors": visitors,
                })
        if not payload.get("more"):
            break
        offset += 100

    total = get_json(base_url, token, "stats/total", start, end)
    output = {
        "generated_at": end,
        "period_start": start,
        "total_visitors": int(total.get("total") or 0),
        "locations": sorted(locations, key=lambda item: (-item["visitors"], item["name"])),
    }
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Exported {len(locations)} country-level aggregates to {OUTPUT.relative_to(ROOT)}.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print(f"Visitor export failed: {error}", file=sys.stderr)
        sys.exit(1)
