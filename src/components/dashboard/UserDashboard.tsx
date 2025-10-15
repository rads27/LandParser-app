'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Map,
  AttachMoney,
  Security,
} from '@mui/icons-material';
import BoundarySegmentation from './BoundarySegmentation';
import EncroachmentDetection from './EncroachmentDetection';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const UserDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="primary">
          Welcome to LandParser Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Your comprehensive land management and analysis platform
        </Typography>

        {/* Dashboard Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Map sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Land Analysis
                  </Typography>
                </Box>
                <Typography variant="body2">
                  Advanced boundary segmentation and land mapping tools
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoney sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Price Prediction
                  </Typography>
                </Box>
                <Typography variant="body2">
                  AI-powered land valuation and ownership details
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Security sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Encroachment Detection
                  </Typography>
                </Box>
                <Typography variant="body2">
                  Protect your land with automated monitoring
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ width: '100%', borderRadius: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
              <Tab
                icon={<Map />}
                label="Boundary Segmentation"
                id="dashboard-tab-0"
                aria-controls="dashboard-tabpanel-0"
              />
              <Tab
                icon={<Security />}
                label="Encroachment Detection"
                id="dashboard-tab-1"
                aria-controls="dashboard-tabpanel-1"
              />
            </Tabs>
          </Box>
          <TabPanel value={tabValue} index={0}>
            <BoundarySegmentation />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <EncroachmentDetection />
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default UserDashboard;