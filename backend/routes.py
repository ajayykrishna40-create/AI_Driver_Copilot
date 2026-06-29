from fastapi import APIRouter,  HTTPException
from database import get_db
from schemas import DriverCreate, HookupVerificationRequest, HookupVerificationResponse
from models import Tractor, Location, Trailer, Driver, Load, User, HookupVerification
from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import Depends
from sqlalchemy.exc import SQLAlchemyError
from security import hash_password, verify_password
from auth import RegisterRequest, LoginRequest
from jwt_handler import create_access_token

router = APIRouter()

@router.post("/register")
def register(driver: DriverCreate, db: Session = Depends(get_db)):
    db_driver = Driver(
        driver_id=driver.driver_id,
        driver_code=driver.driver_code,
        first_name=driver.first_name,
        last_name=driver.last_name,
        phone=driver.phone,
        email=driver.email,
        status=driver.status,
        tractor_id=driver.tractor_id
    )

    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)

    return {
        "message": "Driver registered",
        "data": db_driver
    }


@router.get("/drivers")
def get_drivers(db: Session = Depends(get_db)):
    drivers = db.query(Driver).all()

    return drivers



@router.get("/drivers/{driver_id}/active-loads")
def get_driver_active_loads(driver_id: str, db: Session = Depends(get_db)):
    try:
        driver = db.query(Driver).filter(Driver.driver_id == driver_id).first()
        loads = db.query(Load).filter(
            Load.driver_id == driver_id,
            Load.status.in_(["ASSIGNED", "HOOKED", "IN_TRANSIT", "STANDBY"]),
        ).all()

        driver_data = {
            "driver": {
                "driver_id": driver.driver_id,
                "first_name": driver.first_name,
                "last_name": driver.last_name,
                "phone": driver.phone,
                "email": driver.email,
                "status": driver.status,
            }
            if driver
            else {"driver_id": driver_id}
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database query failed: {str(e)}. Check MySQL connection and schema."
        )

    def location_payload(location_id: str):
        if not location_id:
            return None
        location = db.query(Location).filter(Location.location_id == location_id).first()
        if not location:
            return None
        return {
            "name": location.name,
            "address": location.address,
            "city": location.city,
            "state": location.state,
            "facility_code": location.facility_code,
            "gate": location.gate,
            "dock": location.dock,
            "contact_name": location.contact_name,
            "contact_phone": location.contact_phone,
        }

    response_loads = []
    for load in loads:
        trailer = db.query(Trailer).filter(Trailer.trailer_id == load.trailer_id).first()
        # Find look-alike trailers: same type, similar number, different load
        lookalikes = []
        if trailer:
            try:
                trailer_num = int(''.join(filter(str.isdigit, trailer.trailer_number)))
                all_trailers = db.query(Trailer).filter(
                    Trailer.trailer_id != trailer.trailer_id,
                    Trailer.current_status.in_(["READY", "IN_USE"])
                ).all()
                for t in all_trailers:
                    try:
                        t_num = int(''.join(filter(str.isdigit, t.trailer_number)))
                        if abs(t_num - trailer_num) <= 10:
                            lookalikes.append({
                                "trailer_number": t.trailer_number,
                                "type": t.type,
                                "staging_location": t.staging_location or "yard"
                            })
                    except ValueError:
                        pass
            except ValueError:
                pass

        response_loads.append(
            {
                "order_id": load.order_id,
                "load_number": load.load_number,
                "status": load.status,
                "temp_setpoint": load.temp_setpoint,
                "planned_pickup_dt": load.planned_pickup_dt,
                "planned_delivery_dt": load.planned_delivery_dt,
                "appointment_number": load.appointment_number,
                "distance_miles": load.distance_miles,
                "eta_hours": load.eta_hours,
                "trailer": {
                    "trailer_number": trailer.trailer_number if trailer else None,
                    "type": trailer.type if trailer else None,
                    "year": trailer.year if trailer else None,
                    "color": trailer.color if trailer else None,
                    "make": trailer.make if trailer else None,
                    "license_plate": trailer.license_plate if trailer else None,
                    "staging_location": trailer.staging_location if trailer else None,
                    "current_status": trailer.current_status if trailer else None,
                }
                if trailer
                else None,
                "shipper": location_payload(load.shipper_location_id),
                "consignee": location_payload(load.consignee_location_id),
                "lookalike_trailers": lookalikes,
            }
        )

    driver_data["loads"] = response_loads
    return driver_data


