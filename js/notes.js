
const localIcon = (name, options = {}) => window.IconRegistry
    ? window.IconRegistry.svg(name, options)
    : '';

class NotesApp {
    constructor() {
        this.NOTES_LOCAL_KEY = 'soheil_notes_local_v1';
        this.NOTES_PUBLIC_URL = 'notes.json';

        this.notesPublic = [];
        this.notesLocal = this.readLocalNotes();
        this.notesLoadedPublic = false;
        this.lastFocus = null;
        this.editingNoteId = null;

        // UI Elements
        this.listEl = document.getElementById('notesList');
        this.addBtn = document.getElementById('notesAddBtn');

        this.editorModal = document.getElementById('notesEditor');
        this.nameIn = document.getElementById('noteName');
        this.descIn = document.getElementById('noteDesc');
        this.nameCount = document.getElementById('noteNameCount');
        this.descCount = document.getElementById('noteDescCount');
        this.linkIn = document.getElementById('noteLink');
        this.saveBtn = document.getElementById('notesSave');
        this.editorCancel = document.getElementById('notesEditCancel');
        this.editorMsg = document.getElementById('notesEditMsg');

        this.editForm = document.getElementById('notesEditForm');

        this.bindEvents();
        this.loadNotesPublic();
    }

    bindEvents() {
        if (this.addBtn) {
            // No auth gate — go straight to editor
            this.addBtn.addEventListener('click', () => this.openEditor());
        }

        if (this.nameIn && this.nameCount) {
            this.nameIn.addEventListener('input', () => {
                this.nameCount.textContent = `${this.nameIn.value.length}/80`;
            });
        }

        if (this.descIn && this.descCount) {
            this.descIn.addEventListener('input', () => {
                this.descCount.textContent = `${this.descIn.innerText.length}/280`;
            });
        }

        // Toolbar buttons handler
        const tbBtns = this.editorModal?.querySelectorAll('.notes-tb-btn');
        if (tbBtns) {
            tbBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const cmd = btn.dataset.cmd;
                    document.execCommand(cmd, false, null);
                    this.descIn.focus();
                });
            });
        }

        if (this.editForm) {
            this.editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNote();
            });
        }
        if (this.editorCancel) this.editorCancel.addEventListener('click', () => this.closeEditor());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.editorModal && this.editorModal.classList.contains('open')) {
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
        return true; // No auth required — anyone can add/edit/delete notes
    }

    openEditor() {
        this.lastFocus = document.activeElement;
        this.editorModal.classList.add('open');
        this.editorModal.removeAttribute('inert');
        if(this.nameCount) this.nameCount.textContent = `${this.nameIn.value.length}/80`;
        if(this.descCount) this.descCount.textContent = `${this.descIn.innerText.length}/280`;
        this.nameIn.focus();
    }

    closeEditor() {
        this.editorModal.classList.remove('open');
        this.editorModal.setAttribute('inert', '');
        this.nameIn.value = '';
        this.descIn.innerHTML = '';
        this.linkIn.value = '';
        this.editorMsg.textContent = '';
        if(this.nameCount) this.nameCount.textContent = '0/80';
        if(this.descCount) this.descCount.textContent = '0/280';
        
        this.editingNoteId = null;
        const modalTitle = this.editorModal.querySelector('.notes-modal-title');
        if (modalTitle) modalTitle.textContent = 'New note';

        if (this.lastFocus) {
            this.lastFocus.focus();
            this.lastFocus = null;
        }
    }

    saveNote() {
        const name = this.nameIn.value.trim();
        const descHtml = this.descIn.innerHTML.trim();
        const desc = (descHtml === '<br>' || descHtml === '<div><br></div>') ? '' : descHtml;
        const link = this.linkIn.value.trim();

        if (!name) { this.editorMsg.textContent = 'Name required'; return; }

        if (this.editingNoteId) {
            const next = this.notesLocal.map(n => {
                if (n.id === this.editingNoteId) {
                    return { ...n, name, desc, link, ts: Date.now() };
                }
                return n;
            });
            this.writeLocalNotes(next);
        } else {
            const newNote = {
                id: 'n_' + Date.now(),
                name, desc, link,
                ts: Date.now()
            };
            const next = [...this.notesLocal, newNote];
            this.writeLocalNotes(next);
        }
        
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
            this.listEl.innerHTML = `<div class="note-item" style="text-align: center; padding: 40px 20px;">${localIcon('ui/notes', { label: 'Notes' })}<div style="color: var(--text-muted); margin-bottom: 5px;">No notes yet</div><div style="font-size: 0.85rem; color: var(--text-muted); opacity: 0.7;">Click the ${localIcon('ui/add', { label: 'Add note' })} button above to create one</div></div>`;
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
                        ${n.src === 'local' && this.isAuthed() ? `
                            <button class="note-edit" data-id="${n.id}" aria-label="Edit note" title="Edit note">${localIcon('ui/edit', { label: 'Edit note' })}</button>
                            <button class="note-del" data-id="${n.id}" aria-label="Delete note" title="Delete note">${localIcon('ui/delete', { label: 'Delete note' })}</button>
                        ` : ''}
                    </div>
                </div>
                <div class="note-desc">${n.desc || ''}</div>
                ${n.link ? `<a href="${n.link}" target="_blank" class="note-link">${n.link}</a>` : ''}
            `;

            const editBtn = div.querySelector('.note-edit');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    this.editingNoteId = n.id;
                    this.nameIn.value = n.name || '';
                    this.descIn.innerHTML = n.desc || '';
                    this.linkIn.value = n.link || '';
                    
                    const modalTitle = this.editorModal.querySelector('.notes-modal-title');
                    if (modalTitle) modalTitle.textContent = 'Edit note';
                    
                    this.openEditor();
                });
            }

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
