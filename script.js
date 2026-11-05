"use strict";

// SEATSYNC — COMPLETE APPLICATION LOGIC

const USER_KEY = "seatsync_users_v2";
const BOOKING_KEY = "seatsync_bookings_v2";
const SESSION_KEY = "seatsync_session_v2";

const TOTAL_SEATS = 40;
const SLOTS = {
  "09:00-11:00": "09:00 AM – 11:00 AM",
  "11:00-13:00": "11:00 AM – 01:00 PM",
  "13:00-15:00": "01:00 PM – 03:00 PM",
  "15:00-17:00": "03:00 PM – 05:00 PM",
  "17:00-19:00": "05:00 PM – 07:00 PM"
};

let users = readStorage(USER_KEY);
let bookings = readStorage(BOOKING_KEY);
let currentUser = null;
let selectedSeat = null;
let authMode = "login";
let toastTimer;

// GENERAL HELPERS

function $(id) {
  return document.getElementById(id);
}

function readStorage(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveBookings() {
  try {
    localStorage.setItem(BOOKING_KEY, JSON.stringify(bookings));
    return true;
  } catch {
    toast("Could not save booking. Check browser storage.");
    return false;
  }
}

function todayString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startTime(booking) {
  return new Date(
    `${booking.date}T${booking.slot.split("-")[0]}:00`
  ).getTime();
}

function endTime(booking) {
  return new Date(
    `${booking.date}T${booking.slot.split("-")[1]}:00`
  ).getTime();
}

function statusOf(booking) {
  if (booking.status === "cancelled") return "cancelled";
  if (endTime(booking) <= Date.now()) return "completed";
  return "active";
}

function expireBookings() {
  let changed = false;
  bookings.forEach(booking => {
    if (booking.status === "active" && endTime(booking) <= Date.now()) {
      booking.status = "completed";
      changed = true;
    }
  });
  if (changed) saveBookings();
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $("toast").classList.remove("show");
  }, 3200);
}

// LOGIN AND REGISTRATION
// DEMO ONLY: No password is stored or verified.
// Never use a real password in this prototype.

function switchAuth(mode) {
  authMode = mode;
  const register = mode === "register";

  $("registerFields").hidden = !register;
  $("authHeading").textContent =
    register ? "Create your account" : "Welcome back";
  $("authDescription").textContent =
    register
      ? "Join SeatSync to reserve your study space."
      : "Sign in to access your study dashboard.";
  $("authSubmit").textContent =
    register ? "Create Account →" : "Sign In →";

  $("loginTab").classList.toggle("active", !register);
  $("registerTab").classList.toggle("active", register);

  $("authName").required = register;
  $("authReg").required = register;
  $("authError").textContent = "";
}

$("loginTab").addEventListener("click", () => switchAuth("login"));
$("registerTab").addEventListener("click", () => switchAuth("register"));

$("authForm").addEventListener("submit", event => {
  event.preventDefault();

  const email = $("authEmail").value.trim().toLowerCase();
  const password = $("authPassword").value;

  if (password.length < 6) {
    $("authError").textContent = "Enter at least 6 characters.";
    return;
  }

  if (authMode === "register") {
    const name = $("authName").value.trim();
    const reg = $("authReg").value.trim();

    if (!name || !reg) {
      $("authError").textContent = "Enter your name and registration number.";
      return;
    }

    if (users.some(u => u.email === email)) {
      $("authError").textContent = "Email already registered.";
      return;
    }

    if (users.some(u => u.reg.toLowerCase() === reg.toLowerCase())) {
      $("authError").textContent = "Registration number already exists.";
      return;
    }

    const user = {
      id: makeId(),
      name,
      reg,
      email
    };

    const updatedUsers = [...users, user];

    try {
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUsers));
    } catch {
      $("authError").textContent = "Could not save account.";
      return;
    }

    users = updatedUsers;
    login(user);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    $("authError").textContent =
      "Account not found. Please create an account.";
    return;
  }

  // Password is intentionally NOT checked.
  // This is a demonstration of the login interface only.
  login(user);
});

