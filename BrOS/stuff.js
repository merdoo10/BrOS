let activeWindowZ = 1200;
const requestFrame = typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
    ? window.requestAnimationFrame.bind(window)
    : (callback) => setTimeout(callback, 16);

function setWindowVisibility(element, isVisible) {
    if (!element) return;

    element.style.display = isVisible ? 'block' : 'none';
    element.setAttribute('aria-hidden', String(!isVisible));
    element.dataset.open = isVisible ? 'true' : 'false';
}

function openWindow(element) {
    if (!element) return;

    element.style.display = 'block';
    element.classList.remove('is-closing');
    element.dataset.open = 'true';
    requestFrame(() => {
        element.classList.add('is-open');
    });
    bringWindowToFront(element);
}

function closeWindow(element) {
    if (!element) return;

    element.classList.remove('is-open');
    element.classList.add('is-closing');
    element.dataset.open = 'false';

    const delayHandle = typeof window !== 'undefined' ? window.setTimeout : setTimeout;
    delayHandle(() => {
        element.style.display = 'none';
        element.classList.remove('is-closing');
    }, 180);
}

function toggleWindowState(element) {
    if (!element) return;

    const isOpen = element.dataset.open === 'true';
    if (isOpen) {
        closeWindow(element);
    } else {
        openWindow(element);
    }

    return element.dataset.open === 'true';
}

function bringWindowToFront(element) {
    if (!element) return;

    activeWindowZ += 1;
    element.style.zIndex = String(activeWindowZ);

    if (typeof document === 'undefined') return;

    document.querySelectorAll('.window').forEach((windowElement) => {
        windowElement.classList.remove('is-active');
    });
    element.classList.add('is-active');
}

function updateTime() {
    const timeText = document.querySelector('#TimeElement');

    if (timeText) {
        timeText.textContent = new Date().toLocaleTimeString();
    }
}

function updateCurrentDate() {
    const dateText = document.getElementById('current-date');

    if (dateText) {
        dateText.textContent = new Date().toLocaleDateString();
    }
}

function dragElement(element, handle = element) {
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let pendingX = 0;
    let pendingY = 0;
    let frameScheduled = false;

    handle.addEventListener('mousedown', startDragging);

    function startDragging(event) {
        event.preventDefault();
        event.stopPropagation();

        // Snapshot the mouse position and the element's real rendered
        // position ONCE at drag start, instead of re-reading offsetLeft/Top
        // on every mousemove (which forces a layout reflow and causes lag).
        startX = event.clientX;
        startY = event.clientY;
        startLeft = element.offsetLeft;
        startTop = element.offsetTop;
        pendingX = 0;
        pendingY = 0;

        document.addEventListener('mouseup', stopDragging);
        document.addEventListener('mousemove', dragElementMouse);
        element.classList.add('is-dragging');
        bringWindowToFront(element);
    }

    function dragElementMouse(event) {
        event.preventDefault();

        // Always measure the total delta from the drag's starting point,
        // never from the last frame — this keeps the element locked
        // exactly to the cursor with zero drift, however fast you move.
        pendingX = event.clientX - startX;
        pendingY = event.clientY - startY;

        if (!frameScheduled) {
            frameScheduled = true;
            requestFrame(() => {
                element.style.left = `${startLeft + pendingX}px`;
                element.style.top = `${startTop + pendingY}px`;
                frameScheduled = false;
            });
        }
    }

    function stopDragging() {
        document.removeEventListener('mouseup', stopDragging);
        document.removeEventListener('mousemove', dragElementMouse);
        element.classList.remove('is-dragging');
    }
}

function initializeWindowControls() {
    const statWindow = document.getElementById('stat');
    const statToggleButton = document.getElementById('window-toggle-btn');
    const statHeader = document.getElementById('statheader');
    const notesWindow = document.getElementById('journal-window');
    const notesToggleButton = document.getElementById('journal-toggle-btn');
    const notesHeader = document.getElementById('journal-header');

    if (statWindow && statToggleButton && statHeader) {
        statToggleButton.addEventListener('click', () => {
            const body = statWindow.querySelector('.window-body');
            const isCollapsed = statWindow.dataset.collapsed === 'true';

            statWindow.dataset.collapsed = isCollapsed ? 'false' : 'true';
            if (body) {
                body.style.display = isCollapsed ? 'block' : 'none';
            }
            statToggleButton.textContent = isCollapsed ? '<' : '>';
        });

        dragElement(statWindow, statHeader);
    }

    if (notesWindow && notesToggleButton && notesHeader) {
        notesToggleButton.addEventListener('click', () => {
            toggleWindowState(notesWindow);
            notesToggleButton.textContent = notesWindow.dataset.open === 'true' ? '−' : '+';
            notesToggleButton.setAttribute('aria-expanded', notesWindow.dataset.open === 'true' ? 'true' : 'false');
        });

        dragElement(notesWindow, notesHeader);
    }

    document.querySelectorAll('.window').forEach((windowElement) => {
        windowElement.addEventListener('mousedown', () => bringWindowToFront(windowElement));
    });
}

