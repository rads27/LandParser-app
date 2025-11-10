'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Divider,
} from '@mui/material';  
import {
  CloudUpload,
  Close,
  Image,
  History,
  CheckCircle,
  Cancel,
  Pending,
  Visibility,
  PhotoCamera,
} from '@mui/icons-material';
import { SubmissionHistory } from '@/types';
import dynamic from 'next/dynamic';

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
      <CircularProgress />
    </Box>
  ),
});

const EncroachmentDetection: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionHistory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionHistory[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Track if user manually edited the address (to prevent pin from moving)
  const [addressManuallyEdited, setAddressManuallyEdited] = useState(false);
  
  // Encroachment complaint form data
  const [formData, setFormData] = useState({
    areaName: '',
    plotName: '',
    plotNumber: '',
    comments: '',
    latitude: '',
    longitude: '',
    contactName: '',
    contactPhone: '',
    address: '',
    propertyType: '',
    estimatedArea: '',
  });

  useEffect(() => {
    fetchSubmissions();
    // Set up real-time polling for submission updates
    const interval = setInterval(fetchSubmissions, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSubmissions = async () => {
    try {
      // Get user email from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      let user;
      try {
        user = JSON.parse(userData);
      } catch (parseError) {
        console.error('Failed to parse user data from localStorage:', parseError);
        localStorage.removeItem('user'); // Clear corrupted data
        return;
      }
      
      const response = await fetch(`/api/encroachment?userEmail=${encodeURIComponent(user.email)}`);
      
      if (!response.ok) {
        console.error(`HTTP ${response.status}: ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSubmissions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setError('File size must be less than 5MB. Please compress your image or select a smaller file.');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreviewImage = () => {
    if (imagePreview) {
      setPreviewDialogOpen(true);
    }
  };

  const handleViewDetails = (submission: SubmissionHistory) => {
    setSelectedSubmission(submission);
    setDetailsDialogOpen(true);
  };

  const handleSubmitClick = () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    // Validate required fields
    const requiredFields = ['areaName', 'plotName', 'contactName', 'contactPhone', 'address'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData].trim());
    
    if (missingFields.length > 0) {
      setError('Please fill in all required fields: ' + missingFields.join(', '));
      return;
    }
    
    setConfirmDialogOpen(true);
  };

  const handleFormChange = (field: string, value: string) => {
    // Track if user manually edited the address field
    if (field === 'address') {
      setAddressManuallyEdited(true);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle location selection from map
  const handleLocationSelect = (location: { latitude: string; longitude: string; address: string; areaName: string }) => {
    console.log('EncroachmentDetection: Location selected:', location);
    
    // Update coordinates and area name always
    // But only update address if user hasn't manually edited it
    setFormData(prev => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
      address: addressManuallyEdited ? prev.address : location.address, // Keep manual edit if exists
      areaName: location.areaName || prev.areaName,
    }));
    
    // If we're updating from map, reset the manual edit flag (for next map interaction)
    if (!addressManuallyEdited) {
      // Address came from map, so it's not a manual edit
    }
  };

  // Debug: Log formData changes
  useEffect(() => {
    console.log('EncroachmentDetection: FormData updated:', formData);
  }, [formData]);

  const handleConfirmSubmit = () => {
    setConfirmDialogOpen(false);
    handleSubmitForReview();
  };

  const handleSubmitForReview = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSubmitSuccess('');

    try {
      // Get user email from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('User not authenticated');
        return;
      }
      
      let user;
      try {
        user = JSON.parse(userData);
      } catch (parseError) {
        console.error('Failed to parse user data:', parseError);
        setError('Authentication error. Please log in again.');
        localStorage.removeItem('user');
        return;
      }
      
      const submitFormData = new FormData();
      submitFormData.append('file', selectedFile);
      submitFormData.append('userEmail', user.email);
      
      // Add complaint details
      submitFormData.append('complaintDetails', JSON.stringify(formData));

      const response = await fetch('/api/encroachment', {
        method: 'POST',
        body: submitFormData,
      });

      if (!response.ok) {
        setError(`Server error (${response.status}). Please try again.`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setSubmitSuccess('File submitted successfully for review!');
        setSelectedFile(null);
        setImagePreview(null);
        // Reset form data
        setFormData({
          areaName: '',
          plotName: '',
          plotNumber: '',
          comments: '',
          latitude: '',
          longitude: '',
          contactName: '',
          contactPhone: '',
          address: '',
          propertyType: '',
          estimatedArea: '',
        });
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Refresh submissions
        fetchSubmissions();
      } else {
        setError(data.error || 'Failed to submit file for review');
      }
    } catch (error) {
      setError('An error occurred while submitting your file');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Pending color="warning" />;
      case 'approved':
      case 'approved (encroachment detected)':
        return <CheckCircle color="success" />;
      case 'rejected':
        return <Cancel color="error" />;
      default:
        return <Pending color="warning" />;
    }
  };

  const getStatusColor = (status: string): "success" | "error" | "warning" | "info" => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'approved':
      case 'approved (encroachment detected)':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Encroachment Detection
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Report encroachment issues with location and evidence
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column - Map and Location Details */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📍 Select Location
              </Typography>
              
              {/* Interactive Map */}
              <LocationPicker 
                onLocationSelect={handleLocationSelect}
                initialLat={formData.latitude}
                initialLng={formData.longitude}
              />

              <Divider sx={{ my: 3 }} />

              {/* Property Details */}
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                Property Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Area Name"
                    value={formData.areaName}
                    onChange={(e) => handleFormChange('areaName', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Plot Name"
                    value={formData.plotName}
                    onChange={(e) => handleFormChange('plotName', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Plot Number"
                    value={formData.plotNumber}
                    onChange={(e) => handleFormChange('plotNumber', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Property Type"
                    value={formData.propertyType}
                    onChange={(e) => handleFormChange('propertyType', e.target.value)}
                    placeholder="Residential, Commercial..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Estimated Area"
                    value={formData.estimatedArea}
                    onChange={(e) => handleFormChange('estimatedArea', e.target.value)}
                    placeholder="e.g., 1000 sq ft"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Contact & Upload */}
        <Grid item xs={12} lg={6}>
          {/* Contact Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📞 Contact Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Contact Name"
                    value={formData.contactName}
                    onChange={(e) => handleFormChange('contactName', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Contact Phone"
                    value={formData.contactPhone}
                    onChange={(e) => handleFormChange('contactPhone', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Address"
                      value={formData.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      multiline
                      rows={2}
                      required
                      helperText={
                        addressManuallyEdited 
                          ? "✏️ Manual edit preserved - pin won't move when you click the map" 
                          : "Address will auto-fill when you mark location on the map above"
                      }
                      color={addressManuallyEdited ? "success" : "primary"}
                    />
                    {addressManuallyEdited && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setAddressManuallyEdited(false)}
                        sx={{ mt: 0.5, minWidth: 'auto', whiteSpace: 'nowrap' }}
                      >
                        Enable Auto-fill
                      </Button>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Comments"
                    value={formData.comments}
                    onChange={(e) => handleFormChange('comments', e.target.value)}
                    multiline
                    rows={2}
                    placeholder="Describe the encroachment issue..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📷 Upload Evidence
              </Typography>
              
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {!selectedFile ? (
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<PhotoCamera />}
                  onClick={() => document.getElementById('file-upload')?.click()}
                  sx={{ py: 2, mb: 2 }}
                >
                  Select Image (Max 5MB)
                </Button>
              ) : (
                <Box sx={{ mb: 2 }}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      bgcolor: 'success.50'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle color="success" />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      {imagePreview && (
                        <IconButton size="small" onClick={handlePreviewImage}>
                          <Visibility />
                        </IconButton>
                      )}
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setSelectedFile(null);
                          setImagePreview(null);
                          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                      >
                        <Close />
                      </IconButton>
                    </Box>
                  </Paper>
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              )}

              {submitSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>{submitSuccess}</Alert>
              )}
                
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSubmitClick}
                disabled={!selectedFile || isSubmitting || !formData.contactName || !formData.contactPhone || !formData.address}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <CloudUpload />}
                sx={{ py: 1.5 }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Submission History - Full Width */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <History sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Submission History
                </Typography>
              </Box>
              
              {submissions.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>File Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Submitted</TableCell>
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {submission.fileName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getStatusIcon(submission.status)}
                              <Chip
                                label={submission.status}
                                size="small"
                                color={getStatusColor(submission.status)}
                                variant="outlined"
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(submission.submittedAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleViewDetails(submission)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: 'background.default',
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No submissions yet. Upload your first image to get started.
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Image Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Image Preview
          <IconButton
            onClick={() => setPreviewDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {imagePreview && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
              <Typography variant="body2" sx={{ mt: 2 }}>
                File: {selectedFile?.name}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit this image for encroachment review?
          </Typography>
          {selectedFile && (
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              File: {selectedFile.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmSubmit} variant="contained">
            Yes, Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submission Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Submission Details</Typography>
            <IconButton onClick={() => setDetailsDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedSubmission && (
            <Grid container spacing={3}>
              {/* Image Preview */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  Uploaded Image
                </Typography>
                {selectedSubmission.imageUrl ? (
                  <Box
                    component="img"
                    src={selectedSubmission.imageUrl}
                    alt={selectedSubmission.fileName}
                    sx={{
                      width: '100%',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider'
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
                    <Image sx={{ fontSize: 60, color: 'grey.400' }} />
                  </Box>
                )}
              </Grid>

              {/* Submission Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  Submission Information
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>File Name:</strong></TableCell>
                      <TableCell>{selectedSubmission.fileName}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Status:</strong></TableCell>
                      <TableCell>
                        <Chip
                          label={selectedSubmission.status}
                          size="small"
                          color={getStatusColor(selectedSubmission.status)}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Submitted:</strong></TableCell>
                      <TableCell>{new Date(selectedSubmission.submittedAt).toLocaleString()}</TableCell>
                    </TableRow>
                    {selectedSubmission.processedAt && (
                      <TableRow>
                        <TableCell><strong>Processed:</strong></TableCell>
                        <TableCell>{new Date(selectedSubmission.processedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Location Details */}
                {(selectedSubmission as any).complaintDetails && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                      Location Details
                    </Typography>
                    <Table size="small">
                      <TableBody>
                        {(selectedSubmission as any).complaintDetails.areaName && (
                          <TableRow>
                            <TableCell><strong>Area:</strong></TableCell>
                            <TableCell>{(selectedSubmission as any).complaintDetails.areaName}</TableCell>
                          </TableRow>
                        )}
                        {(selectedSubmission as any).complaintDetails.plotName && (
                          <TableRow>
                            <TableCell><strong>Plot Name:</strong></TableCell>
                            <TableCell>{(selectedSubmission as any).complaintDetails.plotName}</TableCell>
                          </TableRow>
                        )}
                        {(selectedSubmission as any).complaintDetails.address && (
                          <TableRow>
                            <TableCell><strong>Address:</strong></TableCell>
                            <TableCell>{(selectedSubmission as any).complaintDetails.address}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </>
                )}

                {/* Admin Notes */}
                {selectedSubmission.adminNotes && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="primary">
                      Admin Notes
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'info.lighter' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {selectedSubmission.adminNotes}
                      </Typography>
                    </Paper>
                  </>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EncroachmentDetection;