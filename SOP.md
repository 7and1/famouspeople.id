# FamousPeople.id - Execution SOP

## Day 1 Checklist

### 1. Get Data Source
```bash
# Open https://query.wikidata.org/
# Paste query from raw_data/wikidata_query.sparql
# Click Download → CSV → Save as raw_data/wikidata_export.csv
```

### 2. Setup Environment
```bash
cd /path/to/famouspeople.id
cp .env.example .env
# Edit .env with Supabase credentials

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Create Database Schema
```bash
# Go to Supabase Dashboard → SQL Editor
# Paste contents of supabase/schema.sql
# Execute
```

### 4. Generate Markdown Files
```bash
cd scripts
python bulk_init.py
# Output: 00-People/{decade}/*.md
```

### 5. Sync to Supabase
```bash
python sync_db.py
# Output: identities + relationships tables populated
```

### 6. Manual Enrichment (Obsidian)
- Open 00-People as Obsidian vault
- Search for a person (e.g., "Elon Musk")
- Fill in `net_worth`, `relationships`, etc.
- Save file

### 7. Re-sync
```bash
python sync_db.py
# Changed records will be upserted
```

---

## Ongoing Workflow

| Action | Command |
|--------|---------|
| Add new person | Create `FP-YYYY-slug.md` in correct decade folder |
| Edit person | Modify YAML frontmatter in Obsidian |
| Sync changes | `python sync_db.py` |
| Bulk import | Add rows to CSV, run `bulk_init.py` |

## Troubleshooting

| Error | Fix |
|-------|-----|
| `SUPABASE_URL not set` | Edit `.env` file |
| `Duplicate key` | Person already exists, will upsert |
| `Foreign key violation` | Target relationship person doesn't exist yet |
| `Parse error` | Check YAML syntax (proper indentation, quotes) |
