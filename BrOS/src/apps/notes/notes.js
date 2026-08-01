
      const STORAGE_KEY = 'bros-notes';
      const notesList = document.getElementById('notes-list');
      const newNoteBtn = document.getElementById('new-note-btn');
      const searchInput = document.getElementById('search-input');
      const notesEmpty = document.getElementById('notes-empty');

      let notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

      function saveNotes() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      }

      function createNote() {
        notes.unshift({
          id: Date.now().toString(),
          title: 'Yeni Not',
          content: '',
          updated: new Date().toISOString(),
        });
        saveNotes();
        renderNotes();
      }

      function deleteNote(id) {
        notes = notes.filter((note) => note.id !== id);
        saveNotes();
        renderNotes();
      }

      function updateNote(id, key, value) {
        notes = notes.map((note) => note.id === id ? { ...note, [key]: value, updated: new Date().toISOString() } : note);
        saveNotes();
      }

      function renderNotes() {
        const query = searchInput.value.trim().toLowerCase();
        const filtered = notes.filter((note) => note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query));
        notesList.innerHTML = '';

        if (!filtered.length) {
          notesEmpty.hidden = false;
          return;
        }
        notesEmpty.hidden = true;

        filtered.forEach((note) => {
          const card = document.createElement('article');
          card.className = 'note-card';
          card.innerHTML = `
            <input type="text" value="${note.title}" aria-label="Not başlığı" />
            <textarea aria-label="Not içeriği">${note.content}</textarea>
            <footer>
              <small>${new Date(note.updated).toLocaleString()}</small>
              <button type="button" class="delete-note">Sil</button>
            </footer>
          `;

          const titleInput = card.querySelector('input');
          const contentTextarea = card.querySelector('textarea');
          const deleteButton = card.querySelector('.delete-note');

          titleInput.addEventListener('input', () => {
            updateNote(note.id, 'title', titleInput.value);
          });
          contentTextarea.addEventListener('input', () => {
            updateNote(note.id, 'content', contentTextarea.value);
          });
          deleteButton.addEventListener('click', () => deleteNote(note.id));

          notesList.appendChild(card);
        });
      }

      newNoteBtn.addEventListener('click', createNote);
      searchInput.addEventListener('input', renderNotes);
      window.addEventListener('load', renderNotes);