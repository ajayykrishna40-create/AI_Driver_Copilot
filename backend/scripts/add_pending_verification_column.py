"""
Add pending_hookup_verification column to session_logs table
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from sqlalchemy import text

print("Adding pending_hookup_verification column to session_logs...")

try:
    with engine.connect() as conn:
        # Add the column
        conn.execute(text("""
            ALTER TABLE session_logs 
            ADD COLUMN pending_hookup_verification JSON NULL
        """))
        conn.commit()
        print("✅ Column added successfully")
except Exception as e:
    if "Duplicate column name" in str(e):
        print("✅ Column already exists")
    else:
        print(f"❌ Error: {e}")
