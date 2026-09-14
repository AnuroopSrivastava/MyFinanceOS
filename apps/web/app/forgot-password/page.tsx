import React from 'react';
import { ForgotPasswordView } from '../../src/components/ForgotPasswordView';

export const metadata = {
  title: 'Reset Password — MyFinanceOS',
  description: 'Request a secure password reset link for your MyFinanceOS account.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
