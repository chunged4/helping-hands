# Helping Hands

## Project Overview

Helping Hands is a web application designed to connect volunteers with community service opportunities. It was developed as a senior project at California State University, Fullerton by Edison Chung.

## Features

-   User authentication (email/password and Google Sign-In)
-   Role-based access control (Volunteer, Coordinator, Member)
-   Event creation and management
-   Volunteer sign-up system
-   Notification system for event reminders and updates
-   Calendar view of upcoming events

## Technologies Used

-   Frontend: React.js
-   Backend: Firebase (Authentication, Firestore, Cloud Functions)

## Getting Started

### Prerequisites

-   Node.js (current version 21.6.1)
-   npm (current version 10.2.4)
-   Firebase account

### Installation

1. Clone the repository
    - git clone [https://github.com/chunged4/helping-hands.git](https://github.com/chunged4/helping-hands)
2. Navigate to the project directory
    - cd helping-hands
3. Install dependencies
    - npm install
4. Set up your Firebase configuration
    - Create a new project in Firebase Console
    - Enable Authentication and Firestore
    - Add your Firebase configuration to `src/config/firebase.config.js`
5. npm start

## Usage

1. Creating an Account:

    - Navigate to the sign-up page.
    - Choose to sign up with email/password or Google account.
    - Select your role (Volunteer, Coordinator, or Member).

2. For Volunteers:

    - Browse available events on the home page or calendar view.
    - Click on an event to view details.
    - Use the "Sign Up" button to join an event.

3. For Coordinators:

    - Create new events using the "Create Event" button.
    - Manage existing events (edit details, cancel events, etc.).
    - View all upcoming events.

4. For Members:

    - Request help for specific needs.

5. Notifications:
    - All users receive notifications for event reminders, updates, or responses to requests.
    - Access your notifications through the bell icon in the navigation bar.

## Project Structure

-   `/public`: Public assets and HTML template
-   `/src`: Source code of the application

    -   `/components`: Reusable React components
        -   `EventCard.jsx`: Component for displaying event information
        -   `EventModal.jsx`: A modal showing more event information and signup / unsignup capabilities
        -   `Navbar.jsx`: Navigation bar
        -   `NotificationCard.jsx`: Displays notification information
        -   `NotificationPopUp.jsx`: Displays all the notifications a user has as a notification card
        -   `PasswordRequirements.jsx`: Renders and checks as the user inputs their password
        -   `ProtectedRoute.jsx`: Makes sure other roles can not access other pages
        -   `RequirementCheckmark.jsx`: Checkmark or x
        -   `ShowPasswordIconButton.jsx`: Icon that toggles visibility for the password
        -   `ThankYouModal.jsx`: A modal that thanks the user
    -   `/config`: Configuration files
        -   `firebase.config.js`: Firebase configuration
    -   `/context`: React context files
        -   `AuthContext.js`: Manages authentication state and functions
    -   `/pages`: Main page components
        -   `Calendar.jsx`: Calendar view of events
        -   `CreateEvent.jsx`: Form that provides info to create event
        -   `EmailVerification.jsx`: Displays the info during email verification
        -   `HelpForm.jsx`: Form to send for help
        -   `Home.jsx`: Home page displaying events
        -   `Landing.jsx`: What the user sees when not logged in
        -   `LogIn.jsx`: Login the user
        -   `RoleSelection.jsx`: Provides roles for the user to choose from
        -   `SignUp.jsx`: Signs up the user
    -   `/styles`: CSS files for styling
    -   `/utils`: Utility functions and helpers

## Stretch Goals

-   Mobile Application: Develop an app version.
-   Volunteer Certification: Implement a system to verify and display qualifications.
-   Feedback System: Implement rating and review systems for events and volunteers.
-   Point System: Points and badges to encourage volunteer participation.
-   Language Support: Support for multiple languages.

## Acknowledgements

-   Special thanks to Advisor Bruce McKenzie for guidance and support throughout, as well as the extra time provided to complete the project.

## Contact

Edison Chung - edchungw4@gmail.com

Project Link: [https://github.com/chunged4/helping-hands](https://github.com/chunged4/helping-hands)
