const FEATURED_BOOK_COUNT = 27;
const DECORATION_INDEX = 5;
const TAG_LABELS = {
  read: "Read",
  "currently-reading": "Currently reading",
  "to-read": "Want to read",
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

function selectDailyBooks(allBooks) {
  const today = new Date();
  let seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const shuffle = (items) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const swapped = items[i];
      items[i] = items[j];
      items[j] = swapped;
    }
  };

  const remaining = [...allBooks];
  const selected = [];
  for (const tag of Object.keys(TAG_LABELS)) {
    const matching = remaining.filter((book) => book.tags?.includes(tag));
    if (!matching.length) continue;
    const book = matching[Math.floor(random() * matching.length)];
    selected.push(book);
    remaining.splice(remaining.indexOf(book), 1);
  }

  shuffle(remaining);
  const extraCount = Math.max(0, FEATURED_BOOK_COUNT - selected.length);
  selected.push(...remaining.slice(0, extraCount));
  shuffle(selected);
  return { featured: selected, remaining: remaining.slice(extraCount) };
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

let featuredBooks;
let remainingBooks;
try {
  const selection = selectDailyBooks(await loadBooks());
  featuredBooks = selection.featured;
  remainingBooks = selection.remaining;
} catch (error) {
  root.textContent = "Could not load the book list. Please reload the page.";
  throw error;
}

const shelf = document.createElement("main");
shelf.className = "shelf-display";
shelf.setAttribute("aria-label", "Books on a bookshelf");
shelf.style.setProperty(
  "--shelf-width",
  `${Math.min(1150, Math.max(520, featuredBooks.length * 68 + 110))}px`,
);

function createPlant() {
  const plant = document.createElement("div");
  plant.className = "shelf-plant";
  plant.setAttribute("aria-hidden", "true");

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
  const reviewUrl =
    typeof book.reviewUrl === "string" ? book.reviewUrl.trim() : "";
  const spine = document.createElement(reviewUrl ? "a" : "div");
  if (reviewUrl) spine.href = reviewUrl;
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

function appendShelfRow(bookList, label, decoration) {
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
  woodShelf.append(span("wood-line"), span("wood-line second"));
  shelf.append(row, woodShelf);
  return { row, bookCycle, alignJarOnLoad: decoration === "jar" };
}

const shelfRows = [appendShelfRow(featuredBooks, "Today's books", "plant")];
if (remainingBooks.length) {
  shelfRows.push(appendShelfRow(remainingBooks, "Remaining books", "jar"));
}

root.replaceChildren(shelf);

function setupLoop(row, bookCycle, alignJarOnLoad) {
  let drag = null;
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
    row.setPointerCapture(event.pointerId);
    row.classList.add("is-dragging");
  });

  row.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    row.scrollLeft = drag.scrollLeft - (event.clientX - drag.x);
    centerLoop();
  });

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (row.hasPointerCapture(event.pointerId))
      row.releasePointerCapture(event.pointerId);
    row.classList.remove("is-dragging");
    drag = null;
  }

  row.addEventListener("pointerup", endDrag);
  row.addEventListener("pointercancel", endDrag);

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

  return { row, moveShelf };
}

const shelfControllers = shelfRows.map(({ row, bookCycle, alignJarOnLoad }) =>
  setupLoop(row, bookCycle, alignJarOnLoad),
);

window.addEventListener("keydown", (event) => {
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
