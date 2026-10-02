const DECORATION_INDEX = 5;
const TAG_LABELS = {
  read: "Read",
  "did-not-finished": "Did not finish",
  "currently-reading": "Currently reading",
  "to-read": "Want to read",
  "want-to-read": "Want to read",
  "want to read": "Want to read",
};
const LEAN_ANGLES = [3.5, 4.1, 4.7, 3.3, 2.9, 4.5, 1.5];

async function loadBooks() {
  const response = await fetch(new URL("../books.json", import.meta.url));
  if (!response.ok)
    throw new Error(`Could not load books.json (${response.status})`);

  const books = await response.json();
  if (!Array.isArray(books))
    throw new Error("books.json must contain an array of books");
  return books;
}

function groupBooksByShelf(allBooks) {
  const matchesTags = (book, tags) =>
    tags.some((tag) => book.tags?.includes(tag));
  return {
    first: allBooks.filter((book) =>
      matchesTags(book, ["read", "did-not-finished"]),
    ),
    second: allBooks.filter((book) =>
      matchesTags(book, ["currently-reading", "to-read", "want-to-read", "want to read"]),
    ),
  };
}

function span(className, text = "") {
  const element = document.createElement("span");
  element.className = className;
  element.textContent = text;
  return element;
}

function normalizeBookTitle(title) {
  const withoutParentheses = title.replace(
    /\s*(?:\([^()]*\)|（[^（）]*）)/g,
    "",
  );
  return (
    withoutParentheses.split(/[:：]/, 1)[0].replace(/\s+/g, " ").trim() || title
  );
}

const root = document.getElementById("app");

if (!root) throw new Error("Application mount target not found");

let firstShelfBooks;
let secondShelfBooks;
try {
  const selection = groupBooksByShelf(await loadBooks());
  firstShelfBooks = selection.first;
  secondShelfBooks = selection.second;
} catch (error) {
  root.textContent = "Could not load the book list. Please reload the page.";
  throw error;
}

const shelf = document.createElement("main");
shelf.className = "shelf-display";
shelf.setAttribute("aria-label", "Books on a bookshelf");
shelf.style.setProperty(
  "--shelf-width",
  `${Math.min(1150, Math.max(520, Math.max(firstShelfBooks.length, secondShelfBooks.length) * 68 + 110))}px`,
);

function createPlant() {
  const plant = document.createElement("a");
  plant.className = "shelf-plant";
  plant.href = "https://www.goodreads.com/user/show/81224485-shirin-manzari";
  plant.setAttribute("aria-label", "Shirin Manzari on Goodreads");
  plant.title = "Visit Shirin Manzari's Goodreads profile";

  const cactus = document.createElement("div");
  cactus.className = "plant-cactus";
  cactus.append(span("cactus-body"));

  const pot = document.createElement("div");
  pot.className = "plant-pot";
  pot.append(span("plant-soil"), span("plant-rim"), span("plant-pot-body"));
  plant.append(cactus, pot);
  return plant;
}

function createJar() {
  const jar = document.createElement("a");
  jar.className = "shelf-jar";
  jar.href = "https://shirin-manzari.github.io/";
  jar.setAttribute("aria-label", "My personal blog");
  jar.title = "Visit Shirin Manzari's website";
  jar.append(span("jar-lid"), span("jar-neck"));

  const glass = span("jar-glass");
  const butterfly = document.createElement("div");
  butterfly.className = "butterfly";
  for (let side = 0; side < 2; side++) {
    const wing = document.createElement("div");
    wing.className = "wing";
    wing.append(document.createElement("div"), document.createElement("div"));
    wing.children[0].className = "bit";
    wing.children[1].className = "bit";
    butterfly.append(wing);
  }
  const scene = document.createElement("div");
  scene.className = "jar-butterfly-scene";
  scene.append(butterfly);
  glass.append(scene, span("jar-shine"));
  jar.append(glass);
  return jar;
}

