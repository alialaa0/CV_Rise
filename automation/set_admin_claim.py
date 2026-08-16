"""
CV Rise — Admin Custom Claims Provisioning Utility
This script assigns {"admin": True} custom claim to a designated user using the Firebase Admin SDK.
Usage:
    python set_admin_claim.py <email_or_uid>
"""

import sys
import os
import firebase_admin
from firebase_admin import credentials, auth

SERVICE_ACCOUNT_PATH = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

def initialize_admin():
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print(f"Error: Service account file not found at {SERVICE_ACCOUNT_PATH}")
        sys.exit(1)
        
    if not firebase_admin._apps:
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)

def set_admin_claim(identifier):
    initialize_admin()
    
    try:
        # Check by email first
        if "@" in identifier:
            user = auth.get_user_by_email(identifier)
        else:
            user = auth.get_user(identifier)
            
        print(f"Found user: {user.email or user.uid} (UID: {user.uid})")
        
        # Set custom claims
        auth.set_custom_user_claims(user.uid, {"admin": True})
        print(f"Successfully granted 'admin: True' custom claim to {user.email or user.uid}.")
        print("Note: The user must sign in or refresh their token for the claim to take effect.")
        
    except Exception as e:
        print(f"Failed to set custom claim: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python set_admin_claim.py <user_email_or_uid>")
        sys.exit(1)
        
    set_admin_claim(sys.argv[1].strip())
