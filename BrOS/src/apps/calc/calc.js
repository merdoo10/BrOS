let activeWindowZ = 1200;
const requestFrame =
  typeof window !== "undefined" &&
  typeof window.requestAnimationFrame === "function"
    ? window.requestAnimationFrame.bind(window)
    : (callback) => setTimeout(callback, 16);

function setWindowVisibility(element, isVisible) {
  if (!element) return;
  element.style.display = isVisible ? "block" : "none";
  element.setAttribute("aria-hidden", String(!isVisible));
  element.dataset.open = isVisible ? "true" : "false";
}

function openWindow(element) {
  if (!element) return;
  element.style.display = "block";
  element.classList.remove("is-closing");
  element.dataset.open = "true";
  requestFrame(() => {
    element.classList.add("is-open");
  });
  bringWindowToFront(element);
}

function closeWindow(element) {
  if (!element) return;
  element.classList.remove("is-open");
  element.classList.add("is-closing");
  element.dataset.open = "false";

  const delayHandle =
    typeof window !== "undefined" ? window.setTimeout : setTimeout;
  delayHandle(() => {
    element.style.display = "none";
    element.classList.remove("is-closing");
  }, 180);
}

function toggleWindowState(element) {
  if (!element) return;
  const isOpen = element.dataset.open === "true";
  if (isOpen) {
    closeWindow(element);
  } else {
    openWindow(element);
  }
  return element.dataset.open === "true";
}

function bringWindowToFront(element) {
  if (!element) return;
  activeWindowZ += 1;
  element.style.zIndex = String(activeWindowZ);

  if (typeof document === "undefined") return;
  document.querySelectorAll(".window").forEach((windowElement) => {
    windowElement.classList.remove("is-active");
  });
  element.classList.add("is-active");
}

function dragElement(element, handle = element) {
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let pendingX = 0;
  let pendingY = 0;
  let frameScheduled = false;

  handle.addEventListener("mousedown", startDragging);

  function startDragging(event) {
    event.preventDefault();
    event.stopPropagation();

    startX = event.clientX;
    startY = event.clientY;
    startLeft = element.offsetLeft;
    startTop = element.offsetTop;
    pendingX = 0;
    pendingY = 0;

    document.addEventListener("mouseup", stopDragging);
    document.addEventListener("mousemove", dragElementMouse);
    element.classList.add("is-dragging");
    bringWindowToFront(element);
  }

  function dragElementMouse(event) {
    event.preventDefault();
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
    document.removeEventListener("mouseup", stopDragging);
    document.removeEventListener("mousemove", dragElementMouse);
    element.classList.remove("is-dragging");
  }
}

function updateTime() {
  const timeText = document.querySelector("#TimeElement");
  if (timeText) {
    timeText.textContent = new Date().toLocaleTimeString();
  }
}

function initializeClock() {
  const hourHand = document.getElementById("hour-hand");
  const minuteHand = document.getElementById("minute-hand");
  const secondHand = document.getElementById("second-hand");

  if (!hourHand || !minuteHand || !secondHand) return;

  function updateClock() {
    const date = new Date();
    const seconds = date.getSeconds();
    const minutes = date.getMinutes();
    const hours = date.getHours() % 12;

    const secondsDegrees = (seconds / 60) * 360;
    const minutesDegrees = (minutes / 60) * 360 + (seconds / 60) * 6;
    const hoursDegrees = (hours / 12) * 360 + (minutes / 60) * 30;

    secondHand.style.transform = `translateX(-50%) rotate(${secondsDegrees}deg)`;
    minuteHand.style.transform = `translateX(-50%) rotate(${minutesDegrees}deg)`;
    hourHand.style.transform = `translateX(-50%) rotate(${hoursDegrees}deg)`;
  }

  setInterval(updateClock, 1000);
  updateClock();
}

function initializePopupDialog() {
  const openBtn = document.getElementById("openBtn");
  const closeBtn = document.getElementById("closeBtn");
  const popupWindow = document.getElementById("popupWindow");

  if (!openBtn || !closeBtn || !popupWindow) return;

  openBtn.addEventListener("click", (event) => {
    event.preventDefault();
    popupWindow.showModal();
  });

  closeBtn.addEventListener("click", () => {
    popupWindow.close();
  });
}

function initializeWindowControls() {
  const statWindow = document.getElementById("stat");
  const statToggleButton = document.getElementById("window-toggle-btn");
  const statHeader = document.getElementById("statheader");
  const journalWindow = document.getElementById("journal-window");
  const journalToggleButton = document.getElementById("journal-toggle-btn");
  const journalHeader = document.getElementById("journal-header");

  if (statWindow && statToggleButton && statHeader) {
    statToggleButton.addEventListener("click", () => {
      const body = statWindow.querySelector(".window-body");
      const isCollapsed = statWindow.dataset.collapsed === "true";
      statWindow.dataset.collapsed = isCollapsed ? "false" : "true";
      if (body) {
        body.style.display = isCollapsed ? "block" : "none";
      }
      statToggleButton.textContent = isCollapsed ? "<" : ">";
    });
    dragElement(statWindow, statHeader);
  }

  if (journalWindow && journalToggleButton && journalHeader) {
    journalToggleButton.addEventListener("click", () => {
      toggleWindowState(journalWindow);
      journalToggleButton.textContent =
        journalWindow.dataset.open === "true" ? "−" : "+";
      journalToggleButton.setAttribute(
        "aria-expanded",
        journalWindow.dataset.open === "true" ? "true" : "false",
      );
    });
    dragElement(journalWindow, journalHeader);
  }

  document.querySelectorAll(".window").forEach((windowElement) => {
    windowElement.addEventListener("mousedown", () =>
      bringWindowToFront(windowElement),
    );
  });
}