function initializeNotesPages() {
    const notesWindow = document.getElementById('journal-window');
    const pagesContainer = document.querySelector('.journal-pages');
    const prevButton = document.getElementById('journal-prev');
    const nextButton = document.getElementById('journal-next');
    const newPageButton = document.getElementById('journal-new-page');
    const pageIndicator = document.getElementById('journal-page-indicator');

    if (!notesWindow || !pagesContainer) return;

    let currentPage = 0;
    let pageCount = pagesContainer.querySelectorAll('.journal-page').length;
    const savedEntries = JSON.parse(localStorage.getItem('notes-entries') || '{}');

    function saveEntry(textarea) {
        const storageKey = textarea.dataset.storageKey;
        if (storageKey) {
            savedEntries[storageKey] = textarea.value;
            localStorage.setItem('notes-entries', JSON.stringify(savedEntries));
        }
    }

    function bindPage(pageElement, index) {
        const textarea = pageElement.querySelector('.journal-entry');
        const storageKey = textarea ? textarea.dataset.storageKey : null;

        if (textarea && storageKey && savedEntries[storageKey]) {
            textarea.value = savedEntries[storageKey];
        }

        if (textarea) {
            textarea.addEventListener('input', () => saveEntry(textarea));
        }

        pageElement.dataset.page = String(index);
    }

    function updatePageDisplay() {
        const pages = Array.from(pagesContainer.querySelectorAll('.journal-page'));
        pages.forEach((page, index) => {
            page.classList.toggle('is-active', index === currentPage);
        });
        if (pageIndicator) {
            pageIndicator.textContent = `Page ${currentPage + 1} / ${pages.length}`;
        }
    }

    function createNewPage() {
        const pageNumber = pageCount + 1;
        const pageElement = document.createElement('article');
        pageElement.className = 'journal-page';
        pageElement.innerHTML = `
            <h3>Page ${pageNumber}</h3>
            <p>Write a fresh note here.</p>
            <textarea class="journal-entry" data-storage-key="notes-page-${pageNumber}" placeholder="Write your new page here"></textarea>
        `;

        pagesContainer.appendChild(pageElement);
        bindPage(pageElement, pageCount);
        pageCount += 1;
        currentPage = pageCount - 1;
        updatePageDisplay();
    }

    Array.from(pagesContainer.querySelectorAll('.journal-page')).forEach((page, index) => bindPage(page, index));

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            const pages = pagesContainer.querySelectorAll('.journal-page');
            currentPage = (currentPage - 1 + pages.length) % pages.length;
            updatePageDisplay();
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const pages = pagesContainer.querySelectorAll('.journal-page');
            currentPage = (currentPage + 1) % pages.length;
            updatePageDisplay();
        });
    }

    if (newPageButton) {
        newPageButton.addEventListener('click', createNewPage);
    }

    updatePageDisplay();
}

