# Tools

## Instagram scraper

Pulls a profile's posts and captions using [Instaloader](https://github.com/instaloader/instaloader).

Setup (already done — venv lives in `tools/.venv`):

```powershell
python -m venv .venv
.venv\Scripts\pip install instaloader
```

Usage:

```powershell
.venv\Scripts\python scrape_instagram.py <profile_name>          # captions/metadata only -> output/<profile>/posts.json
.venv\Scripts\python scrape_instagram.py <profile_name> --media  # also download images/videos
```

Notes:

- Works on public profiles without login; for heavy use run `.venv\Scripts\instaloader --login <throwaway_account>` first so the session cookie is reused.
- Instagram rate-limits aggressively — don't hammer it, and use a throwaway account if logging in.
- `output/` and `.venv/` are gitignored.
