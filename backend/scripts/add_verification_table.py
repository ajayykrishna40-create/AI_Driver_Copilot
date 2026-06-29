"""
Add hookup_verifications table to database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, Base
from models import HookupVerification

print("Creating hookup_verifications table...")

try:
    # Create only the new table
    HookupVerification.__table__.create(engine, checkfirst=True)
    print("✅ hookup_verifications table created successfully")
except Exception as e:
    print(f"❌ Error creating table: {e}")