function resizeElement(element, handle, direction) {
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let startWidth = 0;
    let startHeight = 0;
    let pendingX = 0;
    let pendingY = 0;
    let frameScheduled = false;

    const MIN_WIDTH = 280;
    const MIN_HEIGHT = 180;

    handle.addEventListener('mousedown', startResize);

    function startResize(event) {
        event.preventDefault();
        event.stopPropagation();

        // Mirror dragElement's snapshot at the start so we don't force a
        // layout reflow on every mousemove.
        startX = event.clientX;
        startY = event.clientY;
        startLeft = element.offsetLeft;
        startTop = element.offsetTop;
        startWidth = element.offsetWidth;
        startHeight = element.offsetHeight;
        pendingX = 0;
        pendingY = 0;

        document.addEventListener('mouseup', stopResize);
        document.addEventListener('mousemove', resizeMouse);
        element.classList.add('is-resizing');
        bringWindowToFront(element);
    }

    function resizeMouse(event) {
        event.preventDefault();

        // Always measure total delta from the start of the resize so the
        // edge stays locked exactly to the cursor, same drift-free guarantee
        // as dragElement.
        pendingX = event.clientX - startX;
        pendingY = event.clientY - startY;

        if (!frameScheduled) {
            frameScheduled = true;
            requestFrame(() => {
                const isLeft = direction === 'nw' || direction === 'sw';
                const isTop = direction === 'nw' || direction === 'ne';

                let newLeft = startLeft;
                let newTop = startTop;
                let newWidth = startWidth;
                let newHeight = startHeight;

                if (isLeft) {
                    newLeft = startLeft + pendingX;
                    newWidth = startWidth - pendingX;
                } else {
                    newWidth = startWidth + pendingX;
                }
                if (isTop) {
                    newTop = startTop + pendingY;
                    newHeight = startHeight - pendingY;
                } else {
                    newHeight = startHeight + pendingY;
                }

                // Snap to minimums while keeping the opposite edge pinned —
                // back-compute the moving edge so the resize feels solid,
                // not rubbery, at the minimum boundary.
                if (newWidth < MIN_WIDTH) {
                    if (isLeft) {
                        newLeft = startLeft + startWidth - MIN_WIDTH;
                    }
                    newWidth = MIN_WIDTH;
                }
                if (newHeight < MIN_HEIGHT) {
                    if (isTop) {
                        newTop = startTop + startHeight - MIN_HEIGHT;
                    }
                    newHeight = MIN_HEIGHT;
                }

                element.style.left = `${newLeft}px`;
                element.style.top = `${newTop}px`;
                element.style.width = `${newWidth}px`;
                element.style.height = `${newHeight}px`;

                frameScheduled = false;
            });
        }
    }

    function stopResize() {
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('mousemove', resizeMouse);
        element.classList.remove('is-resizing');
    }
}

