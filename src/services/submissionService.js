import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

export async function createSubmission(candidateData) {
  const submission = {
    rawData: candidateData,

    status: "new",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),

    workflow: {
      mode: null,
      templateId: null,
    },

    aiData: null,
    finalData: null,
    generatedDocument: null,
  };

  const docRef = await addDoc(
    collection(db, "submissions"),
    submission
  );

  return docRef.id;
}