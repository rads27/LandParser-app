'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Image as ImageIcon,
  Person,
  AdminPanelSettings,
  Close,
  Visibility,
} from '@mui/icons-material';
import { EncroachmentRequest } from '@/types';

const AdminDashboard: React.FC = () => {
  const [requests, setRequests] = useState<EncroachmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    processedToday: 0,
    totalThisMonth: 0,
    accuracyRate: 0
  });

  // Dialog states
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EncroachmentRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionComments, setActionComments] = useState('');

  useEffect(() => {
    console.log('AdminDashboard: Component mounted, starting initial fetch...');
    fetchRequests();
    fetchStats();
    
    // Poll for new requests every 10 seconds
    console.log('AdminDashboard: Setting up polling intervals...');
    const requestsInterval = setInterval(() => {
      console.log('AdminDashboard: Polling interval triggered for requests');
      fetchRequests();
    }, 10000);
    const statsInterval = setInterval(() => {
      console.log('AdminDashboard: Polling interval triggered for stats');
      fetchStats();
    }, 30000);
    
    return () => {
      console.log('AdminDashboard: Cleaning up intervals...');
      clearInterval(requestsInterval);
      clearInterval(statsInterval);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      console.log('AdminDashboard: Starting fetchRequests...');
      const response = await fetch('/api/admin/requests');
      console.log('AdminDashboard: Response status:', response.status);
      
      if (!response.ok) {
        console.error('AdminDashboard: Response not ok:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      console.log('AdminDashboard: Full response data:', data);
      
      if (data.success) {
        console.log('AdminDashboard: Setting requests, count:', data.data.length);
        console.log('AdminDashboard: Request details:', data.data.map((r: any) => ({ id: r.id, userEmail: r.userEmail, fileName: r.fileName })));
        setRequests(data.data);
        console.log('AdminDashboard: Requests state updated successfully');
      } else {
        console.error('AdminDashboard: API returned success=false:', data);
      }
    } catch (error) {
      console.error('AdminDashboard: Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handlePreviewRequest = (request: EncroachmentRequest) => {
    setSelectedRequest(request);
    setPreviewDialogOpen(true);
  };

  const handleActionClick = (request: EncroachmentRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setActionReason('');
    setActionComments('');
    setActionDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (selectedRequest && actionType && actionReason.trim()) {
      setActionDialogOpen(false);
      handleAction(selectedRequest.id, actionType);
    }
  };

  const handleAction = async (requestId: number, action: 'approve' | 'reject') => {
    setActionLoading(requestId);
    setMessage('');

    try {
      const response = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          requestId, 
          action, 
          notes: `${actionReason}\n\nFurther Procedure: ${actionComments}` 
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove the request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId));
        setMessage(`Request ${action}d successfully`);
        // Refresh stats after action
        fetchStats();
      } else {
        setMessage(`Failed to ${action} request`);
      }
    } catch (error) {
      setMessage(`An error occurred while ${action}ing the request`);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <AdminPanelSettings sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h3" component="h1" fontWeight="bold" color="primary">
              Admin Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage encroachment requests and system monitoring
            </Typography>
          </Box>
        </Box>

        {/* Debug Controls */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={async () => {
              console.log('=== MANUAL DEBUG TRIGGER ===');
              try {
                const debugResponse = await fetch('/api/debug/stores');
                const debugData = await debugResponse.json();
                console.log('Debug stores data:', debugData);
                
                // Test database connection
                const dbTestResponse = await fetch('/api/test-db');
                const dbTestData = await dbTestResponse.json();
                console.log('Database test:', dbTestData);
                
                // Also manually trigger fetch
                console.log('Manually triggering fetchRequests...');
                await fetchRequests();
                console.log('Manual fetchRequests completed');
              } catch (error) {
                console.error('Debug trigger error:', error);
              }
            }}
            sx={{ mr: 2 }}
          >
            Debug System & Test DB
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="secondary"
            onClick={async () => {
              try {
                const response = await fetch('/api/test-db');
                const data = await response.json();
                alert(`Database Status: ${data.database}\nMessage: ${data.message}`);
              } catch (error) {
                alert('Failed to test database connection');
              }
            }}
            sx={{ mr: 2 }}
          >
            Test Database
          </Button>
          <Typography variant="caption" color="text.secondary">
            Current requests in state: {requests.length} | Check browser console for detailed debug info
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">
                  {stats.pending}
                </Typography>
                <Typography variant="body1">
                  Pending Requests
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">
                  {stats.processedToday}
                </Typography>
                <Typography variant="body1">
                  Processed Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalThisMonth}
                </Typography>
                <Typography variant="body1">
                  Total This Month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">
                  {stats.accuracyRate}%
                </Typography>
                <Typography variant="body1">
                  Accuracy Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {message && (
          <Alert 
            severity={message.includes('success') ? 'success' : 'error'} 
            sx={{ mb: 3 }}
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        )}

        <Typography variant="h5" gutterBottom fontWeight="bold">
          Encroachment Requests
        </Typography>

        {requests.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No pending requests at this time
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All encroachment requests have been processed
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {requests.map((request) => (
              <Grid item xs={12} md={6} lg={4} key={request.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {request.userEmail}
                        </Typography>
                        <Chip
                          label={request.status}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        File: {request.fileName}
                      </Typography>
                    </Box>

                    {/* Image Preview */}
                    <Box
                      sx={{
                        height: 200,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        backgroundImage: `url(${request.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                      }}
                    >
                      {!request.imageUrl && (
                        <ImageIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                      )}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="caption">
                          Land Survey Image
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0, flexDirection: 'column', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handlePreviewRequest(request)}
                    >
                      View Details
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        startIcon={
                          actionLoading === request.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <CheckCircle />
                          )
                        }
                        onClick={() => handleActionClick(request, 'approve')}
                        disabled={actionLoading === request.id}
                      >
                        Approve
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        startIcon={
                          actionLoading === request.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <Cancel />
                          )
                        }
                        onClick={() => handleActionClick(request, 'reject')}
                        disabled={actionLoading === request.id}
                      >
                        Reject
                      </Button>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Image Preview Dialog with Details */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Encroachment Request Details
          <IconButton
            onClick={() => setPreviewDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={3}>
              {/* Image */}
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    Submitted Image
                  </Typography>
                  {selectedRequest.imageUrl ? (
                    <img
                      src={selectedRequest.imageUrl}
                      alt="Encroachment Evidence"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '400px',
                        objectFit: 'contain',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100',
                        borderRadius: 1
                      }}
                    >
                      <ImageIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Request Details */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Request Information
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>User Email:</strong></TableCell>
                      <TableCell>{selectedRequest.userEmail}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>File Name:</strong></TableCell>
                      <TableCell>{selectedRequest.fileName}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Submitted:</strong></TableCell>
                      <TableCell>{new Date(selectedRequest.submittedAt).toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Status:</strong></TableCell>
                      <TableCell>
                        <Chip 
                          label={selectedRequest.status} 
                          color="warning" 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Complaint Details */}
                {(selectedRequest as any).complaintDetails && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Complaint Details
                    </Typography>
                    <Table size="small">
                      <TableBody>
                        {(selectedRequest as any).complaintDetails.areaName && (
                          <TableRow>
                            <TableCell><strong>Area Name:</strong></TableCell>
                            <TableCell>{(selectedRequest as any).complaintDetails.areaName}</TableCell>
                          </TableRow>
                        )}
                        {(selectedRequest as any).complaintDetails.plotName && (
                          <TableRow>
                            <TableCell><strong>Plot Name:</strong></TableCell>
                            <TableCell>{(selectedRequest as any).complaintDetails.plotName}</TableCell>
                          </TableRow>
                        )}
                        {(selectedRequest as any).complaintDetails.plotNumber && (
                          <TableRow>
                            <TableCell><strong>Plot Number:</strong></TableCell>
                            <TableCell>{(selectedRequest as any).complaintDetails.plotNumber}</TableCell>
                          </TableRow>
                        )}
                        {(selectedRequest as any).complaintDetails.propertyType && (
                          <TableRow>
                            <TableCell><strong>Property Type:</strong></TableCell>
                            <TableCell>{(selectedRequest as any).complaintDetails.propertyType}</TableCell>
                          </TableRow>
                        )}
                        {(selectedRequest as any).complaintDetails.estimatedArea && (
                          <TableRow>
                            <TableCell><strong>Estimated Area:</strong></TableCell>
                            <TableCell>{(selectedRequest as any).complaintDetails.estimatedArea}</TableCell>
                          </TableRow>
                        )}
                        {((selectedRequest as any).complaintDetails.latitude || (selectedRequest as any).complaintDetails.longitude) && (
                          <TableRow>
                            <TableCell><strong>GPS Coordinates:</strong></TableCell>
                            <TableCell>
                              {(selectedRequest as any).complaintDetails.latitude}, {(selectedRequest as any).complaintDetails.longitude}
                            </TableCell>
                          </TableRow>
                        )}
                        {(selectedRequest as any).complaintDetails.contactName && (
                          <TableRow>
                            <TableCell><strong>Contact Name:</strong></TableCell>
                            <TableCell>{(selectedRequest as any).complaintDetails.contactName}</TableCell>
                          </TableRow>
                        )}
                        {(selectedRequest as any).complaintDetails.contactPhone && (
                          <TableRow>
                            <TableCell><strong>Contact Phone:</strong></TableCell>
                            <TableCell>{(selectedRequest as any).complaintDetails.contactPhone}</TableCell>
                          </TableRow>
                        )}
                        {(selectedRequest as any).complaintDetails.address && (
                          <TableRow>
                            <TableCell><strong>Address:</strong></TableCell>
                            <TableCell>{(selectedRequest as any).complaintDetails.address}</TableCell>
                          </TableRow>
                        )}
                        {(selectedRequest as any).complaintDetails.comments && (
                          <TableRow>
                            <TableCell><strong>Comments:</strong></TableCell>
                            <TableCell>{(selectedRequest as any).complaintDetails.comments}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Please provide a reason for this {actionType === 'approve' ? 'approval' : 'rejection'} and any comments about further procedure:
          </Typography>
          
          <TextField
            fullWidth
            label="Reason for Action *"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            multiline
            rows={3}
            sx={{ mt: 2, mb: 2 }}
            required
            placeholder={`Enter the reason for ${actionType === 'approve' ? 'approving' : 'rejecting'} this request...`}
          />
          
          <TextField
            fullWidth
            label="Further Procedure Comments"
            value={actionComments}
            onChange={(e) => setActionComments(e.target.value)}
            multiline
            rows={3}
            placeholder="Describe any next steps, follow-up actions required, or additional information..."
          />
          
          {selectedRequest && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2">Request Summary:</Typography>
              <Typography variant="body2">
                User: {selectedRequest.userEmail}<br/>
                File: {selectedRequest.fileName}<br/>
                Submitted: {new Date(selectedRequest.submittedAt).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAction} 
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            disabled={!actionReason.trim()}
          >
            Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;