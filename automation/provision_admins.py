"""
CV Rise — Secure Server-side Admin Account Provisioning Script
Assigns custom claim {"admin": True} to authorized admin accounts via Firebase Admin SDK.
Never exposes service account keys or admin claims to frontend clients.
"""

import os
import sys
import json

try:
    import firebase_admin
    from firebase_admin import credentials, auth
except ImportError:
    print("Error: firebase-admin Python package is not installed.")
    print("Install it with: pip install firebase-admin")
    sys.exit(1)

# Authorized Admin Accounts Allowlist
ADMIN_EMAILS = [
    "alialaaaou@gmail.com",
    "ali@cvrise.com",
    "mahmoud@cvrise.com",
    "hazem@cvrise.com",
    "mo@cvrise.com",
]

KEY_PATH = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")


def init_firebase_admin():
    if not os.path.exists(KEY_PATH):
        print(f"Service account key not found at {KEY_PATH}")
        print("Please download serviceAccountKey.json from Firebase Console:")
        print("Project Settings -> Service Accounts -> Generate New Private Key")
        return False

    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(KEY_PATH)
            firebase_admin.initialize_app(cred)
        return True
    except Exception as e:
        print(f"Failed to initialize Firebase Admin SDK: {e}")
        return False


def provision_admin_account(email: str):
    email = email.strip().lower()
    print(f"\nProcessing: {email}...")

    try:
        user = auth.get_user_by_email(email)
        existing_claims = user.custom_claims or {}

        if existing_claims.get("admin") is True:
            print(f"✓ {email} already has admin claim: {existing_claims}")
            return True

        updated_claims = {**existing_claims, "admin": True}
        auth.set_custom_user_claims(user.uid, updated_claims)
        print(f"✓ Successfully assigned {{'admin': True}} to {email} (UID: {user.uid})")
        return True

    except auth.UserNotFoundError:
        print(f"✕ [USER NOT FOUND IN FIREBASE AUTH] {email}")
        print(f"  -> Please create this user account manually in Firebase Console -> Authentication -> Users.")
        return False
    except Exception as e:
        print(f"✕ Error provisioning {email}: {e}")
        return False


def main():
    print("==================================================")
    print("CV Rise — Admin Custom Claims Provisioning")
    print("==================================================")

    if not init_firebase_admin():
        sys.exit(1)

    success_count = 0
    missing_count = 0

    for email in ADMIN_EMAILS:
        ok = provision_admin_account(email)
        if ok:
            success_count += 1
        else:
            missing_count += 1

    print("\n==================================================")
    print(f"Summary: {success_count} accounts provisioned/verified, {missing_count} accounts require action.")
    print("==================================================")


if __name__ == "__main__":
    main()
