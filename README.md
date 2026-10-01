# The Tiny Library

A scrolling bookshelf built with vanilla JavaScript and CSS.

Books come from [`books.json`](books.json), with `read`, `currently-reading`, and `to-read` tags. The top shelf shows 27 daily picks; the second shows the rest.

Refresh from Goodreads with `python scripts/import_goodreads.py`. Serve the site over HTTP to view it.
