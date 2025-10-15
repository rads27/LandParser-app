'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/common/Navbar';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <Navbar />
      <AdminDashboard />
    </ProtectedRoute>
  );
}