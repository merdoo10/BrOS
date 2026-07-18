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
    const journalWindow = document.getElementById('journal-window');
    const journalToggleButton = document.getElementById('journal-toggle-btn');
    const journalHeader = document.getElementById('journal-header');

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

    if (journalWindow && journalToggleButton && journalHeader) {
        journalToggleButton.addEventListener('click', () => {
            toggleWindowState(journalWindow);
            journalToggleButton.textContent = journalWindow.dataset.open === 'true' ? '−' : '+';
            journalToggleButton.setAttribute('aria-expanded', journalWindow.dataset.open === 'true' ? 'true' : 'false');
        });

        dragElement(journalWindow, journalHeader);
    }

    document.querySelectorAll('.window').forEach((windowElement) => {
        windowElement.addEventListener('mousedown', () => bringWindowToFront(windowElement));
    });
}

function initializeJournalPages() {
    const journalWindow = document.getElementById('journal-window');
    const pagesContainer = document.querySelector('.journal-pages');
    const prevButton = document.getElementById('journal-prev');
    const nextButton = document.getElementById('journal-next');
    const newPageButton = document.getElementById('journal-new-page');
    const pageIndicator = document.getElementById('journal-page-indicator');

    if (!journalWindow || !pagesContainer) return;

    let currentPage = 0;
    let pageCount = pagesContainer.querySelectorAll('.journal-page').length;
    const savedEntries = JSON.parse(localStorage.getItem('journal-entries') || '{}');

    function saveEntry(textarea) {
        const storageKey = textarea.dataset.storageKey;
        if (storageKey) {
            savedEntries[storageKey] = textarea.value;
            localStorage.setItem('journal-entries', JSON.stringify(savedEntries));
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
            <!-- Add your own content here -->
            <textarea class="journal-entry" data-storage-key="journal-page-${pageNumber}" placeholder="Write your new page here"></textarea>
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

function bindAppIconToggle() {
    const appIcon = document.querySelector('.SelectedIcon');
    const journalWindow = document.getElementById('journal-window');

    if (!appIcon || !journalWindow) return;

    appIcon.addEventListener('click', () => {
        toggleWindowState(journalWindow);
        appIcon.classList.toggle('is-selected', journalWindow.dataset.open === 'true');
    });
}

function initializePage() {
    const eyeSocket = document.querySelector('.eye-socket');

    initializeWindowControls();
    initializeJournalPages();
    bindAppIconToggle();

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
