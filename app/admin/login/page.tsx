import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Brand } from '@/components/brand';
import { LoginForm } from '@/components/login-form';
import { adminSession, isConfigured } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export default async function Login() {
  const configured = isConfigured();
  if (configured) {
    const session = await adminSession();
    if (session) redirect('/admin');
  }
  return (
    <main className="login-page" id="main-content">
      <div className="login-art">
        <Image
          src="/garden-illustration.svg"
          alt="Decorative botanical garden illustration"
          fill
          sizes="50vw"
          priority
        />
        <div className="login-art-copy">
          <div className="eyebrow text-[#e5d8ae]">Behind every beautiful moment</div>
          <h2>
            A little planning.
            <br />A lot of possibility.
          </h2>
          <p>Your space to manage the moments at Soleil Garden.</p>
        </div>
      </div>
      <div className="login-content">
        <div className="login-box">
          <Brand />
          <h1>Welcome back.</h1>
          <p>Sign in to your Soleil Garden workspace.</p>
          <LoginForm configured={configured} />
          <div className="login-bottom">
            <Link href="/">← Back to the garden</Link>
            <p className="mt-4 text-[10px]">
              Authorized staff only. Need access? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
