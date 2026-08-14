/* =============================================
   1. SHARE WIDGET
============================================= */
(function() {
    const widget  = document.getElementById('shareWidget');
    const toggle  = document.getElementById('shareToggle');
    const copyBtn = document.getElementById('shareCopy');
    const toast   = document.getElementById('shareToast');
    if (!widget || !toggle) return;

    let open = false;
    const pageUrl = window.location.href;

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        // On mobile use native Web Share if supported
        if (!open && navigator.share && window.innerWidth <= 768) {
            navigator.share({ title: 'Soheil Aghayani - Portfolio', url: pageUrl }).catch(() => {});
            return;
        }
        open = !open;
        widget.classList.toggle('open', open);
    });

    copyBtn && copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(pageUrl).then(() => {
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        });
    });

    document.addEventListener('click', (e) => {
        if (open && !widget.contains(e.target)) {
            open = false;
            widget.classList.remove('open');
        }
    });
})();

/* =============================================
   2. SCREENSAVER ENGINE (RANDOM ACTIVATION & FAST EXIT)
============================================= */
(function() {
    const ss     = document.getElementById('screensaver');
    const canvas = document.getElementById('ssCanvas');
    const clock  = document.getElementById('ssClock');
    const dateEl = document.getElementById('ssDate');
    const center = document.getElementById('ssCenter');
    const dvdLogo = document.getElementById('ssDvdLogo');
    const badge  = document.getElementById('ssBadge');
    const bIcon  = document.getElementById('ssBadgeIcon');
    const bLabel = document.getElementById('ssBadgeLabel');
    if (!ss || !canvas || !clock) return;

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    const TIMEOUT = 120000; // 2 minutes inactivity
    let timer, ssActive = false, animId;
    let ignoreEvents = false;
    let launchGuardTimer = null;
    let mouseX = -1000, mouseY = -1000;

    const MODES = ['starfield', 'matrix', 'dvd', 'synthwave', 'quantum'];
    const MODE_META = {
        starfield: { title: 'Starfield', icon: 'assets/icons/screensavers/starfield.svg', iconName: 'screensavers/starfield' },
        matrix: { title: 'Matrix Code Rain', icon: 'assets/icons/screensavers/matrix.svg', iconName: 'screensavers/matrix' },
        dvd: { title: 'Bouncing DVD', icon: 'assets/icons/screensavers/dvd.svg', iconName: 'screensavers/dvd' },
        synthwave: { title: '80s Synthwave', icon: 'assets/icons/screensavers/sunrise.svg', iconName: 'screensavers/sunrise' },
        quantum: { title: 'Quantum Constellation', icon: 'assets/icons/screensavers/ai-line.svg', iconName: 'screensavers/ai-line' }
    };
    let currentMode = 'starfield';

    function getRandomMode() {
        const idx = Math.floor(Math.random() * MODES.length);
        return MODES[idx];
    }

    function updateTimeDisplay() {
        const now = new Date();
        clock.textContent = now.toLocaleTimeString('en-US', { hour12: false });
        if (dateEl) {
            const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
            dateEl.textContent = now.toLocaleDateString('en-US', options);
        }
    }

    function isGameOpen() {
        const gameWrap = document.getElementById('appWrap');
        return Boolean(
            (window.OS && window.OS.isOpen && window.OS.isOpen('games')) ||
            (gameWrap && gameWrap.classList.contains('open'))
        );
    }

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        const minSide = Math.min(canvas.width, canvas.height);
        dvdState.w = Math.min(300, Math.max(150, minSide * 0.34));
        dvdState.h = dvdState.w * 0.44;
        dvdState.x = Math.min(Math.max(0, dvdState.x), Math.max(0, canvas.width - dvdState.w));
        dvdState.y = Math.min(Math.max(0, dvdState.y), Math.max(0, canvas.height - dvdState.h));
    }

    // Dynamic State for Renderers
    const stars = [];
    const matrixStreams = [];
    let dvdState = { x: 100, y: 100, vx: 3.5, vy: 2.5, w: 220, h: 90, colorIdx: 0, bounceCount: 0 };
    const dvdTrail = [];
    const dvdColors = ['#2dd4bf', '#ec4899', '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#f43f5e'];
    let synthOffset = 0;
    let lastFrameTime = 0;
    const quantumNodes = [];

    function initCurrentModeData() {
        const W = canvas.width, H = canvas.height;
        if (currentMode === 'starfield') {
            stars.length = 0;
            for (let i = 0; i < 200; i++) {
                stars.push({
                    x: Math.random() * W, y: Math.random() * H,
                    r: Math.random() * 1.5 + 0.3,
                    speed: Math.random() * 0.4 + 0.05,
                    alpha: Math.random(),
                    dA: (Math.random() * 0.006 + 0.002) * (Math.random() > 0.5 ? 1 : -1)
                });
            }
        } else if (currentMode === 'matrix') {
            matrixStreams.length = 0;
            const fontSize = 16;
            const cols = Math.floor(W / fontSize);
            const allChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

            for (let i = 0; i < cols; i++) {
                const length = Math.floor(Math.random() * 20 + 10);
                const speed = Math.random() * 1.5 + 0.8;
                matrixStreams.push({
                    x: i * fontSize,
                    y: Math.random() * -600,
                    speed: speed,
                    length: length,
                    chars: Array.from({ length }, () => allChars[Math.floor(Math.random() * allChars.length)])
                });
            }
        } else if (currentMode === 'dvd') {
            dvdTrail.length = 0;
            dvdState.x = Math.random() * Math.max(0, W - dvdState.w);
            dvdState.y = Math.random() * Math.max(0, H - dvdState.h);
            dvdState.vx = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 1.5 + 2.5);
            dvdState.vy = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 1.5 + 2.0);
        } else if (currentMode === 'quantum') {
            quantumNodes.length = 0;
            const nodeCount = Math.floor((W * H) / 12000);
            const count = Math.max(40, Math.min(120, nodeCount));
            for (let i = 0; i < count; i++) {
                quantumNodes.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: (Math.random() - 0.5) * 0.8,
                    r: Math.random() * 2 + 1.2,
                    alpha: Math.random() * 0.5 + 0.5
                });
            }
        }
    }

    // Mode Renderers
    function renderStarfield(frameScale = 1) {
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';

        stars.forEach(s => {
            s.alpha += s.dA * frameScale;
            if (s.alpha > 1) { s.alpha = 1; s.dA *= -1; }
            if (s.alpha < 0) { s.alpha = 0; s.dA *= -1; }
            s.y -= s.speed * frameScale;
            if (s.y < -2) s.y = canvas.height + 2;

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.globalAlpha = s.alpha * 0.75;
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    function renderMatrix(frameScale = 1) {
        ctx.fillStyle = 'rgba(3, 8, 5, 0.18)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const fontSize = 16;
        ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
        const allChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        matrixStreams.forEach(stream => {
            stream.y += stream.speed * 6 * frameScale;

            for (let j = 0; j < stream.length; j++) {
                const charY = stream.y - j * fontSize;
                if (charY < -20 || charY > canvas.height + 40) continue;

                if (Math.random() < 0.04) {
                    stream.chars[j] = allChars[Math.floor(Math.random() * allChars.length)];
                }

                const char = stream.chars[j];

                if (j === 0) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(char, stream.x, charY);
                } else if (j < 3) {
                    ctx.fillStyle = '#34d399';
                    ctx.fillText(char, stream.x, charY);
                } else {
                    const alpha = Math.max(0.08, 1 - j / stream.length);
                    ctx.fillStyle = `rgba(16, 185, 129, ${alpha * 0.75})`;
                    ctx.fillText(char, stream.x, charY);
                }
            }

            if (stream.y - stream.length * fontSize > canvas.height) {
                stream.y = Math.random() * -300;
                stream.speed = Math.random() * 1.5 + 0.8;
                stream.length = Math.floor(Math.random() * 20 + 10);
            }
        });
    }

    function renderDVD(frameScale = 1) {
        const W = canvas.width, H = canvas.height;
        const s = dvdState;
        const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();

        ctx.fillStyle = 'rgba(2, 6, 23, 0.34)';
        ctx.fillRect(0, 0, W, H);

        s.x += s.vx * frameScale;
        s.y += s.vy * frameScale;

        let bounced = false;
        if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); bounced = true; }
        if (s.x + s.w >= W) { s.x = Math.max(0, W - s.w); s.vx = -Math.abs(s.vx); bounced = true; }
        if (s.y <= 0) { s.y = 0; s.vy = Math.abs(s.vy); bounced = true; }
        if (s.y + s.h >= H) { s.y = Math.max(0, H - s.h); s.vy = -Math.abs(s.vy); bounced = true; }

        if (bounced) {
            s.colorIdx = (s.colorIdx + 1) % dvdColors.length;
            s.bounceCount++;
        }

        const color = s.bounceCount % 5 === 0 && primary ? primary : dvdColors[s.colorIdx];
        dvdTrail.push({ x: s.x + s.w / 2, y: s.y + s.h / 2, color });
        while (dvdTrail.length > 12) dvdTrail.shift();

        ctx.save();
        dvdTrail.forEach((point, index) => {
            const alpha = (index + 1) / dvdTrail.length * 0.08;
            const radius = 4 + (index / dvdTrail.length) * 10;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = point.color;
            ctx.shadowColor = point.color;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        if (dvdLogo) {
            dvdLogo.style.setProperty('--dvd-color', color);
            dvdLogo.style.width = `${s.w}px`;
            dvdLogo.style.height = `${s.h}px`;
            dvdLogo.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
        }
    }

    function renderSynthwave(frameScale = 1) {
        const W = canvas.width, H = canvas.height;
        synthOffset = (synthOffset + 0.8 * frameScale) % 40;

        const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6);
        sky.addColorStop(0, '#09021a');
        sky.addColorStop(0.6, '#260845');
        sky.addColorStop(1, '#6b116a');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H * 0.6);

        ctx.fillStyle = '#05020c';
        ctx.fillRect(0, H * 0.6, W, H * 0.4);

        const horizon = H * 0.6;
        const sunRadius = Math.min(W, H) * 0.18;
        const sunY = horizon - sunRadius * 0.3;

        ctx.save();
        const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
        sunGrad.addColorStop(0, '#ffdd00');
        sunGrad.addColorStop(0.5, '#ff2a6d');
        sunGrad.addColorStop(1, '#9b00e8');

        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(W / 2, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#260845';
        for (let i = 0; i < 6; i++) {
            const lineY = sunY + (i * 12) + 10;
            if (lineY < sunY + sunRadius) {
                ctx.fillRect(W / 2 - sunRadius - 10, lineY, sunRadius * 2 + 20, 2 + i * 0.8);
            }
        }

        ctx.strokeStyle = 'rgba(244, 63, 94, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        const vpX = W / 2, vpY = horizon;
        const lineCount = 24;
        for (let i = -lineCount / 2; i <= lineCount / 2; i++) {
            const targetX = vpX + i * (W / 10);
            ctx.moveTo(vpX, vpY);
            ctx.lineTo(targetX, H);
        }

        for (let y = synthOffset; y < H * 0.4; y += 14) {
            const normY = y / (H * 0.4);
            const gridY = horizon + Math.pow(normY, 1.8) * (H * 0.4);
            ctx.moveTo(0, gridY);
            ctx.lineTo(W, gridY);
        }
        ctx.stroke();
    }

    function renderQuantum(frameScale = 1) {
        ctx.fillStyle = '#080d1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const W = canvas.width, H = canvas.height;
        const maxDist = 120;
        const maxDistSq = maxDist * maxDist;

        quantumNodes.forEach(node => {
            node.x += node.vx * frameScale;
            node.y += node.vy * frameScale;

            if (node.x < 0 || node.x > W) node.vx *= -1;
            if (node.y < 0 || node.y > H) node.vy *= -1;

            const dx = node.x - mouseX;
            const dy = node.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100 && dist > 0) {
                const force = (100 - dist) / 100;
                node.x += (dx / dist) * force * 3 * frameScale;
                node.y += (dy / dist) * force * 3 * frameScale;
            }
        });

        // Draw all nodes in one path instead of one fill operation per node.
        ctx.beginPath();
        ctx.fillStyle = 'rgba(45, 212, 191, 0.82)';
        quantumNodes.forEach(node => {
            ctx.moveTo(node.x + node.r, node.y);
            ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        });
        ctx.fill();

        const linePaths = [new Path2D(), new Path2D(), new Path2D()];
        for (let i = 0; i < quantumNodes.length; i++) {
            for (let j = i + 1; j < quantumNodes.length; j++) {
                const n1 = quantumNodes[i];
                const n2 = quantumNodes[j];
                const dx = n1.x - n2.x;
                const dy = n1.y - n2.y;
                const distSq = dx * dx + dy * dy;
                if (distSq >= maxDistSq) continue;

                const bucket = distSq < 2304 ? 0 : (distSq < 7056 ? 1 : 2);
                linePaths[bucket].moveTo(n1.x, n1.y);
                linePaths[bucket].lineTo(n2.x, n2.y);
            }
        }

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.38)';
        ctx.stroke(linePaths[0]);
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.24)';
        ctx.stroke(linePaths[1]);
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.12)';
        ctx.stroke(linePaths[2]);
    }

    function loop(timestamp) {
        if (!ssActive) {
            animId = null;
            lastFrameTime = 0;
            return;
        }

        const now = Number.isFinite(timestamp) ? timestamp : performance.now();
        const frameScale = lastFrameTime
            ? Math.min(2.5, Math.max(0.5, (now - lastFrameTime) / 16.6667))
            : 1;
        lastFrameTime = now;

        if (currentMode === 'starfield') renderStarfield(frameScale);
        else if (currentMode === 'matrix') renderMatrix(frameScale);
        else if (currentMode === 'dvd') renderDVD(frameScale);
        else if (currentMode === 'synthwave') renderSynthwave(frameScale);
        else if (currentMode === 'quantum') renderQuantum(frameScale);

        animId = requestAnimationFrame(loop);
    }

    function applyModeUI() {
        const meta = MODE_META[currentMode] || MODE_META.starfield;
        if (bLabel) bLabel.textContent = meta.title;
        if (bIcon) {
            if (window.IconRegistry) {
                bIcon.innerHTML = window.IconRegistry.svg(meta.iconName, { label: meta.title });
            } else {
                bIcon.textContent = '';
            }
        }

        if (dvdLogo) {
            dvdLogo.hidden = currentMode !== 'dvd';
            dvdLogo.innerHTML = currentMode === 'dvd' && window.IconRegistry
                ? window.IconRegistry.svg('screensavers/dvd', { className: 'ss-dvd-svg', label: 'Bouncing DVD logo' })
                : '';
        }

        if (clock) {
            if (currentMode === 'matrix') {
                clock.style.color = '#34d399';
                clock.style.textShadow = '0 0 30px #10b981, 0 0 60px rgba(16,185,129,0.5)';
            } else if (currentMode === 'synthwave') {
                clock.style.color = '#f43f5e';
                clock.style.textShadow = '0 0 30px #f43f5e, 0 0 70px #ff2a6d';
            } else if (currentMode === 'dvd') {
                clock.style.color = '#3b82f6';
                clock.style.textShadow = '0 0 30px #3b82f6, 0 0 60px rgba(59,130,246,0.5)';
            } else {
                clock.style.color = 'var(--primary, #2dd4bf)';
                clock.style.textShadow = '0 0 40px var(--primary, #2dd4bf), 0 0 80px rgba(45,212,191,0.3)';
            }
        }

        if (center) {
            center.classList.toggle('matrix-active', currentMode === 'matrix');
            center.classList.toggle('synthwave-active', currentMode === 'synthwave');
            if (currentMode === 'dvd') {
                center.style.opacity = '0.35';
                center.style.transform = '';
            } else if (currentMode === 'synthwave') {
                center.style.opacity = '1';
                center.style.transform = '';
            } else {
                center.style.opacity = '1';
                center.style.transform = '';
            }
        }
    }

    function setMode(mode) {
        if (!MODES.includes(mode)) mode = getRandomMode();
        currentMode = mode;
        initCurrentModeData();
        applyModeUI();
    }

    function tickClock() {
        if (!ssActive) return;
        updateTimeDisplay();
        setTimeout(tickClock, 1000);
    }

    function activate(modeOverride) {
        if (isGameOpen()) {
            resetTimer();
            return;
        }

        // Random mode unless explicit mode is specified
        const selected = (modeOverride && MODES.includes(modeOverride)) ? modeOverride : getRandomMode();
        setMode(selected);

        ssActive = true;
        lastFrameTime = 0;
        ss.setAttribute('aria-hidden', 'false');
        ss.classList.add('active');
        document.documentElement.classList.add('screensaver-active');
        window.dispatchEvent(new CustomEvent('screensaver-visibilitychange', { detail: { active: true } }));

        // Terminal boot can finish with a programmatic scroll. Keep that event from
        // being mistaken for the user's first screensaver interaction.
        ignoreEvents = true;
        clearTimeout(launchGuardTimer);
        launchGuardTimer = setTimeout(() => { ignoreEvents = false; }, 350);

        resize();
        updateTimeDisplay();
        loop();
        tickClock();
    }

    function deactivate(event) {
        if (!ssActive) return;
        // The launch guard only filters terminal's programmatic scroll. Genuine
        // keyboard, pointer, touch, and wheel input must always exit immediately.
        if (event && event.type === 'scroll' && (ignoreEvents || event.isTrusted === false)) return;
        ssActive = false;
        ss.classList.remove('active');
        ss.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('screensaver-active');
        window.dispatchEvent(new CustomEvent('screensaver-visibilitychange', { detail: { active: false } }));
        cancelAnimationFrame(animId);
        animId = null;
        lastFrameTime = 0;
        resetTimer();
    }

    function resetTimer() {
        clearTimeout(timer);
        timer = setTimeout(activate, TIMEOUT);
    }

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }, { passive: true });

    // Exit only for genuine interaction; programmatic terminal scroll is ignored.
    ['mousemove','mousedown','keydown','touchstart','pointerdown','wheel','scroll'].forEach(ev => {
        document.addEventListener(ev, (event) => {
            deactivate(event);
        }, { passive: true });
    });

    ss.addEventListener('click', (event) => deactivate(event));

    resize();
    window.addEventListener('resize', resize);
    resetTimer();

    // Export Global Screensaver API
    window.Screensaver = {
        activate: (mode) => activate(mode),
        deactivate: () => deactivate(),
        setMode: (mode) => setMode(mode),
        getMode: () => currentMode,
        listModes: () => [...MODES]
    };
})();

