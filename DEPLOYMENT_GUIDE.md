# TeamSync Deployment Guide

This guide explains how to take this application from a local demo to a live link you can share with your HR team.

## Phase 1: Hosting the Frontend (Free)

You can host this application for free using **Vercel** or **Netlify**.

1.  **Push code to GitHub**:
    *   Create a repository on GitHub.
    *   Push all these files to the repository.

2.  **Deploy on Vercel**:
    *   Go to [vercel.com](https://vercel.com) and sign up.
    *   Click "Add New Project" -> "Import" your GitHub repository.
    *   **Important**: In the "Environment Variables" section, add your Google Gemini API Key:
        *   Name: `API_KEY`
        *   Value: `your-google-api-key-here`
    *   Click "Deploy".
    *   Vercel will give you a URL (e.g., `teamsync.vercel.app`).

## Phase 2: Connecting a Database (Required for Team usage)

Currently, the app uses LocalStorage. To allow HR to see what employees submit, you need a shared database. We will use **Firebase (Firestore)** as it is free and easy.

### Step 1: Set up Firebase
1.  Go to [firebase.google.com](https://firebase.google.com) and create a project.
2.  Go to "Build" -> "Firestore Database" -> "Create Database".
3.  Start in **Test Mode** (allows read/write for development).

### Step 2: Install Firebase in your project
If you are developing locally:
```bash
npm install firebase
```

### Step 3: Create a Configuration File
Create a new file `services/firebaseConfig.ts`:
```typescript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### Step 4: Update `storageService.ts`
Replace the simulated content in `services/storageService.ts` with real Firestore calls.

**Example Replacement for `saveTimesheet`:**
```typescript
import { doc, setDoc } from "firebase/firestore"; 
import { db } from "./firebaseConfig";

export const saveTimesheet = async (timesheet: Timesheet) => {
  // Save to collection 'timesheets' with the ID as the document name
  await setDoc(doc(db, "timesheets", timesheet.id), timesheet);
  return timesheet;
};
```

**Example Replacement for `getAllTimesheets`:**
```typescript
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";

export const getAllTimesheets = async () => {
  const querySnapshot = await getDocs(collection(db, "timesheets"));
  return querySnapshot.docs.map(doc => doc.data() as Timesheet);
};
```

## Phase 3: Sharing with HR

1.  Once deployed and the database is connected, copy your Vercel URL.
2.  Send the link to your HR team.
3.  Instruct them to click "HR Portal" in the top right.
4.  Instruct employees to enter their Name and start filling.

**Note on Security**:
For a real company, you should implement Authentication (Login). Firebase Auth is great for this. Currently, anyone with the link can access the HR portal.
