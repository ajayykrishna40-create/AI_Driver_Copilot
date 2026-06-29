import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import *
from datetime import datetime

db = SessionLocal()

try:
    print("Seeding database...")

    # Clear existing data in FK-safe order
    db.query(Load).delete()
    db.query(User).delete()
    db.query(SessionLog).delete()
    db.query(Driver).delete()
    db.query(Trailer).delete()
    db.query(Location).delete()
    db.query(Tractor).delete()

    db.commit()

    # --------------------
        # TRACTORS
        # --------------------
    tractors = [
        Tractor(
            tractor_id="TR001",
            tractor_number="TX1001",
            make="Freightliner",
            model="Cascadia",
            year=2023,
            status="ACTIVE"
            ),
        Tractor(
            tractor_id="TR002",
            tractor_number="TX1002",
            make="Volvo",
            model="VNL760",
            year=2022,
            status="ACTIVE"
        ),
        Tractor(
            tractor_id="TR003",
            tractor_number="TX1003",
            make="Peterbilt",
            model="579",
            year=2021,
            status="AVAILABLE"
        ),
        Tractor(
            tractor_id="TR004",
            tractor_number="TX1004",
            make="Kenworth",
            model="T680",
            year=2023,
            status="ACTIVE"
        ),
        Tractor(
            tractor_id="TR005",
            tractor_number="TX1005",
            make="International",
            model="LT625",
            year=2022,
            status="MAINTENANCE"
        ),
        ]

    db.add_all(tractors)
    db.commit()

        # --------------------
        # LOCATIONS
        # --------------------
    locations = [
        Location(
            location_id="LOC001",
            name="Tyson Foods",
            facility_code="TYS01",
            address="123 Tyson Road",
            city="Springdale",
            state="AR",
            gate="Gate A",
            dock="Dock 4",
            contact_name="Sarah",
            contact_phone="ext. 4421"
        ),
        Location(
            location_id="LOC002",
            name="Walmart DC 6847",
            facility_code="WM6847",
            address="500 Walmart Blvd",
            city="Bentonville",
            state="AR",
            gate="Gate C",
            dock="Dock 12",
            contact_name="Tom Richards",
            contact_phone="479-555-0192"
        ),
        Location(
            location_id="LOC003",
            name="Smithfield Foods",
            facility_code="SM001",
            address="1 Smithfield Drive",
            city="Tar Heel",
            state="NC",
            gate="Gate B",
            dock="Dock 7",
            contact_name="Lisa Monroe",
            contact_phone="910-555-0344"
        ),
        Location(
            location_id="LOC004",
            name="WEL Terminal",
            facility_code="WEL001",
            address="100 Logistics Pkwy",
            city="Little Rock",
            state="AR",
            gate="Main Gate",
            dock="Dock 1",
            contact_name="Dispatch",
            contact_phone="501-555-0100"
        ),
        Location(
            location_id="LOC005",
            name="Costco Distribution Center",
            facility_code="COS01",
            address="777 Warehouse Ave",
            city="Dallas",
            state="TX",
            gate="Gate D",
            dock="Dock 9",
            contact_name="Mike Torres",
            contact_phone="214-555-0871"
        )
    ]

    db.add_all(locations)
    db.commit()

        # --------------------
        # TRAILERS
        # --------------------
    trailers = [
        Trailer(
            trailer_id="TRL001",
            trailer_number="24087",
            type="REEFER",
            year=2022,
            current_status="READY",
            color="White",
            make="Wabash",
            license_plate="AR-4821",
            staging_location="East lot, second row"
        ),
        Trailer(
            trailer_id="TRL002",
            trailer_number="24085",
            type="REEFER",
            year=2022,
            current_status="READY",
            color="White",
            make="Wabash",
            license_plate="AR-4820",
            staging_location="East lot, first row"
        ),
        Trailer(
            trailer_id="TRL003",
            trailer_number="31042",
            type="REEFER",
            year=2023,
            current_status="READY",
            color="Silver",
            make="Great Dane",
            license_plate="NC-7731",
            staging_location="North lot, dock 3"
        ),
        Trailer(
            trailer_id="TRL004",
            trailer_number="42010",
            type="DRY_VAN",
            year=2021,
            current_status="IN_USE",
            color="Brown",
            make="Utility",
            license_plate="TX-9902",
            staging_location="West lot, row B"
        ),
        Trailer(
            trailer_id="TRL005",
            trailer_number="51020",
            type="FLATBED",
            year=2023,
            current_status="READY",
            color="Black",
            make="Fontaine",
            license_plate="TX-3310",
            staging_location="South lot, bay 7"
        )
    ]

    db.add_all(trailers)
    db.commit()

        # --------------------
        # DRIVERS
        # --------------------
    drivers = [
        Driver(
            driver_id="DRV001",
            driver_code="MK101",
            first_name="Mike",
            last_name="Johnson",
            phone="5551234567",
            email="mike@fleet.com",
            status="ACTIVE",
            tractor_id="TR001"
        ),
        Driver(
            driver_id="DRV002",
            driver_code="JD102",
            first_name="John",
            last_name="Smith",
            phone="5559876543",
            email="john@fleet.com",
            status="ACTIVE",
            tractor_id="TR002"
        ),
        Driver(
            driver_id="DRV003",
            driver_code="RB103",
            first_name="Robert",
            last_name="Brown",
            phone="5555551111",
            email="robert@fleet.com",
            status="AVAILABLE",
            tractor_id="TR003"
        ),
        Driver(
            driver_id="DRV004",
            driver_code="DW104",
            first_name="David",
            last_name="Wilson",
            phone="5555552222",
            email="david@fleet.com",
            status="ACTIVE",
            tractor_id="TR004"
        ),
        Driver(
            driver_id="DRV005",
            driver_code="AJ105",
            first_name="Andrew",
            last_name="Jackson",
            phone="5555553333",
            email="andrew@fleet.com",
            status="OFF_DUTY",
            tractor_id="TR005"
        )
    ]

    db.add_all(drivers)
    db.commit()

    # --------------------
    # USERS
    # --------------------
    users = [
        User(
            email="mike@fleet.com",
            password_hash="$2b$12$boV/qOAguWJ1bgx4zpkDs.UqnGnafB5Q.0uS1sOG2ujK/jZU9UZ4u",  # test123
            role="driver",
            driver_id="DRV001",
            is_active=1,
            first_name="Mike",
            last_name="Johnson"
        ),
        User(
            email="john@fleet.com",
            password_hash="$2b$12$boV/qOAguWJ1bgx4zpkDs.UqnGnafB5Q.0uS1sOG2ujK/jZU9UZ4u",  # test123
            role="driver",
            driver_id="DRV002",
            is_active=1,
            first_name="John",
            last_name="Smith"
        ),
        User(
            email="robert@fleet.com",
            password_hash="$2b$12$boV/qOAguWJ1bgx4zpkDs.UqnGnafB5Q.0uS1sOG2ujK/jZU9UZ4u",  # test123
            role="driver",
            driver_id="DRV003",
            is_active=1,
            first_name="Robert",
            last_name="Brown"
        ),
        User(
            email="david@fleet.com",
            password_hash="$2b$12$boV/qOAguWJ1bgx4zpkDs.UqnGnafB5Q.0uS1sOG2ujK/jZU9UZ4u",  # test123
            role="driver",
            driver_id="DRV004",
            is_active=1,
            first_name="David",
            last_name="Wilson"
        ),
        User(
            email="andrew@fleet.com",
            password_hash="$2b$12$boV/qOAguWJ1bgx4zpkDs.UqnGnafB5Q.0uS1sOG2ujK/jZU9UZ4u",  # test123
            role="driver",
            driver_id="DRV005",
            is_active=1,
            first_name="Andrew",
            last_name="Jackson"
        ),
        User(
            email="dispatcher@fleet.com",
            password_hash="$2b$12$boV/qOAguWJ1bgx4zpkDs.UqnGnafB5Q.0uS1sOG2ujK/jZU9UZ4u",  # test123
            role="dispatcher",
            driver_id=None,
            is_active=1,
            first_name="Dispatch",
            last_name="Manager"
        ),
        User(
            email="admin@fleet.com",
            password_hash="$2b$12$boV/qOAguWJ1bgx4zpkDs.UqnGnafB5Q.0uS1sOG2ujK/jZU9UZ4u",  # test123
            role="admin",
            driver_id=None,
            is_active=1,
            first_name="Admin",
            last_name="User"
        )
    ]

    db.add_all(users)
    db.commit()

    loads = [
        Load(
            order_id="ORD001",
            load_number="TF-8821",
            driver_id="DRV001",
            tractor_id="TR001",
            trailer_id="TRL001",
            shipper_location_id="LOC001",
            consignee_location_id="LOC002",
            planned_pickup_dt=datetime(2026, 6, 8, 10, 0),
            planned_delivery_dt=datetime(2026, 6, 9, 6, 30),
            temp_setpoint=-18.0,
            appointment_number="WM-2291",
            status="ASSIGNED",
            distance_miles=528.0,
            eta_hours=7.75
        ),
        Load(
            order_id="ORD002",
            load_number="SF-3101",
            driver_id="DRV001",
            tractor_id="TR001",
            trailer_id="TRL003",
            shipper_location_id="LOC003",
            consignee_location_id="LOC004",
            planned_pickup_dt=datetime(2026, 6, 9, 14, 0),
            planned_delivery_dt=datetime(2026, 6, 9, 16, 0),
            temp_setpoint=-4.0,
            appointment_number="SF-7712",
            status="STANDBY",
            distance_miles=245.0,
            eta_hours=3.75
        ),
        Load(
            order_id="ORD003",
            load_number="WM-4500",
            driver_id="DRV002",
            tractor_id="TR002",
            trailer_id="TRL004",
            shipper_location_id="LOC002",
            consignee_location_id="LOC005",
            planned_pickup_dt=datetime(2026, 6, 3, 9, 0),
            planned_delivery_dt=datetime(2026, 6, 4, 7, 0),
            temp_setpoint=5.0,
            appointment_number="WM-4500",
            status="IN_TRANSIT",
            distance_miles=528.0,
            eta_hours=7.75
        ),
        Load(
            order_id="ORD004",
            load_number="TY-7000",
            driver_id="DRV003",
            tractor_id="TR003",
            trailer_id="TRL005",
            shipper_location_id="LOC001",
            consignee_location_id="LOC003",
            planned_pickup_dt=datetime(2026, 6, 5, 10, 0),
            planned_delivery_dt=datetime(2026, 6, 6, 9, 0),
            temp_setpoint=-10.0,
            appointment_number="TY-9900",
            status="PLANNED",
            distance_miles=1100.0,
            eta_hours=16.0
        ),
        Load(
            order_id="ORD005",
            load_number="CT-8801",
            driver_id="DRV004",
            tractor_id="TR004",
            trailer_id="TRL002",
            shipper_location_id="LOC005",
            consignee_location_id="LOC002",
            planned_pickup_dt=datetime(2026, 6, 6, 7, 30),
            planned_delivery_dt=datetime(2026, 6, 7, 6, 0),
            temp_setpoint=2.0,
            appointment_number="CT-8801",
            status="ASSIGNED",
            distance_miles=641.0,
            eta_hours=9.5
        )
    ]

    db.add_all(tractors)
    db.commit()

    db.add_all(locations)
    db.commit()

    db.add_all(trailers)
    db.commit()

    db.add_all(drivers)
    db.commit()

    db.add_all(loads)
    db.commit()

    print("✅ Seed data inserted successfully")

except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")

finally:
    db.close()

        
