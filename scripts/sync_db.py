#!/usr/bin/env python3
"""
FamousPeople.id - Sync Engine
Syncs Obsidian Markdown files to Supabase with batch operations.
"""
import os
import sys
from pathlib import Path
from typing import Optional
from dataclasses import dataclass
import frontmatter
from supabase import create_client
from dotenv import load_dotenv
from tqdm import tqdm
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
VAULT_PATH = os.getenv("VAULT_PATH", "../00-People")
BATCH_SIZE = int(os.getenv("SYNC_BATCH_SIZE", "50"))
MAX_WORKERS = int(os.getenv("SYNC_MAX_WORKERS", "4"))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class SyncStats:
    processed: int = 0
    synced: int = 0
    skipped: int = 0
    errors: int = 0


def validate_env():
    if not SUPABASE_URL:
        logger.error("SUPABASE_URL not set")
        sys.exit(1)
    if not SUPABASE_KEY:
        logger.error("SUPABASE_SERVICE_ROLE_KEY not set")
        sys.exit(1)
    if "YOUR_" in SUPABASE_URL or "YOUR_" in SUPABASE_KEY or "your-" in SUPABASE_URL:
        logger.error("Replace placeholder values in .env")
        sys.exit(1)


def parse_file(filepath: Path) -> Optional[dict]:
    try:
        post = frontmatter.load(filepath)
    except Exception as e:
        logger.warning(f"Parse error {filepath.name}: {e}")
        return None

    meta = post.metadata
    fpid = meta.get('fpid')

    if not fpid or not isinstance(fpid, str):
        return None

    birth_date = meta.get('birth_date')
    if birth_date:
        birth_date = str(birth_date).strip()
        if birth_date in ['', 'None', 'null', 'NaT']:
            birth_date = None

    # Normalize gender
    gender = meta.get('gender')
    if gender:
        gender = str(gender).lower()
        if gender not in ('male', 'female', 'non-binary', 'other'):
            gender = None

    net_worth_raw = meta.get('net_worth')
    net_worth = None
    if net_worth_raw not in (None, '', 0, '0'):
        try:
            net_worth = int(net_worth_raw)
        except (ValueError, TypeError):
            net_worth = None

    height_raw = meta.get('height_cm')
    height_cm = None
    if height_raw not in (None, '', 0, '0'):
        try:
            height_cm = int(height_raw)
        except (ValueError, TypeError):
            height_cm = None

    sitelinks = meta.get('sitelinks') or 0
    try:
        sitelinks = int(sitelinks)
    except (ValueError, TypeError):
        sitelinks = 0

    fame_tier = None
    if sitelinks > 100:
        fame_tier = 'S'
    elif 50 <= sitelinks <= 100:
        fame_tier = 'A'
    elif 20 <= sitelinks < 50:
        fame_tier = 'B'
    elif sitelinks > 0:
        fame_tier = 'C'

    def parse_list(value):
        if isinstance(value, list):
            return value
        if not value:
            return []
        parts = [v.strip() for v in str(value).replace('|', ',').replace(';', ',').split(',') if v.strip()]
        return list(dict.fromkeys(parts))

    payload = {
        "fpid": fpid,
        "slug": meta.get('slug') or fpid.split('-')[-1],
        "full_name": meta.get('name'),
        "type": meta.get('type', 'Person'),
        "net_worth": net_worth,
        "height_cm": height_cm,
        "birth_date": birth_date,
        "country": parse_list(meta.get('country')),
        "gender": gender,
        "mbti": meta.get('mbti'),
        "zodiac": meta.get('zodiac'),
        "occupation": parse_list(meta.get('occupation')),
        "image_url": meta.get('image_url'),
        "wikipedia_url": meta.get('wikipedia_url'),
        "bio_summary": meta.get('ai_summary') or '',
        "content_md": post.content.strip() if post.content else '',
        "social_links": meta.get('social') or {},
        "meta": {"ids": meta.get('ids') or {}},
        "sitelinks": sitelinks,
        "fame_tier": fame_tier,
        "data_sources": meta.get('data_sources') or {}
    }

    rels = meta.get('relationships', [])
    rel_rows = []
    if isinstance(rels, list):
        for r in rels:
            if isinstance(r, dict) and r.get('target'):
                target = str(r['target']).replace("[[", "").replace("]]", "").strip()
                if target:
                    rel_rows.append({
                        "source_fpid": fpid,
                        "target_fpid": target,
                        "relation_type": r.get('type', 'unknown'),
                        "details": {"years": r.get('years')}
                    })

    return {"payload": payload, "relationships": rel_rows}


def batch_sync(supabase, payloads: list, relationships: list, stats: SyncStats):
    if not payloads:
        return

    try:
        supabase.table("identities").upsert(payloads).execute()
        stats.synced += len(payloads)
    except Exception as e:
        logger.error(f"Batch upsert failed: {e}")
        stats.errors += len(payloads)
        return

    if relationships:
        try:
            source_fpids = list(set(r["source_fpid"] for r in relationships))
            for fpid in source_fpids:
                supabase.table("relationships").delete().eq("source_fpid", fpid).execute()
            supabase.table("relationships").insert(relationships).execute()
        except Exception as e:
            logger.warning(f"Relationship sync error: {e}")


def collect_files(vault_path: Path) -> list[Path]:
    files = []
    for filepath in vault_path.rglob("FP-*.md"):
        if filepath.is_file():
            files.append(filepath)
    return sorted(files)


def main():
    validate_env()

    vault = Path(VAULT_PATH)
    if not vault.exists():
        logger.error(f"Vault path not found: {VAULT_PATH}")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    stats = SyncStats()

    files = collect_files(vault)
    logger.info(f"Found {len(files)} files to sync")

    if not files:
        logger.warning("No FP-*.md files found")
        return

    payloads_batch = []
    rels_batch = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(parse_file, f): f for f in files}

        for future in tqdm(as_completed(futures), total=len(files), desc="Syncing"):
            stats.processed += 1
            result = future.result()

            if result is None:
                stats.skipped += 1
                continue

            payloads_batch.append(result["payload"])
            rels_batch.extend(result["relationships"])

            if len(payloads_batch) >= BATCH_SIZE:
                batch_sync(supabase, payloads_batch, rels_batch, stats)
                payloads_batch = []
                rels_batch = []

    if payloads_batch:
        batch_sync(supabase, payloads_batch, rels_batch, stats)

    logger.info(f"Complete: {stats.synced} synced, {stats.skipped} skipped, {stats.errors} errors")


if __name__ == "__main__":
    main()
