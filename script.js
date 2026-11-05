"use strict";

// FIREBASE IMPORTS
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  runTransaction,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// STEP A: REPLACE THIS WITH YOUR NOTEPAD CONFIGURATION
 const firebaseConfig = {
    apiKey: "AIzaSyD-a62SrUwD2uCIzyw1pVIB44mcQoChCdo",
    authDomain: "seatsync-library-booking-ae69d.firebaseapp.com",
    projectId: "seatsync-library-booking-ae69d",
    storageBucket: "seatsync-library-booking-ae69d.firebasestorage.app",
    messagingSenderId: "346762694629",
    appId: "1:346762694629:web:9acffcdcbe6dea6111a90c",
    measurementId: "G-Y2S64TP1D0"
  };

// INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// APP STATE
const TOTAL_SEATS = 40;
const SLOTS = {
  "09:00-11:00": "09:00 AM – 11:00 AM",
  "11:00-13:00": "11:00 AM – 01:00 PM",
  "13:00-15:00": "01:00 PM – 03:00 PM",
  "15:00-17:00": "03:00 PM – 05:00 PM",
  "17:00-19:00": "05:00 PM – 07:00 PM"
};

let currentUser = null;
let bookings = [];
let selectedSeat = null;
let authMode = "login";
let unsubscribeBookings = null;
let toastTimer;

function $(id) {
  return document.getElementById(id);
}

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function seatCode(number) {
  return "S" + String(number).padStart(2, "0");
}

function slotStart(date, slot) {
  return new Date(`${date}T${slot.split("-")[0]}:00`);
}

function slotEnd(date, slot) {
  return new Date(`${date}T${slot.split("-")[1]}:00`);
}

function isActive(booking) {
  return booking.endAt?.toMillis() > Date.now();
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $("toast").classList.remove("show");
  }, 3500);
}

function friendlyError(error) {
  const messages = {
    "auth/email-already-in-use": "Email is already registered.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Choose a stronger password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "permission-denied": "Firebase permission denied. Check Firestore rules."
  };

  return messages[error.code] ||
    messages[error.code?.replace("firestore/", "")] ||
    error.message ||
    "Something went wrong.";
}

// AUTHENTICATION TABS
function switchAuth(mode) {
  authMode = mode;
  const register = mode === "register";

  $("registerFields").hidden = !register;
  $("authName").required = register;
  $("authReg").required = register;

  $("authHeading").textContent =
    register ? "Create your account" : "Welcome back";

  $("authDescription").textContent = register
    ? "Register to reserve your library seat."
    : "Sign in to your SeatSync dashboard.";

  $("authSubmit").textContent =
    register ? "Create Account →" : "Sign In →";

  $("loginTab").classList.toggle("active", !register);
  $("registerTab").classList.toggle("active", register);
  $("authError").textContent = "";
}

$("loginTab").addEventListener("click", () => switchAuth("login"));
$("registerTab").addEventListener("click", () => switchAuth("register"));

// REAL FIREBASE REGISTRATION AND LOGIN
$("authForm").addEventListener("submit", async event => {
  event.preventDefault();

  const email = $("authEmail").value.trim().toLowerCase();
  const password = $("authPassword").value;
  const button = $("authSubmit");

  button.disabled = true;
  $("authError").textContent = "";

  try {
    if (authMode === "register") {
      const name = $("authName").value.trim();
      const reg = $("authReg").value.trim();

      if (!name || !reg) {
        throw new Error("Enter your name and registration number.");
      }

      const credential = await createUserWithEmailAndPassword(
        auth, email, password
      );

      await setDoc(doc(db, "users", credential.user.uid), {
        name,
        reg,
        email,
        createdAt: serverTimestamp()
      });

      toast("Account created successfully!");
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      toast("Welcome back!");
    }
  } catch (error) {
    $("authError").textContent = friendlyError(error);
  } finally {
    button.disabled = false;
  }
});

// AUTHENTICATION STATE
onAuthStateChanged(auth, async firebaseUser => {
  if (unsubscribeBookings) {
    unsubscribeBookings();
    unsubscribeBookings = null;
  }

  if (!firebaseUser) {
    currentUser = null;
    bookings = [];
    selectedSeat = null;

    $("app").classList.add("hidden");
    $("authScreen").classList.remove("hidden");
    return;
  }

  try {
    const profile = await getDoc(doc(db, "users", firebaseUser.uid));

    if (!profile.exists()) {
      $("authError").textContent =
        "Student profile not ready. Please try signing in again.";
      return;
    }

    if (auth.currentUser?.uid !== firebaseUser.uid) return;

    currentUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      ...profile.data()
    };

    openDashboard();
    listenForBookings();
  } catch (error) {
    toast(friendlyError(error));
  }
});

