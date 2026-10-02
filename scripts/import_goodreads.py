"""Refresh books.json from the public Goodreads shelf RSS feeds."""

import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "books.json"
FEEDS = {
    "read": "https://www.goodreads.com/review/list_rss/81224485?shelf=read",
    "did-not-finished": "https://www.goodreads.com/review/list_rss/81224485?shelf=did-not-finished",
    "currently-reading": "https://www.goodreads.com/review/list_rss/81224485?shelf=currently-reading",
    "to-read": "https://www.goodreads.com/review/list_rss/81224485?shelf=to-read",
}
PALETTE = [
    ("#d67c57", "#f4c77d"),
    ("#55866c", "#e6c865"),
    ("#daae4e", "#fff2cf"),
    ("#617c9e", "#d6e1ed"),
    ("#bc675c", "#f0d4ad"),
    ("#4c777c", "#e7bb70"),
    ("#776397", "#e5b778"),
    ("#71875c", "#e8d5a2"),
    ("#568292", "#f0d18e"),
    ("#c17a48", "#f5e3b9"),
    ("#405f48", "#dbc88c"),
    ("#9c4f42", "#edcf9a"),
    ("#b4834e", "#f5dfb5"),
    ("#6e5267", "#e6c5a7"),
]


def previous_styles():
    try:
        books = json.loads(OUTPUT.read_text(encoding="utf-8"))
    except (FileNotFoundError, ValueError):
        return {}
    styles = {}
    for book in books:
        if not isinstance(book, dict) or "title" not in book or "author" not in book:
            continue
        styles[(book["title"].casefold(), book["author"].casefold())] = book
        if book.get("id"):
            styles[str(book["id"])] = book
    return styles


def fetch_items(url, allow_empty=False):
    request = Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; TinyLibrary/1.0)"})
    with urlopen(request, timeout=30) as response:
        root = ElementTree.fromstring(response.read())
    items = root.findall("./channel/item")
    if not items and not allow_empty:
        raise RuntimeError(f"No books found in {url}; books.json was not changed")
    return items


def book_from_item(item, styles):
    title = (item.findtext("title") or "").strip()
    author = (item.findtext("author_name") or "").strip()
    book_id = (item.findtext("book_id") or "").strip()
    if not title or not book_id:
        return None

    digest = hashlib.sha256(book_id.encode("utf-8")).digest()
    color, accent = PALETTE[digest[0] % len(PALETTE)]
    previous = styles.get(book_id) or styles.get((title.casefold(), author.casefold()), {})
    book = {
        "id": book_id,
        "title": title,
        "author": author or "Unknown author",
        "color": previous.get("color", color),
        "accent": previous.get("accent", accent),
        "height": previous.get("height", 164 + digest[1] % 51),
        "tags": [],
        "goodreadsUrl": (item.findtext("link") or "").strip(),
        "reviewUrl": previous.get("reviewUrl") or "",
    }
    if previous.get("lang") == "fa" or any("\u0600" <= char <= "\u06ff" for char in title):
        book["lang"] = "fa"
    return book


def main():
    styles = previous_styles()
    books_by_id = {}
    counts = {}
    for tag, url in FEEDS.items():
        items = fetch_items(url, allow_empty=tag == "did-not-finished")
        counts[tag] = len(items)
        for item in items:
            book = book_from_item(item, styles)
            if book is None:
                continue
            existing = books_by_id.setdefault(book["id"], book)
            custom_tags = (item.findtext("user_shelves") or "").split(",")
            for book_tag in [tag, *(shelf.strip() for shelf in custom_tags)]:
                if not book_tag or (book_tag in FEEDS and book_tag != tag):
                    continue
                if book_tag not in existing["tags"]:
                    existing["tags"].append(book_tag)

    temporary = OUTPUT.with_suffix(".json.tmp")
    temporary.write_text(
        json.dumps(list(books_by_id.values()), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temporary.replace(OUTPUT)
    summary = ", ".join(f"{tag}: {count}" for tag, count in counts.items())
    print(f"Imported {len(books_by_id)} books ({summary}) into {OUTPUT.name}")


if __name__ == "__main__":
    main()
