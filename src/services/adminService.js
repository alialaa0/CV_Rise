import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

const submissionsRef = collection(
  db,
  "submissions"
);


// ===============================
// GET ALL SUBMISSIONS
// ===============================

export async function getSubmissions() {
  const q = query(
    submissionsRef,
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}


// ===============================
// GET ONE SUBMISSION
// ===============================

export async function getSubmission(id) {
  const ref = doc(
    db,
    "submissions",
    id
  );

  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error("Submission not found");
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}


// ===============================
// SAVE FINAL CV
// ===============================

export async function saveFinalCV(
  id,
  finalData,
  reviewerName
) {
  const ref = doc(
    db,
    "submissions",
    id
  );

  await updateDoc(ref, {
    finalData,

    reviewerName,

    status: "in_review",

    updatedAt:
      serverTimestamp(),
  });
}


// ===============================
// START REVIEW
// ===============================

export async function startReview(
  id,
  reviewerName
) {
  const ref = doc(
    db,
    "submissions",
    id
  );

  await updateDoc(ref, {
    status: "in_review",

    reviewerName,

    reviewStartedAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  });
}


// ===============================
// MARK READY TO SEND
// ===============================

export async function markReadyToSend(
  id,
  finalData,
  reviewerName
) {
  const ref = doc(
    db,
    "submissions",
    id
  );

  await updateDoc(ref, {
    finalData,

    status: "ready_to_send",

    reviewerName,

    reviewedAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  });
}


// ===============================
// MARK AS SENT
// ===============================

export async function markAsSent(id) {
  const ref = doc(
    db,
    "submissions",
    id
  );

  await updateDoc(ref, {
    status: "sent",

    sentAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  });
}


// ===============================
// SAVE SOURCE CV DATA
// ===============================

export async function saveSourceCV(
  id,
  sourceField,
  sourceData,
  reviewerName
) {
  const allowedFields = [
    "rawData",
    "aiData",
    "finalData",
  ];

  if (!allowedFields.includes(sourceField)) {
    throw new Error("Unsupported CV source");
  }

  if (sourceField === "finalData") {
    await saveFinalCV(
      id,
      sourceData,
      reviewerName
    );
    return;
  }

  const ref = doc(
    db,
    "submissions",
    id
  );

  await updateDoc(ref, {
    [sourceField]: sourceData,

    reviewerName,

    updatedAt:
      serverTimestamp(),
  });
}
