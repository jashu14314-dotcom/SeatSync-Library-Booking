📚 SeatSync — Smart Library Seat Booking System

A Smart, Secure & Real-Time Library Seat Reservation Platform

SeatSync is a modern, responsive web application designed to simplify library seat reservations for students. It enables users to register, log in, check seat availability, book study spaces, and manage reservations through an interactive dashboard.

The application integrates Firebase Authentication and Cloud Firestore for secure user authentication and cloud-based booking management.

Developed as an academic project for Lovely Professional University (LPU).

---

🌟 Project Overview

Traditional library seat allocation can be time-consuming and inconvenient. Students may struggle to identify available study spaces, especially during busy academic periods.

SeatSync provides a digital solution where students can reserve their preferred library seats in advance, reducing manual coordination and improving the overall library experience.

🎯 Objectives

- Digitize the library seat reservation process.
- Provide an intuitive and responsive booking interface.
- Allow students to select preferred seats and time slots.
- Store booking information using Firebase Cloud Firestore.
- Prevent duplicate reservations for the same seat and time slot.
- Enable students to view and manage their reservations.

---

✨ Key Features

🔐 Student Authentication

- Student registration and login.
- Firebase Authentication integration.
- User-specific access to booking functionality.
- Logout functionality.

📊 Interactive Dashboard

- Modern dashboard interface.
- Seat availability overview.
- Library zone information.
- Reservation statistics.

💺 Smart Seat Booking

- Interactive selection from 40 library seats.
- Quiet Study Zone and Digital Learning Zone.
- Available and occupied seat indicators.
- Date and time-slot selection.
- Booking confirmation.

📅 Reservation Management

- View booking history.
- Track active reservations.
- Cancel eligible reservations.
- Prevent duplicate seat reservations.

☁️ Firebase Integration

- Firebase Authentication for account management.
- Cloud Firestore for booking records.
- Firestore Security Rules for controlled data access.
- Shared cloud-based reservation data.

📱 Responsive User Interface

- Clean, modern dashboard design.
- Responsive layout for desktop and mobile screens.
- Easy navigation and user-friendly forms.

---

🛠️ Technology Stack

Technology| Purpose
HTML5| Website structure
CSS3| Styling and responsive layout
JavaScript| Application logic and interactivity
Firebase Authentication| User registration and login
Cloud Firestore| Cloud database for reservations
GitHub| Source code hosting and version control
Vercel| Website deployment

---

🏗️ System Architecture

             STUDENT
                |
                v
        SEATSYNC WEBSITE
       HTML + CSS + JavaScript
                |
        +-------+-------+
        |               |
        v               v
 FIREBASE AUTH     CLOUD FIRESTORE
        |               |
  Login / Signup   Booking Records
        |               |
        +-------+-------+
                |
                v
       STUDENT DASHBOARD
                |
                v
       LIBRARY SEAT BOOKING

---

📁 Project Structure

SeatSync-Library-Booking/
│
├── index.html       # Website structure
├── style.css        # User interface styling
├── script.js        # Application logic and Firebase integration
└── README.md        # Project documentation

---

⚙️ Installation and Setup

1. Clone the Repository

git clone https://github.com/jashu14314-dotcom/SeatSync-Library-Booking.git

2. Open the Project

Open the project folder using Visual Studio Code.

3. Configure Firebase

1. Create a project in Firebase Console.
2. Register a web application.
3. Enable the required Firebase Authentication sign-in methods.
4. Create a Cloud Firestore database.
5. Configure Firestore Security Rules.
6. Add your Firebase web configuration to the JavaScript application.

4. Run the Application

Use a local development server, such as the VS Code Live Server extension, to open the website.

5. Deploy

Import the GitHub repository into Vercel and deploy it as a static web application.

Add the deployed website domain to Firebase Authentication's authorized domains if required.

---

📖 How to Use SeatSync

1. Open the SeatSync website.
2. Register a student account or log in.
3. Navigate to the dashboard.
4. Select Book a Seat.
5. Choose an available seat from the library layout.
6. Enter the required reservation details.
7. Select the booking date and time slot.
8. Click Confirm Reservation.
9. View the reservation under My Bookings.
10. Cancel the reservation when necessary.

---

⏰ Available Booking Slots

Slot| Time
1| 09:00 AM – 11:00 AM
2| 11:00 AM – 01:00 PM
3| 01:00 PM – 03:00 PM
4| 03:00 PM – 05:00 PM
5| 05:00 PM – 07:00 PM

Total seats: 40

Library zones: Quiet Study Zone and Digital Learning Zone.

---

🔒 Security

SeatSync uses Firebase Authentication to identify signed-in users and Firestore Security Rules to control database access.

The application is designed to associate reservations with authenticated user accounts and restrict unauthorized database operations.

Note: Firebase web configuration is client-side configuration, not a substitute for secure database rules. Authentication and Firestore rules must remain properly configured.

---

🚀 Future Enhancements

- QR-code-based seat check-in.
- Automatic booking reminders.
- Admin-controlled seat maintenance.
- Email notifications.
- Library resource and equipment reservations.
- Seat usage analytics.
- Waiting lists for fully booked time slots.
- Improved accessibility and mobile experience.

---

🎓 Academic Project Information

Project Name: SeatSync — Smart Library Seat Booking System

Project Category: Web Development / Library Management

Institution: Lovely Professional University (LPU)

Project Type: CA1 Academic Project

Deployment Platform: Vercel

Database: Firebase Cloud Firestore

---

🔗 Project Links

GitHub Repository:
https://github.com/jashu14314-dotcom/SeatSync-Library-Booking

Live Website:
https://seatsync-library-booking.vercel.app/

📝 Conclusion

SeatSync demonstrates how modern web technologies and cloud services can be combined to create a practical solution for library seat management.

By integrating student authentication, an interactive seat-selection interface, and Firebase-based reservation storage, the project provides a convenient and organized approach to booking study spaces.

---

⭐ Support

If you find this project useful, consider giving the repository a star on GitHub.

Built with ❤️ for smarter campus learning.
