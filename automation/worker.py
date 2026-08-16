import firebase_admin

from firebase_admin import credentials
from firebase_admin import firestore

from ai_service import generate_cv


SERVICE_ACCOUNT = "serviceAccountKey.json"


def initialize_firebase():
    cred = credentials.Certificate(
        SERVICE_ACCOUNT
    )

    firebase_admin.initialize_app(cred)

    return firestore.client()


def get_new_submissions(db):
    submissions_ref = db.collection(
        "submissions"
    )

    docs = (
        submissions_ref
        .where(
            filter=firestore.FieldFilter(
                "status",
                "==",
                "new",
            )
        )
        .stream()
    )

    return list(docs)


def process_submission(db, doc):
    data = doc.to_dict()

    raw_data = data.get(
        "rawData",
        {}
    )

    print("\n==============================")
    print(
        "Processing submission:",
        doc.id
    )

    personal = raw_data.get(
        "personal",
        {}
    )

    print(
        "Candidate:",
        personal.get("fullName")
    )

    print(
        "Target:",
        personal.get("targetTitle")
    )

    # --------------------------------
    # Mark as processing
    # --------------------------------

    doc.reference.update({
        "status": "processing",
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })

    try:

        print("Generating CV with Groq...")

        ai_data = generate_cv(
            raw_data
        )

        print("AI generation completed.")

        # --------------------------------
        # Save AI result
        # --------------------------------

        doc.reference.update({
            "aiData": ai_data,
            "status": "ai_generated",
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })

        print(
            "AI data saved successfully."
        )

    except Exception as error:

        print(
            "AI generation failed:",
            error
        )

        doc.reference.update({
            "status": "ai_failed",
            "aiError": str(error),
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })


def main():

    print(
        "Starting CV RISE AI worker..."
    )

    db = initialize_firebase()

    submissions = get_new_submissions(
        db
    )

    print(
        f"Found {len(submissions)} "
        "new submission(s)."
    )

    for doc in submissions:

        process_submission(
            db,
            doc
        )


if __name__ == "__main__":
    main()