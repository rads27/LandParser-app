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
  History,
  CheckCircle,
  Cancel,
  Pending,
  Close,
  Visibility,
} from '@mui/icons-material';
import { SubmissionHistory } from '@/types';

const EncroachmentDetection: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionHistory[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [error, setError] = useState('');
  
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
      
      const user = JSON.parse(userData);
      const response = await fetch(`/api/encroachment?userEmail=${encodeURIComponent(user.email)}`);
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
      
      const user = JSON.parse(userData);
      const submitFormData = new FormData();
      submitFormData.append('file', selectedFile);
      submitFormData.append('userEmail', user.email);
      
      // Add complaint details
      submitFormData.append('complaintDetails', JSON.stringify(formData));

      const response = await fetch('/api/encroachment', {
        method: 'POST',
        body: submitFormData,
      });

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
        Upload land images for automated encroachment analysis and monitoring
      </Typography>

      <Grid container spacing={4}>
        {/* Upload Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Encroachment Complaint Details
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Property Information */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Property Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Area Name"
                        value={formData.areaName}
                        onChange={(e) => handleFormChange('areaName', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Plot Name"
                        value={formData.plotName}
                        onChange={(e) => handleFormChange('plotName', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Plot Number"
                        value={formData.plotNumber}
                        onChange={(e) => handleFormChange('plotNumber', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Property Type"
                        value={formData.propertyType}
                        onChange={(e) => handleFormChange('propertyType', e.target.value)}
                        placeholder="e.g., Residential, Commercial, Agricultural"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Estimated Area"
                        value={formData.estimatedArea}
                        onChange={(e) => handleFormChange('estimatedArea', e.target.value)}
                        placeholder="e.g., 1000 sq ft, 2 acres"
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* GPS Coordinates */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    GPS Coordinates
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Latitude"
                        value={formData.latitude}
                        onChange={(e) => handleFormChange('latitude', e.target.value)}
                        placeholder="e.g., 28.6139"
                        type="number"
                        inputProps={{ step: "any" }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Longitude"
                        value={formData.longitude}
                        onChange={(e) => handleFormChange('longitude', e.target.value)}
                        placeholder="e.g., 77.2090"
                        type="number"
                        inputProps={{ step: "any" }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Contact Information */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Contact Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Contact Name"
                        value={formData.contactName}
                        onChange={(e) => handleFormChange('contactName', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Contact Phone"
                        value={formData.contactPhone}
                        onChange={(e) => handleFormChange('contactPhone', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Property Address"
                        value={formData.address}
                        onChange={(e) => handleFormChange('address', e.target.value)}
                        multiline
                        rows={2}
                        required
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Comments */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Additional Comments
                  </Typography>
                  <TextField
                    fullWidth
                    label="Comments"
                    value={formData.comments}
                    onChange={(e) => handleFormChange('comments', e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Describe the encroachment issue, any relevant details..."
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upload Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Land Image
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: selectedFile ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <CloudUpload
                    sx={{
                      fontSize: 48,
                      color: selectedFile ? 'primary.main' : 'grey.400',
                      mb: 2,
                    }}
                  />
                  <Typography variant="h6" gutterBottom>
                    {selectedFile ? selectedFile.name : 'Click to upload image'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supported formats: JPG, PNG, GIF (Max 10MB)
                  </Typography>
                </Box>

                {error && (
                  <Alert severity="error">{error}</Alert>
                )}

                {submitSuccess && (
                  <Alert severity="success">{submitSuccess}</Alert>
                )}
                
                {/* Preview Button */}
                {selectedFile && imagePreview && (
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={handlePreviewImage}
                    startIcon={<Visibility />}
                    sx={{ py: 2, mb: 2 }}
                  >
                    Preview Image
                  </Button>
                )}
                
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSubmitClick}
                  disabled={!selectedFile || isSubmitting || !formData.areaName || !formData.plotName || !formData.contactName || !formData.contactPhone || !formData.address}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <CloudUpload />}
                  sx={{ py: 2 }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Submission History */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <History sx={{ mr: 1 }} />
                Submission History
              </Typography>
              
              {submissions.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>File Name</TableCell>
                        <TableCell>Status</TableCell>
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
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={submission.status.toLowerCase() === 'pending'}
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
    </Box>
  );
};

export default EncroachmentDetection;