#!/usr/bin/env python3
"""
FamousPeople.id - Bulk Init Script
Converts Wikidata CSV export to Obsidian Markdown files with YAML frontmatter.
"""
import pandas as pd
import os
import sys
from slugify import slugify
from tqdm import tqdm
import yaml
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Configuration via environment
CSV_PATH = os.getenv("CSV_PATH", "../raw_data/wikidata_export.csv")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "../00-People")
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "1000"))


def generate_fpid(row):
    """Generate unique FamousPeople ID with year and slug."""
    year_raw = row.get('birth_year')
    if pd.isnull(year_raw):
        year = "0000"
    else:
        year = str(int(float(year_raw)))

    name = row.get('name', '')
    if pd.isnull(name) or not str(name).strip():
        return None, None, None

    slug = slugify(str(name), max_length=100)
    if not slug:
        return None, None, None

    return f"FP-{year}-{slug}", year, slug


def format_date(date_val):
    """Safely format date values."""
    if pd.isnull(date_val):
        return None
    if hasattr(date_val, 'strftime'):
        return date_val.strftime('%Y-%m-%d')
    s = str(date_val).strip()
    if s in ['NaT', 'nan', 'None', '']:
        return None
    return s


def parse_list(value):
    if pd.isnull(value):
        return []
    if isinstance(value, list):
        return value
    s = str(value).strip()
    if not s:
        return []
    if ';' in s:
        parts = [p.strip() for p in s.split(';') if p.strip()]
    elif '|' in s:
        parts = [p.strip() for p in s.split('|') if p.strip()]
    else:
        parts = [p.strip() for p in s.split(',') if p.strip()]
    return list(dict.fromkeys(parts))


def create_md(row, output_dir):
    """Create markdown file with proper YAML frontmatter."""
    result = generate_fpid(row)
    if result[0] is None:
        return False

    fpid, year, slug = result
    birth_date = format_date(row.get('birth_date'))
    imdb_id = row.get('imdb_id') if pd.notnull(row.get('imdb_id')) else None
    wikidata_id = row.get('wikidata_id') if pd.notnull(row.get('wikidata_id')) else None
    sitelinks = row.get('sitelinks')
    if pd.isnull(sitelinks):
        sitelinks = 0
    gender = row.get('gender', 'unknown')
    if pd.isnull(gender):
        gender = 'unknown'

    frontmatter = {
        'fpid': fpid,
        'slug': slug,
        'name': row.get('name', ''),
        'type': 'Person',
        'status': 'Active',
        'net_worth': None,
        'height_cm': None,
        'birth_date': birth_date,
        'country': parse_list(row.get('country')),
        'gender': str(gender).lower() if gender else 'unknown',
        'mbti': None,
        'zodiac': None,
        'occupation': parse_list(row.get('occupation')),
        'social': {'instagram': None, 'twitter': None},
        'ids': {'imdb': imdb_id, 'wikidata': wikidata_id},
        'sitelinks': int(sitelinks) if sitelinks is not None else 0,
        'relationships': [],
        'ai_summary': ''
    }

    content = "---\n" + yaml.safe_dump(
        frontmatter,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False
    ) + "---\n\n# Notes\n"

    try:
        year_int = int(year)
        decade_start = (year_int // 10) * 10
        target_dir = Path(output_dir) / f"{decade_start}-{decade_start + 9}"
    except ValueError:
        target_dir = Path(output_dir) / "unknown"

    target_dir.mkdir(parents=True, exist_ok=True)

    filepath = target_dir / f"{fpid}.md"
    if filepath.exists():
        return False

    try:
        filepath.write_text(content, encoding='utf-8')
        return True
    except OSError as e:
        print(f"Error writing {fpid}: {e}", file=sys.stderr)
        return False


def main():
    csv_path = Path(CSV_PATH)
    if not csv_path.exists():
        print(f"CSV not found: {CSV_PATH}", file=sys.stderr)
        sys.exit(1)

    print(f"Reading CSV: {CSV_PATH}")

    created = 0
    skipped = 0

    try:
        for chunk in pd.read_csv(CSV_PATH, chunksize=BATCH_SIZE,
                                  encoding='utf-8',
                                  on_bad_lines='warn'):
            for _, row in tqdm(chunk.iterrows(),
                              total=len(chunk),
                              desc="Processing"):
                result = create_md(row, OUTPUT_DIR)
                if result:
                    created += 1
                else:
                    skipped += 1
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"\nComplete: {created} created, {skipped} skipped")


if __name__ == "__main__":
    main()
