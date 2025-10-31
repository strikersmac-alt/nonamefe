import { Box, Flex, Text } from '@radix-ui/themes';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, PlusIcon, RocketIcon, DashboardIcon } from '@radix-ui/react-icons';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (to: string) => {
    const currentPath = location.pathname;
    if (to === currentPath) {
      window.location.reload();
    } else {
      navigate(to);
    }
  };

  const isActive = (path: string) => location.pathname === path;
  
  // Hide bottom nav during contest play or waiting room
  const hideBottomNav = location.pathname.includes('/contest/') && 
    (location.pathname.includes('/play') || location.pathname.includes('/waiting'));
  
  if (hideBottomNav) {
    return null;
  }

  return (
    <Box
      className="bottom-nav-mobile"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.3)',
        display: 'none',
        padding: '0.4rem 0 0.5rem 0',
      }}
    >
      <Flex
        justify="between"
        align="center"
        style={{
          maxWidth: '500px',
          margin: '0 auto',
          padding: '0 0.5rem',
        }}
      >
        {/* Home */}
        <Flex
          direction="column"
          align="center"
          gap="1"
          onClick={() => handleNav('/')}
          style={{
            cursor: 'pointer',
            padding: '0.3rem 0.75rem',
            flex: 1,
            transition: 'all 0.2s ease',
          }}
        >
          <HomeIcon 
            width="20" 
            height="20" 
            style={{ color: isActive('/') ? '#60a5fa' : '#94a3b8' }} 
          />
          <Text 
            size="1" 
            style={{ 
              color: isActive('/') ? '#60a5fa' : '#94a3b8', 
              fontSize: '0.7rem', 
              fontWeight: 500 
            }}
          >
            Home
          </Text>
        </Flex>

        {/* Create */}
        <Flex
          direction="column"
          align="center"
          gap="1"
          onClick={() => handleNav('/create-contest')}
          style={{
            cursor: 'pointer',
            padding: '0.3rem 0.75rem',
            flex: 1,
            transition: 'all 0.2s ease',
          }}
        >
          <PlusIcon 
            width="20" 
            height="20" 
            style={{ color: isActive('/create-contest') ? '#60a5fa' : '#94a3b8' }} 
          />
          <Text 
            size="1" 
            style={{ 
              color: isActive('/create-contest') ? '#60a5fa' : '#94a3b8', 
              fontSize: '0.7rem', 
              fontWeight: 500 
            }}
          >
            Create
          </Text>
        </Flex>

        {/* Join */}
        <Flex
          direction="column"
          align="center"
          gap="1"
          onClick={() => handleNav('/join-contest')}
          style={{
            cursor: 'pointer',
            padding: '0.3rem 0.75rem',
            flex: 1,
            transition: 'all 0.2s ease',
          }}
        >
          <RocketIcon 
            width="20" 
            height="20" 
            style={{ color: isActive('/join-contest') ? '#60a5fa' : '#94a3b8' }} 
          />
          <Text 
            size="1" 
            style={{ 
              color: isActive('/join-contest') ? '#60a5fa' : '#94a3b8', 
              fontSize: '0.7rem', 
              fontWeight: 500 
            }}
          >
            Join
          </Text>
        </Flex>

        {/* NPTEL */}
        <Flex
          direction="column"
          align="center"
          gap="1"
          onClick={() => handleNav('/practice')}
          style={{
            cursor: 'pointer',
            padding: '0.3rem 0.75rem',
            flex: 1,
            transition: 'all 0.2s ease',
          }}
        >
          <DashboardIcon 
            width="20" 
            height="20" 
            style={{ color: isActive('/practice') ? '#60a5fa' : '#94a3b8' }} 
          />
          <Text 
            size="1" 
            style={{ 
              color: isActive('/practice') ? '#60a5fa' : '#94a3b8', 
              fontSize: '0.7rem', 
              fontWeight: 500 
            }}
          >
            NPTEL
          </Text>
        </Flex>

      </Flex>
    </Box>
  );
}
