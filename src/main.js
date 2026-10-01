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
  const extraCount = Math.max(0, 27 - selected.length)
  selected.push(...remaining.slice(0, extraCount))
  shuffle(selected)
  return { featured: selected, remaining: remaining.slice(extraCount) }
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

let featuredBooks
let remainingBooks
try {
  const selection = selectDailyBooks(await loadBooks())
  featuredBooks = selection.featured
  remainingBooks = selection.remaining
} catch (error) {
  root.textContent = 'Could not load the book list. Please reload the page.'
  throw error
}

const shelf = document.createElement('main')
shelf.className = 'shelf-display'
shelf.setAttribute('aria-label', 'Books on a bookshelf')
shelf.style.setProperty('--shelf-width', `${Math.min(1150, Math.max(520, featuredBooks.length * 68 + 110))}px`)

const row = document.createElement('div')
row.className = 'books-row'
row.tabIndex = 0
row.setAttribute('aria-label', "Today's books; drag, scroll, or use the left and right arrow keys to browse")

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

function createJar() {
  const jar = document.createElement('div')
  jar.className = 'shelf-jar'
  jar.setAttribute('role', 'img')
  jar.setAttribute('aria-label', 'Glass jar with a blue butterfly')
  jar.append(span('jar-lid'), span('jar-neck'))

  const glass = span('jar-glass')
  const butterfly = document.createElement('div')
  butterfly.className = 'butterfly'
  for (let side = 0; side < 2; side++) {
    const wing = document.createElement('div')
    wing.className = 'wing'
    wing.append(document.createElement('div'), document.createElement('div'))
    wing.children[0].className = 'bit'
    wing.children[1].className = 'bit'
    butterfly.append(wing)
  }
  const scene = document.createElement('div')
  scene.className = 'jar-butterfly-scene'
  scene.append(butterfly)
  glass.append(scene, span('jar-shine'))
  jar.append(glass)
  return jar
}

const tagLabels = { read: 'Read', 'currently-reading': 'Currently reading', 'to-read': 'Want to read' }
const leanAngles = [3.5, 4.1, 4.7, 3.3, 2.9, 4.5, 1.5]

function populateCycle(bookList, cycle, withPlant, withJar = false) {
  bookList.forEach((book, index) => {
    const reviewUrl = typeof book.reviewUrl === 'string' ? book.reviewUrl.trim() : ''
    const spine = document.createElement(reviewUrl ? 'a' : 'div')
    if (reviewUrl) spine.href = reviewUrl
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
    if (withPlant && index === 5) classes.push('plant-neighbor')
    if (displayTitle.length > 18) classes.push('wide-title')
    if (displayTitle.length <= 14) classes.push('short-title')
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
    const height = Math.max(book.height, minimumHeight)
    spine.style.setProperty('--height', `${height}px`)
    if (classes.includes('lean-right') || classes.includes('lean-left')) {
      const direction = classes.includes('lean-right') ? 1 : -1
      const angleIndex = (Math.floor(index / 10) + (direction < 0 ? 3 : 0)) % leanAngles.length
      const angle = leanAngles[angleIndex]
      spine.style.setProperty('--lean', `${direction * angle}deg`)
      spine.style.setProperty('--lean-gap', `${Math.ceil(height * Math.sin(angle * Math.PI / 180)) + 2}px`)
    }

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
    cycle.append(spine)
    if (withPlant && index === 5) cycle.append(createPlant())
    if (withJar && index === 5) cycle.append(createJar())
  })
}

populateCycle(featuredBooks, bookCycle, true)

row.append(bookCycle)
const woodShelf = document.createElement('div')
woodShelf.className = 'wood-shelf'
woodShelf.append(span('wood-line'), span('wood-line second'))
shelf.append(row, woodShelf)

let secondRow = null
let secondCycle = null
if (remainingBooks.length) {
  secondRow = document.createElement('div')
  secondRow.className = 'books-row'
  secondRow.tabIndex = 0
  secondRow.setAttribute('aria-label', 'Remaining books; drag, scroll, or use the left and right arrow keys to browse')
  secondCycle = document.createElement('div')
  secondCycle.className = 'book-cycle'
  populateCycle(remainingBooks, secondCycle, false, true)
  secondRow.append(secondCycle)

  const secondWoodShelf = document.createElement('div')
  secondWoodShelf.className = 'wood-shelf'
  secondWoodShelf.append(span('wood-line'), span('wood-line second'))
  shelf.append(secondRow, secondWoodShelf)
}

root.replaceChildren(shelf)

function setupLoop(row, bookCycle) {
  let drag = null
  let cycleWidth = 0
  let sideCopies = 0

  function centerShortTitles() {
    row.querySelectorAll('.book.short-title').forEach((book) => {
      const title = book.querySelector('.book-title')
      const rule = book.querySelector('.book-rule')
      const currentCenter = title.offsetTop + title.offsetHeight / 2
      title.style.translate = `0 ${Math.round(rule.offsetTop / 2 - currentCenter)}px`
    })
  }

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
    centerShortTitles()
  }

  layoutLoop()
  document.fonts.ready.then(centerShortTitles)
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
    if (!cycleWidth) return
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

  return { row, moveShelf }
}

const shelfControllers = [setupLoop(row, bookCycle)]
if (secondRow) shelfControllers.push(setupLoop(secondRow, secondCycle))

window.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  if (event.altKey || event.ctrlKey || event.metaKey) return
  if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return

  const focusedRow = event.target instanceof Element ? event.target.closest('.books-row') : null
  const controller = shelfControllers.find(({ row }) => row === focusedRow) || shelfControllers[0]
  event.preventDefault()
  controller.moveShelf(event.key === 'ArrowRight' ? 320 : -320)
})
