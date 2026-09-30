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
row.setAttribute('aria-label', 'Bookshelf; drag, scroll, or use the left and right arrow keys to browse')

books.forEach((book, index) => {
  const spine = document.createElement('div')
  const classes = ['book']
  if (index % 6 === 0) classes.push('vintage-bands')
  else if (index % 7 === 2) classes.push('vintage-frame')
  else if (index % 9 === 4) classes.push('vintage-crest')
  if (index % 10 === 3) classes.push('lean-right')
  if (index % 10 === 7) classes.push('lean-left')
  spine.className = classes.join(' ')
  spine.setAttribute('aria-label', `${book.title} by ${book.author}`)
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
  row.append(spine)
})

const woodShelf = document.createElement('div')
woodShelf.className = 'wood-shelf'
woodShelf.append(span('wood-line'), span('wood-line second'))
shelf.append(row, woodShelf)
root.replaceChildren(shelf)

let drag = null

row.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch' || event.button !== 0 || row.scrollWidth <= row.clientWidth) return
  drag = { pointerId: event.pointerId, x: event.clientX, scrollLeft: row.scrollLeft }
  row.setPointerCapture(event.pointerId)
  row.classList.add('is-dragging')
})

row.addEventListener('pointermove', (event) => {
  if (!drag || event.pointerId !== drag.pointerId) return
  row.scrollLeft = drag.scrollLeft - (event.clientX - drag.x)
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
  const maxScroll = row.scrollWidth - row.clientWidth
  if (maxScroll <= 0) return

  const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? row.clientWidth : 1
  const nextScroll = Math.max(0, Math.min(maxScroll, row.scrollLeft + event.deltaY * multiplier))
  if (nextScroll === row.scrollLeft) return
  event.preventDefault()
  row.scrollLeft = nextScroll
}, { passive: false })

window.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  if (event.altKey || event.ctrlKey || event.metaKey) return
  if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return
  if (row.scrollWidth <= row.clientWidth) return

  event.preventDefault()
  row.scrollBy({ left: event.key === 'ArrowRight' ? 320 : -320, behavior: 'smooth' })
})
