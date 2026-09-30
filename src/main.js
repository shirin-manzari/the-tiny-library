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
]

function loadBooks() {
  try {
    const saved = localStorage.getItem('tiny-library-goodreads-books')
    const parsed = saved ? JSON.parse(saved) : null
    return Array.isArray(parsed) ? parsed : starterBooks
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
