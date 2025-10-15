-- Supabase Schema for LandParser App
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (using Supabase auth, but keeping for reference)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create encroachment_requests table
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

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_encroachment_requests_user_email ON encroachment_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_encroachment_requests_status ON encroachment_requests(status);
CREATE INDEX IF NOT EXISTS idx_encroachment_requests_created_at ON encroachment_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read_status ON admin_notifications(read_status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE encroachment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for encroachment_requests
-- Allow all operations for now (you can make this more restrictive later)
CREATE POLICY "Allow all operations on encroachment_requests" ON encroachment_requests
    FOR ALL USING (true);

-- Create policies for admin_notifications
-- Allow all operations for now (you can make this more restrictive later)
CREATE POLICY "Allow all operations on admin_notifications" ON admin_notifications
    FOR ALL USING (true);

-- Insert default admin user (optional)
INSERT INTO users (email, password, role, name) VALUES 
('admin@landparser.com', '$2b$10$rGIqzpHKMiC/xKfHYGn0j.VQf5xKbL8qLfL6MzE1xQxQKzYzLJz9K', 'admin', 'Admin User')
ON CONFLICT (email) DO NOTHING;

-- Insert default user for testing (optional)
INSERT INTO users (email, password, role, name) VALUES 
('user@landparser.com', '$2b$10$rGIqzpHKMiC/xKfHYGn0j.VQf5xKbL8qLfL6MzE1xQxQKzYzLJz9K', 'user', 'Test User')
ON CONFLICT (email) DO NOTHING;