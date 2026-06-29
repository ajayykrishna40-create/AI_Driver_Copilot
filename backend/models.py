from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    Text,
    TIMESTAMP,
    Boolean,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base

class Driver(Base):
    __tablename__ = "drivers"

    driver_id = Column(String(50), primary_key=True)
    driver_code = Column(String(50))
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(20))
    email = Column(String(100))
    status = Column(String(50))
    assignment_start_dt = Column(DateTime, nullable=True)
    assignment_end_dt = Column(DateTime, nullable=True)

    tractor_id = Column(
        String(50),
        ForeignKey("tractors.tractor_id"),
        nullable=True
    )

    sessions = relationship("SessionLog", back_populates="driver")


class Tractor(Base):
    __tablename__ = "tractors"

    tractor_id = Column(String(50), primary_key=True)
    tractor_number = Column(String(50))
    make = Column(String(50))
    model = Column(String(50))
    year = Column(Integer)
    status = Column(String(50))


class Trailer(Base):
    __tablename__ = "trailers"

    trailer_id = Column(String(50), primary_key=True)
    trailer_number = Column(String(50))
    type = Column(String(50))
    year = Column(Integer)
    current_status = Column(String(50))
    color = Column(String(50), nullable=True)
    make = Column(String(50), nullable=True)
    license_plate = Column(String(50), nullable=True)
    staging_location = Column(String(100), nullable=True)

class Location(Base):
    __tablename__ = "locations"

    location_id = Column(String(50), primary_key=True)

    name = Column(String(100))
    facility_code = Column(String(50))

    address = Column(String(255))
    city = Column(String(100))
    state = Column(String(50))
    gate = Column(String(50), nullable=True)
    dock = Column(String(50), nullable=True)
    contact_name = Column(String(100), nullable=True)
    contact_phone = Column(String(50), nullable=True)

class Load(Base):
    __tablename__ = "loads"

    order_id = Column(String(50), primary_key=True)

    load_number = Column(String(50))

    driver_id = Column(
        String(50),
        ForeignKey("drivers.driver_id")
    )

    tractor_id = Column(
        String(50),
        ForeignKey("tractors.tractor_id")
    )

    trailer_id = Column(
        String(50),
        ForeignKey("trailers.trailer_id")
    )

    shipper_location_id = Column(
        String(50),
        ForeignKey("locations.location_id")
    )

    consignee_location_id = Column(
        String(50),
        ForeignKey("locations.location_id")
    )

    planned_pickup_dt = Column(DateTime)
    actual_pickup_dt = Column(DateTime, nullable=True)
    planned_delivery_dt = Column(DateTime)
    actual_delivery_dt = Column(DateTime, nullable=True)

    temp_setpoint = Column(Float)

    appointment_number = Column(String(50))

    status = Column(String(50))

    hookup_confirmed_at = Column(DateTime, nullable=True)
    departed_at = Column(DateTime, nullable=True)
    eta_sent_at = Column(DateTime, nullable=True)
    distance_miles = Column(Float, nullable=True)
    eta_hours = Column(Float, nullable=True)

    driver = relationship("Driver", foreign_keys=[driver_id])
    trailer = relationship("Trailer", foreign_keys=[trailer_id])
    tractor = relationship("Tractor", foreign_keys=[tractor_id])
    shipper = relationship("Location", foreign_keys=[shipper_location_id])
    consignee = relationship("Location", foreign_keys=[consignee_location_id])


class DispatchLog(Base):
    __tablename__ = "dispatch_logs"

    id = Column(Integer, primary_key=True)

    driver_id = Column(String(50))
    load_id = Column(String(50))

    action = Column(String(100))

    notes = Column(Text)

    created_at = Column(
        TIMESTAMP,
        server_default=func.now()
    )

class User(Base):
    __tablename__ = "users"

    user_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    first_name = Column(
        String(100),
        nullable=False
    )

    last_name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(20),
        default="driver"
    )

    driver_id = Column(
        String(50),
        ForeignKey("drivers.driver_id"),
        nullable=True
    )

    is_active = Column(
        Boolean,
        default=True
    )


class SessionLog(Base):
    __tablename__ = "session_logs"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(String(50), ForeignKey("drivers.driver_id"), nullable=False)
    session_start = Column(DateTime, server_default=func.now())
    session_end = Column(DateTime, nullable=True)
    events = Column(JSON, nullable=False, default=[])
    total_interactions = Column(Integer, default=0)
    actions_taken = Column(JSON, default=[])
    
    # Hookup verification tracking
    pending_hookup_verification = Column(JSON, nullable=True)  # Stores tractor, trailer, temp for verification

    driver = relationship("Driver", back_populates="sessions")


class HookupVerification(Base):
    __tablename__ = "hookup_verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), ForeignKey("loads.order_id"), nullable=False)
    driver_id = Column(String(50), ForeignKey("drivers.driver_id"), nullable=False)
    
    # Expected values (from database)
    expected_tractor_number = Column(String(50))
    expected_trailer_number = Column(String(50))
    expected_temp_setpoint = Column(Float)
    
    # Driver-provided values
    provided_tractor_number = Column(String(50), nullable=True)
    provided_trailer_number = Column(String(50), nullable=True)
    provided_temp_setpoint = Column(Float, nullable=True)
    
    # Verification results
    tractor_match = Column(Boolean, nullable=True)
    trailer_match = Column(Boolean, nullable=True)
    temp_match = Column(Boolean, nullable=True)
    
    # Status
    verification_status = Column(String(50))  # PENDING, VERIFIED, MISMATCH
    created_at = Column(DateTime, server_default=func.now())
    verified_at = Column(DateTime, nullable=True)
    
    mismatch_details = Column(Text, nullable=True)


