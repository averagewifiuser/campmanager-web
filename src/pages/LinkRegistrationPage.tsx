// src/pages/LinkRegistrationPage.tsx
import { useParams } from 'react-router-dom';
import { PublicRegistrationPage } from './PublicRegistrationPage';

export const LinkRegistrationPage: React.FC = () => {
  // This component just passes the linkToken to PublicRegistrationPage
  // The PublicRegistrationPage handles both camp and link registration
  return <PublicRegistrationPage />;
};