/* =============================================
   3. KONAMI CODE EASTER EGG & CHEAT CODE UNLOCK
============================================= */
(function() {
    const overlay = document.getElementById('konamiOverlay');
    const art     = document.getElementById('konamiArt');
    const closeBtn = document.getElementById('konamiClose');
    const msgEl   = overlay ? overlay.querySelector('.konami-msg') : null;
    if (!overlay) return;

    const SEQUENCE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    const CHEAT_ICON = 'states/hacker';
    let pos = 0;

    const isTyping = (e) => {
        const tag = e.target.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;
    };

    function updateCheatCodeUI() {
        const isUnlocked = sessionStorage.getItem('cheatcode_unlocked') === 'true';
        
        // Matrix theme dot toggle
        const matrixDot = document.getElementById('matrixThemeDot');
        if (matrixDot) {
            if (isUnlocked) {
                matrixDot.classList.remove('hide');
                matrixDot.style.display = 'inline-block';
            } else {
                matrixDot.classList.add('hide');
                matrixDot.style.display = 'none';
            }
        }

        // Footer heart link toggle
        const heartEl = document.querySelector('.heart-beat');
        if (heartEl) {
            if (isUnlocked) {
                heartEl.style.cursor = 'pointer';
                heartEl.setAttribute('role', 'button');
                heartEl.setAttribute('tabindex', '0');
                heartEl.setAttribute('aria-label', 'Open Web Projects Showcase');
                heartEl.title = 'Open Web Projects Showcase';
                heartEl.onclick = () => {
                    window.location.href = 'projects.html';
                };
                heartEl.onkeydown = (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        heartEl.click();
                    }
                };
            } else {
                heartEl.style.cursor = 'default';
                heartEl.removeAttribute('title');
                heartEl.removeAttribute('role');
                heartEl.removeAttribute('tabindex');
                heartEl.removeAttribute('aria-label');
                heartEl.onclick = null;
                heartEl.onkeydown = null;
            }
        }
    }

    document.addEventListener('DOMContentLoaded', updateCheatCodeUI);
    updateCheatCodeUI();

    document.addEventListener('keydown', (e) => {
        if (isTyping(e)) return; // don't interfere with terminal / input fields

        // Close if active
        if (overlay.classList.contains('active')) {
            close(); return;
        }

        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        const expected = SEQUENCE[pos].length === 1 ? SEQUENCE[pos].toLowerCase() : SEQUENCE[pos];

        if (key === expected) {
            pos++;
            if (pos === SEQUENCE.length) {
                pos = 0;
                toggleCheatCode();
            }
        } else {
            const firstSeqKey = SEQUENCE[0].length === 1 ? SEQUENCE[0].toLowerCase() : SEQUENCE[0];
            pos = (key === firstSeqKey) ? 1 : 0;
        }
    });

    function toggleCheatCode() {
        const isUnlocked = sessionStorage.getItem('cheatcode_unlocked') === 'true';
        if (!isUnlocked) {
            sessionStorage.setItem('cheatcode_unlocked', 'true');
            if (msgEl) {
                msgEl.innerHTML = '<span class="svg-icon-slot" data-icon="ui/terminal" aria-hidden="true"></span> CHEAT CODE ACTIVATED<br><span>Secret unlocked: <em>Matrix Theme & Daft Punk track unlocked! Click heart in footer.</em></span>';
            }
            updateCheatCodeUI();

            // Automatically switch to Matrix theme!
            const matrixDot = document.getElementById('matrixThemeDot');
            if (matrixDot) {
                matrixDot.click();
            }

            // Automatically trigger music playback if not already playing!
            const musicBtn = document.getElementById('musicToggleBtn');
            if (musicBtn && !musicBtn.classList.contains('playing')) {
                musicBtn.click();
            }

            // Expand theme switcher widget to highlight the new green Matrix dot
            const switcher = document.querySelector('.theme-switcher');
            if (switcher) {
                switcher.classList.add('expanded');
                setTimeout(() => switcher.classList.remove('expanded'), 4000);
            }
        } else {
            sessionStorage.removeItem('cheatcode_unlocked');
            if (msgEl) {
                msgEl.innerHTML = '<span class="svg-icon-slot" data-icon="ui/terminal" aria-hidden="true"></span> CHEAT CODE DEACTIVATED<br><span>Secret locked: <em>Matrix Theme & Projects disabled.</em></span>';
            }
            // Revert theme if matrix is active
            if (localStorage.getItem('theme-accent') === 'matrix') {
                const tealDot = document.querySelector('.theme-dot[data-theme="teal"]');
                if (tealDot) tealDot.click();
            }
            updateCheatCodeUI();
        }
        open();
    }

    function open() {
        const iconName = CHEAT_ICON;
        if (art) {
            art.innerHTML = window.IconRegistry
                ? window.IconRegistry.svg(iconName, { className: 'konami-icon', label: 'Cheat code state' })
                : '';
        }
        overlay.removeAttribute('inert');
        overlay.classList.add('active');
    }

    function close() {
        overlay.classList.remove('active');
        overlay.setAttribute('inert', '');
    }

    closeBtn && closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
})();
