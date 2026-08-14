(function () {
  function setupSectionHeaders() {
    const headers = Array.from(document.querySelectorAll('.section-header'));
    if (!headers.length) return;

    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('visible');
        
        const titleEl = entry.target.querySelector('.section-title');
        if (titleEl) {
            scrambleText(titleEl, 1000);
        }
        
        obs.unobserve(entry.target);
      }
    }, { threshold: 0.15 });

    headers.forEach(h => obs.observe(h));
  }

  // Fade in sections on entry, without touching the Professional Training internal animations.
  function setupFade() {
    const fadeObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in');
        fadeObserver.unobserve(entry.target);
      }
    }, { threshold: 0.12 });

    function mark(el){
      if (!el) return;
      el.classList.add('fade-section');
      fadeObserver.observe(el);
    }

    // Fade hero card and footer
    mark(document.querySelector('.hero-card'));
    mark(document.querySelector('footer'));

    // Fade education and training containers
    mark(document.getElementById('education'));
    mark(document.getElementById('training'));

    // Do not reparent sections after parsing. Moving large blocks here caused
    // avoidable layout shifts on first load; existing sections keep their
    // scroll reveal behavior without changing document geometry.
  }

  // Disable right-click completely
  document.addEventListener('contextmenu', e => e.preventDefault());

  function initThemeSwitcher() {
    const trigger = document.getElementById('themeTrigger');
    const switcher = document.getElementById('themeSwitcher');
    const dots = document.querySelectorAll('.theme-dot');
    
    if (!trigger || !switcher) return;
    
    // Toggle expand (listen to entire switcher when collapsed, or trigger button when expanded)
    switcher.addEventListener('click', (e) => {
        if (!switcher.classList.contains('expanded')) {
            e.stopPropagation();
            switcher.classList.add('expanded');
        } else if (trigger.contains(e.target)) {
            e.stopPropagation();
            switcher.classList.remove('expanded');
        }
    });
    
    // Close when clicking outside
    document.addEventListener('click', () => {
        switcher.classList.remove('expanded');
    });
    
    // Themes configuration
    const themes = {
        teal: { primary: '#2dd4bf', secondary: '#60a5fa', accent: '#3b82f6', bg: '#090d16', glass: 'rgba(15,23,42,0.45)', border: 'rgba(255,255,255,0.08)' },
        forest: { primary: '#10b981', secondary: '#34d399', accent: '#059669', bg: '#060f0e', glass: 'rgba(12,24,20,0.45)', border: 'rgba(255,255,255,0.06)' },
        sunset: { primary: '#fb923c', secondary: '#f472b6', accent: '#fb7185', bg: '#120b10', glass: 'rgba(24,12,20,0.45)', border: 'rgba(255,255,255,0.07)' },
        frost: { primary: '#38bdf8', secondary: '#818cf8', accent: '#a5b4fc', bg: '#0b0f19', glass: 'rgba(12,18,32,0.45)', border: 'rgba(255,255,255,0.08)' },
        amethyst: { primary: '#a78bfa', secondary: '#fb7185', accent: '#f472b6', bg: '#0e0b16', glass: 'rgba(18,12,28,0.45)', border: 'rgba(255,255,255,0.08)' },
        matrix: { primary: '#00ff00', secondary: '#22c55e', accent: '#22c55e', bg: '#020617', glass: 'rgba(2,16,8,0.5)', border: 'rgba(0,255,0,0.15)' }
    };
    
    const applyTheme = (themeName) => {
        const theme = themes[themeName] || themes.teal;
        localStorage.setItem('theme-accent', themeName);
        const root = document.documentElement;
        root.setAttribute('data-theme', themeName);
        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--secondary', theme.secondary);
        root.style.setProperty('--accent', theme.accent);
        root.style.setProperty('--bg-dark', theme.bg);
        root.style.setProperty('--glass', theme.glass);
        root.style.setProperty('--glass-border', theme.border);
        
        const allDots = switcher.querySelectorAll('.theme-dot');
        allDots.forEach(d => d.classList.remove('active'));
        const activeDot = switcher.querySelector(`.theme-dot[data-theme="${themeName}"]`);
        if (activeDot) activeDot.classList.add('active');

        window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: themeName } }));
    };

    // Set active theme on load
    let currentTheme = localStorage.getItem('theme-accent') || 'teal';
    if (currentTheme === 'matrix' && sessionStorage.getItem('cheatcode_unlocked') !== 'true') {
        currentTheme = 'teal';
    }
    applyTheme(currentTheme);
    
    switcher.addEventListener('click', (e) => {
        const dot = e.target.closest('.theme-dot');
        if (dot) {
            const themeName = dot.getAttribute('data-theme');
            applyTheme(themeName);
        }
    });
  }

  function setupFlowchartViewer() {
    const btn = document.getElementById('toggleFlowchartBtn');
    const viewer = document.getElementById('flowchartViewer');
    const canvas = document.getElementById('flowchartCanvas');
    const zoomIn = document.getElementById('fcZoomIn');
    const zoomOut = document.getElementById('fcZoomOut');
    const reset = document.getElementById('fcReset');
    const toggleTheme = document.getElementById('fcToggleTheme');
    const lockIcon = document.getElementById('flowchartLockIcon');

    if (!btn || !viewer || !canvas) return;

    let img = new Image();
    let ctx = canvas.getContext('2d');
    let transform = { x: 0, y: 0, scale: 1 };
    let targetTransform = { x: 0, y: 0, scale: 1 };
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let imgLoaded = false;
    let animationFrameId = null;
    let isFilterActive = false;
    let isBlurred = false;

    // Multi-touch gestures tracking
    let initialPinchDist = 0;
    let initialScale = 1;
    let pinchCenter = { x: 0, y: 0 };

    img.onload = () => {
        imgLoaded = true;
        if (!isViewerVisible()) return;
        resizeCanvas();
        resetView(true);
        startAnimationLoop();
    };

    // Select image based on window viewport size
    function updateFlowchartSrc() {
        const isMobile = window.innerWidth <= 768;
        const targetSrc = isMobile ? 'assets/images/portfolio/flowchart-phone.webp' : 'assets/images/portfolio/flowchart.webp';
        if (!img.src.endsWith(targetSrc)) {
            imgLoaded = false;
            img.src = targetSrc;
        }
    }
    
    function isViewerVisible() {
        return viewer.style.display !== 'none' &&
            getComputedStyle(viewer).display !== 'none' &&
            !document.hidden &&
            !document.documentElement.classList.contains('screensaver-active');
    }

    function stopAnimationLoop() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    function startAnimationLoop() {
        if (animationFrameId || !isViewerVisible()) return;

        function update() {
            animationFrameId = null;
            if (!isViewerVisible()) return;

            if (!isBlurred) {
                transform.x += (targetTransform.x - transform.x) * 0.15;
                transform.y += (targetTransform.y - transform.y) * 0.15;
                transform.scale += (targetTransform.scale - transform.scale) * 0.15;
                draw();
            }
            animationFrameId = requestAnimationFrame(update);
        }
        animationFrameId = requestAnimationFrame(update);
    }

    function draw() {
        if (!imgLoaded) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.scale, transform.scale);
        ctx.drawImage(img, 0, 0, img.width, img.height);
        ctx.restore();
    }

    function resetView(instant = false) {
        if (!imgLoaded) return;
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        // Use Math.max to achieve "Cover" behavior so the image fills the canvas with no space around it
        const finalScale = Math.max(scaleX, scaleY);
        
        const targetX = (canvas.width - img.width * finalScale) / 2;
        const targetY = (canvas.height - img.height * finalScale) / 2;

        targetTransform.scale = finalScale;
        targetTransform.x = targetX;
        targetTransform.y = targetY;

        if (instant) {
            transform.scale = finalScale;
            transform.x = targetX;
            transform.y = targetY;
            draw();
        }
    }

    btn.addEventListener('click', () => {
        const isHidden = viewer.style.display === 'none' || getComputedStyle(viewer).display === 'none';
        if (isHidden) {
            viewer.style.display = 'block';
            btn.innerHTML = '<span class="svg-icon-slot" data-icon="ui/filter" aria-hidden="true"></span> Hide Flowchart';
            updateFlowchartSrc();
            setTimeout(() => {
                resizeCanvas();
                if (imgLoaded) {
                    resetView(true);
                    startAnimationLoop();
                }
            }, 50);
        } else {
            viewer.style.display = 'none';
            btn.innerHTML = '<span class="svg-icon-slot" data-icon="ui/filter" aria-hidden="true"></span> View Process Flowchart';
            stopAnimationLoop();
        }
    });

    function resizeCanvas() {
        const parentWidth = viewer.parentElement.clientWidth - 40;
        canvas.width = parentWidth;
        canvas.height = Math.min(480, window.innerHeight * 0.6);
    }

    window.addEventListener('resize', () => {
        if (viewer.style.display === 'block') {
            updateFlowchartSrc();
            resizeCanvas();
        }
    });

    window.addEventListener('screensaver-visibilitychange', (event) => {
        if (event.detail && event.detail.active) stopAnimationLoop();
        else startAnimationLoop();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopAnimationLoop();
        else startAnimationLoop();
    });

    canvas.addEventListener('mousedown', (e) => {
        if (isBlurred) return;
        e.preventDefault();
        isDragging = true;
        dragStart.x = e.clientX - targetTransform.x;
        dragStart.y = e.clientY - targetTransform.y;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging || isBlurred) return;
        e.preventDefault();
        targetTransform.x = e.clientX - dragStart.x;
        targetTransform.y = e.clientY - dragStart.y;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    canvas.addEventListener('touchstart', (e) => {
        if (isBlurred) return;
        if (e.touches.length === 1) {
            isDragging = true;
            dragStart.x = e.touches[0].clientX - targetTransform.x;
            dragStart.y = e.touches[0].clientY - targetTransform.y;
        } else if (e.touches.length === 2) {
            isDragging = false;
            initialPinchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialScale = targetTransform.scale;
            
            const rect = canvas.getBoundingClientRect();
            pinchCenter.x = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
            pinchCenter.y = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (isBlurred) return;
        if (e.touches.length === 1 && isDragging) {
            e.preventDefault();
            targetTransform.x = e.touches[0].clientX - dragStart.x;
            targetTransform.y = e.touches[0].clientY - dragStart.y;
        } else if (e.touches.length === 2 && initialPinchDist > 0) {
            e.preventDefault(); // Stop mobile from zooming the entire page
            const currentDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const zoomFactor = currentDist / initialPinchDist;
            const targetScale = Math.min(Math.max(initialScale * zoomFactor, 0.15), 4.5);
            
            targetTransform.x = pinchCenter.x - (pinchCenter.x - targetTransform.x) * (targetScale / targetTransform.scale);
            targetTransform.y = pinchCenter.y - (pinchCenter.y - targetTransform.y) * (targetScale / targetTransform.scale);
            targetTransform.scale = targetScale;
        }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        isDragging = false;
        if (e.touches.length < 2) {
            initialPinchDist = 0;
        }
    });

    canvas.addEventListener('wheel', (e) => {
        if (isBlurred) return;
        e.preventDefault();
        const zoomIntensity = 0.08;
        const mouseX = e.clientX - canvas.getBoundingClientRect().left;
        const mouseY = e.clientY - canvas.getBoundingClientRect().top;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoomFactor = Math.exp(wheel * zoomIntensity);
        
        const targetScale = Math.min(Math.max(targetTransform.scale * zoomFactor, 0.15), 4.5);
        
        targetTransform.x = mouseX - (mouseX - targetTransform.x) * (targetScale / targetTransform.scale);
        targetTransform.y = mouseY - (mouseY - targetTransform.y) * (targetScale / targetTransform.scale);
        targetTransform.scale = targetScale;
    }, { passive: false });

    canvas.addEventListener('dblclick', () => {
        if (isBlurred) return;
        resetView(false);
    });

    zoomIn.addEventListener('click', () => {
        if (isBlurred) return;
        const mouseX = canvas.width / 2;
        const mouseY = canvas.height / 2;
        const targetScale = Math.min(targetTransform.scale * 1.3, 4.5);
        targetTransform.x = mouseX - (mouseX - targetTransform.x) * (targetScale / targetTransform.scale);
        targetTransform.y = mouseY - (mouseY - targetTransform.y) * (targetScale / targetTransform.scale);
        targetTransform.scale = targetScale;
    });

    zoomOut.addEventListener('click', () => {
        if (isBlurred) return;
        const mouseX = canvas.width / 2;
        const mouseY = canvas.height / 2;
        const targetScale = Math.max(targetTransform.scale / 1.3, 0.15);
        targetTransform.x = mouseX - (mouseX - targetTransform.x) * (targetScale / targetTransform.scale);
        targetTransform.y = mouseY - (mouseY - targetTransform.y) * (targetScale / targetTransform.scale);
        targetTransform.scale = targetScale;
    });

    reset.addEventListener('click', () => {
        if (isBlurred) return;
        resetView(false);
    });

    if (toggleTheme) {
        toggleTheme.addEventListener('click', () => {
            if (isBlurred) return;
            isFilterActive = !isFilterActive;
            canvas.style.filter = isFilterActive 
                ? 'invert(0.9) hue-rotate(180deg) brightness(0.95) contrast(1.15)' 
                : 'none';
            toggleTheme.style.color = isFilterActive ? 'var(--primary)' : '';
        });
    }

    const EASTER_EGG_REACTIONS = [
        { icon: 'states/hacker', title: 'Look at you! You sneaky hacker...', sub: '(Focus this window to unmask the secret blueprint)' },
        { icon: 'states/vpn', title: 'Neo, is that you? The Matrix has you...', sub: '(Click back into this window to take the red pill)' },
        { icon: 'states/security-check', title: 'Access Denied: Mainframe is watching you!', sub: '(Focus window to resume top-secret operation)' },
        { icon: 'states/external-link-rounded', title: 'Unauthorized tab switching detected!', sub: '(Return to base to decrypt the master diagram)' },
        { icon: 'states/flowchart-outline-sharp', title: 'The blueprint is hiding from your tabs!', sub: '(Focus this window to reveal the classified flow)' },
        { icon: 'states/verified-user', title: 'Are you inspecting my source code?', sub: '(Click back to disarm the cyber security field)' },
        { icon: 'games/blackjack/reward-12-regular', title: 'Level 99 Cyber Detective Discovered!', sub: '(Focus window to claim your reward and unmask data)' }
    ];

    function lockScreen() {
        isBlurred = true;
        isDragging = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.99)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const reaction = EASTER_EGG_REACTIONS[Math.floor(Math.random() * EASTER_EGG_REACTIONS.length)];

        if (lockIcon) {
            lockIcon.innerHTML = window.IconRegistry
                ? window.IconRegistry.svg(reaction.icon, { className: 'flowchart-lock-svg', label: 'Flowchart focus lock' })
                : '';
            lockIcon.classList.add('show');
        }

        ctx.fillStyle = 'rgba(45, 212, 191, 0.95)';
        ctx.font = 'bold 18px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(reaction.title, canvas.width / 2, canvas.height / 2 - 10);

        ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
        ctx.font = '14px Outfit, sans-serif';
        ctx.fillText(reaction.sub, canvas.width / 2, canvas.height / 2 + 18);
    }

    function unlockScreen() {
        isBlurred = false;
        if (lockIcon) lockIcon.classList.remove('show');
        draw();
    }

    window.addEventListener('blur', lockScreen);
    window.addEventListener('focus', unlockScreen);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) lockScreen();
        else unlockScreen();
    });
  }

  const LOAD_MORE_STEP = 3;

  function applyLoadMore(list, rowId) {
    if (!list) return;

    // Remove old row if any
    const existing = document.getElementById(rowId);
    if (existing) existing.remove();

    const allItems = Array.from(list.querySelectorAll('.pub-item')).filter(
      el => el.style.display !== 'none' || el.dataset.loadHidden === 'true'
    );

    // Reset visibility to first batch
    allItems.forEach((item, idx) => {
      item.style.display = idx < LOAD_MORE_STEP ? 'flex' : 'none';
      item.dataset.loadHidden = idx >= LOAD_MORE_STEP ? 'true' : 'false';
    });

    if (allItems.length <= LOAD_MORE_STEP) return; // nothing to paginate

    // Wrapper row
    const row = document.createElement('div');
    row.id = rowId;
    row.className = 'pub-load-row';

    const remaining = allItems.length - LOAD_MORE_STEP;
    const localIcon = name => window.IconRegistry ? window.IconRegistry.svg(name) : '';

    const moreBtn = document.createElement('button');
    moreBtn.className = 'load-more-btn';
    moreBtn.innerHTML = `${localIcon('ui/expand-more')} Load More <span class="load-count">(${remaining} remaining)</span>`;
    row.appendChild(moreBtn);

    // Load Less button — hidden until at least one extra batch is shown
    const lessBtn = document.createElement('button');
    lessBtn.className = 'load-less-btn';
    lessBtn.style.display = 'none';
    lessBtn.innerHTML = `${localIcon('ui/expand-less')} Load Less`;
    row.appendChild(lessBtn);

    moreBtn.addEventListener('click', () => {
      // Button bounce
      moreBtn.classList.remove('bouncing');
      void moreBtn.offsetWidth;
      moreBtn.classList.add('bouncing');
      moreBtn.addEventListener('animationend', () => moreBtn.classList.remove('bouncing'), { once: true });

      // Spin the chevron down
      const moreBtnIcon = moreBtn.querySelector('.svg-icon');
      if (moreBtnIcon) moreBtnIcon.style.transform = 'rotate(360deg)';
      setTimeout(() => { if (moreBtnIcon) moreBtnIcon.style.transform = ''; }, 350);

      const hidden = Array.from(list.querySelectorAll('.pub-item[data-load-hidden="true"]'));
      hidden.slice(0, LOAD_MORE_STEP).forEach((el, i) => {
        el.style.display = 'flex';
        el.dataset.loadHidden = 'false';
        // Staggered entrance — each item slightly delayed
        el.classList.remove('animating-in', 'animating-out');
        el.style.animationDelay = `${i * 80}ms`;
        void el.offsetWidth; // reflow
        el.classList.add('animating-in');
        el.addEventListener('animationend', () => {
          el.classList.remove('animating-in');
          el.style.animationDelay = '';
        }, { once: true });
      });

      const stillHidden = Array.from(list.querySelectorAll('.pub-item[data-load-hidden="true"]'));
      const countEl = moreBtn.querySelector('.load-count');
      if (stillHidden.length === 0) {
        moreBtn.classList.add('all-loaded');
        if (moreBtnIcon && window.IconRegistry) moreBtnIcon.outerHTML = window.IconRegistry.svg('states/check-circle');
        if (countEl) countEl.textContent = '(all shown)';
        moreBtn.disabled = true;
        moreBtn.style.cursor = 'default';
      } else {
        if (countEl) countEl.textContent = `(${stillHidden.length} remaining)`;
      }
      lessBtn.style.display = 'inline-flex';
    });

    lessBtn.addEventListener('click', () => {
      // Button bounce
      lessBtn.classList.remove('bouncing');
      void lessBtn.offsetWidth;
      lessBtn.classList.add('bouncing');
      lessBtn.addEventListener('animationend', () => lessBtn.classList.remove('bouncing'), { once: true });

      // Spin the chevron up
      const lessBtnIcon = lessBtn.querySelector('.svg-icon');
      if (lessBtnIcon) lessBtnIcon.style.transform = 'rotate(-360deg)';
      setTimeout(() => { if (lessBtnIcon) lessBtnIcon.style.transform = ''; }, 350);

      // Stagger collapse from bottom to top
      const toHide = allItems.slice(LOAD_MORE_STEP).reverse();
      toHide.forEach((item, i) => {
        item.classList.remove('animating-in', 'animating-out');
        item.style.animationDelay = `${i * 55}ms`;
        item.classList.add('animating-out');
        item.addEventListener('animationend', () => {
          item.style.display = 'none';
          item.dataset.loadHidden = 'true';
          item.classList.remove('animating-out');
          item.style.animationDelay = '';
        }, { once: true });
      });

      // Reset more button after longest delay
      const collapseDuration = toHide.length * 55 + 220;
      setTimeout(() => {
        const remaining = allItems.length - LOAD_MORE_STEP;
        moreBtn.classList.remove('all-loaded');
        moreBtn.disabled = false;
        moreBtn.style.cursor = '';
        const moreBtnIcon = moreBtn.querySelector('.svg-icon');
        if (moreBtnIcon && window.IconRegistry) moreBtnIcon.outerHTML = window.IconRegistry.svg('ui/expand-more');
        const countEl = moreBtn.querySelector('.load-count');
        if (countEl) countEl.textContent = `(${remaining} remaining)`;
      }, collapseDuration);

      lessBtn.style.display = 'none';
      // Smooth scroll so user sees the list top again
      list.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    list.after(row);
  }

  function setupPubFilters() {
    const filters = document.querySelectorAll('.pub-filter-btn');
    const items = document.querySelectorAll('.pub-item');
    const journalTitle = document.getElementById('pub-journal-title');
    const journalList = document.getElementById('pub-journal-list');
    const conferenceTitle = document.getElementById('pub-conference-title');
    const conferenceList = document.getElementById('pub-conference-list');

    if (filters.length === 0 || items.length === 0) return;

    // Apply load-more on initial load
    applyLoadMore(journalList, 'loadMoreJournal');
    applyLoadMore(conferenceList, 'loadMoreConference');

    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            // First show all items so applyLoadMore can read them
            items.forEach(item => {
                const category = item.getAttribute('data-category');
                const tags = item.getAttribute('data-tags') || '';
                const tagList = tags.split(',');

                if (filterValue === 'all') {
                    item.style.display = 'flex';
                    item.dataset.loadHidden = 'false';
                } else if (filterValue === 'journal') {
                    item.style.display = (category === 'journal') ? 'flex' : 'none';
                    item.dataset.loadHidden = 'false';
                } else if (filterValue === 'conference') {
                    item.style.display = (category === 'conference') ? 'flex' : 'none';
                    item.dataset.loadHidden = 'false';
                } else if (filterValue === 'lca-waste') {
                    const match = tagList.includes('lca') || tagList.includes('msw') || tagList.includes('waste');
                    item.style.display = match ? 'flex' : 'none';
                    item.dataset.loadHidden = 'false';
                } else if (filterValue === 'biofuels-facades') {
                    const match = tagList.includes('biofuel') || tagList.includes('facade') || tagList.includes('engineering') || tagList.includes('energy');
                    item.style.display = match ? 'flex' : 'none';
                    item.dataset.loadHidden = 'false';
                }
            });

            // Adjust section header visibility
            if (filterValue === 'all') {
                if (journalTitle) journalTitle.style.display = 'block';
                if (journalList) journalList.style.display = 'block';
                if (conferenceTitle) conferenceTitle.style.display = 'block';
                if (conferenceList) conferenceList.style.display = 'block';
            } else if (filterValue === 'journal') {
                if (journalTitle) journalTitle.style.display = 'block';
                if (journalList) journalList.style.display = 'block';
                if (conferenceTitle) conferenceTitle.style.display = 'none';
                if (conferenceList) conferenceList.style.display = 'none';
            } else if (filterValue === 'conference') {
                if (journalTitle) journalTitle.style.display = 'none';
                if (journalList) journalList.style.display = 'none';
                if (conferenceTitle) conferenceTitle.style.display = 'block';
                if (conferenceList) conferenceList.style.display = 'block';
            } else {
                let visibleJournals = 0;
                let visibleConfs = 0;
                if (journalList) journalList.querySelectorAll('.pub-item').forEach(item => { if (item.style.display !== 'none') visibleJournals++; });
                if (conferenceList) conferenceList.querySelectorAll('.pub-item').forEach(item => { if (item.style.display !== 'none') visibleConfs++; });
                if (journalTitle) journalTitle.style.display = visibleJournals > 0 ? 'block' : 'none';
                if (journalList) journalList.style.display = visibleJournals > 0 ? 'block' : 'none';
                if (conferenceTitle) conferenceTitle.style.display = visibleConfs > 0 ? 'block' : 'none';
                if (conferenceList) conferenceList.style.display = visibleConfs > 0 ? 'block' : 'none';
            }

            // Re-apply load-more after filter changes item visibility
            applyLoadMore(journalList, 'loadMoreJournal');
            applyLoadMore(conferenceList, 'loadMoreConference');
        });
    });
  }

  function setupMusicPlayer() {
    const btn = document.getElementById('musicToggleBtn');
    const muteIcon = document.getElementById('musicMuteIcon');
    const wave = document.getElementById('musicWave');
    const spans = wave.querySelectorAll('span');

    if (!btn) return;

    // Playlist tracks
    const tracks = [
        "assets/audio/warm-cup-of-coffee.mp3",
        "assets/audio/monday-routine.mp3",
        "assets/audio/kyoto.mp3"
    ];
    const matrixTrack = "assets/audio/daft-punk-veridis-quo.mp3";
    let currentTrackIdx = 0;
    let preloadedNext = false; // prevents redundant trigger calls
    
    function getActiveTrack() {
        const activeTheme = localStorage.getItem('theme-accent');
        return activeTheme === 'matrix' ? matrixTrack : tracks[currentTrackIdx];
    }

    let audio = new Audio();
    audio.preload = "none";
    let audioLoaded = false;

    function loadTrack(track = getActiveTrack()) {
        if (audioLoaded && audio.src.includes(track)) return;
        audio.src = track;
        audio.preload = "auto";
        audio.load();
        audioLoaded = true;
    }

    let isPlaying = false;
    let audioCtx = null;
    let analyser = null;
    let dataArray = null;
    let source = null;
    let animFrameId = null;

    // Detect when current music reaches halfway point and lazy-preload the next one
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration || preloadedNext) return;
        const activeTheme = localStorage.getItem('theme-accent');
        if (activeTheme === 'matrix') return; // Don't preload default tracks when on matrix theme
        
        if (audio.currentTime >= audio.duration / 2) {
            preloadedNext = true;
            const nextIdx = (currentTrackIdx + 1) % tracks.length;
            const nextUrl = tracks[nextIdx];
            console.log(`Lazy-preloading next track into cache: ${nextUrl}`);
            
            // Instantiate background loader to push the track into HTTP disk cache
            const cacheLoader = new Audio();
            cacheLoader.src = nextUrl;
            cacheLoader.preload = "auto";
            cacheLoader.load();
        }
    });

    audio.addEventListener('ended', () => {
        const activeTheme = localStorage.getItem('theme-accent');
        if (activeTheme === 'matrix') {
            audio.src = matrixTrack;
            audio.load();
            if (isPlaying) {
                audio.play().catch(() => setPlayingState(false));
            }
        } else {
            currentTrackIdx = (currentTrackIdx + 1) % tracks.length;
            preloadedNext = false; // reset preload trigger for the next track
            audio.src = tracks[currentTrackIdx];
            audio.load();
            if (isPlaying) {
                audio.play().catch(() => setPlayingState(false));
            }
        }
    });

    audio.addEventListener('error', (e) => {
        console.error("Audio playback error encountered:", audio.error);
    });

    // Handle theme switching seamlessly
    window.addEventListener('theme-changed', (e) => {
        const themeName = e.detail && e.detail.theme;
        const desiredTrack = (themeName === 'matrix') ? matrixTrack : tracks[currentTrackIdx];
        if (!audioLoaded) return;
        if (!audio.src.includes(desiredTrack)) {
            const wasPlaying = isPlaying;
            audio.pause();
            loadTrack(desiredTrack);
            if (wasPlaying) {
                audio.play().then(() => {
                    setPlayingState(true);
                }).catch(() => setPlayingState(false));
            }
        }
    });

    function initWebAudio() {
        if (audioCtx) return;
        
        // Bypassing Web Audio API context rerouting when using file:// protocol.
        // Chrome/Firefox treat local file elements as cross-origin, which permanently mutes audio elements when rerouted.
        if (window.location.protocol === 'file:') {
            console.warn("Bypassing Web Audio Context on file:// protocol to avoid CORS playback mute.");
            return;
        }
        
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 32;
            
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            source = audioCtx.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
        } catch (e) {
            console.warn("Web Audio API not fully supported or blocked:", e);
            audioCtx = null;
            analyser = null;
            dataArray = null;
            source = null;
        }
    }

    function setPlayingState(play) {
        isPlaying = play;
        sessionStorage.setItem('music_playing', play ? 'true' : 'false');
        if (play) {
            btn.classList.add('playing');
            muteIcon.style.display = 'none';
            wave.style.display = 'flex';
            startVisualizer();
        } else {
            btn.classList.remove('playing');
            muteIcon.style.display = 'flex';
            wave.style.display = 'none';
            stopVisualizer();
        }
    }

    function updateVisualizer() {
        if (!isPlaying) return;
        
        if (analyser && dataArray) {
            analyser.getByteFrequencyData(dataArray);
            const bands = [
                dataArray[1] || 0,
                dataArray[3] || 0,
                dataArray[5] || 0,
                dataArray[7] || 0
            ];
            
            spans.forEach((span, idx) => {
                const val = bands[idx];
                const scale = Math.max(0.18, val / 255);
                span.style.transform = `scaleY(${scale})`;
            });
        } else {
            // Smoothly animate random bounce heights for local/fallback player mode
            spans.forEach((span) => {
                const scale = 0.2 + Math.random() * 0.8;
                span.style.transform = `scaleY(${scale})`;
            });
        }
        
        animFrameId = requestAnimationFrame(updateVisualizer);
    }

    function startVisualizer() {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = requestAnimationFrame(updateVisualizer);
    }

    function stopVisualizer() {
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
        spans.forEach(span => {
            span.style.transform = 'scaleY(0.2)';
        });
    }

    btn.addEventListener('click', () => {
        initWebAudio();
        
        if (isPlaying) {
            audio.pause();
            setPlayingState(false);
        } else {
            const targetTrack = getActiveTrack();
            loadTrack(targetTrack);
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            audio.play().then(() => {
                setPlayingState(true);
            }).catch(() => setPlayingState(false));
        }
    });

    if (sessionStorage.getItem('music_playing') === 'true') {
        const targetTrack = getActiveTrack();
        loadTrack(targetTrack);
        audio.play().then(() => {
            setPlayingState(true);
        }).catch(() => setPlayingState(false));
    }
  }

  function scrambleText(target, duration = 1200, delay = 0) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    
    // Find text node inside element to preserve icons/HTML tags
    let textNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    const targetNode = textNode || el;
    
    const originalText = targetNode.textContent;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';
    const totalSteps = originalText.length;
    let step = 0;
    
    setTimeout(() => {
      const interval = setInterval(() => {
        let scrambled = '';
        for (let i = 0; i < totalSteps; i++) {
          if (originalText[i] === ' ') {
            scrambled += ' ';
            continue;
          }
          if (i < Math.floor(step)) {
            scrambled += originalText[i];
          } else {
            scrambled += chars[Math.floor(Math.random() * chars.length)];
          }
        }
        targetNode.textContent = scrambled;
        step += totalSteps / (duration / 40);
        if (step >= totalSteps) {
          targetNode.textContent = originalText;
          clearInterval(interval);
        }
      }, 40);
    }, delay);
  }

  const initializeLandingInteractions = () => {
    setupSectionHeaders();
    setupFade();
    initThemeSwitcher();

    const initializeDeferredInteractions = () => {
      setupFlowchartViewer();
      setupPubFilters();
      setupMusicPlayer();

      // Dynamically toggle morph classes on fixed widgets during scroll (throttled)
      const musicBtn = document.getElementById('musicToggleBtn');
      const themeBtn = document.getElementById('themeSwitcher');
      let scrollTicking = false;

      window.addEventListener('scroll', () => {
          if (!scrollTicking) {
              requestAnimationFrame(() => {
                  const scrolled = window.scrollY > 40;
                  if (musicBtn) musicBtn.classList.toggle('scrolled', scrolled);
                  if (themeBtn) themeBtn.classList.toggle('scrolled', scrolled);
                  scrollTicking = false;
              });
              scrollTicking = true;
          }
      }, { passive: true });
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(initializeDeferredInteractions, { timeout: 1400 });
    } else {
      setTimeout(initializeDeferredInteractions, 0);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLandingInteractions, { once: true });
  } else {
    initializeLandingInteractions();
  }
})();
