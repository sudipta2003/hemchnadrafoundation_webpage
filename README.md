# Firebase integration (quick start)

This project is a static HTML/CSS/JS site. The repository now contains a small Firebase initialization module at `assets/js/firebase-init.js` that you can use to connect to Firestore for simple read/write operations.

What I added
- `assets/js/firebase-init.js` — an ES module that initializes Firebase (placeholder config) and exposes two helper functions on `window`:
  - `addMessage(name, text)` — writes a document to the `messages` collection
  - `getMessages()` — reads documents from `messages` ordered by creation time
- `index.html` — updated to load the module via `<script type="module" src="assets/js/firebase-init.js"></script>`

How to set up Firebase
1. Go to https://console.firebase.google.com and create (or open) a project.
2. In the project, enable **Firestore** (Database -> Create database). Choose test mode for initial testing, but update rules before production.
3. Register a Web app in Project settings -> Your apps -> Add app (</>) and copy the Firebase config (the Web SDK snippet).
4. Open `assets/js/firebase-init.js` and replace the placeholder values in the `firebaseConfig` object with the values from your app's config.

Testing locally
1. Start a simple static server in the project root. Example PowerShell commands:

   # If you have Node installed
   npx http-server . -p 8080

   # OR if you have Python installed
   python -m http.server 8080

2. Open `http://localhost:8080` in your browser. Open DevTools -> Console.
3. Run these commands in the console to test:

   // write
   addMessage('Alice','Hello from local site').then(id => console.log('doc id', id)).catch(console.error)

   // read
   getMessages().then(list => console.log(list)).catch(console.error)

Deployment (optional)
- You can deploy to Firebase Hosting: https://firebase.google.com/docs/hosting
  - Install the Firebase CLI: `npm install -g firebase-tools`
  - `firebase login`
  - `firebase init hosting` (choose your project and set the public directory to the project root or `.`)
  - `firebase deploy --only hosting`

Security & rules
- Do not leave your Firestore in test mode for production. Update rules to restrict writes/reads appropriately.
- The example helper functions are for quick testing. For production, implement proper auth and validation.

If you'd like, I can:
- Add a small UI (form + list) on the homepage to show messages live.
- Wire up Firebase Authentication (Google/Email) and show how to protect writes.

Tell me which of those follow-ups you want next.
