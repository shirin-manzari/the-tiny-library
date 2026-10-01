const starterBooks = [
  { title: 'The Creative Act', author: 'Rick Rubin', color: '#d67c57', accent: '#f4c77d', height: 190 },
  { title: 'The Little Prince', author: 'Antoine de Saint-Exupéry', color: '#55866c', accent: '#e6c865', height: 164 },
  { title: 'Steal Like an Artist', author: 'Austin Kleon', color: '#daae4e', accent: '#fff2cf', height: 178 },
  { title: 'A Philosophy of Software Design', author: 'John Ousterhout', color: '#617c9e', accent: '#d6e1ed', height: 204 },
  { title: 'The Design of Everyday Things', author: 'Don Norman', color: '#bc675c', accent: '#f0d4ad', height: 186 },
  { title: 'The Pragmatic Programmer', author: 'David Thomas & Andrew Hunt', color: '#4c777c', accent: '#e7bb70', height: 199 },
  { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', color: '#776397', accent: '#e5b778', height: 206 },
  { title: 'How to Do Nothing', author: 'Jenny Odell', color: '#71875c', accent: '#e8d5a2', height: 182 },
  { title: 'Piranesi', author: 'Susanna Clarke', color: '#568292', accent: '#f0d18e', height: 195 },
  { title: 'Ways of Seeing', author: 'John Berger', color: '#c17a48', accent: '#f5e3b9', height: 169 },
  { title: 'The Hobbit', author: 'J. R. R. Tolkien', color: '#405f48', accent: '#dbc88c', height: 201 },
  { title: 'Jane Eyre', author: 'Charlotte Bronte', color: '#9c4f42', accent: '#edcf9a', height: 183 },
  { title: 'Dune', author: 'Frank Herbert', color: '#b4834e', accent: '#f5dfb5', height: 208 },
  { title: 'The Secret Garden', author: 'Frances Hodgson Burnett', color: '#668169', accent: '#e8d7aa', height: 174 },
  { title: 'Beloved', author: 'Toni Morrison', color: '#6e5267', accent: '#e6c5a7', height: 194 },
  { title: 'Frankenstein', author: 'Mary Shelley', color: '#4c6872', accent: '#d7cba8', height: 187 },
  { title: 'The Night Circus', author: 'Erin Morgenstern', color: '#343f50', accent: '#e8d7c2', height: 203 },
  { title: 'Normal People', author: 'Sally Rooney', color: '#7d8c6f', accent: '#f1e2bf', height: 177 },
  { title: 'The Alchemist', author: 'Paulo Coelho', color: '#ac6949', accent: '#f2c980', height: 190 },
  { title: 'A Room of One’s Own', author: 'Virginia Woolf', color: '#77739b', accent: '#e3d6b2', height: 180 },
  { title: 'Invisible Cities', author: 'Italo Calvino', color: '#b45e59', accent: '#f0cfa5', height: 197 },
  { title: 'The Bell Jar', author: 'Sylvia Plath', color: '#597c80', accent: '#e6d6af', height: 185 },
  { title: 'بوف کور', author: 'صادق هدایت', color: '#493f53', accent: '#dfc3a0', height: 196, lang: 'fa' },
  { title: 'سووشون', author: 'سیمین دانشور', color: '#855c4b', accent: '#f2d5a3', height: 186, lang: 'fa' },
  { title: 'کلیدر', author: 'محمود دولت‌آبادی', color: '#59694b', accent: '#e9d7a4', height: 208, lang: 'fa' },
  { title: 'چشم‌هایش', author: 'بزرگ علوی', color: '#315e68', accent: '#f0d4aa', height: 178, lang: 'fa' },
  { title: 'سمفونی مردگان', author: 'عباس معروفی', color: '#763d4a', accent: '#e9c8a4', height: 214, lang: 'fa' },
]

function loadBooks() {
  try {
    const saved = localStorage.getItem('tiny-library-goodreads-books')
    const parsed = saved ? JSON.parse(saved) : null
    if (!Array.isArray(parsed)) return starterBooks

    const savedTitles = new Set(parsed.map((book) => book?.title?.toLowerCase()))
    const newBooks = starterBooks.slice(10).filter((book) => !savedTitles.has(book.title.toLowerCase()))
    return [...parsed, ...newBooks]
  } catch {
    return starterBooks
  }
}

function span(className, text = '') {
  const element = document.createElement('span')
  element.className = className
  element.textContent = text
  return element
}

const books = loadBooks()
const root = document.getElementById('app')

if (!root) throw new Error('Application mount target not found')

const shelf = document.createElement('main')
shelf.className = 'shelf-display'
shelf.setAttribute('aria-label', 'Books on a bookshelf')
shelf.style.setProperty('--shelf-width', `${Math.min(1150, Math.max(520, books.length * 68 + 110))}px`)

const row = document.createElement('div')
row.className = 'books-row'
row.tabIndex = 0
row.setAttribute('aria-label', 'Looping bookshelf; drag, scroll, or use the left and right arrow keys to browse')

const bookCycle = document.createElement('div')
bookCycle.className = 'book-cycle'

function createPlant() {
  const plant = document.createElement('div')
  plant.className = 'shelf-plant'
  plant.setAttribute('aria-hidden', 'true')

  const cactus = document.createElement('div')
  cactus.className = 'plant-cactus'
  cactus.append(span('cactus-body'))

  const pot = document.createElement('div')
  pot.className = 'plant-pot'
  pot.append(span('plant-soil'), span('plant-rim'), span('plant-pot-body'))
  plant.append(cactus, pot)
  return plant
}

books.forEach((book, index) => {
  const spine = document.createElement('div')
  const classes = ['book']
  if (index % 6 === 0) classes.push('vintage-bands')
  else if (index % 7 === 2) classes.push('vintage-frame')
  else if (index % 9 === 4) classes.push('vintage-crest')
  if (book.title !== 'A Philosophy of Software Design' && index % 10 === 3) classes.push('lean-right')
  if (book.title !== 'A Philosophy of Software Design' && index % 10 === 7) classes.push('lean-left')
  if (index === 5) classes.push('plant-neighbor')
  if (book.lang === 'fa') classes.push('farsi-book')
  spine.className = classes.join(' ')
  spine.setAttribute('aria-label', book.lang === 'fa' ? `${book.title}، اثر ${book.author}` : `${book.title} by ${book.author}`)
  if (book.lang === 'fa') {
    spine.lang = 'fa'
    spine.dir = 'rtl'
  }
  spine.style.setProperty('--book', book.color)
  spine.style.setProperty('--accent', book.accent)
  spine.style.setProperty('--height', `${book.height}px`)

  const ornament = span('book-ornament')
  ornament.setAttribute('aria-hidden', 'true')
  spine.append(
    span('book-cap'),
    ornament,
    span('book-title', book.title),
    span('book-rule'),
    span('book-author', book.author),
    span('book-mark', '✳'),
  )
  bookCycle.append(spine)
  if (index === 5) bookCycle.append(createPlant())
})

row.append(bookCycle)
const woodShelf = document.createElement('div')
woodShelf.className = 'wood-shelf'
woodShelf.append(span('wood-line'), span('wood-line second'))
shelf.append(row, woodShelf)

const preview = document.createElement('figure')
preview.className = 'project-preview'
const previewImage = document.createElement('img')
previewImage.src = new URL('../assets/bookshelf-preview.png', import.meta.url).href
previewImage.alt = 'The Tiny Library bookshelf with colorful book spines on a wooden shelf'
previewImage.loading = 'lazy'
preview.append(previewImage)
root.replaceChildren(shelf, preview)

let drag = null
let cycleWidth = 0
let sideCopies = 0

function cloneCycle() {
  const clone = bookCycle.cloneNode(true)
  clone.setAttribute('aria-hidden', 'true')
  return clone
}

function centerLoop() {
  if (!cycleWidth) return
  const offset = row.scrollLeft - sideCopies * cycleWidth
  if (Math.abs(offset) <= cycleWidth / 2) return

  const shift = -Math.round(offset / cycleWidth) * cycleWidth
  row.scrollLeft += shift
  if (drag) drag.scrollLeft += shift
}

function layoutLoop() {
  const relativePosition = cycleWidth ? (row.scrollLeft - sideCopies * cycleWidth) / cycleWidth : 0
  const nextWidth = bookCycle.getBoundingClientRect().width
  if (!nextWidth) return

  const nextSideCopies = Math.max(1, Math.ceil(row.clientWidth / nextWidth))
  if (nextSideCopies !== sideCopies) {
    const fragment = document.createDocumentFragment()
    for (let i = 0; i < nextSideCopies; i++) fragment.append(cloneCycle())
    fragment.append(bookCycle)
    for (let i = 0; i < nextSideCopies; i++) fragment.append(cloneCycle())
    row.replaceChildren(fragment)
  }

  cycleWidth = nextWidth
  sideCopies = nextSideCopies
  row.scrollLeft = (sideCopies + relativePosition) * cycleWidth
  centerLoop()
}

layoutLoop()
window.addEventListener('resize', layoutLoop)
row.addEventListener('scroll', centerLoop, { passive: true })

let keyAnimation = null

function stopKeyAnimation() {
  if (keyAnimation !== null) cancelAnimationFrame(keyAnimation)
  keyAnimation = null
}

row.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch' || event.button !== 0 || row.scrollWidth <= row.clientWidth) return
  stopKeyAnimation()
  drag = { pointerId: event.pointerId, x: event.clientX, scrollLeft: row.scrollLeft }
  row.setPointerCapture(event.pointerId)
  row.classList.add('is-dragging')
})

