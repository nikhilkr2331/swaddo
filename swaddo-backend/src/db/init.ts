import { pool } from './index';
import { logger } from '../utils/logger';

const runSchema = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create ENUMs
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'delivery', 'admin');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(15) UNIQUE NOT NULL,
        name VARCHAR(100),
        role user_role DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Vendors
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(150),
        status VARCHAR(20) DEFAULT 'active',
        fssai_license VARCHAR(50),
        gst_number VARCHAR(50),
        bank_account_name VARCHAR(150),
        bank_account_number VARCHAR(50),
        bank_ifsc VARCHAR(20),
        pan_number VARCHAR(20),
        aadhaar_number VARCHAR(20)
      );
    `);
    
    // Add new columns to vendors if table already exists
    await client.query(`
      DO $$ BEGIN ALTER TABLE vendors ADD COLUMN fssai_license VARCHAR(50); EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN ALTER TABLE vendors ADD COLUMN gst_number VARCHAR(50); EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN ALTER TABLE vendors ADD COLUMN bank_account_name VARCHAR(150); EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN ALTER TABLE vendors ADD COLUMN bank_account_number VARCHAR(50); EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN ALTER TABLE vendors ADD COLUMN bank_ifsc VARCHAR(20); EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN ALTER TABLE vendors ADD COLUMN pan_number VARCHAR(20); EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN ALTER TABLE vendors ADD COLUMN aadhaar_number VARCHAR(20); EXCEPTION WHEN duplicate_column THEN null; END $$;
    `);

    // Stalls
    await client.query(`
      CREATE TABLE IF NOT EXISTS stalls (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        location VARCHAR(255) NOT NULL,
        latitude DECIMAL(10,8) DEFAULT 25.61100000,
        longitude DECIMAL(11,8) DEFAULT 85.13000000,
        cover_image TEXT,
        opening_time VARCHAR(10) DEFAULT '09:00 AM',
        closing_time VARCHAR(10) DEFAULT '10:00 PM',
        is_open BOOLEAN DEFAULT true,
        rating DECIMAL(3,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add columns if table already exists
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE stalls ADD COLUMN latitude DECIMAL(10,8) DEFAULT 25.61100000;
      EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN
        ALTER TABLE stalls ADD COLUMN longitude DECIMAL(11,8) DEFAULT 85.13000000;
      EXCEPTION WHEN duplicate_column THEN null; END $$;
    `);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_stalls_location ON stalls(location);`);

    // Menu Items
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        stall_id INTEGER REFERENCES stalls(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        is_veg BOOLEAN DEFAULT true,
        is_available BOOLEAN DEFAULT true
      );
    `);

    // Orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        stall_id INTEGER REFERENCES stalls(id) ON DELETE CASCADE,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'payment_pending', -- payment_pending, placed, preparing, out_for_delivery, delivered, cancelled
        payment_method VARCHAR(50) DEFAULT 'upi', -- upi, cod
        delivery_address TEXT,
        delivery_lat DECIMAL(10,8),
        delivery_lng DECIMAL(11,8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_stall ON orders(stall_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);`);

    // Add delivery coordinate columns if table already exists
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE orders ADD COLUMN delivery_lat DECIMAL(10,8);
      EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN
        ALTER TABLE orders ADD COLUMN delivery_lng DECIMAL(11,8);
      EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN
        ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'upi';
      EXCEPTION WHEN duplicate_column THEN null; END $$;
    `);

    // Order Items
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id INTEGER REFERENCES menu_items(id),
        quantity INTEGER NOT NULL,
        price_at_time DECIMAL(10,2) NOT NULL
      );
    `);

    // Delivery Partners
    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_partners (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        vehicle_details VARCHAR(255),
        current_status VARCHAR(50) DEFAULT 'offline',
        is_active BOOLEAN DEFAULT false,
        id_proof_status VARCHAR(20) DEFAULT 'pending',
        dl_status VARCHAR(20) DEFAULT 'pending',
        rc_status VARCHAR(20) DEFAULT 'pending',
        bank_name VARCHAR(100),
        account_name VARCHAR(100),
        account_number VARCHAR(50),
        ifsc_code VARCHAR(20)
      );
    `);

    // Payments
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        razorpay_order_id VARCHAR(100) UNIQUE,
        razorpay_payment_id VARCHAR(100) UNIQUE,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'created', -- created, captured, failed, refunded
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP
      );
    `);

    // Delivery Assignments
    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_assignments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        delivery_partner_id INTEGER REFERENCES delivery_partners(id),
        status VARCHAR(50) DEFAULT 'assigned', -- assigned, accepted, picked_up, completed
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        pickup_distance_km DECIMAL(10,2),
        delivery_distance_km DECIMAL(10,2),
        cash_collected BOOLEAN DEFAULT false,
        cash_deposited BOOLEAN DEFAULT false,
        earnings_amount DECIMAL(10,2) DEFAULT 0.00
      );

      CREATE TABLE IF NOT EXISTS deposit_history (
        id SERIAL PRIMARY KEY,
        delivery_partner_id INTEGER REFERENCES delivery_partners(id),
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rider_daily_stats (
        id SERIAL PRIMARY KEY,
        delivery_partner_id INTEGER REFERENCES delivery_partners(id),
        date DATE NOT NULL,
        online_minutes INTEGER DEFAULT 0,
        UNIQUE(delivery_partner_id, date)
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_delivery_assignments_partner_status ON delivery_assignments(delivery_partner_id, status);`);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE delivery_partners ADD COLUMN bank_name VARCHAR(100);
      EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN
        ALTER TABLE delivery_partners ADD COLUMN account_name VARCHAR(100);
      EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN
        ALTER TABLE delivery_partners ADD COLUMN account_number VARCHAR(50);
      EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN
        ALTER TABLE delivery_partners ADD COLUMN ifsc_code VARCHAR(20);
      EXCEPTION WHEN duplicate_column THEN null; END $$;
    `);
    
    // Add columns if table already exists
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE delivery_assignments ADD COLUMN pickup_distance_km DECIMAL(10,2);
      EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN
        ALTER TABLE delivery_assignments ADD COLUMN delivery_distance_km DECIMAL(10,2);
      EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN
        ALTER TABLE delivery_assignments ADD COLUMN cash_collected BOOLEAN DEFAULT false;
      EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN
        ALTER TABLE delivery_assignments ADD COLUMN cash_deposited BOOLEAN DEFAULT false;
      EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN
        ALTER TABLE delivery_assignments ADD COLUMN earnings_amount DECIMAL(10,2) DEFAULT 0.00;
      EXCEPTION WHEN duplicate_column THEN null; END $$;
      
      DO $$ BEGIN
        ALTER TABLE delivery_partners ADD COLUMN is_active BOOLEAN DEFAULT false;
      EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN
        ALTER TABLE delivery_partners ADD COLUMN id_proof_status VARCHAR(20) DEFAULT 'pending';
      EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN
        ALTER TABLE delivery_partners ADD COLUMN dl_status VARCHAR(20) DEFAULT 'pending';
      EXCEPTION WHEN duplicate_column THEN null; END $$;
      DO $$ BEGIN
        ALTER TABLE delivery_partners ADD COLUMN rc_status VARCHAR(20) DEFAULT 'pending';
      EXCEPTION WHEN duplicate_column THEN null; END $$;
    `);

    // Payments
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        method VARCHAR(50), -- upi, cod
        status VARCHAR(50) DEFAULT 'pending'
      );
    `);

    // Ratings & Reviews
    await client.query(`
      CREATE TABLE IF NOT EXISTS ratings_reviews (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        stall_id INTEGER REFERENCES stalls(id),
        customer_id INTEGER REFERENCES users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    logger.info('Database schema initialized successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to initialize database schema:', error);
    throw error;
  } finally {
    client.release();
  }
};

runSchema().then(() => process.exit(0)).catch(() => process.exit(1));