@router.post("/loads/{order_id}/verify-hookup", response_model=HookupVerificationResponse)
def verify_hookup(order_id: str, verification: HookupVerificationRequest, db: Session = Depends(get_db)):
    """
    Verify tractor number, trailer number, and temperature before confirming hookup.
    Returns verification status with detailed mismatch information.
    """
    # Try to find by order_id first, then by load_number
    load = db.query(Load).filter(Load.order_id == order_id).first()
    if not load:
        load = db.query(Load).filter(Load.load_number == order_id).first()
    if not load:
        raise HTTPException(status_code=404, detail=f"Load not found with order_id or load_number: {order_id}")
    
    # Get expected values from database
    tractor = db.query(Tractor).filter(Tractor.tractor_id == load.tractor_id).first()
    trailer = db.query(Trailer).filter(Trailer.trailer_id == load.trailer_id).first()
    
    if not tractor or not trailer:
        raise HTTPException(status_code=500, detail="Tractor or trailer information missing")
    
    expected_tractor = tractor.tractor_number
    expected_trailer = trailer.trailer_number
    expected_temp = load.temp_setpoint
    
    # Verify each field
    tractor_match = verification.tractor_number.strip().upper() == expected_tractor.strip().upper()
    trailer_match = verification.trailer_number.strip() == expected_trailer.strip()
    
    # Temperature tolerance: allow ±1 degree
    temp_match = abs(verification.temp_setpoint - expected_temp) <= 1.0
    
    # Build mismatch details
    mismatches = []
    if not tractor_match:
        mismatches.append(f"Tractor mismatch: provided '{verification.tractor_number}', expected '{expected_tractor}'")
    if not trailer_match:
        mismatches.append(f"Trailer mismatch: provided '{verification.trailer_number}', expected '{expected_trailer}'")
    if not temp_match:
        mismatches.append(f"Temperature mismatch: provided {verification.temp_setpoint}°C, expected {expected_temp}°C")
    
    verification_status = "VERIFIED" if (tractor_match and trailer_match and temp_match) else "MISMATCH"
    mismatch_details = "; ".join(mismatches) if mismatches else None
    
    # Log verification attempt
    hookup_verification = HookupVerification(
        order_id=load.order_id,
        driver_id=load.driver_id,
        expected_tractor_number=expected_tractor,
        expected_trailer_number=expected_trailer,
        expected_temp_setpoint=expected_temp,
        provided_tractor_number=verification.tractor_number,
        provided_trailer_number=verification.trailer_number,
        provided_temp_setpoint=verification.temp_setpoint,
        tractor_match=tractor_match,
        trailer_match=trailer_match,
        temp_match=temp_match,
        verification_status=verification_status,
        mismatch_details=mismatch_details,
        verified_at=datetime.utcnow() if verification_status == "VERIFIED" else None
    )
    db.add(hookup_verification)
    db.commit()
    
    # Build response message
    if verification_status == "VERIFIED":
        message = f"Verification successful! Tractor {expected_tractor}, Trailer {expected_trailer}, Temperature {expected_temp}°C confirmed."
    else:
        message = f"Verification failed. {mismatch_details}"
    
    return HookupVerificationResponse(
        status=verification_status,
        tractor_match=tractor_match,
        trailer_match=trailer_match,
        temp_match=temp_match,
        mismatch_details=mismatch_details,
        message=message
    )


@router.post("/loads/{order_id}/confirm-hookup")
def confirm_hookup(order_id: str, db: Session = Depends(get_db)):
    # Try to find by order_id first, then by load_number
    load = db.query(Load).filter(Load.order_id == order_id).first()
    if not load:
        load = db.query(Load).filter(Load.load_number == order_id).first()
    if not load:
        raise HTTPException(status_code=404, detail=f"Load not found with order_id or load_number: {order_id}")
    load.status = "HOOKED"
    load.hookup_confirmed_at = datetime.utcnow()
    db.add(load)
    db.commit()
    db.refresh(load)
    return {"status": "success", "order_id": load.order_id, "load_number": load.load_number, "new_status": load.status, "hookup_confirmed_at": load.hookup_confirmed_at}


@router.post("/loads/{order_id}/depart")
def notify_departure(order_id: str, db: Session = Depends(get_db)):
    # Try to find by order_id first, then by load_number
    load = db.query(Load).filter(Load.order_id == order_id).first()
    if not load:
        load = db.query(Load).filter(Load.load_number == order_id).first()
    if not load:
        raise HTTPException(status_code=404, detail=f"Load not found with order_id or load_number: {order_id}")
    load.status = "IN_TRANSIT"
    load.departed_at = datetime.utcnow()
    load.eta_sent_at = datetime.utcnow()
    db.add(load)
    db.commit()
    db.refresh(load)
    eta_str = f"{load.eta_hours} hours" if load.eta_hours else "unknown"
    return {
        "status": "success",
        "order_id": load.order_id,
        "load_number": load.load_number,
        "new_status": load.status,
        "departed_at": load.departed_at,
        "eta_sent_at": load.eta_sent_at,
        "eta": eta_str,
        "distance_miles": load.distance_miles,
    }


@router.post("/loads/{order_id}/complete-delivery")
def complete_delivery(order_id: str, db: Session = Depends(get_db)):
    # Try to find by order_id first, then by load_number
    load = db.query(Load).filter(Load.order_id == order_id).first()
    if not load:
        load = db.query(Load).filter(Load.load_number == order_id).first()
    if not load:
        raise HTTPException(status_code=404, detail=f"Load not found with order_id or load_number: {order_id}")
    load.status = "COMPLETED"
    db.add(load)
    db.commit()
    db.refresh(load)
    return {"status": "success", "order_id": load.order_id, "load_number": load.load_number, "new_status": load.status}


@router.post("/register_user")
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db)
):

    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match"
        )

    existing_user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        password_hash=hash_password(
            payload.password
        ),
        role="driver"
        
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Registration successful",
        "user_id": user.user_id
    }

@router.post("/login")
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.email == payload.email
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        payload.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(
        {
            "user_id": user.user_id,
            "driver_id": user.driver_id,
            "email": user.email,
            "role": user.role
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "driver_id": user.driver_id,
        "role": user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }