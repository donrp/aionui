import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import AppLoader from '@renderer/components/layout/AppLoader';
import { ensureBrandFavicon } from '@/renderer/brand/supernodes';
import {
  type HubSpotUseCase,
  submitHubSpotLeadForm,
} from '@renderer/services/hubspot/submitLeadForm';
import { useAuth } from '../../hooks/context/AuthContext';
import { useAuthPageAnalytics } from '../../hooks/useAuthPageAnalytics';
import AuthBrandPanel from './AuthBrandPanel';
import './LoginPage.css';

type MessageState = {
  type: 'error' | 'success';
  text: string;
};

const USE_CASE_OPTIONS: { value: HubSpotUseCase; labelKey: string }[] = [
  { value: 'leadGeneration', labelKey: 'login.registerLead.useCaseLeadGeneration' },
  { value: 'aiAds', labelKey: 'login.registerLead.useCaseAiAds' },
  { value: 'contentLab', labelKey: 'login.registerLead.useCaseContentLab' },
  { value: 'nurturingLab', labelKey: 'login.registerLead.useCaseNurturingLab' },
];

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [useCases, setUseCases] = useState<HubSpotUseCase[]>([]);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const firstNameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('login-page-active');
    document.body.classList.add('login-page-active');
    ensureBrandFavicon();
    document.documentElement.lang = 'en';
    document.title = t('login.registerLead.pageTitle');
    window.setTimeout(() => firstNameRef.current?.focus(), 0);
    return () => {
      document.documentElement.classList.remove('login-page-active');
      document.body.classList.remove('login-page-active');
    };
  }, [t]);

  useAuthPageAnalytics(t('login.registerLead.pageTitle'), '#/register');

  useEffect(() => {
    if (status === 'authenticated') {
      void navigate('/guid', { replace: true });
    }
  }, [navigate, status]);

  const toggleUseCase = useCallback((value: HubSpotUseCase) => {
    setUseCases((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!firstName.trim() || !lastName.trim() || !company.trim() || !email.trim() || useCases.length === 0) {
        setMessage({ type: 'error', text: t('login.registerLead.errors.empty') });
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setMessage({ type: 'error', text: t('login.registerLead.errors.invalidEmail') });
        return;
      }

      setLoading(true);
      setMessage(null);

      const result = await submitHubSpotLeadForm(
        {
          firstname: firstName,
          lastname: lastName,
          company,
          email,
          useCases,
        },
        {
          pageUri: window.location.href,
          pageName: t('login.registerLead.pageTitle'),
        }
      );

      if (result.success) {
        setSubmitted(true);
        setMessage({ type: 'success', text: t('login.registerLead.success') });
      } else {
        setMessage({
          type: 'error',
          text: result.message || t('login.registerLead.errors.unknown'),
        });
      }

      setLoading(false);
    },
    [company, email, firstName, lastName, t, useCases]
  );

  if (status === 'checking') {
    return <AppLoader />;
  }

  return (
    <div className='login-page'>
      <div className='login-page__shell'>
      <div className='login-page__panel'>
        <div className='login-page__panel-inner login-page__panel-inner--register'>
          <div className='login-page__header'>
            <span className='login-page__eyebrow'>{t('login.registerLead.eyebrow')}</span>
            <h1 className='login-page__title'>{t('login.registerLead.title')}</h1>
            <p className='login-page__subtitle'>{t('login.registerLead.subtitle')}</p>
          </div>

        {submitted ? (
          <div className='login-page__success-panel'>
            <p className='login-page__success-title'>{t('login.registerLead.successTitle')}</p>
            <p className='login-page__success-body'>{t('login.registerLead.success')}</p>
            <Link to='/login' className='login-page__submit login-page__submit--link'>
              {t('login.registerLead.backToSignIn')}
            </Link>
          </div>
        ) : (
          <form className='login-page__form' onSubmit={handleSubmit} noValidate>
            <div className='login-page__form-row'>
              <div className='login-page__form-item login-page__form-item--half'>
                <label className='login-page__label' htmlFor='register-firstname'>
                  {t('login.registerLead.firstName')}
                  <span className='login-page__required' aria-hidden='true'>
                    *
                  </span>
                </label>
                <input
                  ref={firstNameRef}
                  id='register-firstname'
                  name='0-1/firstname'
                  type='text'
                  className='login-page__input login-page__input--plain'
                  placeholder={t('login.registerLead.firstNamePlaceholder')}
                  autoComplete='given-name'
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  aria-required='true'
                />
              </div>

              <div className='login-page__form-item login-page__form-item--half'>
                <label className='login-page__label' htmlFor='register-lastname'>
                  {t('login.registerLead.lastName')}
                  <span className='login-page__required' aria-hidden='true'>
                    *
                  </span>
                </label>
                <input
                  id='register-lastname'
                  name='0-1/lastname'
                  type='text'
                  className='login-page__input login-page__input--plain'
                  placeholder={t('login.registerLead.lastNamePlaceholder')}
                  autoComplete='family-name'
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                  aria-required='true'
                />
              </div>
            </div>

            <div className='login-page__form-item'>
              <label className='login-page__label' htmlFor='register-company'>
                {t('login.registerLead.company')}
                <span className='login-page__required' aria-hidden='true'>
                  *
                </span>
              </label>
              <input
                id='register-company'
                name='0-1/company'
                type='text'
                className='login-page__input login-page__input--plain'
                placeholder={t('login.registerLead.companyPlaceholder')}
                autoComplete='organization'
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                required
                aria-required='true'
              />
            </div>

            <div className='login-page__form-item'>
              <label className='login-page__label' htmlFor='register-email'>
                {t('login.registerLead.email')}
                <span className='login-page__required' aria-hidden='true'>
                  *
                </span>
              </label>
              <input
                id='register-email'
                name='0-1/email'
                type='email'
                inputMode='email'
                className='login-page__input login-page__input--plain'
                placeholder={t('login.registerLead.emailPlaceholder')}
                autoComplete='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                aria-required='true'
              />
            </div>

            <fieldset className='login-page__form-item login-page__checkbox-fieldset'>
              <legend className='login-page__label login-page__checkbox-legend'>
                {t('login.registerLead.challenges')}
                <span className='login-page__required' aria-hidden='true'>
                  *
                </span>
              </legend>
              <div className='login-page__checkbox-group' role='group' aria-required='true'>
                {USE_CASE_OPTIONS.map((option) => {
                  const inputId = `register-challenge-${option.value}`;
                  const checked = useCases.includes(option.value);
                  return (
                    <label key={option.value} className='login-page__checkbox-option' htmlFor={inputId}>
                      <input
                        id={inputId}
                        type='checkbox'
                        name='0-1/product_type'
                        className='login-page__checkbox-input'
                        value={option.value}
                        checked={checked}
                        onChange={() => toggleUseCase(option.value)}
                      />
                      <span>{t(option.labelKey)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className='login-page__form-actions'>
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
              <span>{loading ? t('login.registerLead.submitting') : t('login.registerLead.submit')}</span>
            </button>
            </div>

            <div
              role='alert'
              aria-live='polite'
              className={`login-page__message ${message ? 'login-page__message--visible' : ''} ${message ? (message.type === 'success' ? 'login-page__message--success' : 'login-page__message--error') : ''}`}
              hidden={!message}
            >
              {message?.text}
            </div>
          </form>
        )}

        {!submitted && (
          <p className='login-page__switch-auth'>
            {t('login.registerLead.hasAccount')}{' '}
            <Link to='/login' className='login-page__switch-auth-link'>
              {t('login.registerLead.signInLink')}
            </Link>
          </p>
        )}
        </div>
      </div>

      <AuthBrandPanel />
      </div>
    </div>
  );
};

export default RegisterPage;