row.addEventListener('pointermove', (event) => {
  if (!drag || event.pointerId !== drag.pointerId) return
  row.scrollLeft = drag.scrollLeft - (event.clientX - drag.x)
  centerLoop()
})

function endDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return
  if (row.hasPointerCapture(event.pointerId)) row.releasePointerCapture(event.pointerId)
  row.classList.remove('is-dragging')
  drag = null
}

row.addEventListener('pointerup', endDrag)
row.addEventListener('pointercancel', endDrag)

row.addEventListener('wheel', (event) => {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
  if (!cycleWidth) return

  stopKeyAnimation()
  const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? row.clientWidth : 1
  event.preventDefault()
  row.scrollLeft += event.deltaY * multiplier
  centerLoop()
}, { passive: false })

function moveShelf(distance) {
  stopKeyAnimation()
  let startedAt = null
  let previousProgress = 0

  function frame(now) {
    if (startedAt === null) startedAt = now
    const progress = Math.min(1, (now - startedAt) / 300)
    const eased = 1 - (1 - progress) ** 3
    row.scrollLeft += distance * (eased - previousProgress)
    centerLoop()
    previousProgress = eased
    keyAnimation = progress < 1 ? requestAnimationFrame(frame) : null
  }

  keyAnimation = requestAnimationFrame(frame)
}

window.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  if (event.altKey || event.ctrlKey || event.metaKey) return
  if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return
  if (!cycleWidth) return

  event.preventDefault()
  moveShelf(event.key === 'ArrowRight' ? 320 : -320)
})
