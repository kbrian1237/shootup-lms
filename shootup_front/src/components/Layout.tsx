import React, { useState, useCallback, useEffect } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Navigation from './Navigation';
import NavigationToggle from './NavigationToggle';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  currentPath?: string;
  onNavigate?: (href: string) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  showNavigation = true,
  currentPath = '',
  onNavigate
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [navigationOpen, setNavigationOpen] = useState(!isMobile);

  // Debug effect to track state changes
  useEffect(() => {
    console.log('Navigation state changed:', navigationOpen);
  }, [navigationOpen]);

  const handleToggleNavigation = useCallback(() => {
    console.log('Toggle navigation called, current state:', navigationOpen);
    setNavigationOpen(prev => {
      const newState = !prev;
      console.log('Setting navigation to:', newState);
      return newState;
    });
  }, [navigationOpen]);

  const handleCloseNavigation = useCallback(() => {
    console.log('Close navigation called');
    setNavigationOpen(false);
  }, []);

  // Handle responsive behavior
  useEffect(() => {
    if (isMobile && navigationOpen) {
      // On mobile, close navigation by default
      setNavigationOpen(false);
    }
  }, [isMobile]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {showNavigation && (
        <>
          <Navigation
            open={navigationOpen}
            currentPath={currentPath}
            onNavigate={onNavigate}
            onClose={handleCloseNavigation}
          />
          
          {/* Toggle Button - shows when navigation is closed */}
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: 1500,
              pointerEvents: navigationOpen ? 'none' : 'auto',
            }}
          >
            <NavigationToggle
              isOpen={navigationOpen}
              onToggle={handleToggleNavigation}
              variant="floating"
              position="fixed"
            />
          </Box>
        </>
      )}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          backgroundColor: 'background.default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          marginLeft: showNavigation && navigationOpen && !isMobile ? 0 : 0,
          width: showNavigation && navigationOpen && !isMobile 
            ? 'calc(100% - 280px)' 
            : '100%',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;