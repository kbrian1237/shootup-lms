import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Home,
  Dashboard,
  MenuBook,
  Schedule,
  Analytics,
  EmojiEvents,
  Settings,
  AdminPanelSettings,
  Login,
  School,
  Close
} from '@mui/icons-material';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavigationProps {
  open?: boolean;
  onNavigate?: (href: string) => void;
  onClose?: () => void;
  currentPath?: string;
}

const navigationItems: NavigationItem[] = [
  { label: 'Home', href: 'landing.html', icon: <Home /> },
  { label: 'Dashboard', href: 'dashboard.html', icon: <Dashboard /> },
  { label: 'My Courses', href: 'courses.html', icon: <MenuBook /> },
  { label: 'Schedule', href: 'schedule.html', icon: <Schedule /> },
  { label: 'Analytics', href: 'analytics.html', icon: <Analytics /> },
  { label: 'Achievements', href: 'achievements.html', icon: <EmojiEvents /> },
  { label: 'Settings', href: 'settings.html', icon: <Settings /> },
  { label: 'Admin', href: 'admin.html', icon: <AdminPanelSettings /> },
  { label: 'Login', href: 'login.html', icon: <Login /> }
];

const Navigation: React.FC<NavigationProps> = ({
  open = true,
  onNavigate,
  onClose,
  currentPath = ''
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const handleNavigationClick = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    } else {
      console.log(`Navigate to: ${href}`);
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Close Button at Top */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, pt: 2, pb: 1 }}>
        {(isMobile || onClose) && (
          <Tooltip title="Close Navigation">
            <IconButton
              onClick={onClose}
              sx={{
                color: 'text.secondary',
                backgroundColor: 'action.hover',
                '&:hover': {
                  backgroundColor: 'error.main',
                  color: 'error.contrastText',
                  transform: 'rotate(90deg)',
                },
                transition: 'all 0.3s ease',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Close />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Brand Section */}
      <Box sx={{ p: 3, pt: 0 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <School sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            sx={{ 
              background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.05em'
            }}
          >
            ShootUp
          </Typography>
        </Stack>
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.3 }} />

      {/* Navigation Items */}
      <Box sx={{ flex: 1, px: 2, py: 1 }}>
        <List>
          {navigationItems.map((item) => {
            const isActive = currentPath.includes(item.href.replace('.html', ''));
            
            return (
              <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigationClick(item.href)}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    px: 2,
                    backgroundColor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: isActive ? '100%' : '0%',
                      height: '2px',
                      backgroundColor: 'primary.main',
                      transition: 'width 0.3s ease',
                    },
                    '&:hover::before': {
                      width: '100%',
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'primary.contrastText' : 'primary.main',
                      minWidth: 40,
                      '& .MuiSvgIcon-root': {
                        fontSize: 20
                      }
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.95rem'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer/User Section */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Welcome back!
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            Student Dashboard
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        width: open ? 280 : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          boxShadow: isMobile ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          ...(isMobile ? {} : {
            transform: open ? 'translateX(0)' : 'translateX(-100%)',
          }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Navigation;