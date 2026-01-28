import { isAuthenticated } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';

export default async function Home() {
  const authenticated = await isAuthenticated();

  if (authenticated) {
    redirect('/dashboard');
  }

  return <LoginForm />;
}
