'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validation';
import { Button } from './ui/button';
import { ArrowRight, LoaderCircle, Eye, EyeOff } from 'lucide-react';
export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [error, setError] = useState(''),
    [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (data) => {
        setError('');
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          router.replace('/admin');
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not sign in. Please try again.');
        }
      })}
    >
      {!configured && (
        <div className="notice mb-6">
          Admin sign-in is not configured yet. Connect Supabase and provision a staff account using
          the deployment guide.
        </div>
      )}
      <div className="form-field">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="you@example.com"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="field-error" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>
      <div className="form-field">
        <label htmlFor="password">Password</label>
        <div className="relative">
          <input
            id="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            {...register('password')}
            style={{ paddingRight: 45 }}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-3.5"
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {errors.password && (
          <p className="field-error" role="alert">
            Enter your password.
          </p>
        )}
      </div>
      {error && (
        <div className="notice error-notice mb-5" role="alert">
          {error}
        </div>
      )}
      <Button className="mt-2" disabled={isSubmitting || !configured} type="submit">
        {isSubmitting ? (
          <>
            <LoaderCircle size={15} className="animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Sign In <ArrowRight size={15} />
          </>
        )}
      </Button>
    </form>
  );
}
