import { Box, Flex, Text } from '@radix-ui/themes';
import '../App.css';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ message = 'Loading...', size = 'medium' }: LoadingSpinnerProps) {
  const spinnerSize = size === 'small' ? '40px' : size === 'large' ? '80px' : '60px';
  const textSize = size === 'small' ? '3' : size === 'large' ? '5' : '4';

  return (
    <Box style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 60% 20%, #203a55 0%, #12141c 60%, #090a10 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Floating Orbs */}
      <div className="floating-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <Flex direction="column" align="center" gap="4" style={{ position: 'relative', zIndex: 1 }}>
        {/* Spinner */}
        <Box className="spinner" style={{
          width: spinnerSize,
          height: spinnerSize,
          border: '4px solid rgba(99, 102, 241, 0.2)',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        
        {/* Loading Text */}
        <Text size={textSize as any} weight="medium" style={{ 
          color: 'rgba(226, 232, 240, 0.9)',
          fontFamily: 'Poppins, sans-serif',
        }}>
          {message}
        </Text>
      </Flex>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}
