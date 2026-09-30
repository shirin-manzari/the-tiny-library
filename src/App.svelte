<script lang="ts">
  type Book = { title: string; author: string; color: string; accent: string; height: number }

  const starterBooks: Book[] = [
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

  function loadBooks(): Book[] {
    try {
      const saved = localStorage.getItem('tiny-library-goodreads-books')
      return saved ? JSON.parse(saved) as Book[] : starterBooks
    } catch { return starterBooks }
  }

  let books = $state<Book[]>(loadBooks())
</script>

<main class="shelf-display" aria-label="Books on a bookshelf">
  <div class="books-row">
    {#each books as book, index (book.title)}
      <div class="book" style={`--book:${book.color};--accent:${book.accent};--height:${book.height}px;--tilt:${index % 4 === 0 ? '-1.2deg' : index % 4 === 1 ? '.8deg' : '0deg'}`} aria-label={`${book.title} by ${book.author}`}>
        <span class="book-cap"></span>
        <span class="book-title">{book.title}</span>
        <span class="book-rule"></span>
        <span class="book-author">{book.author}</span>
        <span class="book-mark">✳</span>
      </div>
    {/each}
  </div>
  <div class="wood-shelf"><span class="wood-line"></span><span class="wood-line second"></span></div>
</main>
