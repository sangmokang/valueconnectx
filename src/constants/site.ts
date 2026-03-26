export const SITE_NAME = 'ValueConnect X';
export const SITE_DESCRIPTION =
  '검증된 핵심 인재 네트워크와 기업 리더를 연결하는 Private Talent Network';

export const DESIGN_TOKENS = {
  colors: {
    primary: '#0A0A0A',
    secondary: '#1A1A1A',
    accent: '#c9a84c',
    background: '#FFFFFF',
    backgroundDark: '#0A0A0A',
    deepNavy: '#0F172A',
    textPrimary: '#0A0A0A',
    textSecondary: '#6B6B6B',
    textMuted: '#9B9B9B',
    border: '#E5E5E5',
    borderDark: '#2A2A2A',
  },
  fonts: {
    sans: 'var(--font-geist-sans)',
    mono: 'var(--font-geist-mono)',
  },
  spacing: {
    section: '120px',
    container: '1280px',
    gutter: '40px',
  },
} as const;

export const HERO_COPY = {
  h1: 'Selective Hiring\n× Selective Talent',
  paragraphs: [
    '기업은 더 적은 인원으로 높은 성과를 요구하고 있으며,\n핵심 인재 역시 아무 기업과도 매칭되지 않습니다.',
    'ValueConnect X는 검증된 핵심 인재와 의사결정자가\n신뢰 기반으로 연결되는 Private Network입니다.',
  ],
  cta: {
    primary: '멤버십 신청하기',
    secondary: '서비스 소개 보기',
  },
} as const;

export const CLOSING_COPY = {
  quote:
    '경영자, 회사, 채용 채널에 존재하는 부정적 요소를 사전에 필터링하여,\n후보자가 최선의 선택을 할 수 있도록 지속적으로 개선하고 있습니다.',
  cta: {
    primary: '멤버십 신청하기',
    secondary: '더 알아보기',
  },
} as const;
