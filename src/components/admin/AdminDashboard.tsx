'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
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
  TableContainer,
  TableHead,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Image as ImageIcon,
  Person,
  AdminPanelSettings,
  Close,
  Visibility,
  HistoryOutlined,
} from '@mui/icons-material';
import { EncroachmentRequest } from '@/types';

// Dynamic import of LocationPicker for SSR compatibility
const LocationPicker = dynamic(
  () => import('@/components/dashboard/LocationPicker'),
  { 
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )
  }
);

const AdminDashboard: React.FC = () => {
  const [requests, setRequests] = useState<EncroachmentRequest[]>([]);
  const [processedRequests, setProcessedRequests] = useState<EncroachmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    processedToday: 0,
    totalThisMonth: 0,
    accuracyRate: 0
  });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Dialog states
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EncroachmentRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionComments, setActionComments] = useState('');

  useEffect(() => {
    fetchRequests();
    fetchProcessedRequests();
    fetchStats();
    
    // Poll for new requests every 10 seconds
    const requestsInterval = setInterval(fetchRequests, 10000);
    const processedInterval = setInterval(fetchProcessedRequests, 30000);
    const statsInterval = setInterval(fetchStats, 30000);
    
    return () => {
      clearInterval(requestsInterval);
      clearInterval(processedInterval);
      clearInterval(statsInterval);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      console.log('AdminDashboard: Fetching requests...');
      const response = await fetch('/api/admin/requests');
      const data = await response.json();
      console.log('AdminDashboard: Requests response:', data);
      
      if (data.success) {
        setRequests(data.data);
        console.log('AdminDashboard: Updated requests count:', data.data.length);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProcessedRequests = async () => {
    try {
      const response = await fetch('/api/admin/requests?status=processed');
      const data = await response.json();
      
      if (data.success) {
        setProcessedRequests(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch processed requests:', error);
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

  // Filter and search logic
  const filteredRequests = requests.filter(request => {
    // Search filter - searches in user email and filename
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      request.userEmail.toLowerCase().includes(searchLower) ||
      request.fileName.toLowerCase().includes(searchLower);
    
    // Date filter
    const requestDate = new Date(request.submittedAt);
    const now = new Date();
    let matchesDate = true;
    
    switch (dateFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        matchesDate = requestDate >= today;
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = requestDate >= weekAgo;
        break;
      case 'month':
        // Use 30 days to avoid month-end overflow issues (e.g., Jan 31 -> Feb 31 = Mar 3)
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = requestDate >= monthAgo;
        break;
      default:
        matchesDate = true;
    }
    
    return matchesSearch && matchesDate;
  });

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
        // Refresh stats and processed requests after action
        fetchStats();
        fetchProcessedRequests();
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            Encroachment Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredRequests.length} of {requests.length} requests
          </Typography>
        </Box>

        {/* Search and Filter Controls */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by user email or filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">🔍</Typography>
                    </Box>
                  ),
                  endAdornment: searchTerm && (
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={dateFilter === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setDateFilter('all')}
                  size="small"
                >
                  All Time
                </Button>
                <Button
                  variant={dateFilter === 'today' ? 'contained' : 'outlined'}
                  onClick={() => setDateFilter('today')}
                  size="small"
                >
                  Today
                </Button>
                <Button
                  variant={dateFilter === 'week' ? 'contained' : 'outlined'}
                  onClick={() => setDateFilter('week')}
                  size="small"
                >
                  This Week
                </Button>
                <Button
                  variant={dateFilter === 'month' ? 'contained' : 'outlined'}
                  onClick={() => setDateFilter('month')}
                  size="small"
                >
                  This Month
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {requests.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No pending requests at this time
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All encroachment requests have been processed
            </Typography>
          </Paper>
        ) : filteredRequests.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No requests match your search criteria
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search term or date filter
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => { setSearchTerm(''); setDateFilter('all'); }}
              sx={{ mt: 2 }}
            >
              Clear Filters
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredRequests.map((request) => (
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

        {/* Submission History Section */}
        <Box sx={{ mt: 6, mb: 4 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryOutlined />
            Submission History
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            View all processed submissions (approved and rejected)
          </Typography>

          {processedRequests.length === 0 ? (
            <Paper 
              sx={{ 
                p: 4, 
                textAlign: 'center',
                bgcolor: 'background.paper',
                border: '1px dashed',
                borderColor: 'divider'
              }}
            >
              <Typography variant="body1" color="text.secondary">
                No processed submissions yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Approved and rejected submissions will appear here
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>User Email</TableCell>
                    <TableCell>File Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted At</TableCell>
                    <TableCell>Processed At</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processedRequests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell>{request.id}</TableCell>
                      <TableCell>{request.userEmail}</TableCell>
                      <TableCell>{request.fileName}</TableCell>
                      <TableCell>
                        <Chip
                          label={request.status.toUpperCase()}
                          color={request.status === 'approved' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(request.submittedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {request.processedAt ? new Date(request.processedAt).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => {
                            setSelectedRequest(request);
                            setPreviewDialogOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
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
                          <>
                            <TableRow>
                              <TableCell><strong>GPS Coordinates:</strong></TableCell>
                              <TableCell>
                                {(selectedRequest as any).complaintDetails.latitude}, {(selectedRequest as any).complaintDetails.longitude}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell colSpan={2}>
                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    <strong>📍 Location Marked by User on Map:</strong>
                                  </Typography>
                                  {(selectedRequest as any).complaintDetails.latitude && 
                                   (selectedRequest as any).complaintDetails.longitude ? (
                                    <LocationPicker
                                      initialLat={String((selectedRequest as any).complaintDetails.latitude)}
                                      initialLng={String((selectedRequest as any).complaintDetails.longitude)}
                                      onLocationSelect={() => {}} // Read-only, no selection needed
                                      readOnly={true}
                                      height={300}
                                    />
                                  ) : (
                                    <Typography variant="body2" color="error">
                                      No valid coordinates available
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          </>
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