function openDashboard() {
  const name = currentUser.name;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();

  $("profileAvatar").textContent = initials;
  $("topAvatar").textContent = initials.charAt(0);
  $("profileName").textContent = name;
  $("profileReg").textContent = currentUser.reg;

  $("welcomeTitle").textContent =
    `Welcome, ${name.split(" ")[0]} 👋`;

  $("studentName").value = name;
  $("studentReg").value = currentUser.reg;

  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");

  // Admin demo is not a protected admin system.
  // Hide it until proper admin roles are implemented.
  const adminButton = document.querySelector(
    '.nav-btn[data-page="admin"]'
  );
  if (adminButton) adminButton.hidden = true;

  showPage("dashboard");
}

$("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    $("authForm").reset();
    switchAuth("login");
    toast("Signed out successfully.");
  } catch (error) {
    toast(friendlyError(error));
  }
});

// NAVIGATION
function showPage(pageId) {
  if (pageId === "admin") {
    toast("Admin access is not configured yet.");
    return;
  }

  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle(
      "active", button.dataset.page === pageId
    );
  });

  const titles = {
    dashboard: "Dashboard",
    booking: "Book a Seat",
    history: "My Bookings"
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

// REAL-TIME FIRESTORE LISTENER
function listenForBookings() {
  unsubscribeBookings = onSnapshot(
    collection(db, "bookings"),
    snapshot => {
      bookings = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));
      renderAll();
    },
    error => {
      toast("Unable to load seats: " + friendlyError(error));
    }
  );
}

function seatBooked(number, date, slot) {
  return bookings.some(b =>
    b.seat === seatCode(number) &&
    b.date === date &&
    b.slot === slot &&
    isActive(b)
  );
}

// SEAT MAP
function renderSeats() {
  $("quietSeats").replaceChildren();
  $("digitalSeats").replaceChildren();

  const date = $("bookingDate").value;
  const slot = $("bookingSlot").value;

  if (
    selectedSeat !== null &&
    seatBooked(selectedSeat, date, slot)
  ) {
    selectedSeat = null;
  }

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
    label.textContent = seatCode(number);

    button.append(icon, label);

    button.addEventListener("click", () => {
      if (!date || !slot) {
        toast("First select a date and time slot.");
        return;
      }

      if (slotStart(date, slot) <= new Date()) {
        toast("Choose a future time slot.");
        return;
      }

      selectedSeat = number;
      renderSeats();
    });

    (number <= 20
      ? $("quietSeats")
      : $("digitalSeats")
    ).appendChild(button);
  }

  $("selectedSeatLabel").textContent =
    selectedSeat === null
      ? "None"
      : `Seat ${seatCode(selectedSeat)}`;

  $("selectedZoneLabel").textContent =
    selectedSeat === null
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

// FIRESTORE TRANSACTION: PREVENT DOUBLE BOOKING
$("bookingForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser) {
    toast("Please sign in.");
    return;
  }

  const date = $("bookingDate").value;
  const slot = $("bookingSlot").value;
  const seat = selectedSeat;

  if (!date || !SLOTS[slot] || seat === null) {
    toast("Choose a date, time slot and seat.");
    return;
  }

  const start = slotStart(date, slot);
  const end = slotEnd(date, slot);

  if (start <= new Date()) {
    toast("You cannot book a past time slot.");
    return;
  }

  const code = seatCode(seat);
  const bookingId = `${date}_${slot}_${code}`;
  const bookingRef = doc(db, "bookings", bookingId);
  console.log("SEATSYNC BOOKING DEBUG", {
  loggedIn: !!auth.currentUser,
  userId: auth.currentUser?.uid,
  bookingId,
  seat: code,
  date,
  slot,
  start: start.toISOString(),
  end: end.toISOString(),
  currentTime: new Date().toISOString()
});

  try {
    await runTransaction(db, async transaction => {
      const existing = await transaction.get(bookingRef);

      if (existing.exists()) {
        throw new Error("This seat has already been booked.");
      }

      transaction.set(bookingRef, {
        userId: currentUser.uid,
        name: currentUser.name,
        reg: currentUser.reg,
        seat: code,
        date,
        slot,
        status: "active",
        startAt: Timestamp.fromDate(start),
        endAt: Timestamp.fromDate(end),
        createdAt: serverTimestamp()
      });
    });

    showConfirmation({
      id: bookingId,
      seat: code,
      date,
      slot,
      name: currentUser.name
    });

    selectedSeat = null;
    $("bookingSlot").value = "";
    renderAll();
  } catch (error) {
    toast(friendlyError(error));
    renderAll();
  }
});

