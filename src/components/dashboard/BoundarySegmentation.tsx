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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
    village: '',
    plotNo: '',
    surveyNo: '',
    areaSize: '',
    areaUnit: 'sq.m',
    latitude: '',
    longitude: '',
    pinCode: '',
    cadastralId: '',
    imageFile: null as File | null,
  });
  const [landInfo, setLandInfo] = useState<LandInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file?: File | null) => {
    setFormData(prev => ({ ...prev, imageFile: file || null }));
  };

  const [segmentationImage, setSegmentationImage] = useState<string>('');
  const [segmentationFeatures, setSegmentationFeatures] = useState<any | null>(null);

  const handleGenerateBoundary = async () => {
    // Required fields: city, taluka, village, plotNo, areaSize, areaUnit, latitude, longitude
    if (!formData.city || !formData.taluka || !formData.village || !formData.plotNo || !formData.areaSize || !formData.areaUnit || !formData.latitude || !formData.longitude) {
      setError('Please fill in all required fields (city, taluka, village, plot no, area, coordinates)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Send as multipart/form-data to allow file upload
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k === 'imageFile') return;
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      if (formData.imageFile) fd.append('imageFile', formData.imageFile);

      const response = await fetch('/api/segmentation', {
        method: 'POST',
        body: fd,
      });

      const data = await response.json();

      if (data.success) {
        // show basic info immediately and set predictedPrice to placeholder while we call the ML predictor
        setLandInfo({
          predictedPrice: 'Predicting...',
          owner: data.data.owner || 'N/A',
          landType: data.data.landType || 'Unknown',
          soilType: data.data.soilType || 'Unknown',
          area: data.data.features && Number.isFinite(data.data.features.area_m2) ? `${data.data.features.area_m2.toFixed(2)} m²` : 'Unknown',
        });
        // store segmentation image separately
        setSegmentationImage(data.data.segmentationImage || '');
        const features = data.data.features || null;
        setSegmentationFeatures(features);

        // Call ML prediction API (Python-backed) if we have area info
        try {
          const payload: any = {};
          if (features && Number.isFinite(features.area_m2)) payload.area_m2 = features.area_m2;
          if (features && Number.isFinite(features.ndvi_mean)) payload.ndvi_mean = features.ndvi_mean;
          if (data.data.landType) payload.landType = data.data.landType;
          if (data.data.soilType) payload.soilType = data.data.soilType;

          // only call if we have at least area
          if (payload.area_m2) {
            (async () => {
              try {
                const resp = await fetch('/api/price/predict', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                const json = await resp.json();
                if (json.success && json.data && typeof json.data.prediction === 'number') {
                  const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(json.data.prediction);
                  setLandInfo(prev => prev ? { ...prev, predictedPrice: formatted } : prev);
                } else {
                  setLandInfo(prev => prev ? { ...prev, predictedPrice: 'N/A' } : prev);
                }
              } catch (e) {
                console.error('Price prediction failed', e);
                setLandInfo(prev => prev ? { ...prev, predictedPrice: 'N/A' } : prev);
              }
            })();
          }
        } catch (e) {
          console.error('Failed to request prediction', e);
        }
      } else {
        setError('Failed to generate boundary information');
      }
    } catch (error) {
      console.error(error);
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
                  label="Village"
                  value={formData.village}
                  onChange={(e) => handleInputChange('village', e.target.value)}
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

                <TextField
                  fullWidth
                  label="Survey No."
                  value={formData.surveyNo}
                  onChange={(e) => handleInputChange('surveyNo', e.target.value)}
                  variant="outlined"
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="Area Size"
                    value={formData.areaSize}
                    onChange={(e) => handleInputChange('areaSize', e.target.value)}
                    variant="outlined"
                    type="number"
                    required
                  />
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel id="area-unit-label">Unit</InputLabel>
                    <Select
                      labelId="area-unit-label"
                      value={formData.areaUnit}
                      label="Unit"
                      onChange={(e) => handleInputChange('areaUnit', String(e.target.value))}
                    >
                      <MenuItem value="sq.m">sq.m</MenuItem>
                      <MenuItem value="m2">m²</MenuItem>
                      <MenuItem value="hectares">hectares</MenuItem>
                      <MenuItem value="acres">acres</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    variant="outlined"
                    required
                  />
                  <TextField
                    fullWidth
                    label="Longitude"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    variant="outlined"
                    required
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="PIN Code"
                    value={formData.pinCode}
                    onChange={(e) => handleInputChange('pinCode', e.target.value)}
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    label="Cadastral / Map ID"
                    value={formData.cadastralId}
                    onChange={(e) => handleInputChange('cadastralId', e.target.value)}
                    variant="outlined"
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Upload satellite crop or screenshot (recommended 512-2048px)
                  </Typography>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                  />
                </Box>

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
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {segmentationImage ? (
                      <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                        <img src={segmentationImage} alt="Segmentation" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    ) : (
                      <Box sx={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="h6">Interactive Map</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {segmentationFeatures && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6">Segmentation Results</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">Area (m²): {Number.isFinite(segmentationFeatures.area_m2) ? segmentationFeatures.area_m2.toFixed(2) : 'N/A'}</Typography>
                      {Number.isFinite(segmentationFeatures.ndvi_mean) ? (
                        <Typography variant="body2">NDVI (mean): {segmentationFeatures.ndvi_mean.toFixed(3)}</Typography>
                      ) : null}
                      {Number.isFinite(segmentationFeatures.distance_to_road_m) ? (
                        <Typography variant="body2">Distance to road (m): {segmentationFeatures.distance_to_road_m.toFixed(2)}</Typography>
                      ) : null}
                      <Box sx={{ mt: 2 }}>
                        {segmentationImage && (
                          <Button variant="outlined" href={segmentationImage} download={`segmentation-${formData.plotNo || 'plot'}.svg`}>
                            Download Segmentation
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

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