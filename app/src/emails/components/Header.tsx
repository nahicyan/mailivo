// app/src/emails/components/Header.tsx
import React from 'react';
import { Text } from '@react-email/components';

interface HeaderProps {
  className?: string;
}

export function Header({ className = '' }: HeaderProps) {
  return (
    <Text
      className={`text-center text-2xl font-bold text-gray-800 py-4 ${className}`}
      style={{
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1f2937',
        padding: '16px 0',
      }}
    >
      Landivo
    </Text>
  );
}

export default Header;