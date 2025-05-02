
import React from 'react';
import ApiTester from '@/components/ApiTester';

const ProfilePage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Profile Page</h1>
      <div className="mb-8">
        <ApiTester />
      </div>
    </div>
  );
};

export default ProfilePage;
