import React from 'react';
import { IconButton, Fab, Tooltip, Zoom } from '@mui/material';
import { Menu, Close } from '@mui/icons-material';

interface NavigationToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  variant?: 'header' | 'floating';
  position?: 'fixed' | 'relative';
}

const NavigationToggle: React.FC<NavigationToggleProps> = ({
  isOpen,
  onToggle,
  variant = 'floating',
  position = 'fixed'
}) => {
  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('NavigationToggle clicked, isOpen:', isOpen);
    onToggle();
  };

  if (variant === 'header') {
    return (
      <Tooltip title={isOpen ? 'Close Navigation' : 'Open Navigation'}>
        <IconButton
          onClick={handleClick}
          sx={{
            color: 'text.primary',
            '&:hover': {
              backgroundColor: 'action.hover',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {isOpen ? <Close /> : <Menu />}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Zoom in={!isOpen} timeout={300}>
      <Fab
        onClick={handleClick}
        sx={{
          position: position,
          top: 20,
          left: 20,
          zIndex: 1400, // Higher z-index to ensure visibility
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
          width: 56,
          height: 56,
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            transform: 'scale(1.1)',
            boxShadow: '0 12px 40px rgba(99, 102, 241, 0.6)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          animation: !isOpen ? 'pulse 2s infinite' : 'none',
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(1)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
            },
            '50%': {
              transform: 'scale(1.05)',
              boxShadow: '0 12px 40px rgba(99, 102, 241, 0.6)',
            },
            '100%': {
              transform: 'scale(1)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
            },
          },
          // Ensure visibility on all backgrounds
          border: '2px solid rgba(255, 255, 255, 0.1)',
          // Ensure it's clickable
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
      >
        <Menu sx={{ fontSize: 24 }} />
      </Fab>
    </Zoom>
  );
};

export default NavigationToggle;