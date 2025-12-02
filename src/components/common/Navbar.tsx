'use client';

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  AccountCircle,
  Landscape,
  ExitToApp,
  Notifications,
  NotificationsNone,
} from '@mui/icons-material';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const Navbar: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications for admin users
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchNotifications();
      // Try real-time via SSE with token in query string (EventSource can't set headers)
      let es: EventSource | null = null;
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        es = new EventSource(`/api/admin/notifications?token=${encodeURIComponent(token || '')}`);
        es.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            if (payload && (payload.type === 'initial' || payload.type === 'update')) {
              setNotifications(payload.notifications || []);
              setUnreadCount((payload.notifications || []).filter((n: any) => !n.read).length);
            }
          } catch (err) {}
        };
        es.onerror = () => { if (es) { es.close(); es = null; } };
      } catch (err) {
        // fallback to polling
        const interval = setInterval(fetchNotifications, 30000); // Every 30 seconds
        return () => clearInterval(interval);
      }

      return () => { if (es) { try { es.close(); } catch(_) {} } };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      console.log('Navbar: Fetching notifications...');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/admin/notifications', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json();
      console.log('Navbar: Notifications response:', data);
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
        console.log('Navbar: Updated notifications count:', data.data.notifications.length);
        console.log('Navbar: Updated unread count:', data.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    handleMenuClose();
  };

  const markAllAsRead = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  return (
    <AppBar position="sticky" elevation={2}>
      <Toolbar>
        <Landscape sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          LandParser
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" onClick={toggleTheme}>
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          {user?.role === 'admin' && (
            <>
              <IconButton color="inherit" onClick={handleNotificationClick}>
                <Badge badgeContent={unreadCount} color="error">
                  {unreadCount > 0 ? <Notifications /> : <NotificationsNone />}
                </Badge>
              </IconButton>
              <Popover
                open={Boolean(notificationAnchor)}
                anchorEl={notificationAnchor}
                onClose={handleNotificationClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <Box sx={{ width: 350, maxHeight: 400, overflow: 'auto' }}>
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" fontWeight="bold">
                        Notifications
                      </Typography>
                      {unreadCount > 0 && (
                        <Button size="small" onClick={markAllAsRead}>
                          Mark all read
                        </Button>
                      )}
                    </Box>
                  </Box>
                  {notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary">
                        No notifications
                      </Typography>
                    </Box>
                  ) : (
                    <List dense>
                      {notifications.slice(0, 10).map((notification) => (
                        <React.Fragment key={notification.id}>
                          <ListItem
                            sx={{
                              backgroundColor: notification.read ? 'transparent' : 'action.hover',
                            }}
                          >
                            <ListItemText
                              primary={notification.message}
                              secondary={new Date(notification.timestamp).toLocaleTimeString()}
                            />
                            {!notification.read && (
                              <Chip size="small" label="New" color="primary" />
                            )}
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </Box>
              </Popover>
            </>
          )}

          {user && (
            <>
              <Button
                color="inherit"
                startIcon={<AccountCircle />}
                onClick={handleMenuOpen}
                sx={{ textTransform: 'none' }}
              >
                {user.name || user.email}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleLogout}>
                  <ExitToApp sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;