function makeId() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2);
}

function login(user) {
  currentUser = user;
  sessionStorage.setItem(SESSION_KEY, user.id);

  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();

  $("profileAvatar").textContent = initials;
  $("topAvatar").textContent = initials.charAt(0);
  $("profileName").textContent = user.name;
  $("profileReg").textContent = user.reg;
  $("welcomeTitle").textContent =
    `Welcome, ${user.name.split(" ")[0]} 👋`;

  $("studentName").value = user.name;
  $("studentReg").value = user.reg;

  showPage("dashboard");
}

function logout() {
  currentUser = null;
  selectedSeat = null;
  sessionStorage.removeItem(SESSION_KEY);
  $("app").classList.add("hidden");
  $("authScreen").classList.remove("hidden");
  $("authForm").reset();
  switchAuth("login");
}

$("logoutBtn").addEventListener("click", logout);

function restoreSession() {
  const id = sessionStorage.getItem(SESSION_KEY);
  const user = users.find(u => u.id === id);
  if (user) login(user);
}

// NAVIGATION

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageId
    );
  });

  const titles = {
    dashboard: "Dashboard",
    booking: "Book a Seat",
    history: "My Bookings",
    admin: "Admin Demo"
  };

  $("pageTitle").textContent = titles[pageId];
  $("sidebar").classList.remove("open");

  renderAll();
  window.scrollTo(0, 0);
}

document.querySelectorAll(".nav-btn").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

document.querySelectorAll(".go-booking").forEach(button => {
  button.addEventListener("click", () => showPage("booking"));
});

$("menuBtn").addEventListener("click", () => {
  $("sidebar").classList.toggle("open");
});

// SEAT SELECTION

function selectedDate() {
  return $("bookingDate").value;
}

function selectedSlot() {
  return $("bookingSlot").value;
}

function seatBooked(number, date, slot) {
  return bookings.some(booking =>
    booking.seat === number &&
    booking.date === date &&
    booking.slot === slot &&
    statusOf(booking) === "active"
  );
}

function renderSeats() {
  $("quietSeats").replaceChildren();
  $("digitalSeats").replaceChildren();

  const date = selectedDate();
  const slot = selectedSlot();

  for (let number = 1; number <= TOTAL_SEATS; number++) {
    const occupied = date && slot
      ? seatBooked(number, date, slot)
      : false;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "seat";

    if (occupied) {
      button.classList.add("occupied");
      button.disabled = true;
    }

    if (selectedSeat === number && !occupied) {
      button.classList.add("selected");
    }

    const icon = document.createElement("span");
    icon.className = "seat-icon";
    icon.textContent = "▣";

    const label = document.createElement("span");
    label.className = "seat-number";
    label.textContent = "S" + String(number).padStart(2, "0");

    button.append(icon, label);
    button.setAttribute(
      "aria-label",
      `Seat ${number}, ${occupied ? "booked" : "available"}`
    );

    button.addEventListener("click", () => {
      if (!date || !slot) {
        toast("Select a date and time slot first.");
        return;
      }

      if (seatBooked(number, date, slot)) {
        toast("This seat is already booked.");
        return;
      }

      selectedSeat = number;
      renderSeats();
    });

    const container = number <= 20
      ? $("quietSeats")
      : $("digitalSeats");

    container.appendChild(button);
  }

  $("selectedSeatLabel").textContent = selectedSeat
    ? "Seat S" + String(selectedSeat).padStart(2, "0")
    : "None";

  $("selectedZoneLabel").textContent = !selectedSeat
    ? "Choose a seat from the map"
    : selectedSeat <= 20
      ? "Quiet Study Zone"
      : "Digital Learning Zone";
}

$("bookingDate").addEventListener("change", () => {
  selectedSeat = null;
  renderAll();
});

