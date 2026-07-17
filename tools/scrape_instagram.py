"""Scrape an Instagram profile's posts and captions with Instaloader.

Usage:
    .venv/Scripts/python scrape_instagram.py <profile_name> [--login <account>] [--media]

Instagram now blocks anonymous API access, so a logged-in session is required.
Log in once with:  .venv/Scripts/instaloader --login <account>
then pass --login <account> here to reuse that saved session.

By default only captions/metadata are saved (to output/<profile_name>/).
Pass --media to also download the post images/videos.
"""
import argparse
import json
import sys
from pathlib import Path

import instaloader


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("profile", help="Instagram profile name (public)")
    parser.add_argument("--login", metavar="ACCOUNT", help="reuse the saved session for this account")
    parser.add_argument("--media", action="store_true", help="also download images/videos")
    args = parser.parse_args()

    out_dir = Path(__file__).parent / "output" / args.profile
    out_dir.mkdir(parents=True, exist_ok=True)

    loader = instaloader.Instaloader(
        download_pictures=args.media,
        download_videos=args.media,
        download_video_thumbnails=False,
        download_comments=False,
        save_metadata=False,
        dirname_pattern=str(out_dir),
    )

    if args.login:
        try:
            loader.load_session_from_file(args.login)
            print(f"Loaded saved session for '{args.login}'.")
        except FileNotFoundError:
            sys.exit(
                f"No saved session for '{args.login}'. Log in first:\n"
                f"    .venv/Scripts/instaloader --login {args.login}"
            )

    try:
        profile = instaloader.Profile.from_username(loader.context, args.profile)
    except instaloader.exceptions.ProfileNotExistsException:
        sys.exit(f"Profile '{args.profile}' does not exist.")

    posts = []
    for post in profile.get_posts():
        posts.append(
            {
                "shortcode": post.shortcode,
                "url": f"https://www.instagram.com/p/{post.shortcode}/",
                "date": post.date_utc.isoformat(),
                "caption": post.caption or "",
                "likes": post.likes,
                "is_video": post.is_video,
                "image_url": post.url,
            }
        )
        print(f"[{len(posts)}] {post.shortcode} — {(post.caption or '')[:60]!r}")
        if args.media:
            loader.download_post(post, target=args.profile)

    json_path = out_dir / "posts.json"
    json_path.write_text(json.dumps(posts, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nSaved {len(posts)} posts to {json_path}")


if __name__ == "__main__":
    main()
