/**
 * Self-service account registration (email + password → SQLite users table).
 * Archived for later — re-enable by swapping this back into RegisterPage.tsx
 * when per-user isolation is ready.
 */
import loginLogo from '@renderer/assets/logos/brand/supernodes.svg';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import AppLoader from '@renderer/components/layout/AppLoader';
import { ensureBrandFavicon } from '@/renderer/brand/supernodes';
import { useAuth } from '../../hooks/context/AuthContext';
import './LoginPage.css';

type MessageState = {
  type: 'error' | 'success';
  text: string;
};

const RegisterPageAccount: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status, register } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [loading, setLoading] = useState(false);

  const usernameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.body.classList.add('login-page-active');
    ensureBrandFavicon();
    document.documentElement.lang = 'en';
    document.title = t('login.registerPageTitle');
    window.setTimeout(() => usernameRef.current?.focus(), 0);
    return () => {
      document.body.classList.remove('login-page-active');
    };
  }, [t]);

  useEffect(() => {
    if (status === 'authenticated') {
      void navigate('/guid', { replace: true });
    }
  }, [navigate, status]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const trimmedUsername = username.trim();

      if (!trimmedUsername || !password || !confirmPassword) {
        setMessage({ type: 'error', text: t('login.register.errors.empty') });
        return;
      }

      if (password !== confirmPassword) {
        setMessage({ type: 'error', text: t('login.register.errors.passwordMismatch') });
        return;
      }

      setLoading(true);
      setMessage(null);

      const result = await register({ username: trimmedUsername, password });

      if (result.success) {
        setMessage({ type: 'success', text: t('login.register.success') });
        window.setTimeout(() => {
          void navigate('/guid', { replace: true });
        }, 600);
      } else {
        const errorText = (() => {
          switch (result.code) {
            case 'usernameTaken':
              return t('login.register.errors.usernameTaken');
            case 'weakPassword':
              return t('login.register.errors.weakPassword');
            case 'invalidUsername':
              return t('login.register.errors.invalidUsername');
            case 'registrationDisabled':
              return t('login.register.errors.registrationDisabled');
            case 'networkError':
              return t('login.errors.networkError');
            case 'serverError':
              return t('login.errors.serverError');
            default:
              return result.message ?? t('login.register.errors.unknown');
          }
        })();
        setMessage({ type: 'error', text: errorText });
      }

      setLoading(false);
    },
    [confirmPassword, navigate, password, register, t, username]
  );

  if (status === 'checking') {
    return <AppLoader />;
  }

  return (
    <div className='login-page'>
      <div className='login-page__card'>
        <div className='login-page__header'>
          <div className='login-page__logo'>
            <img src={loginLogo} alt={t('login.brand')} />
          </div>
          <p className='login-page__subtitle'>{t('login.register.subtitle')}</p>
        </div>

        <form className='login-page__form' onSubmit={handleSubmit}>
          <div className='login-page__form-item'>
            <label className='login-page__label' htmlFor='register-username'>
              {t('login.register.emailLabel')}
            </label>
            <div className='login-page__input-wrapper'>
              <svg
                className='login-page__input-icon'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                aria-hidden='true'
              >
                <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
                <polyline points='22,6 12,13 2,6' />
              </svg>
              <input
                ref={usernameRef}
                id='register-username'
                name='username'
                type='email'
                className='login-page__input'
                placeholder={t('login.register.emailPlaceholder')}
                autoComplete='email'
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                aria-required='true'
              />
            </div>
          </div>

          <div className='login-page__form-item'>
            <label className='login-page__label' htmlFor='register-password'>
              {t('login.password')}
            </label>
            <div className='login-page__input-wrapper'>
              <svg
                className='login-page__input-icon'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                aria-hidden='true'
              >
                <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
                <path d='M7 11V7a5 5 0 0 1 10 0v4' />
              </svg>
              <input
                id='register-password'
                name='password'
                type={passwordVisible ? 'text' : 'password'}
                className='login-page__input'
                placeholder={t('login.register.passwordPlaceholder')}
                autoComplete='new-password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-required='true'
              />
              <button
                type='button'
                className='login-page__toggle-password'
                onClick={() => setPasswordVisible((prev) => !prev)}
                aria-label={passwordVisible ? t('login.hidePassword') : t('login.showPassword')}
              >
                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                  {passwordVisible ? (
                    <>
                      <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' />
                      <line x1='1' y1='1' x2='23' y2='23' />
                    </>
                  ) : (
                    <>
                      <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
                      <circle cx='12' cy='12' r='3' />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className='login-page__form-item'>
            <label className='login-page__label' htmlFor='register-confirm-password'>
              {t('login.register.confirmPassword')}
            </label>
            <div className='login-page__input-wrapper'>
              <svg
                className='login-page__input-icon'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                aria-hidden='true'
              >
                <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
                <path d='M7 11V7a5 5 0 0 1 10 0v4' />
              </svg>
              <input
                id='register-confirm-password'
                name='confirmPassword'
                type={passwordVisible ? 'text' : 'password'}
                className='login-page__input'
                placeholder={t('login.register.confirmPasswordPlaceholder')}
                autoComplete='new-password'
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                aria-required='true'
              />
            </div>
          </div>

          <button type='submit' className='login-page__submit' disabled={loading}>
            {loading && (
              <svg className='login-page__spinner' viewBox='0 0 24 24' width='18' height='18'>
                <circle
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='3'
                  fill='none'
                  strokeDasharray='50'
                  strokeDashoffset='25'
                  strokeLinecap='round'
                />
              </svg>
            )}
            <span>{loading ? t('login.register.submitting') : t('login.register.submit')}</span>
          </button>

          <div
            role='alert'
            aria-live='polite'
            className={`login-page__message ${message ? 'login-page__message--visible' : ''} ${message ? (message.type === 'success' ? 'login-page__message--success' : 'login-page__message--error') : ''}`}
            hidden={!message}
          >
            {message?.text}
          </div>
        </form>

        <p className='login-page__switch-auth'>
          {t('login.register.hasAccount')}{' '}
          <Link to='/login' className='login-page__switch-auth-link'>
            {t('login.register.signInLink')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPageAccount;
