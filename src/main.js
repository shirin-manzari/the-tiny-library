async function loadBooks() {
  const response = await fetch(new URL('../books.json', import.meta.url))
  if (!response.ok) throw new Error(`Could not load books.json (${response.status})`)

  const books = await response.json()
  if (!Array.isArray(books)) throw new Error('books.json must contain an array of books')
  return books
}

function selectDailyBooks(allBooks) {
  const today = new Date()
  let seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const shuffle = (items) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      const swapped = items[i]
      items[i] = items[j]
      items[j] = swapped
    }
  }

  const remaining = [...allBooks]
  const selected = []
  for (const tag of ['read', 'currently-reading', 'to-read']) {
    const matching = remaining.filter((book) => book.tags?.includes(tag))
    if (!matching.length) continue
    const book = matching[Math.floor(random() * matching.length)]
    selected.push(book)
    remaining.splice(remaining.indexOf(book), 1)
  }

  shuffle(remaining)
  selected.push(...remaining.slice(0, Math.max(0, 27 - selected.length)))
  shuffle(selected)
  return selected
}

function span(className, text = '') {
  const element = document.createElement('span')
  element.className = className
  element.textContent = text
  return element
}

function normalizeBookTitle(title) {
  const withoutParentheses = title.replace(/\s*(?:\([^()]*\)|（[^（）]*）)/g, '')
  return withoutParentheses.split(/[:：]/, 1)[0].replace(/\s+/g, ' ').trim() || title
}

const root = document.getElementById('app')

if (!root) throw new Error('Application mount target not found')

let books
try {
  books = selectDailyBooks(await loadBooks())
} catch (error) {
  root.textContent = 'Could not load the book list. Please reload the page.'
  throw error
}

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

const tagLabels = { read: 'Read', 'currently-reading': 'Currently reading', 'to-read': 'Want to read' }

books.forEach((book, index) => {
  const spine = document.createElement('div')
  const tags = (book.tags || []).map((tag) => tagLabels[tag] || tag).join(', ')
  const displayTitle = normalizeBookTitle(book.title)
  const hasThreeWords = displayTitle.split(/\s+/u).length === 3
  const farsiAuthor = /[\u0600-\u06ff]/.test(book.author)
  const classes = ['book']
  if (index % 6 === 0) classes.push('vintage-bands')
  else if (index % 7 === 2) classes.push('vintage-frame')
  else if (index % 9 === 4) classes.push('vintage-crest')
  if (book.title !== 'A Philosophy of Software Design' && index % 10 === 3) classes.push('lean-right')
  if (book.title !== 'A Philosophy of Software Design' && index % 10 === 7) classes.push('lean-left')
  if (index === 5) classes.push('plant-neighbor')
  if (displayTitle.length > 18) classes.push('wide-title')
  if (hasThreeWords) classes.push('three-word-title')
  if (book.lang === 'fa') classes.push('farsi-book')
  spine.className = classes.join(' ')
  const bookLabel = book.lang === 'fa' ? `${book.title}، اثر ${book.author}` : `${book.title} by ${book.author}`
  spine.setAttribute('aria-label', tags ? `${bookLabel}. ${tags}` : bookLabel)
  spine.title = tags ? `${bookLabel} · ${tags}` : bookLabel
  spine.dataset.tags = (book.tags || []).join(' ')
  if (book.lang === 'fa') {
    spine.lang = 'fa'
    spine.dir = 'rtl'
  }
  spine.style.setProperty('--book', book.color)
  spine.style.setProperty('--accent', book.accent)
  const minimumHeight = displayTitle.length > 38 ? 238 : displayTitle.length > 18 ? 230 : 200
  spine.style.setProperty('--height', `${Math.max(book.height, minimumHeight)}px`)

  const ornament = span('book-ornament')
  ornament.setAttribute('aria-hidden', 'true')
  const titleClasses = ['book-title']
  if (displayTitle.length > (book.lang === 'fa' ? 18 : 30)) titleClasses.push('compact')
  if (displayTitle.length <= 14 || hasThreeWords) titleClasses.push('single-line')
  const title = span(titleClasses.join(' '), displayTitle)
  const author = span(`book-author${farsiAuthor ? ' farsi-author' : ''}${book.author.length > (farsiAuthor ? 14 : 20) ? ' compact' : ''}`, book.author)
  author.lang = farsiAuthor ? 'fa' : 'und'
  author.dir = farsiAuthor ? 'rtl' : 'ltr'
  spine.append(
    span('book-cap'),
    ornament,
    title,
    span('book-rule'),
    author,
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
const shadowObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const height = entry.target.offsetHeight
    const scale = Math.max(0.8, Math.min(1.5, height / 220))
    entry.target.style.setProperty('--shadow-offset', `${Math.round(8 * scale)}px`)
    entry.target.style.setProperty('--shadow-blur', `${Math.round(16 * scale)}px`)
    entry.target.style.setProperty('--hover-shadow-blur', `${Math.round(40 * scale)}px`)
    entry.target.style.setProperty('--hover-shadow-spread', `${-Math.round(6 * scale)}px`)
  }
})

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
    shadowObserver.disconnect()
    row.querySelectorAll('.book').forEach((book) => shadowObserver.observe(book))
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
