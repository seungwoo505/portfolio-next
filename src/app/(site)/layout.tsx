import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProjectTransitions } from '@/components/site/ProjectTransitions';
import { SiteMotion } from "@/components/site/SiteMotion";

interface SiteLayoutProps {
  children: ReactNode;
}

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="site-shell">
      <a href="#main-content" className="skip-link">본문으로 바로가기</a>
      <Header />
      <main id="main-content" tabIndex={-1}><SiteMotion><ProjectTransitions>{children}</ProjectTransitions></SiteMotion></main>
      <Footer />
    </div>
  );
}
