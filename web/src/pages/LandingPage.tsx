import styled from 'styled-components';

import CtaSection from '../components/landing/CtaSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HeroSection from '../components/landing/HeroSection';
import LandingFooter from '../components/landing/LandingFooter';
import LandingHeader from '../components/landing/LandingHeader';
import StepsSection from '../components/landing/StepsSection';

const Page = styled.div`
  min-height: 100dvh;
  background-color: var(--primary-grey);
`;

function LandingPage() {
  return (
    <Page>
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <StepsSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </Page>
  );
}

export default LandingPage;
