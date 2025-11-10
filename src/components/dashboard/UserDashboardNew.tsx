'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Avatar,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp,
  Security,
  LocationOn,
  Analytics,
  Terrain,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import BoundarySegmentation from './BoundarySegmentation';
import EncroachmentDetection from './EncroachmentDetection';

const DRAWER_WIDTH = 280;

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const UserDashboard: React.FC = () => {
  const [selectedView, setSelectedView] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalSubmissions: 0,
    totalValue: 0,
    pendingReviews: 0,
    accuracyRate: 95
  });
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch real-time dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      // Get user email from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      
      // Fetch user-specific stats
      const response = await fetch(`/api/encroachment?userEmail=${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const result = await response.json();
        const submissions = result.data || [];
        
        // Calculate user-specific statistics
        const totalSubmissions = submissions.length;
        const pendingCount = submissions.filter((s: any) => s.status.toLowerCase() === 'pending').length;
        const approvedCount = submissions.filter((s: any) => s.status.toLowerCase() === 'approved').length;
        const rejectedCount = submissions.filter((s: any) => s.status.toLowerCase() === 'rejected').length;
        
        setDashboardStats({
          totalSubmissions: totalSubmissions,
          totalValue: approvedCount, // Show approved count instead of fake value
          pendingReviews: pendingCount,
          accuracyRate: rejectedCount // Show rejected count (can be improved later)
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    // Poll for updates every 10 seconds for more responsive updates
    const interval = setInterval(fetchDashboardStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      icon: <DashboardIcon />,
    },
    {
      id: 'price-prediction',
      label: 'Price Prediction & Ownership',
      icon: <TrendingUp />,
    },
    {
      id: 'encroachment',
      label: 'Encroachment Detection',
      icon: <Security />,
    },
  ];

  const renderMainContent = () => {
    switch (selectedView) {
      case 'price-prediction':
        return <BoundarySegmentation />;
      case 'encroachment':
        return <EncroachmentDetection />;
      case 'dashboard':
      default:
        return (
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" color="primary" gutterBottom>
              Welcome back, {user?.name || 'User'}!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
              Manage your land assets and monitor property boundaries with our comprehensive tools
            </Typography>

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" fontWeight="bold">
                          {dashboardStats.totalSubmissions}
                        </Typography>
                        <Typography variant="body2">
                          Total Submissions
                        </Typography>
                      </Box>
                      <LocationOn sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" fontWeight="bold">
                          {dashboardStats.totalValue}
                        </Typography>
                        <Typography variant="body2">
                          Approved Requests
                        </Typography>
                      </Box>
                      <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" fontWeight="bold">
                          {dashboardStats.pendingReviews}
                        </Typography>
                        <Typography variant="body2">
                          Pending Reviews
                        </Typography>
                      </Box>
                      <Security sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" fontWeight="bold">
                          {dashboardStats.accuracyRate}
                        </Typography>
                        <Typography variant="body2">
                          Rejected Requests
                        </Typography>
                      </Box>
                      <Analytics sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Quick Actions */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card 
                  sx={{ cursor: 'pointer', transition: 'all 0.3s' }}
                  onClick={() => setSelectedView('price-prediction')}
                >
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        mx: 'auto',
                        mb: 2,
                        bgcolor: 'primary.main',
                      }}
                    >
                      <Terrain sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Boundary Segmentation & Pricing
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Analyze land boundaries, get price predictions, and view ownership details
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card 
                  sx={{ cursor: 'pointer', transition: 'all 0.3s' }}
                  onClick={() => setSelectedView('encroachment')}
                >
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        mx: 'auto',
                        mb: 2,
                        bgcolor: 'secondary.main',
                      }}
                    >
                      <Security sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Encroachment Detection
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload images for automated encroachment analysis and monitoring
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={isMobile ? drawerOpen : drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            top: 64, // Account for navbar height
            height: 'calc(100vh - 64px)',
            borderRight: 1,
            borderColor: 'divider',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="primary">
            Navigation
          </Typography>
        </Box>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={selectedView === item.id}
                onClick={() => setSelectedView(item.id)}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: selectedView === item.id ? 'inherit' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: drawerOpen ? `${DRAWER_WIDTH}px` : 0,
          width: drawerOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Menu Toggle Button */}
          <Box sx={{ mb: 2 }}>
            <IconButton
              onClick={() => setDrawerOpen(!drawerOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          {renderMainContent()}
        </Container>
      </Box>
    </Box>
  );
};

export default UserDashboard;