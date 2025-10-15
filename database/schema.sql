-- Database schema for LandParser app
-- Create database: CREATE DATABASE landparser;

-- Users table with enhanced fields
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced encroachment requests table with all form fields
CREATE TABLE IF NOT EXISTS encroachment_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    user_email VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_data TEXT NOT NULL, -- Base64 encoded image data
    area_name VARCHAR(255),
    plot_name VARCHAR(255),
    comments TEXT,
    coordinates VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_action VARCHAR(50),
    admin_reason TEXT,
    admin_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Land plots table (kept for future use)
CREATE TABLE IF NOT EXISTS land_plots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    state VARCHAR(100) DEFAULT 'Maharashtra',
    city VARCHAR(100),
    taluka VARCHAR(100),
    plot_no VARCHAR(100),
    coordinates JSONB, -- Store polygon coordinates
    predicted_price DECIMAL(15,2),
    owner_name VARCHAR(255),
    land_type VARCHAR(100),
    soil_type VARCHAR(100),
    area DECIMAL(10,2),
    area_unit VARCHAR(20) DEFAULT 'Acres',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_encroachment_requests_user_email ON encroachment_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_encroachment_requests_status ON encroachment_requests(status);
CREATE INDEX IF NOT EXISTS idx_encroachment_requests_created_at ON encroachment_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read_status ON admin_notifications(read_status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);

-- Insert default users (with properly hashed passwords)
INSERT INTO users (email, password, role, name) VALUES 
('user@landparser.com', '$2b$10$rGIqzpHKMiC/xKfHYGn0j.VQf5xKbL8qLfL6MzE1xQxQKzYzLJz9K', 'user', 'Test User'),
('admin@landparser.com', '$2b$10$rGIqzpHKMiC/xKfHYGn0j.VQf5xKbL8qLfL6MzE1xQxQKzYzLJz9K', 'admin', 'Admin User')
ON CONFLICT (email) DO NOTHING;