$("bookingSlot").addEventListener("change", () => {
  selectedSeat = null;
  renderAll();
});

// CREATE RESERVATION

$("bookingForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!currentUser) {
    toast("Please sign in first.");
    return;
  }

  expireBookings();

  const date = selectedDate();
  const slot = selectedSlot();

  if (!date || !slot || selectedSeat === null) {
    toast("Choose a date, time slot and available seat.");
    return;
  }

  if (date < todayString()) {
    toast("You cannot reserve a past date.");
    return;
  }

  const start = new Date(
    `${date}T${slot.split("-")[0]}:00`
  ).getTime();

  if (!Number.isFinite(start) || start <= Date.now()) {
    toast("This time slot has already started.");
    return;
  }

  if (seatBooked(selectedSeat, date, slot)) {
    toast("This seat is already reserved.");
    selectedSeat = null;
    renderSeats();
    return;
  }

  const duplicate = bookings.some(booking =>
    booking.userId === currentUser.id &&
    booking.date === date &&
    booking.slot === slot &&
    statusOf(booking) === "active"
  );

  if (duplicate) {
    toast("You already have a booking for this time slot.");
    return;
  }

  const booking = {
    id: "SS-" + makeId().slice(0, 8).toUpperCase(),
    userId: currentUser.id,
    name: currentUser.name,
    reg: currentUser.reg,
    seat: selectedSeat,
    date,
    slot,
    status: "active",
    createdAt: new Date().toISOString()
  };

  bookings.push(booking);

  if (!saveBookings()) {
    bookings.pop();
    return;
  }

  showConfirmation(booking);
  selectedSeat = null;
  $("bookingSlot").value = "";
  renderAll();
});

// BOOKING CONFIRMATION

function showConfirmation(booking) {
  const container = $("confirmationDetails");
  container.replaceChildren();

  const details = [
    ["Booking ID", booking.id],
    ["Student", booking.name],
    ["Seat", "S" + String(booking.seat).padStart(2, "0")],
    ["Date", booking.date],
    ["Time", SLOTS[booking.slot]]
  ];

  details.forEach(([label, value]) => {
    const line = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = label + ": ";
    line.append(strong, document.createTextNode(value));
    container.appendChild(line);
  });

  $("successModal").classList.add("show");
}

$("closeModal").addEventListener("click", () => {
  $("successModal").classList.remove("show");
  showPage("dashboard");
});

// CANCEL RESERVATION

function cancelBooking(id) {
  const booking = bookings.find(b => b.id === id);

  if (!booking || statusOf(booking) !== "active") {
    toast("This booking cannot be cancelled.");
    return;
  }

  if (!confirm("Cancel reservation " + id + "?")) {
    return;
  }

  booking.status = "cancelled";
  saveBookings();
  renderAll();
  toast("Booking cancelled. Seat released.");
}

// TABLE UTILITIES

function addCell(row, text) {
  const td = document.createElement("td");
  td.textContent = text;
  row.appendChild(td);
}

function addStatus(row, status) {
  const td = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = "status " + status;
  badge.textContent =
    status.charAt(0).toUpperCase() + status.slice(1);
  td.appendChild(badge);
  row.appendChild(td);
}

function addAction(row, booking) {
  const td = document.createElement("td");

  if (statusOf(booking) === "active") {
    const button = document.createElement("button");
    button.className = "cancel-btn";
    button.textContent = "Cancel";
    button.addEventListener("click", () => {
      cancelBooking(booking.id);
    });
    td.appendChild(button);
  } else {
    td.textContent = "—";
  }

  row.appendChild(td);
}

function emptyRow(body, count, message) {
  const row = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = count;
  td.className = "empty";
  td.textContent = message;
  row.appendChild(td);
  body.appendChild(row);
}

// PERSONAL BOOKING HISTORY

