# The Tiny Library

A small Vanilla JavaScript and CSS bookshelf displaying books from public Goodreads shelves.

To preview locally, run this from the project directory and open http://localhost:8000:

```sh
python3 -m http.server 8000
```

To refresh `books.json` from Goodreads:

```sh
python3 scripts/import_goodreads.py
```

The importer preserves existing book colors, heights, language settings, and review links. The browser selects up to 27 books for the first shelf using the current local date and puts the rest on the second shelf.
