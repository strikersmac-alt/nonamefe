import { Box, Flex, Button, Text, Avatar, DropdownMenu } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { PersonIcon, RocketIcon, PlusIcon, ExitIcon, DashboardIcon, HomeIcon, HamburgerMenuIcon } from '@radix-ui/react-icons';
import { useState, useEffect } from 'react';
import GoogleSignInButton from './OAuth';

export default function Navbar() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [scrolled, setScrolled] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Hide pulse animation after 5 seconds or on first interaction
    const timer = setTimeout(() => setShowPulse(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      logout();
      navigate('/');
    } catch (error) {
      // Silently handle logout error
    }
  };

  const handleNav = (to: string) => {
    const currentPath = window.location.pathname;
    if (to === currentPath) {
      window.location.reload();
    } else {
      navigate(to);
    }
  };

  return (
    <Box
      className={`navbar-container ${scrolled ? 'navbar-scrolled' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: scrolled
          ? 'rgba(15, 23, 42, 0.85)'
          : 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(20px)',
        borderBottom: scrolled
          ? '1px solid rgba(99, 102, 241, 0.3)'
          : '1px solid rgba(99, 102, 241, 0.1)',
        boxShadow: scrolled
          ? '0 4px 24px rgba(0, 0, 0, 0.3)'
          : '0 2px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Flex
        justify="between"
        align="center"
        px={{ initial: '4', sm: '6', md: '8' }}
        py="3"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* Logo */}
        <Flex
          align="center"
          gap="2"
          style={{ cursor: 'pointer' }}
          onClick={() => handleNav('/')}
        >
          <Box
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
              transition: 'transform 0.2s ease',
            }}
            className="logo-box"
          >
            <Text
              size="5"
              weight="bold"
              style={{
                color: 'white',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              M
            </Text>
          </Box>
          <Text
            size="5"
            weight="bold"
            style={{
              background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Poppins, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            MindMuse
          </Text>
        </Flex>

        {/* Navigation Items */}
        {user ? (
          <Flex align="center" gap="3" style={{ flexWrap: 'nowrap' }}>
            {/* Mobile Hamburger Menu - More Discoverable */}
            <Box className="mobile-menu-trigger">
              <DropdownMenu.Root onOpenChange={() => setShowPulse(false)}>
                <DropdownMenu.Trigger>
                  <Button
                    variant="ghost"
                    size="1"
                    style={{
                      cursor: 'pointer',
                      position: 'relative',
                      borderRadius: '50%',
                      padding: '0.4rem',
                      width: '34px',
                      height: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    className={showPulse ? 'hamburger-pulse' : ''}
                  >
                    <HamburgerMenuIcon width="16" height="16" />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                  style={{
                    background: 'rgba(15, 23, 42, 0.98)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    minWidth: '220px',
                    marginTop: '8px',
                  }}
                  className="mobile-navigation-menu"
                >
                  <DropdownMenu.Item
                    onClick={() => handleNav('/')}
                    style={{
                      cursor: 'pointer',
                      color: 'rgba(226, 232, 240, 0.9)',
                      padding: '0.75rem 1rem',
                      fontSize: '15px',
                    }}
                  >
                    <HomeIcon width="16" height="16" /> Home
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => handleNav('/create-contest')}
                    style={{
                      cursor: 'pointer',
                      color: 'rgba(226, 232, 240, 0.9)',
                      padding: '0.75rem 1rem',
                      fontSize: '15px',
                    }}
                  >
                    <PlusIcon width="16" height="16" /> Create Contest
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => handleNav('/join-contest')}
                    style={{
                      cursor: 'pointer',
                      color: 'rgba(226, 232, 240, 0.9)',
                      padding: '0.75rem 1rem',
                      fontSize: '15px',
                    }}
                  >
                    <RocketIcon width="16" height="16" /> Join Contest
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => handleNav('/practice')}
                    style={{
                      cursor: 'pointer',
                      color: 'rgba(226, 232, 240, 0.9)',
                      padding: '0.75rem 1rem',
                      fontSize: '15px',
                    }}
                  >
                    <DashboardIcon width="16" height="16" /> NPTEL
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Box>

            {/* Desktop Navigation */}
            <Flex
              gap="4"
              align="center"
              style={{
                display: 'none',
              }}
              className="desktop-nav"
            >
              <Button
                variant="ghost"
                size="2"
                onClick={() => handleNav('/')}
                style={{
                  cursor: 'pointer',
                  color: 'rgba(226, 232, 240, 0.9)',
                  fontWeight: 500,
                }}
              >
                <HomeIcon />
                Home
              </Button>
              <Button
                variant="ghost"
                size="2"
                onClick={() => handleNav('/create-contest')}
                style={{
                  cursor: 'pointer',
                  color: 'rgba(226, 232, 240, 0.9)',
                  fontWeight: 500,
                }}
              >
                <PlusIcon />
                Create Contest
              </Button>
              <Button
                variant="ghost"
                size="2"
                onClick={() => handleNav('/join-contest')}
                style={{
                  cursor: 'pointer',
                  color: 'rgba(226, 232, 240, 0.9)',
                  fontWeight: 500,
                }}
              >
                <RocketIcon />
                Join Contest
              </Button>
              <Button
                variant="ghost"
                size="2"
                onClick={() => handleNav('/practice')}
                style={{
                  cursor: 'pointer',
                  color: 'rgba(226, 232, 240, 0.9)',
                  fontWeight: 500,
                }}
              >
                <DashboardIcon />
                NPTEL
              </Button>
            </Flex>

            {/* User Profile Dropdown - Separated from Navigation */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button
                  variant="ghost"
                  style={{
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '50%',
                  }}
                >
                  <Avatar
                    src={user.profilePicture}
                    fallback={user.name?.charAt(0) || 'U'}
                    size="2"
                    style={{
                      border: '2px solid rgba(99, 102, 241, 0.5)',
                      boxShadow: '0 0 12px rgba(99, 102, 241, 0.3)',
                    }}
                  />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                style={{
                  background: 'rgba(15, 23, 42, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  minWidth: '180px',
                  marginTop: '8px',
                }}
              >
                <DropdownMenu.Item
                  onClick={() => navigate('/profile')}
                  style={{
                    cursor: 'pointer',
                    color: 'rgba(226, 232, 240, 0.9)',
                    padding: '0.75rem 1rem',
                    fontSize: '15px',
                  }}
                >
                  <PersonIcon width="16" height="16" /> My Profile
                </DropdownMenu.Item>
                <DropdownMenu.Separator style={{ background: 'rgba(99, 102, 241, 0.2)' }} />
                <DropdownMenu.Item
                  onClick={handleLogout}
                  style={{
                    cursor: 'pointer',
                    color: '#f87171',
                    padding: '0.75rem 1rem',
                    fontSize: '15px',
                  }}
                >
                  <ExitIcon width="16" height="16" /> Logout
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Flex>
        ) : (
          <Flex align="end" gap="3">
            {/* <Button
              variant="ghost"
              size="2"
              onClick={() => navigate('/')}
              style={{
                cursor: 'pointer',
                color: 'rgba(226, 232, 240, 0.9)',
                fontWeight: 500,
              }}
            >
              <HomeIcon />
              Home
            </Button> */}
            <Box style={{ minWidth: '110px' }}>
              <GoogleSignInButton />
            </Box>
          </Flex>
        )}
      </Flex>

    </Box>
  );
}