// CONFIRMATION MODAL
function showConfirmation(booking) {
  const box = $("confirmationDetails");
  box.replaceChildren();

  const details = [
    ["Booking ID", booking.id],
    ["Student", booking.name],
    ["Seat", booking.seat],
    ["Date", booking.date],
    ["Time", SLOTS[booking.slot]]
  ];

  details.forEach(([label, value]) => {
    const line = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = label + ": ";
    line.append(strong, document.createTextNode(value));
    box.appendChild(line);
  });

  $("successModal").classList.add("show");
}

$("closeModal").addEventListener("click", () => {
  $("successModal").classList.remove("show");
  showPage("dashboard");
});

// CANCEL BOOKING
async function cancelBooking(id) {
  const booking = bookings.find(b => b.id === id);

  if (!booking || booking.userId !== currentUser?.uid) {
    toast("You cannot cancel this booking.");
    return;
  }

  if (!isActive(booking)) {
    toast("This booking has already finished.");
    return;
  }

  if (!confirm("Cancel this seat reservation?")) return;

  try {
    // Deleting releases the seat for another student.
    await deleteDoc(doc(db, "bookings", id));
    toast("Reservation cancelled. Seat is available again.");
  } catch (error) {
    toast(friendlyError(error));
  }
}

// TABLE HELPERS
function addCell(row, value) {
  const td = document.createElement("td");
  td.textContent = value;
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

  if (isActive(booking)) {
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

// MY BOOKINGS
function renderHistory() {
  const body = $("historyBody");
  body.replaceChildren();

  if (!currentUser) return;

  const mine = bookings
    .filter(b => b.userId === currentUser.uid)
    .sort((a, b) =>
      b.startAt.toMillis() - a.startAt.toMillis()
    );

  $("historyCount").textContent =
    mine.length + " BOOKINGS";

  if (mine.length === 0) {
    const row = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.className = "empty";
    td.textContent = "No reservations yet.";
    row.appendChild(td);
    body.appendChild(row);
    return;
  }

  mine.forEach(booking => {
    const row = document.createElement("tr");

    addCell(row, booking.id);
    addCell(row, booking.seat);
    addCell(row, booking.date);
    addCell(row, SLOTS[booking.slot]);
    addStatus(row, isActive(booking) ? "active" : "completed");
    addAction(row, booking);

    body.appendChild(row);
  });
}

// DASHBOARD
function currentSlot() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();

  return Object.keys(SLOTS).find(slot => {
    const [start, end] = slot.split("-");

    const convert = value => {
      const [h, m] = value.split(":").map(Number);
      return h * 60 + m;
    };

    return minutes >= convert(start) &&
      minutes < convert(end);
  }) || null;
}

function renderDashboard() {
  const slot = currentSlot();
  const date = todayString();

  const occupied = new Set();

  bookings.forEach(b => {
    if (
      slot &&
      b.date === date &&
      b.slot === slot &&
      isActive(b)
    ) {
      occupied.add(b.seat);
    }
  });

  $("statTotal").textContent = TOTAL_SEATS;
  $("statOccupied").textContent = occupied.size;
  $("statAvailable").textContent =
    TOTAL_SEATS - occupied.size;

  const mine = bookings.filter(b =>
    b.userId === currentUser?.uid && isActive(b)
  );

  $("statMine").textContent = mine.length;

  const upcoming = [...mine].sort((a, b) =>
    a.startAt.toMillis() - b.startAt.toMillis()
  )[0];

  const box = $("nextBooking");
  box.replaceChildren();

  if (!upcoming) {
    box.textContent =
      "No upcoming reservations. Book your first seat!";
    return;
  }

  const strong = document.createElement("strong");
  strong.textContent = upcoming.seat;

  box.append(
    strong,
    document.createTextNode(
      ` · ${upcoming.date} · ${SLOTS[upcoming.slot]}`
    )
  );
}

// ADMIN DEMO DISABLED UNTIL ROLE-BASED ACCESS EXISTS
function renderAdmin() {
  $("adminTotal").textContent = "—";
  $("adminActive").textContent = "—";
  $("adminCompleted").textContent = "—";
  $("adminCancelled").textContent = "—";
  $("adminBody").replaceChildren();
}

$("refreshAdmin").addEventListener("click", () => {
  toast("Admin dashboard requires administrator permissions.");
});

// REFRESH
function renderAll() {
  renderSeats();
  renderDashboard();
  renderHistory();
  renderAdmin();
}

// STARTUP
$("todayLabel").textContent =
  new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

$("bookingDate").min = todayString();
$("bookingDate").value = todayString();

switchAuth("login");
renderAll();

setInterval(() => {
  $("bookingDate").min = todayString();
  if (currentUser) renderAll();
}, 30000);

console.log("SeatSync Firebase initialized");