function createBook(book, index, withPlant) {
  const spine = document.createElement("button");
  spine.type = "button";
  spine.dataset.bookId = book.id;
  spine.setAttribute("aria-haspopup", "dialog");
  const tags = (book.tags || []).map((tag) => TAG_LABELS[tag] || tag).join(", ");
  const displayTitle = normalizeBookTitle(book.title);
  const titleLength = displayTitle.length;
  const isFarsiBook = book.lang === "fa";
  const isShortTitle = titleLength <= 14;
  const isWideTitle = titleLength > 18;
  const hasThreeWords = displayTitle.split(/\s+/u).length === 3;
  const isFarsiAuthor = /[\u0600-\u06ff]/.test(book.author);
  let leanDirection = 0;
  if (book.title !== "A Philosophy of Software Design") {
    if (index % 10 === 3) leanDirection = 1;
    else if (index % 10 === 7) leanDirection = -1;
  }
  const classes = ["book"];
  if (index % 6 === 0) classes.push("vintage-bands");
  else if (index % 7 === 2) classes.push("vintage-frame");
  else if (index % 9 === 4) classes.push("vintage-crest");
  if (leanDirection) classes.push(leanDirection > 0 ? "lean-right" : "lean-left");
  if (withPlant && index === DECORATION_INDEX) classes.push("plant-neighbor");
  if (isWideTitle) classes.push("wide-title");
  if (isShortTitle) classes.push("short-title");
  if (hasThreeWords) classes.push("three-word-title");
  if (isFarsiBook) classes.push("farsi-book");
  spine.className = classes.join(" ");
  const bookLabel =
    isFarsiBook
      ? `${book.title}، اثر ${book.author}`
      : `${book.title} by ${book.author}`;
  spine.setAttribute(
    "aria-label",
    tags ? `${bookLabel}. ${tags}` : bookLabel,
  );
  spine.title = tags ? `${bookLabel} · ${tags}` : bookLabel;
  if (isFarsiBook) {
    spine.lang = "fa";
    spine.dir = "rtl";
  }
  spine.style.setProperty("--book", book.color);
  spine.style.setProperty("--accent", book.accent);
  const minimumHeight = titleLength > 38 ? 238 : isWideTitle ? 230 : 200;
  const height = Math.max(book.height, minimumHeight);
  spine.style.setProperty("--height", `${height}px`);
  if (leanDirection) {
    const angleIndex =
      (Math.floor(index / 10) + (leanDirection < 0 ? 3 : 0)) % LEAN_ANGLES.length;
    const angle = LEAN_ANGLES[angleIndex];
    spine.style.setProperty("--lean", `${leanDirection * angle}deg`);
    spine.style.setProperty(
      "--lean-gap",
      `${Math.ceil(height * Math.sin((angle * Math.PI) / 180)) + 2}px`,
    );
  }

  const ornament = span("book-ornament");
  ornament.setAttribute("aria-hidden", "true");
  const titleClasses = ["book-title"];
  if (titleLength > (isFarsiBook ? 18 : 30)) titleClasses.push("compact");
  if (isShortTitle || hasThreeWords) titleClasses.push("single-line");
  const title = span(titleClasses.join(" "), displayTitle);
  const author = span(
    `book-author${isFarsiAuthor ? " farsi-author" : ""}${book.author.length > (isFarsiAuthor ? 14 : 20) ? " compact" : ""}`,
    book.author,
  );
  author.lang = isFarsiAuthor ? "fa" : "und";
  author.dir = isFarsiAuthor ? "rtl" : "ltr";
  spine.append(
    span("book-cap"),
    ornament,
    title,
    span("book-rule"),
    author,
    span("book-mark", "✳"),
  );
  return spine;
}

