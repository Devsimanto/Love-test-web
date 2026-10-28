/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CreateLetterForm } from './components/CreateLetterForm';
import { LetterCreatedSuccess } from './components/LetterCreatedSuccess';
import { VictimView } from './components/VictimView';
import { AdminTrackerView } from './components/AdminTrackerView';
import { LetterData } from './types';
import { createLetterDirect } from './services/letterService';

export default function App() {
  const [params, setParams] = useState<{
    letterId: string | null;
    adminId: string | null;
    token: string | null;
  }>({
    letterId: null,
    adminId: null,
    token: null,
  });

  const [createdLetter, setCreatedLetter] = useState<LetterData | null>(null);

  // Parse URL search query on mount and history changes
  useEffect(() => {
    const handleLocationChange = () => {
      const searchParams = new URLSearchParams(window.location.search);
      setParams({
        letterId: searchParams.get('letter'),
        adminId: searchParams.get('admin'),
        token: searchParams.get('token'),
      });
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Quick Demo action
  const handleQuickDemo = async () => {
    try {
      const letter = await createLetterDirect({
        recipientName: 'প্রিয় মানুষ (জরিনা)',
        senderName: 'তোমার সিক্রেট প্রেমিক',
        secretMessage:
          'তুমি সত্যিই ২৫ বার কষ্ট করে "I love you" খুঁজে বের করেছ! এর মানে তোমার ভালোবাসা খাঁটি ও অকৃত্রিম। আমি তোমাকে সারাজীবন এভাবেই ভালোবেসে যেতে চাই! ❤️🎉💍',
      });
      setCreatedLetter(letter);
    } catch (e) {
      alert('ডেমো তৈরি করতে ব্যর্থ হয়েছে');
    }
  };

  // 1. If URL has ?letter=..., show Victim View
  if (params.letterId) {
    return <VictimView letterId={params.letterId} />;
  }

  // 2. If URL has ?admin=...&token=..., show Admin Tracker View
  if (params.adminId && params.token) {
    return <AdminTrackerView letterId={params.adminId} adminToken={params.token} />;
  }

  // 3. If a letter was just created, show Success with both links
  if (createdLetter) {
    return (
      <LetterCreatedSuccess
        letter={createdLetter}
        onGoToAdmin={() => {
          // Update URL to admin tracker
          const url = new URL(window.location.href);
          url.search = `?admin=${createdLetter.id}&token=${createdLetter.adminToken}`;
          window.history.pushState({}, '', url.toString());
          setParams({
            letterId: null,
            adminId: createdLetter.id,
            token: createdLetter.adminToken || null,
          });
        }}
      />
    );
  }

  // 4. Default: Show Creator Form
  return (
    <CreateLetterForm
      onCreated={(letter) => setCreatedLetter(letter)}
      onQuickDemo={handleQuickDemo}
    />
  );
}
