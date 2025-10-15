'use client';

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Paper,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  LocationOn,
  Terrain,
  Analytics,
} from '@mui/icons-material';

interface LandInfo {
  predictedPrice: string;
  owner: string;
  landType: string;
  soilType: string;
  area: string;
}

const BoundarySegmentation: React.FC = () => {
  const [formData, setFormData] = useState({
    state: 'Maharashtra',
    city: '',
    taluka: '',
    plotNo: '',
  });
  const [landInfo, setLandInfo] = useState<LandInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateBoundary = async () => {
    if (!formData.city || !formData.taluka || !formData.plotNo) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/segmentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setLandInfo(data.data);
      } else {
        setError('Failed to generate boundary information');
      }
    } catch (error) {
      setError('An error occurred while processing your request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Automated Boundary Segmentation
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Enter your land details to generate accurate boundary information and valuation
      </Typography>

      <Grid container spacing={4}>
        {/* Input Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Land Details
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="State"
                  value={formData.state}
                  disabled
                  variant="outlined"
                />
                
                <TextField
                  fullWidth
                  label="City"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  variant="outlined"
                  required
                />
                
                <TextField
                  fullWidth
                  label="Taluka"
                  value={formData.taluka}
                  onChange={(e) => handleInputChange('taluka', e.target.value)}
                  variant="outlined"
                  required
                />
                
                <TextField
                  fullWidth
                  label="Plot No."
                  value={formData.plotNo}
                  onChange={(e) => handleInputChange('plotNo', e.target.value)}
                  variant="outlined"
                  required
                />

                {error && (
                  <Alert severity="error">{error}</Alert>
                )}
                
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleGenerateBoundary}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <Analytics />}
                  sx={{ py: 2 }}
                >
                  {isLoading ? 'Generating...' : 'Generate Boundary'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Map and Results */}
        <Grid item xs={12} md={6}>
          {landInfo ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Map View */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <LocationOn sx={{ mr: 1 }} />
                    Map View
                  </Typography>
                  <Box
                    sx={{
                      height: 300,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '60%',
                        height: '40%',
                        border: '3px solid #FFD700',
                        borderRadius: 1,
                        backgroundColor: 'rgba(255, 215, 0, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        Your Plot: {formData.plotNo}
                      </Typography>
                    </Box>
                    <Typography variant="h6">Interactive Map</Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Information Panel */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Terrain sx={{ mr: 1 }} />
                    Land Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Predicted Price
                        </Typography>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          {landInfo.predictedPrice}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Owner
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {landInfo.owner}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Land Type
                        </Typography>
                        <Chip 
                          label={landInfo.landType} 
                          color="primary" 
                          variant="outlined" 
                          size="small"
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Soil Type
                        </Typography>
                        <Chip 
                          label={landInfo.soilType} 
                          color="secondary" 
                          variant="outlined" 
                          size="small"
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Area
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {landInfo.area}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Paper
              sx={{
                height: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="body1" color="text.secondary">
                Enter land details and click "Generate Boundary" to view results
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default BoundarySegmentation;