'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Box, TextField, InputAdornment, CircularProgress, Typography, ToggleButtonGroup, ToggleButton, Chip } from '@mui/material';
import { Search, MyLocation, Map as MapIcon, Satellite, Layers } from '@mui/icons-material';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Types for map components (will be loaded dynamically)
interface LocationData {
  latitude: string;
  longitude: string;
  address: string;
  areaName: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLat?: string;
  initialLng?: string;
  readOnly?: boolean;
  height?: number;
}

type MapLayer = 'street' | 'satellite' | 'hybrid';

const LocationPicker: React.FC<LocationPickerProps> = ({ 
  onLocationSelect, 
  initialLat = '19.0760',
  initialLng = '72.8777',
  readOnly = false,
  height = 400
}) => {
  const [position, setPosition] = useState<[number, number]>([
    parseFloat(initialLat) || 19.0760, 
    parseFloat(initialLng) || 72.8777
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [address, setAddress] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [mapLayer, setMapLayer] = useState<MapLayer>('street');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Dynamically import map components (client-side only)
  const [MapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    // Import Leaflet components only on client side
    const loadMapComponents = async () => {
      try {
        const L = await import('leaflet');
        
        // Fix Leaflet default marker icon issue with Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        setMapComponents({ L });
        setMapReady(true);
      } catch (error) {
        console.error('Error loading map components:', error);
      }
    };

    loadMapComponents();

    // Cleanup function to remove map on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Reverse geocoding to get address from coordinates (using Photon - better than Nominatim)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      console.log('LocationPicker: Reverse geocoding for:', { lat, lng });
      
      // Try Photon first (better results, faster)
      const photonResponse = await fetch(
        `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}&lang=en`
      );
      const photonData = await photonResponse.json();
      
      console.log('LocationPicker: Photon response:', photonData);
      
      if (photonData && photonData.features && photonData.features.length > 0) {
        const props = photonData.features[0].properties;
        const parts = [];
        
        // Build detailed address with more granular components
        if (props.housenumber) parts.push(props.housenumber);
        if (props.street) parts.push(props.street);
        if (props.name && props.name !== props.street) parts.push(props.name);
        if (props.suburb) parts.push(props.suburb);
        if (props.neighbourhood) parts.push(props.neighbourhood);
        if (props.district && props.district !== props.city) parts.push(props.district);
        if (props.city) parts.push(props.city);
        if (props.postcode) parts.push(props.postcode);
        if (props.state) parts.push(props.state);
        if (props.country) parts.push(props.country);
        
        const fullAddress = parts.join(', ');
        const areaName = props.neighbourhood || props.suburb || props.district || props.city || '';
        
        console.log('LocationPicker: Sending to parent:', { fullAddress, areaName, allProps: props });
        
        setAddress(fullAddress);
        
        // Update parent component
        onLocationSelect({
          latitude: lat.toString(),
          longitude: lng.toString(),
          address: fullAddress,
          areaName: areaName
        });
        return;
      }
      
      console.log('LocationPicker: Photon failed, trying Nominatim...');
      
      // Fallback to Nominatim if Photon fails
      const nomResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=19&addressdetails=1&extratags=1`
      );
      const nomData = await nomResponse.json();
      
      console.log('LocationPicker: Nominatim response:', nomData);
      
      if (nomData && nomData.display_name) {
        // Build more detailed address from Nominatim components
        const addr = nomData.address;
        const parts = [];
        
        if (addr?.house_number) parts.push(addr.house_number);
        if (addr?.road) parts.push(addr.road);
        if (addr?.building) parts.push(addr.building);
        if (addr?.neighbourhood) parts.push(addr.neighbourhood);
        if (addr?.suburb) parts.push(addr.suburb);
        if (addr?.city_district) parts.push(addr.city_district);
        if (addr?.city || addr?.town || addr?.village) parts.push(addr.city || addr.town || addr.village);
        if (addr?.postcode) parts.push(addr.postcode);
        if (addr?.state) parts.push(addr.state);
        if (addr?.country) parts.push(addr.country);
        
        const fullAddress = parts.length > 0 ? parts.join(', ') : nomData.display_name;
        const areaName = addr?.neighbourhood || addr?.suburb || addr?.city || '';
        
        console.log('LocationPicker: Sending to parent (Nominatim):', { fullAddress, areaName, addressComponents: addr });
        
        setAddress(fullAddress);
        
        onLocationSelect({
          latitude: lat.toString(),
          longitude: lng.toString(),
          address: fullAddress,
          areaName: areaName
        });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Set basic coordinates even if geocoding fails
      onLocationSelect({
        latitude: lat.toString(),
        longitude: lng.toString(),
        address: `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        areaName: ''
      });
    }
  };

  // Forward geocoding - search for location using Photon (better than Nominatim)
  const searchLocation = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // Try Photon first - more accurate and faster
      const photonResponse = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en`
      );
      const photonData = await photonResponse.json();

      if (photonData && photonData.features && photonData.features.length > 0) {
        const coords = photonData.features[0].geometry.coordinates; // [lng, lat]
        const newPosition: [number, number] = [coords[1], coords[0]];
        setPosition(newPosition);
        await reverseGeocode(coords[1], coords[0]);
        setIsSearching(false);
        return;
      }
      
      // Fallback to Nominatim if Photon fails
      const nomResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const nomData = await nomResponse.json();

      if (nomData && nomData.length > 0) {
        const { lat, lon } = nomData[0];
        const newPosition: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setPosition(newPosition);
        await reverseGeocode(parseFloat(lat), parseFloat(lon));
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocation(query);
      }, 1000); // 1 second debounce
    }
  };

  // Handle marker drag
  const handleMarkerDrag = (e: any) => {
    const newLat = e.target.getLatLng().lat;
    const newLng = e.target.getLatLng().lng;
    setPosition([newLat, newLng]);
    reverseGeocode(newLat, newLng);
  };

  // Handle map click
  const handleMapClick = (e: any) => {
    const newLat = e.latlng.lat;
    const newLng = e.latlng.lng;
    setPosition([newLat, newLng]);
    reverseGeocode(newLat, newLng);
    
    // Update marker position
    if (mapInstanceRef.current && MapComponents) {
      const marker = mapInstanceRef.current._marker;
      if (marker) {
        marker.setLatLng([newLat, newLng]);
      }
    }
  };

  // Get current location
  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPosition: [number, number] = [latitude, longitude];
          setPosition(newPosition);
          reverseGeocode(latitude, longitude);
          
          // Update map view
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(newPosition, 15);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapReady || !MapComponents || !mapContainerRef.current) return;
    
    // Prevent re-initialization
    if (mapInstanceRef.current) return;

    const { L } = MapComponents;
    
    // Define tile layers with better providers
    const tileLayers = {
      street: L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
      }),
      hybrid: L.layerGroup()
    };
    
    // Create the map with higher zoom levels
    const map = L.map(mapContainerRef.current, {
      center: position,
      zoom: 15,
      maxZoom: 19,
      minZoom: 3,
      layers: [tileLayers.street] // Default to street view
    });
    
    // For hybrid view, we need to add both satellite and labels
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19
    });
    const labelsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    });
    tileLayers.hybrid = L.layerGroup([satelliteLayer, labelsLayer]);
    
    // Store tile layers for layer switching
    (map as any)._tileLayers = tileLayers;
    (map as any)._currentLayer = tileLayers.street;

    // Add draggable marker
    const marker = L.marker(position, { draggable: !readOnly }).addTo(map);
    marker.bindPopup(`<b>Selected Location</b><br>Lat: ${position[0].toFixed(6)}<br>Lng: ${position[1].toFixed(6)}`);
    
    // Handle marker drag (only if not read-only)
    if (!readOnly) {
      marker.on('dragend', handleMarkerDrag);
      
      // Handle map click
      map.on('click', handleMapClick);
    }

    // Store references
    mapInstanceRef.current = map;
    mapInstanceRef.current._marker = marker;

    // Initial reverse geocode
    reverseGeocode(position[0], position[1]);

  }, [mapReady, MapComponents, readOnly]);

  // Update marker position when position state changes
  useEffect(() => {
    if (mapInstanceRef.current && mapInstanceRef.current._marker) {
      const marker = mapInstanceRef.current._marker;
      marker.setLatLng(position);
      marker.setPopupContent(`<b>Selected Location</b><br>Lat: ${position[0].toFixed(6)}<br>Lng: ${position[1].toFixed(6)}`);
      mapInstanceRef.current.setView(position, mapInstanceRef.current.getZoom());
    }
  }, [position]);

  // Handle layer change
  const handleLayerChange = (event: React.MouseEvent<HTMLElement>, newLayer: MapLayer) => {
    if (!newLayer || !mapInstanceRef.current) return;
    
    setMapLayer(newLayer);
    
    const map = mapInstanceRef.current;
    const tileLayers = (map as any)._tileLayers;
    const currentLayer = (map as any)._currentLayer;
    
    // Remove current layer
    if (currentLayer) {
      map.removeLayer(currentLayer);
    }
    
    // Add new layer
    const newTileLayer = tileLayers[newLayer];
    if (newTileLayer) {
      map.addLayer(newTileLayer);
      (map as any)._currentLayer = newTileLayer;
    }
  };

  if (!mapReady || !MapComponents) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Search Box */}
      {!readOnly && (
        <TextField
          fullWidth
          placeholder="Search for location (e.g., Mumbai, Colaba)"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {isSearching ? <CircularProgress size={20} /> : <Search />}
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <MyLocation 
                  sx={{ cursor: 'pointer', color: 'primary.main' }} 
                  onClick={handleGetCurrentLocation}
                  titleAccess="Use current location"
                />
              </InputAdornment>
            ),
          }}
        />
      )}

      {/* Map Layer Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 1 }}>
        <ToggleButtonGroup
          value={mapLayer}
          exclusive
          onChange={handleLayerChange}
          size="small"
          aria-label="map layer"
        >
          <ToggleButton value="street" aria-label="street view">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Layers sx={{ fontSize: 18 }} />
              <Typography variant="caption">Street</Typography>
            </Box>
          </ToggleButton>
          <ToggleButton value="satellite" aria-label="satellite view">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Satellite sx={{ fontSize: 18 }} />
              <Typography variant="caption">Satellite</Typography>
            </Box>
          </ToggleButton>
          <ToggleButton value="hybrid" aria-label="hybrid view">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Layers sx={{ fontSize: 18 }} />
              <Satellite sx={{ fontSize: 18, ml: -0.5 }} />
              <Typography variant="caption">Hybrid</Typography>
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
        
        <Chip 
          label={`Zoom: ${mapInstanceRef.current?.getZoom() || 15}`}
          size="small"
          variant="outlined"
        />
      </Box>

      {/* Map Container */}
      <Box 
        ref={mapContainerRef}
        sx={{ 
          height: height || 400, 
          width: '100%', 
          borderRadius: 1, 
          overflow: 'hidden', 
          mb: 2,
          '& .leaflet-container': {
            height: '100%',
            width: '100%',
          }
        }}
      />

      {/* Selected Address Display */}
      {address && (
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Selected Location:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {address}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            📍 Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </Typography>
          <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
            💡 Tip: Zoom in to level 18-19 and use Satellite view for most precise address. The closer you zoom, the more specific the address!
          </Typography>
        </Box>
      )}

      {!readOnly && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          💡 Tip: Click on the map or drag the marker to select exact location. Switch between Street, Satellite, and Hybrid views for better accuracy.
        </Typography>
      )}
    </Box>
  );
};

export default LocationPicker;
