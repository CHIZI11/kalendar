// script.js

// DOM
const calendarEl = document.querySelector(".calendar");
const monthLabel = document.querySelector(".month-label");
const prevBtn = document.querySelector(".prev-month");
const nextBtn = document.querySelector(".next-month");
const themeButtons = document.querySelectorAll(".swatch");
const infoBtn = document.querySelector(".info-btn");
const sheet = document.querySelector(".sheet");
const scrim = document.querySelector(".scrim");

// Дата
let currentDate = new Date();
let viewYear = currentDate.getFullYear();
let viewMonth = currentDate.getMonth();

// Смены (пример расписания)
let shifts = {}; 
// Пример: shifts["2025-08-17"] = "D";

function renderCalendar() {
  calendarEl.innerHTML = "";

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Подпись месяца
  monthLabel.textContent = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric"
  }).format(new Date(viewYear, viewMonth));

  // Заполняем пустые клетки
  const offset = (firstDay + 6) % 7; // сдвиг (понедельник - первый)
  for (let i = 0; i < offset; i++) {
    const blank = document.createElement("div");
    calendarEl.appendChild(blank);
  }

  // Дни месяца
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const dayEl = document.createElement("div");
    dayEl.className = "day";

    const num = document.createElement("div");
    num.className = "num";
    num.textContent = d;
    dayEl.appendChild(num);

    // Смена
    if (shifts[dateKey]) {
      const shiftEl = document.createElement("div");
      shiftEl.className = "shift " + shifts[dateKey];
      dayEl.appendChild(shiftEl);
    }

    // Сегодня
    if (
      d === currentDate.getDate() &&
      viewMonth === currentDate.getMonth() &&
      viewYear === currentDate.getFullYear()
    ) {
      dayEl.classList.add("today");
    }

    calendarEl.appendChild(dayEl);
  }
}

// Переключение месяцев
prevBtn.addEventListener("click", () => {
  viewMonth--;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear--;
  }
  renderCalendar();
});
nextBtn.addEventListener("click", () => {
  viewMonth++;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear++;
  }
  renderCalendar();
});

// Темы
themeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const theme = btn.dataset.theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  });
});
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

// Инфо-меню
infoBtn.addEventListener("click", () => {
  sheet.classList.add("show");
  scrim.classList.remove("hidden");
});
scrim.addEventListener("click", () => {
  sheet.classList.remove("show");
  scrim.classList.add("hidden");
});

// Первичная отрисовка
renderCalendar();


// --- PWA (Service Worker) ---
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(err => {
    console.warn("SW registration failed", err);
  });
      }