function appendShelfRow(bookList, label, decoration, visibleTag) {
  const row = document.createElement("div");
  row.className = "books-row";
  row.tabIndex = 0;
  row.setAttribute(
    "aria-label",
    `${label}; drag, scroll, or use the left and right arrow keys to browse`,
  );

  const bookCycle = document.createElement("div");
  bookCycle.className = "book-cycle";
  const withPlant = decoration === "plant";
  bookList.forEach((book, index) => {
    bookCycle.append(createBook(book, index, withPlant));
    if (index === DECORATION_INDEX) {
      bookCycle.append(withPlant ? createPlant() : createJar());
    }
  });
  row.append(bookCycle);

  const woodShelf = document.createElement("div");
  woodShelf.className = "wood-shelf";
  woodShelf.append(
    span("wood-line"),
    span("wood-line second"),
    span("shelf-tag", visibleTag),
  );
  shelf.append(row, woodShelf);
  return { row, bookCycle, alignJarOnLoad: decoration === "jar" };
}

const shelfRows = [
  appendShelfRow(firstShelfBooks, "Read and did not finish", "plant", "read"),
  appendShelfRow(secondShelfBooks, "Currently reading and want to read", "jar", "in progress"),
];

root.replaceChildren(shelf);

const booksById = new Map(
  [...firstShelfBooks, ...secondShelfBooks].map((book) => [String(book.id), book]),
);
const bookDialog = document.createElement("dialog");
bookDialog.className = "book-dialog";
bookDialog.setAttribute("aria-labelledby", "preview-title");
bookDialog.setAttribute("aria-describedby", "preview-author");
document.body.append(bookDialog);

let previewSource = null;
let closingPreview = false;

function closeBookPreview() {
  if (!bookDialog.open || closingPreview) return;
  closingPreview = true;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    bookDialog.close();
    closingPreview = false;
    const focusTarget = previewSource?.closest("[aria-hidden='true']")
      ? previewSource.closest(".books-row") : previewSource;
    focusTarget?.focus({ preventScroll: true });
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finish();
    return;
  }
  bookDialog.animate(
    [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.96)" }],
    { duration: 160, easing: "ease-in", fill: "forwards" },
  ).finished.then(finish, finish);
  // Keep closing responsive even when the browser pauses animation frames.
  window.setTimeout(finish, 180);
}

function openBookPreview(book, source) {
  if (bookDialog.open) return;
  previewSource = source;
  bookDialog.getAnimations().forEach((animation) => animation.cancel());
  bookDialog.style.setProperty("--book", book.color);
  bookDialog.style.setProperty("--accent", book.accent);

  const close = document.createElement("button");
  close.type = "button";
  close.className = "preview-close";
  close.setAttribute("aria-label", "Close book preview");
  close.textContent = "×";
  close.autofocus = true;
  close.addEventListener("click", closeBookPreview);

  const cover = document.createElement("div");
  cover.className = "preview-cover";
  cover.lang = book.lang === "fa" ? "fa" : "en";
  cover.dir = book.lang === "fa" ? "rtl" : "ltr";
  const title = document.createElement("h2");
  title.id = "preview-title";
  title.textContent = book.title;
  const author = document.createElement("p");
  author.id = "preview-author";
  author.textContent = book.author;
  author.dir = "auto";
  cover.append(title, span("preview-rule"), author);

  const stage = document.createElement("div");
  stage.className = "preview-stage";
  const volume = document.createElement("div");
  volume.className = "preview-volume";
  for (const face of ["back", "pages-side", "pages-top", "pages-bottom", "pages-front"]) {
    const surface = span(`preview-${face}`);
    surface.setAttribute("aria-hidden", "true");
    volume.append(surface);
  }
  volume.append(cover);
  stage.append(volume);

  const details = document.createElement("div");
  details.className = "preview-details";
  const tags = document.createElement("div");
  tags.className = "preview-tags";
  for (const tag of book.tags || []) {
    const chip = span("preview-tag", TAG_LABELS[tag] || tag);
    chip.dir = "auto";
    tags.append(chip);
  }
  const links = document.createElement("div");
  links.className = "preview-links";
  for (const [label, url] of [["View on Goodreads", book.goodreadsUrl], ["Read my review", book.reviewUrl]]) {
    if (typeof url !== "string" || !url.trim()) continue;
    const link = document.createElement("a");
    link.textContent = label;
    link.href = url.trim();
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    links.append(link);
  }
  details.append(tags, links);
  bookDialog.replaceChildren(close, stage, details);
  shelfControllers.forEach((controller) => controller.stopMotion());
  bookDialog.showModal();

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const from = source.getBoundingClientRect();
    const to = volume.getBoundingClientRect();
    const x = from.left + from.width / 2 - (to.left + to.width / 2);
    const y = from.top + from.height / 2 - (to.top + to.height / 2);
    volume.animate([
      { transform: `translate(${x}px, ${y}px) scale(${from.width / to.width}, ${from.height / to.height}) rotateY(-65deg)`, opacity: .5 },
      { transform: getComputedStyle(volume).transform, opacity: 1 },
    ], { duration: 520, easing: "cubic-bezier(.2,.75,.25,1)" });
    details.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, delay: 220, fill: "backwards" });
  }
}

bookDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeBookPreview();
});
bookDialog.addEventListener("click", (event) => {
  if (event.target !== bookDialog) return;
  const bounds = bookDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) closeBookPreview();
});
function setupLoop(row, bookCycle, alignJarOnLoad) {
  let drag = null;
  let gestureStart = null;
  let gestureMoved = false;
  let cycleWidth = 0;
  let sideCopies = 0;
  let shortTitleElements = [];

  function centerShortTitles() {
    for (const { title, rule } of shortTitleElements) {
      const currentCenter = title.offsetTop + title.offsetHeight / 2;
      title.style.translate = `0 ${Math.round(rule.offsetTop / 2 - currentCenter)}px`;
    }
  }

  const shadowObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const style = entry.target.style;
      const height = entry.target.offsetHeight;
      const scale = Math.max(0.8, Math.min(1.5, height / 220));
      style.setProperty("--shadow-offset", `${Math.round(8 * scale)}px`);
      style.setProperty("--shadow-blur", `${Math.round(16 * scale)}px`);
      style.setProperty("--hover-shadow-blur", `${Math.round(40 * scale)}px`);
      style.setProperty("--hover-shadow-spread", `${-Math.round(6 * scale)}px`);
    }
  });

  function cloneCycle() {
    const clone = bookCycle.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("button, a").forEach((element) => { element.tabIndex = -1; });
    return clone;
  }

  function centerLoop() {
    if (!cycleWidth) return;
    const offset = row.scrollLeft - sideCopies * cycleWidth;
    if (Math.abs(offset) <= cycleWidth / 2) return;

    const shift = -Math.round(offset / cycleWidth) * cycleWidth;
    row.scrollLeft += shift;
    if (drag) drag.scrollLeft += shift;
  }

  function layoutLoop() {
    const relativePosition = cycleWidth
      ? (row.scrollLeft - sideCopies * cycleWidth) / cycleWidth
      : 0;
    const nextWidth = bookCycle.getBoundingClientRect().width;
    if (!nextWidth) return;

    const nextSideCopies = Math.max(1, Math.ceil(row.clientWidth / nextWidth));
    if (nextSideCopies !== sideCopies) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < nextSideCopies; i++) fragment.append(cloneCycle());
      fragment.append(bookCycle);
      for (let i = 0; i < nextSideCopies; i++) fragment.append(cloneCycle());
      row.replaceChildren(fragment);
      shadowObserver.disconnect();
      shortTitleElements = [];
      row.querySelectorAll(".book").forEach((book) => {
        shadowObserver.observe(book);
        if (book.classList.contains("short-title")) {
          shortTitleElements.push({
            title: book.querySelector(".book-title"),
            rule: book.querySelector(".book-rule"),
          });
        }
      });
    }

    cycleWidth = nextWidth;
    sideCopies = nextSideCopies;
    row.scrollLeft = (sideCopies + relativePosition) * cycleWidth;
    centerLoop();
    centerShortTitles();
  }

  layoutLoop();
  if (alignJarOnLoad) {
    const jar = bookCycle.querySelector(".shelf-jar");
    if (jar) {
      const rowRight =
        row.getBoundingClientRect().right -
        parseFloat(getComputedStyle(row).paddingRight);
      row.scrollLeft += jar.getBoundingClientRect().right - rowRight;
      centerLoop();
    }
  }
  document.fonts.ready.then(centerShortTitles);
  window.addEventListener("resize", layoutLoop);
  row.addEventListener("scroll", centerLoop, { passive: true });

  let keyAnimation = null;

  function stopKeyAnimation() {
    if (keyAnimation !== null) cancelAnimationFrame(keyAnimation);
    keyAnimation = null;
  }

  row.addEventListener("pointerdown", (event) => {
    gestureStart = { x: event.clientX, y: event.clientY };
    gestureMoved = false;
    if (
      event.pointerType === "touch" ||
      event.button !== 0 ||
      row.scrollWidth <= row.clientWidth ||
      event.target.closest("a")
    )
      return;
    stopKeyAnimation();
    drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      scrollLeft: row.scrollLeft,
    };
  });

  row.addEventListener("pointermove", (event) => {
    if (gestureStart && Math.hypot(event.clientX - gestureStart.x, event.clientY - gestureStart.y) > 6) {
      gestureMoved = true;
    }
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!gestureMoved) return;
    row.setPointerCapture(event.pointerId);
    row.classList.add("is-dragging");
    row.scrollLeft = drag.scrollLeft - (event.clientX - drag.x);
    centerLoop();
  });

  function endDrag(event) {
    gestureStart = null;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (row.hasPointerCapture(event.pointerId))
      row.releasePointerCapture(event.pointerId);
    row.classList.remove("is-dragging");
    drag = null;
  }

  row.addEventListener("pointerup", endDrag);
  row.addEventListener("pointercancel", endDrag);
  row.addEventListener("lostpointercapture", endDrag);
  row.addEventListener("click", (event) => {
    if (gestureMoved && event.detail !== 0) {
      event.preventDefault();
      return;
    }
    const source = event.target.closest(".book[data-book-id]");
    if (!source) return;
    const book = booksById.get(source.dataset.bookId);
    if (book) openBookPreview(book, source);
  });

  row.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (!cycleWidth) return;

      stopKeyAnimation();
      const multiplier =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? row.clientWidth
            : 1;
      event.preventDefault();
      row.scrollLeft += event.deltaY * multiplier;
      centerLoop();
    },
    { passive: false },
  );

  function moveShelf(distance) {
    if (!cycleWidth) return;
    stopKeyAnimation();
    let startedAt = null;
    let previousProgress = 0;

    function frame(now) {
      if (startedAt === null) startedAt = now;
      const progress = Math.min(1, (now - startedAt) / 300);
      const eased = 1 - (1 - progress) ** 3;
      row.scrollLeft += distance * (eased - previousProgress);
      centerLoop();
      previousProgress = eased;
      keyAnimation = progress < 1 ? requestAnimationFrame(frame) : null;
    }

    keyAnimation = requestAnimationFrame(frame);
  }

  return { row, moveShelf, stopMotion: stopKeyAnimation };
}

const shelfControllers = shelfRows.map(({ row, bookCycle, alignJarOnLoad }) =>
  setupLoop(row, bookCycle, alignJarOnLoad),
);

window.addEventListener("keydown", (event) => {
  if (bookDialog.open) return;
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest("input, textarea, select, [contenteditable]")) return;

  const focusedRow = target?.closest(".books-row");
  const controller =
    shelfControllers.find(({ row }) => row === focusedRow) ||
    shelfControllers[0];
  event.preventDefault();
  controller.moveShelf(event.key === "ArrowRight" ? 320 : -320);
});
