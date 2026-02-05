
class NotesApp {
    constructor() {
        this.NOTES_LOCAL_KEY = 'soheil_notes_local_v1';
        this.NOTES_AUTH_KEY = 'soheil_notes_auth_v1';
        this.NOTES_PUBLIC_URL = 'notes.json';

        this.notesPublic = [];
        this.notesLocal = this.readLocalNotes();
        this.notesLoadedPublic = false;

        // UI Elements
        this.listEl = document.getElementById('notesList');
        this.addBtn = document.getElementById('notesAddBtn');

        this.authModal = document.getElementById('notesAuth');
        this.userIn = document.getElementById('notesUser');
        this.passIn = document.getElementById('notesPass');
        this.authGo = document.getElementById('notesAuthGo');
        this.authCancel = document.getElementById('notesAuthCancel');
        this.authMsg = document.getElementById('notesAuthMsg');

        this.editorModal = document.getElementById('notesEditor');
        this.nameIn = document.getElementById('noteName');
        this.descIn = document.getElementById('noteDesc');
        this.linkIn = document.getElementById('noteLink');
        this.saveBtn = document.getElementById('notesSave');
        this.editorCancel = document.getElementById('notesEditCancel');
        this.editorMsg = document.getElementById('notesEditMsg');

        this.bindEvents();
        this.loadNotesPublic();
    }

    bindEvents() {
        if(this.addBtn) {
            this.addBtn.addEventListener('click', () => {
                if (this.isAuthed()) this.openEditor();
                else this.openAuth();
            });
        }

        if(this.authGo) this.authGo.addEventListener('click', () => this.doAuth());
        if(this.authCancel) this.authCancel.addEventListener('click', () => this.closeAuth());
        if(this.saveBtn) this.saveBtn.addEventListener('click', () => this.saveNote());
        if(this.editorCancel) this.editorCancel.addEventListener('click', () => this.closeEditor());
    }

    readLocalNotes() {
        try {
            const raw = localStorage.getItem(this.NOTES_LOCAL_KEY);
            const arr = JSON.parse(raw || '[]');
            return Array.isArray(arr) ? arr : [];
        } catch { return []; }
    }

    writeLocalNotes(arr) {
        this.notesLocal = arr;
        localStorage.setItem(this.NOTES_LOCAL_KEY, JSON.stringify(arr));
        this.render();
    }

    async loadNotesPublic() {
        if (this.notesLoadedPublic) return;
        try {
            const res = await fetch(this.NOTES_PUBLIC_URL);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    this.notesPublic = data;
                    this.notesLoadedPublic = true;
                    this.render();
                }
            }
        } catch(e) { console.log('No public notes found'); }
    }

    isAuthed() {
        return sessionStorage.getItem(this.NOTES_AUTH_KEY) === '1';
    }

    doAuth() {
        const u = this.userIn.value.trim();
        const p = this.passIn.value;
        // Simple client-side auth as in original code
        if (u === 'agseyl' && p === 'Silver_seyl2021') {
            sessionStorage.setItem(this.NOTES_AUTH_KEY, '1');
            this.closeAuth();
            this.openEditor();
        } else {
            this.authMsg.textContent = 'Invalid credentials';
        }
    }

    openAuth() {
        this.authModal.classList.add('open');
        this.userIn.focus();
    }

    closeAuth() {
        this.authModal.classList.remove('open');
        this.userIn.value = '';
        this.passIn.value = '';
        this.authMsg.textContent = '';
    }

    openEditor() {
        this.editorModal.classList.add('open');
        this.nameIn.focus();
    }

    closeEditor() {
        this.editorModal.classList.remove('open');
        this.nameIn.value = '';
        this.descIn.value = '';
        this.linkIn.value = '';
        this.editorMsg.textContent = '';
    }

    saveNote() {
        const name = this.nameIn.value.trim();
        const desc = this.descIn.value.trim();
        const link = this.linkIn.value.trim();

        if (!name) { this.editorMsg.textContent = 'Name required'; return; }

        const newNote = {
            id: 'n_' + Date.now(),
            name, desc, link,
            ts: Date.now()
        };

        const next = [...this.notesLocal, newNote];
        this.writeLocalNotes(next);
        this.closeEditor();
    }

    render() {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';

        const list = [
            ...this.notesPublic.map(n => ({...n, src: 'public'})),
            ...this.notesLocal.map(n => ({...n, src: 'local'}))
        ].sort((a,b) => (b.ts || 0) - (a.ts || 0));

        if (list.length === 0) {
            this.listEl.innerHTML = '<div class="note-item">No notes yet.</div>';
            return;
        }

        list.forEach(n => {
            const div = document.createElement('div');
            div.className = 'note-item';
            div.innerHTML = `
                <div class="note-top">
                    <div class="note-name">${n.name || 'Untitled'}</div>
                    <div class="note-badges">
                        <span class="note-badge">${n.src}</span>
                        ${n.src === 'local' && this.isAuthed() ? `<button class="note-del" data-id="${n.id}"><span class="material-symbols-rounded">delete</span></button>` : ''}
                    </div>
                </div>
                <div class="note-desc">${n.desc || ''}</div>
                ${n.link ? `<a href="${n.link}" target="_blank" class="note-link">${n.link}</a>` : ''}
            `;

            const delBtn = div.querySelector('.note-del');
            if (delBtn) {
                delBtn.addEventListener('click', () => {
                    const next = this.notesLocal.filter(x => x.id !== n.id);
                    this.writeLocalNotes(next);
                });
            }
            this.listEl.appendChild(div);
        });
    }
}

window.NotesApp = new NotesApp();
