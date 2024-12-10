import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../layouts/MainLayout';
import { motion } from 'framer-motion';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import { H1, H2, Body1, Caption } from '../components/ui/Typography';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <MainLayout>
      <Container>
        <div className="py-12 space-y-8">
          {/* Profile Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <H1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 
                text-transparent bg-clip-text">
                My Profile
              </H1>
              <Body1 color="secondary">View your profile information</Body1>
            </motion.div>
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center">
                    {currentUser?.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <FaUser className="w-8 h-8 text-primary-400" />
                    )}
                  </div>
                  <div>
                    <H2 className="text-xl font-semibold">{currentUser?.displayName || 'User'}</H2>
                    <Caption className="text-gray-500">{currentUser?.email}</Caption>
                  </div>
                </div>
                <Button
                  variant="error"
                  onClick={handleLogout}
                  className="text-sm flex items-center gap-2"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={currentUser?.displayName || ''}
                    disabled
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 
                      bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 
                      bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </MainLayout>
  );
} 