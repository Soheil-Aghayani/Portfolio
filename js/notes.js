
class NotesApp {
    constructor() {
        this.NOTES_LOCAL_KEY = 'soheil_notes_local_v1';
        this.NOTES_AUTH_KEY = 'soheil_notes_auth_v1';
        this.NOTES_PUBLIC_URL = 'notes.json';

        this.notesPublic = [];
        this.notesLocal = this.readLocalNotes();
        this.notesLoadedPublic = false;
        this.lastFocus = null;

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
        this.nameCount = document.getElementById('noteNameCount');
        this.descCount = document.getElementById('noteDescCount');
        this.linkIn = document.getElementById('noteLink');
        this.saveBtn = document.getElementById('notesSave');
        this.editorCancel = document.getElementById('notesEditCancel');
        this.editorMsg = document.getElementById('notesEditMsg');

        this.authForm = document.getElementById('notesAuthForm');
        this.editForm = document.getElementById('notesEditForm');

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

        if(this.nameIn && this.nameCount) {
            this.nameIn.addEventListener('input', () => {
                this.nameCount.textContent = `${this.nameIn.value.length}/80`;
            });
        }

        if(this.descIn && this.descCount) {
            this.descIn.addEventListener('input', () => {
                this.descCount.textContent = `${this.descIn.value.length}/280`;
            });
        }

        if(this.authForm) {
            this.authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.doAuth();
            });
        }
        if(this.authCancel) this.authCancel.addEventListener('click', () => this.closeAuth());

        if(this.editForm) {
            this.editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNote();
            });
        }
        if(this.editorCancel) this.editorCancel.addEventListener('click', () => this.closeEditor());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.authModal && this.authModal.classList.contains('open')) {
                    this.closeAuth();
                } else if (this.editorModal && this.editorModal.classList.contains('open')) {
                    this.closeEditor();
                }
            }
        });
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
        this.lastFocus = document.activeElement;
        this.authModal.classList.add('open');
        this.authModal.setAttribute('aria-hidden', 'false');
        this.userIn.focus();
    }

    closeAuth() {
        this.authModal.classList.remove('open');
        this.authModal.setAttribute('aria-hidden', 'true');
        this.userIn.value = '';
        this.passIn.value = '';
        this.authMsg.textContent = '';
        if (this.lastFocus) {
            this.lastFocus.focus();
            this.lastFocus = null;
        }
    }

    openEditor() {
        this.lastFocus = document.activeElement;
        this.editorModal.classList.add('open');
        this.editorModal.setAttribute('aria-hidden', 'false');
        if(this.nameCount) this.nameCount.textContent = `${this.nameIn.value.length}/80`;
        if(this.descCount) this.descCount.textContent = `${this.descIn.value.length}/280`;
        this.nameIn.focus();
    }

    closeEditor() {
        this.editorModal.classList.remove('open');
        this.editorModal.setAttribute('aria-hidden', 'true');
        this.nameIn.value = '';
        this.descIn.value = '';
        this.linkIn.value = '';
        this.editorMsg.textContent = '';
        if(this.nameCount) this.nameCount.textContent = '0/80';
        if(this.descCount) this.descCount.textContent = '0/280';
        if (this.lastFocus) {
            this.lastFocus.focus();
            this.lastFocus = null;
        }
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
            this.listEl.innerHTML = '<div class="note-item" style="text-align: center; padding: 40px 20px;"><span class="material-symbols-rounded" style="font-size: 3rem; color: var(--text-muted); opacity: 0.5; margin-bottom: 10px;">note_stack</span><div style="color: var(--text-muted); margin-bottom: 5px;">No notes yet</div><div style="font-size: 0.85rem; color: var(--text-muted); opacity: 0.7;">Click the <span class="material-symbols-rounded" style="font-size: 1rem; vertical-align: middle;">add</span> button above to create one</div></div>';
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
                        ${n.src === 'local' && this.isAuthed() ? `<button class="note-del" data-id="${n.id}" aria-label="Delete note" title="Delete note"><span class="material-symbols-rounded">delete</span></button>` : ''}
                    </div>
                </div>
                <div class="note-desc">${n.desc || ''}</div>
                ${n.link ? `<a href="${n.link}" target="_blank" class="note-link">${n.link}</a>` : ''}
            `;

            const delBtn = div.querySelector('.note-del');
            if (delBtn) {
                delBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this note?')) {
                        const next = this.notesLocal.filter(x => x.id !== n.id);
                        this.writeLocalNotes(next);
                    }
                });
            }
            this.listEl.appendChild(div);
        });
    }
}

window.NotesApp = new NotesApp();