function launchAppWindow(url, title, appId) {
    if (!url) return;

    const safeId = (appId || url).replace(/[^a-z0-9-]/gi, '-');
    const existing = document.getElementById(`window-${safeId}`);
    if (existing) {
        bringWindowToFront(existing);
        return;
    }

    const win = document.createElement('div');
    win.className = 'window desktop-app';
    win.id = `window-${safeId}`;

    // Cascade new windows so they don't stack exactly on top of each other.
    // Count only OPEN windows so closed ones don't permanently eat the offset.
    const openWindows = document.querySelectorAll('.desktop-app[data-open="true"]').length;
    const step = Math.min(openWindows, 6) * 30;
    const winWidth = Math.min(900, window.innerWidth * 0.92);
    const winHeight = Math.min(640, window.innerHeight * 0.85);
    const startLeft = Math.max(20, Math.round((window.innerWidth - winWidth) / 2 + step));
    const startTop = Math.min(
        Math.max(20, 80 + step),
        Math.max(20, window.innerHeight - winHeight - 20),
    );
    win.style.left = `${startLeft}px`;
    win.style.top = `${startTop}px`;

    win.innerHTML = `
        <div class="window-header" id="header-${safeId}">
            <button class="win-back" type="button" aria-label="Back">←</button>
            <span class="window-title">${title}</span>
            <button class="win-close" type="button" aria-label="Close">×</button>
        </div>
        <div class="window-body">
            <iframe src="${url}" title="${title}" loading="lazy"></iframe>
        </div>
    `;

    document.body.appendChild(win);

    const header = win.querySelector('.window-header');
    const closeButton = win.querySelector('.win-close');
    const backButton = header.querySelector('.win-back');
    const iframe = win.querySelector('iframe');

    // Corner resize handles, one per corner. The handle's mousedown calls
    // stopPropagation, so even though they live inside the window, they
    // never bubble up into the header's drag listener.
    const cornerDirections = ['nw', 'ne', 'sw', 'se'];
    cornerDirections.forEach((direction) => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-${direction}`;
        win.appendChild(handle);
        resizeElement(win, handle, direction);
    });

    dragElement(win, header);
    openWindow(win);

    // Dynamic .window elements weren't around when initializeWindowControls
    // attached its per-window bring-to-front listener, so wire it up here.
    win.addEventListener('mousedown', () => {
        bringWindowToFront(win);
    });

    // Stop mousedown on the header buttons bubbling to the header's drag
    // listener — otherwise clicking ×/← briefly starts dragging the window.
    closeButton.addEventListener('mousedown', (event) => {
        event.stopPropagation();
    });
    backButton.addEventListener('mousedown', (event) => {
        event.stopPropagation();
    });

    // Hide any "Back to BrOS" button inside the app so users can't
    // accidentally reload bros.html *inside* the iframe.
    const hideInternalBackButton = () => {
        try {
            const backBtn = iframe.contentDocument.querySelector('.back-button');
            if (backBtn) backBtn.style.display = 'none';
        } catch (error) {
            // file:// protocol (or cross-origin iframe) — harmless.
        }
    };
    iframe.addEventListener('load', hideInternalBackButton);

    closeButton.addEventListener('click', (event) => {
        event.stopPropagation();
        closeWindow(win);
    });

    backButton.addEventListener('click', (event) => {
        event.stopPropagation();
        try {
            iframe.contentWindow.history.back();
        } catch (error) {
            // Empty history or cross-origin — just ignore.
        }
    });
}

function initializeAppLaunchers() {
    // Note: preventDefault is omitted because the button elements we attach to
    // don't navigate — calling it would be dead code that confuses readers.
    document.querySelectorAll('[data-app-url]').forEach((element) => {
        element.addEventListener('click', () => {
            const url = element.dataset.appUrl;
            const title = element.dataset.appTitle || element.textContent.trim() || 'App';
            const id = element.dataset.appId || url;
            launchAppWindow(url, title, id);
        });
    });
}

function bindAppIconToggle() {
    const appIcon = document.querySelector('.SelectedIcon');
    const notesWindow = document.getElementById('journal-window');

    if (!appIcon || !notesWindow) return;

    appIcon.addEventListener('click', () => {
        toggleWindowState(notesWindow);
        appIcon.classList.toggle('is-selected', notesWindow.dataset.open === 'true');
    });
}

function initializePage() {
    const eyeSocket = document.querySelector('.eye-socket');

    initializeWindowControls();
    initializeNotesPages();
    bindAppIconToggle();
    initializeAppLaunchers();
    updateCurrentDate();

    const clockElement = document.querySelector('.clock');
    if (clockElement) {
        dragElement(clockElement);
    }

    updateTime();
    setInterval(updateTime, 1000);

    if (!eyeSocket) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentAngle = 0;
    const lagSpeed = 0.025;

    const resetEye = () => {
        mouseX = window.innerWidth / 2;
        mouseY = window.innerHeight / 2;
        currentAngle = 0;
        eyeSocket.style.transform = 'rotate(90deg)';
    };

    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
    });
    window.addEventListener('scroll', resetEye, { passive: true });
    window.addEventListener('resize', resetEye);

    function animate() {
        const rect = eyeSocket.getBoundingClientRect();
        const eyeX = rect.left + rect.width / 2;
        const eyeY = rect.top + rect.height / 2;
        const targetAngle = Math.atan2(mouseY - eyeY, mouseX - eyeX) * (180 / Math.PI);

        let diff = targetAngle - currentAngle;

        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;

        currentAngle += diff * lagSpeed;
        eyeSocket.style.transform = `rotate(${currentAngle + 90}deg)`;

        requestAnimationFrame(animate);
    }

    animate();
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePage);
    } else {
        initializePage();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openWindow,
        closeWindow,
        setWindowVisibility,
        toggleWindowState,
        bindAppIconToggle,
    };
}

var selectedIcon = undefined;

function selectIcon(element) {
    element.classList.add('Selected');
    selectedIcon = element;
}

function unselectIcon(element) {
    element.classList.remove('Selected');
    selectedIcon = undefined;
}

function handleIconClick(event) {
    if (event.target.classList.contains('selected')) {
        unselectIcon(event.target);
    } else {
        selectIcon(event.target);
    }
}
const hourHand = document.getElementById('hour-hand');
const minuteHand = document.getElementById('minute-hand');
const secondHand = document.getElementById('second-hand');

function updateClock() {
    const date = new Date();
    
    const seconds = date.getSeconds();
    const minutes = date.getMinutes();
    const hours = date.getHours() % 12; // 12 saatlik formata çevir

    const secondsDegrees = (seconds / 60) * 360;
    const minutesDegrees = (minutes / 60) * 360 + (seconds / 60) * 6;
    const hoursDegrees = (hours / 12) * 360 + (minutes / 60) * 30;

    secondHand.style.transform = `translateX(-50%) rotate(${secondsDegrees}deg)`;
    minuteHand.style.transform = `translateX(-50%) rotate(${minutesDegrees}deg)`;
    hourHand.style.transform = `translateX(-50%) rotate(${hoursDegrees}deg)`;
}

// Saatin her saniye çalışmasını sağla
setInterval(updateClock, 1000);
updateClock(); // Sayfa yüklendiğinde hemen çalıştır
