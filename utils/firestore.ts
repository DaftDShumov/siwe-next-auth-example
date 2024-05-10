import { Firestore } from "@google-cloud/firestore";

export const firestore = new Firestore({
  projectId: process.env.FIRESTORE_PROJECT_ID,
  databaseId: process.env.FIRESTORE_DATABASE_ID,
  credentials: { 
    client_email: process.env.FIRESTORE_CLIENT_EMAIL, 
    private_key: process.env.FIRESTORE_PRIVATE_KEY 
  },
});
