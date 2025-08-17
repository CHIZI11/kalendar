// --- DOM
const calendarEl = document.getElementById("calendar");
const monthLabel = document.getElementById("currentMonth");
const weekdaysEl = document.getElementById("weekdays");

const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");
const themeBtn = document.getElementById("themeBtn");
const menuBtn = document.getElementById("menuBtn");

const sheet = document.getElementById("sheet");
const scrim = document.getElementById("scrim");
const infoToggle = document.getElementById("infoToggle");
const infoPanel = document.getElementById("infoPanel");
const themeSwatches = document.querySelectorAll(".swatch");

const metaTheme = document.getElementById("metaThemeColor");

// --- State
let today = new Date();
let view = new Date(today.getFullYear(), today.getMonth(), 1);

const SCHEDULE_KEY = "cal:schedule";
const THEME_KEY = "cal:theme";

// расписание по умолчанию
let scheduleType = localStorage.getItem(SCHEDULE_KEY) || "DNV";

// --- Utils
function pad2(n) { return String(n).padStart(2, "0"); }
function ymd(d) { return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function isSameDay(a,b){return a.getDate()===b.getDate() && a.getMonth()===b.getMonth() && a.getFullYear()===b.getFullYear();}

// Пн-вс заголовок
const weekNames = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
function renderWeekdays() {
  weekdaysEl.innerHTML = "";
  weekNames.forEach(w => {
    const s = document.createElement("span");
    s.textContent = w;
    weekdaysEl.appendChild(s);
  });
}

// Сезонный акцент (меняем CSS переменную)
function applySeasonAccent(monthIndex) {
  const root = document.documentElement;
  const seasonAccent = (function(m){
    // Зима: 11,0,1; Весна: 2,3,4; Лето: 5,6,7; Осень: 8,9,10
    if ([11,0,1].includes(m)) return "var(--accent)";       // зима — базовый акцент
    if ([2,3,4].includes(m)) return "var(--shift-v)";       // весна — зелёные
    if ([5,6,7].includes(m)) return "var(--shift-d)";       // лето — синие/яркие
    return "var(--shift-n)";                                // осень — фиолетовые/теплые
  })(monthIndex);
  root.style.setProperty("--season-accent", getComputedStyle(root).getPropertyValue(seasonAccent.replace("var(","").replace(")","")).trim() || "");
}

// Определяем код смены для конкретного дня
function getShiftForDate(dateIndexFromAnchor, type) {
  if (type === "DNV") {
    const r = dateIndexFromAnchor % 3;
    return r === 0 ? "D" : r === 1 ? "N" : "V";
  }
  if (type === "2on2off") {
    const r = dateIndexFromAnchor % 4;
    return r < 2 ? "D" : "V"; // 2 дня смены (дневные), 2 выходных
  }
  return "V";
}

// Рендер месяца
function renderMonth(d) {
  calendarEl.innerHTML = "";

  const year = d.getFullYear();
  const month = d.getMonth();

  // Заголовок месяца
  monthLabel.textContent = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(d);

  // Применяем сезонный акцент в зависимости от месяца
  applySeasonAccent(month);

  // Сколько дней и сдвиг по понедельнику
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // Пн=0 .. Вс=6

  // Пустые клетки до первого числа
  for (let i = 0; i < offset; i++) {
    const empty = document.createElement("div");
    calendarEl.appendChild(empty);
  }

  // Якорь для расписания — 1 января 2025 как точка отсчёта (можно поменять)
  const anchor = new Date(2025, 0, 1);

  // День за днём
  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month, day);
    const cell = document.createElement("div");
    cell.className = "day";

    const circle = document.createElement("div");
    circle.className = "circle";

    // индекс дней с якоря
    const diff = Math.floor((date - anchor) / (1000*60*60*24));
    const shiftCode = getShiftForDate(diff, scheduleType);
    const shift = document.createElement("div");
    shift.className = `shift ${shiftCode}`;
    circle.appendChild(shift);

    const num = document.createElement("div");
    num.className = "num";
    num.textContent = day;
    circle.appendChild(num);

    cell.appendChild(circle);

    if (isSameDay(date, today)) {
      cell.classList.add("today");
    }

    calendarEl.appendChild(cell);
  }
}

// Смена темы
function setTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(THEME_KEY, t);
  // подкорректировать meta theme-color под текущую тему
  const cs = getComputedStyle(document.documentElement);
  const bg = cs.getPropertyValue("--bg").trim() || "#ffffff";
  if (metaTheme) metaTheme.setAttribute("content", bg);
}

// Переключатель светлая/тёмная (по кнопке в топбаре — циклически)
const themeOrder = ["light", "theme1", "theme2", "theme3", "dark"];
function rotateTheme() {
  const cur = localStorage.getItem(THEME_KEY) || "light";
  const idx = themeOrder.indexOf(cur);
  const next = themeOrder[(idx + 1) % themeOrder.length];
  setTheme(next);
}

// Открыть/закрыть меню
function openSheet() {
  sheet.classList.add("show");
  scrim.hidden = false;
}
function closeSheet() {
  sheet.classList.remove("show");
  scrim.hidden = true;
}

// Свайпы (открыть — свайп вверх от нижнего края; закрыть — свайп вниз по шиту)
let startY = null;
document.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) startY = e.touches[0].clientY;
}, {passive:true});

document.addEventListener("touchmove", (e) => {
  if (startY == null) return;
  const y = e.touches[0].clientY;
  const dy = y - startY;

  // открыть: свайп вверх с нижней 1/5 экрана
  if (!sheet.classList.contains("show")) {
    const h = window.innerHeight;
    if (startY > h * 0.8 && dy < -60) {
      openSheet();
      startY = null;
    }
  } else {
    // закрыть: свайп вниз по самому шиту
    const path = e.composedPath();
    if (path.includes(sheet) && dy > 60) {
      closeSheet();
      startY = null;
    }
  }
}, {passive:true});

document.addEventListener("touchend", () => startY = null);

// Клики
prevBtn.addEventListener("click", () => {
  view.setMonth(view.getMonth() - 1);
  renderMonth(view);
});
nextBtn.addEventListener("click", () => {
  view.setMonth(view.getMonth() + 1);
  renderMonth(view);
});
themeBtn.addEventListener("click", rotateTheme);
menuBtn.addEventListener("click", openSheet);
scrim.addEventListener("click", closeSheet);

infoToggle.addEventListener("click", () => {
  const open = infoPanel.hasAttribute("hidden") ? true : false;
  infoPanel.toggleAttribute("hidden");
  infoToggle.setAttribute("aria-expanded", String(open));
});

// Выбор темы из кружков
themeSwatches.forEach(sw => {
  sw.addEventListener("click", () => setTheme(sw.dataset.theme));
});

// Радио переключатели типа расписания
document.querySelectorAll('input[name="schedule"]').forEach(r => {
  r.addEventListener("change", (e) => {
    scheduleType = e.target.value;
    localStorage.setItem(SCHEDULE_KEY, scheduleType);
    renderMonth(view);
  });
});

// Инициализация
(function init(){
  // заголовки дней недели
  renderWeekdays();

  // тема
  setTheme(localStorage.getItem(THEME_KEY) || "light");

  // текущий месяц
  renderMonth(view);
})();
