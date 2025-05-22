# USS Negotiator

USS Negotiator is a modern web application designed to help users practice and improve their negotiation skills. It provides an interactive chat interface powered by AI, user authentication, negotiation templates, and analytics to track your progress.

## Features

- **AI-Powered Negotiation Chat:** Simulate real-world negotiations with an AI assistant that adapts to your strategy.
- **User Authentication:** Secure login, registration, password reset, and protected routes.
- **Negotiation Templates:** Predefined message templates for buying and selling scenarios.
- **Negotiation History:** Track and review your past negotiations and outcomes.
- **Analytics Dashboard:** Visualize your negotiation performance, savings, and success rate.
- **Customizable User Profile:** Manage your account settings and preferences.
- **Responsive Design:** Works seamlessly on desktop and mobile devices.

## Tech Stack

- **Frontend:** React, React Router, Styled Components, SCSS
- **Backend/API:** Express (for some endpoints), Firebase Firestore
- **Authentication:** Firebase Auth
- **AI Integration:** OpenAI API (for negotiation responses)
- **Charts:** Chart.js, Recharts

## Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- npm or yarn
- Firebase project (for Firestore and Auth)
- OpenAI API key

### Installation
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd uss_negotiator
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your Firebase and OpenAI credentials.
   - Example:
     ```env
     REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
     REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     REACT_APP_FIREBASE_PROJECT_ID=your_project_id
     REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     REACT_APP_FIREBASE_APP_ID=your_app_id
     REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
     REACT_APP_OPENAI_API_KEY=your_openai_api_key
     REACT_APP_API_URL=http://localhost:5000
     ```
4. **Start the development server:**
   ```bash
   npm start
   # or
   yarn start
   ```
   The app will be available at `http://localhost:3000`.

### Firestore Setup
- The app will automatically create required collections and indexes on first use.
- To manually trigger index creation, run the provided scripts or visit the admin panel if available.

## Usage
- **Register** for a new account or **log in** with your credentials.
- Start a new negotiation session from the dashboard.
- Use the chat interface to negotiate with the AI, using templates or your own messages.
- Review your negotiation history and analytics to track your improvement.
- Customize your profile and settings as needed.

## Project Structure
- `src/` - Main source code
  - `components/` - Reusable UI components
  - `pages/` - Main app pages (dashboard, negotiator, templates, etc.)
  - `services/` - API and Firebase service logic
  - `context/` - React context providers (auth, negotiation)
  - `data/` - Static data and templates
  - `styles/` - Global and component styles
  - `utils/` - Utility functions
  - `firebase/` - Firebase configuration

## Customization
- You can add or modify negotiation templates in `src/data/negotiationTemplates.js`.
- Update styles and themes in `src/styles/`.

## License
MIT

---

*For questions or contributions, please open an issue or submit a pull request.*
