import authPanelBg from '@renderer/assets/logos/brand/auth-panel-gradient.avif';
import loginLogoWhite from '@renderer/assets/logos/brand/supernodes-white.png';
import React from 'react';
import { useTranslation } from 'react-i18next';

const AuthBrandPanel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <aside
      className='login-page__brand'
      aria-label={t('login.brandPanelAria')}
      style={{ backgroundImage: `url(${authPanelBg})` }}
    >
      <div className='login-page__brand-inner'>
        <div className='login-page__brand-logo-wrap'>
          <img src={loginLogoWhite} alt={t('login.brand')} className='login-page__brand-logo' />
        </div>

        <div className='login-page__brand-middle'>
          <div className='login-page__notif-stack'>
            <div className='login-page__notif'>
              <div className='login-page__notif-ico login-page__notif-ico--mint'>
                <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'>
                  <path d='M4 20V8m0 8 5-5 4 4 7-8' />
                </svg>
              </div>
              <div>
                <h4>{t('login.brandPanel.notif1Title')}</h4>
                <p>{t('login.brandPanel.notif1Body')}</p>
              </div>
            </div>
            <div className='login-page__notif'>
              <div className='login-page__notif-ico login-page__notif-ico--sand'>
                <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
                  <rect x='3' y='5' width='14' height='14' rx='2' />
                  <path d='M17 10l4-2v8l-4-2' />
                </svg>
              </div>
              <div>
                <h4>{t('login.brandPanel.notif2Title')}</h4>
                <p>{t('login.brandPanel.notif2Body')}</p>
              </div>
            </div>
            <div className='login-page__notif'>
              <div className='login-page__notif-ico login-page__notif-ico--sky'>
                <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'>
                  <rect x='3' y='3' width='18' height='18' rx='2' />
                  <path d='M3 9h18M9 21V9' />
                </svg>
              </div>
              <div>
                <h4>{t('login.brandPanel.notif3Title')}</h4>
                <p>{t('login.brandPanel.notif3Body')}</p>
              </div>
            </div>
            <div className='login-page__notif'>
              <div className='login-page__notif-ico login-page__notif-ico--orchid'>
                <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
                  <path d='M12 3v3m0 12v3m9-9h-3M6 12H3m13.5-7.5-2 2m-7 7-2 2m11 0-2-2m-7-7-2-2' />
                </svg>
              </div>
              <div>
                <h4>{t('login.brandPanel.notif4Title')}</h4>
                <p>{t('login.brandPanel.notif4Body')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className='login-page__brand-stats'>
          <div className='login-page__brand-stat'>
            <h4>{t('login.brandPanel.stat1Title')}</h4>
            <p>{t('login.brandPanel.stat1Body')}</p>
          </div>
          <div className='login-page__brand-stat'>
            <h4>{t('login.brandPanel.stat2Title')}</h4>
            <p>{t('login.brandPanel.stat2Body')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AuthBrandPanel;
