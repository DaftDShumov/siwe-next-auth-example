import { firestore } from "./firestore";

interface SessionData {
  address: string;
  token: string;
}

export async function updateSession(telegramId: string, address: string, token: string) {
  const sessions = firestore.collection("sessions")
  const sessionData = (await sessions.doc(telegramId).get()).data() as SessionData
  sessionData.address = address
  sessionData.token = token
  await sessions.doc(telegramId).set(sessionData)
}