function initializeJournalPages() {
  const journalWindow = document.getElementById("journal-window");
  const pagesContainer = document.querySelector(".journal-pages");
  const prevButton = document.getElementById("journal-prev");
  const nextButton = document.getElementById("journal-next");
  const newPageButton = document.getElementById("journal-new-page");
  const pageIndicator = document.getElementById("journal-page-indicator");

  if (!journalWindow || !pagesContainer) return;

  let currentPage = 0;
  let pageCount = pagesContainer.querySelectorAll(".journal-page").length;
  const savedEntries = JSON.parse(
    localStorage.getItem("journal-entries") || "{}",
  );

  function saveEntry(textarea) {
    const storageKey = textarea.dataset.storageKey;
    if (storageKey) {
      savedEntries[storageKey] = textarea.value;
      localStorage.setItem("journal-entries", JSON.stringify(savedEntries));
    }
  }

  function bindPage(pageElement, index) {
    const textarea = pageElement.querySelector(".journal-entry");
    const storageKey = textarea ? textarea.dataset.storageKey : null;

    if (textarea && storageKey && savedEntries[storageKey]) {
      textarea.value = savedEntries[storageKey];
    }

    if (textarea) {
      textarea.addEventListener("input", () => saveEntry(textarea));
    }

    pageElement.dataset.page = String(index);
  }

  function updatePageDisplay() {
    const pages = Array.from(pagesContainer.querySelectorAll(".journal-page"));
    pages.forEach((page, index) => {
      page.classList.toggle("is-active", index === currentPage);
    });
    if (pageIndicator) {
      pageIndicator.textContent = `Page ${currentPage + 1} / ${pages.length}`;
    }
  }

  function createNewPage() {
    const pageNumber = pageCount + 1;
    const pageElement = document.createElement("article");
    pageElement.className = "journal-page";
    pageElement.innerHTML = `
            <h3>Page ${pageNumber}</h3>
            <p>Write a fresh note here.</p>
            <textarea class="journal-entry" data-storage-key="journal-page-${pageNumber}" placeholder="Write your new page here"></textarea>
        `;

    pagesContainer.appendChild(pageElement);
    bindPage(pageElement, pageCount);
    pageCount += 1;
    currentPage = pageCount - 1;
    updatePageDisplay();
  }

  Array.from(pagesContainer.querySelectorAll(".journal-page")).forEach(
    (page, index) => bindPage(page, index),
  );

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      const pages = pagesContainer.querySelectorAll(".journal-page");
      currentPage = (currentPage - 1 + pages.length) % pages.length;
      updatePageDisplay();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      const pages = pagesContainer.querySelectorAll(".journal-page");
      currentPage = (currentPage + 1) % pages.length;
      updatePageDisplay();
    });
  }

  if (newPageButton) {
    newPageButton.addEventListener("click", createNewPage);
  }

  updatePageDisplay();
}

function initializeCalculator() {
  const calcWindow = document.getElementById("calc-window");
  const calcToggleButton = document.getElementById("calc-toggle-btn");
  const calcHeader = document.getElementById("calc-header");
  const calcOpenButton = document.getElementById("hesap1-btn");
  const display = document.getElementById("calc-display");
  const keys = document.querySelector(".calc-keys");

  if (!calcWindow || !display || !keys) return;

  let expression = "";

  function updateDisplay() {
    display.value = expression === "" ? "0" : expression;
  }

  keys.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const { action, value } = button.dataset;

    if (action === "clear") {
      expression = "";
    } else if (action === "delete") {
      expression = expression.slice(0, -1);
    } else if (action === "equals") {
      if (!expression) return;
      try {
        const sanitized = expression.replace(/[^0-9+\-*/.%() ]/g, "");
        if (sanitized !== expression) throw new Error("invalid characters");
        const result = Function(`"use strict"; return (${sanitized})`)();
        if (!Number.isFinite(result)) throw new Error("invalid result");
        expression = String(result);
      } catch (error) {
        expression = "Hata";
      }
    } else if (value !== undefined) {
      expression = expression === "Hata" ? value : expression + value;
    }

    updateDisplay();
  });

  if (calcOpenButton) {
    calcOpenButton.addEventListener("click", (event) => {
      event.preventDefault();
      openWindow(calcWindow);
      if (calcToggleButton) calcToggleButton.textContent = "−";
    });
  }

  if (calcToggleButton && calcHeader) {
    calcToggleButton.addEventListener("click", () => {
      toggleWindowState(calcWindow);
      calcToggleButton.textContent =
        calcWindow.dataset.open === "true" ? "−" : "+";
    });
    dragElement(calcWindow, calcHeader);
  }

  updateDisplay();
}

function initializePage() {
  initializeWindowControls();
  initializeJournalPages();
  initializeCalculator();
  initializePopupDialog();

  const clockElement = document.querySelector(".clock");
  if (clockElement) {
    dragElement(clockElement);
  }

  updateTime();
  setInterval(updateTime, 1000);
  initializeClock();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage);
  } else {
    initializePage();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    openWindow,
    closeWindow,
    setWindowVisibility,
    toggleWindowState,
    dragElement,
    bringWindowToFront,
    updateTime,
  };
}