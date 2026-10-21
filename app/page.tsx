import { Hero } from "@/components/hero";
import { Statement } from "@/components/statement";
import { AboutSection } from "@/components/about-section";
import { ProjectsSection } from "@/components/projects/projects-section";
import { BlogSection } from "@/components/blog/blog-section";
import { JobMatchSection } from "@/components/ai/job-match-section";
import { ContactFooter } from "@/components/contact-footer";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Statement />
        <AboutSection />
        <ProjectsSection />
        <BlogSection />
        <JobMatchSection />
      </main>
      <ContactFooter />
    </>
  );
}