function renderHistory() {
  const body = $("historyBody");
  body.replaceChildren();

  if (!currentUser) return;

  const mine = bookings
    .filter(b => b.userId === currentUser.id)
    .slice()
    .reverse();

  $("historyCount").textContent =
    mine.length + " BOOKINGS";

  if (mine.length === 0) {
    emptyRow(body, 6, "No bookings yet. Book your first seat!");
    return;
  }

  mine.forEach(booking => {
    const row = document.createElement("tr");

    addCell(row, booking.id);
    addCell(row, "S" + String(booking.seat).padStart(2, "0"));
    addCell(row, booking.date);
    addCell(row, SLOTS[booking.slot]);
    addStatus(row, statusOf(booking));
    addAction(row, booking);

    body.appendChild(row);
  });
}

// DASHBOARD

function dashboardSlot() {
  const now = new Date();
  const time = now.getHours() * 60 + now.getMinutes();

  return Object.keys(SLOTS).find(slot => {
    const [start, end] = slot.split("-");
    const toMinutes = value => {
      const [h, m] = value.split(":").map(Number);
      return h * 60 + m;
    };
    return time >= toMinutes(start) && time < toMinutes(end);
  }) || null;
}

function renderDashboard() {
  const today = todayString();
  const slot = dashboardSlot();

  const occupied = new Set();

  if (slot) {
    bookings.forEach(booking => {
      if (
        booking.date === today &&
        booking.slot === slot &&
        statusOf(booking) === "active"
      ) {
        occupied.add(booking.seat);
      }
    });
  }

  $("statTotal").textContent = TOTAL_SEATS;
  $("statOccupied").textContent = occupied.size;
  $("statAvailable").textContent =
    TOTAL_SEATS - occupied.size;

  const mine = currentUser
    ? bookings.filter(b =>
        b.userId === currentUser.id &&
        statusOf(b) === "active"
      )
    : [];

  $("statMine").textContent = mine.length;

  const upcoming = mine
    .filter(b => endTime(b) > Date.now())
    .sort((a, b) => startTime(a) - startTime(b))[0];

  const box = $("nextBooking");
  box.replaceChildren();

  if (!upcoming) {
    box.textContent =
      "No upcoming reservation. Book a seat to get started.";
    return;
  }

  const strong = document.createElement("strong");
  strong.textContent =
    "Seat S" + String(upcoming.seat).padStart(2, "0");

  box.append(
    strong,
    document.createTextNode(
      ` · ${upcoming.date} · ${SLOTS[upcoming.slot]}`
    )
  );
}

// ADMIN DEMO

function renderAdmin() {
  const body = $("adminBody");
  body.replaceChildren();

  $("adminTotal").textContent = bookings.length;
  $("adminActive").textContent =
    bookings.filter(b => statusOf(b) === "active").length;
  $("adminCompleted").textContent =
    bookings.filter(b => statusOf(b) === "completed").length;
  $("adminCancelled").textContent =
    bookings.filter(b => statusOf(b) === "cancelled").length;

  if (bookings.length === 0) {
    emptyRow(body, 7, "No reservations recorded yet.");
    return;
  }

  [...bookings].reverse().forEach(booking => {
    const row = document.createElement("tr");

    addCell(row, booking.id);
    addCell(row, booking.name);
    addCell(row, booking.reg);
    addCell(row, "S" + String(booking.seat).padStart(2, "0"));
    addCell(row, booking.date);
    addStatus(row, statusOf(booking));
    addAction(row, booking);

    body.appendChild(row);
  });
}

$("refreshAdmin").addEventListener("click", renderAll);

// RENDER EVERYTHING

function renderAll() {
  expireBookings();
  renderSeats();
  renderDashboard();
  renderHistory();
  renderAdmin();
}

// INITIAL SETUP

$("todayLabel").textContent =
  new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

$("bookingDate").min = todayString();
$("bookingDate").value = todayString();

switchAuth("login");
restoreSession();
renderAll();

// Check expired bookings every 30 seconds.
setInterval(renderAll, 30000);

console.log("SeatSync is ready!");