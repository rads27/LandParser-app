-- Database schema for LandParser app
-- Create database: CREATE DATABASE landparser_db;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Land plots table
CREATE TABLE land_plots (
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

-- Encroachment requests table
-- Encroachment submissions table (canonicalized)
CREATE TABLE IF NOT EXISTS encroachment_submissions (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_data TEXT,
        file_type VARCHAR(100),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        admin_notes TEXT,
        complaint_details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for submissions
CREATE INDEX IF NOT EXISTS idx_submissions_user_email 
    ON encroachment_submissions(user_email);
CREATE INDEX IF NOT EXISTS idx_submissions_status 
    ON encroachment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at 
    ON encroachment_submissions(submitted_at);

-- Insert default users
INSERT INTO users (email, password_hash, role, name) VALUES 
('user@example.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'user', 'John Doe'),
('admin@example.com', '$2b$10$1234567890abcdefghijklmnopqrstuvwxyz', 'admin', 'Admin User');

-- Insert sample land plot data
INSERT INTO land_plots (user_id, city, taluka, plot_no, coordinates, predicted_price, owner_name, land_type, soil_type, area) VALUES 
(1, 'Pune', 'Haveli', 'P001', '{"type":"Polygon","coordinates":[[[73.8567,18.5204],[73.8577,18.5204],[73.8577,18.5214],[73.8567,18.5214],[73.8567,18.5204]]]}', 4500000, 'Ramesh Kumar', 'Agricultural', 'Black Cotton Soil', 2.5);

-- Insert sample encroachment submissions
INSERT INTO encroachment_submissions (user_email, file_name, status) VALUES 
('user@example.com', 'plot_image_1.jpg', 'pending'),
('user@example.com', 'old_land_photo.png', 'approved'),
('user@example.com', 'boundary_pic.jpg', 'rejected');

-- Ensure plot_no uniqueness for safe CSV upserts
CREATE UNIQUE INDEX IF NOT EXISTS ux_land_plots_plot_no ON land_plots(plot_no);