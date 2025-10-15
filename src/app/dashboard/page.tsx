'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/common/Navbar';
import UserDashboard from '@/components/dashboard/UserDashboardNew';

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole="user">
      <Navbar />
      <UserDashboard />
    </ProtectedRoute>
  );
}