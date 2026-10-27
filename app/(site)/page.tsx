import { Suspense } from "react";
import { Hero } from "@/components/hero";
import { Statement } from "@/components/statement";
import { AboutSection } from "@/components/about-section";
import { ProjectsSection } from "@/components/projects/projects-section";
import { CertificationsSection } from "@/components/certifications/certifications-section";
import { ActivitiesSection } from "@/components/activities/activities-section";
import { BlogSection } from "@/components/blog/blog-section";
import { JobMatchSection } from "@/components/ai/job-match-section";
import { ContactFooter } from "@/components/contact-footer";
import { getPublicActivities, getPublicCertifications, getPublicPosts, getPublicProjects, getPublicSettings } from "@/lib/public-api";

async function HomeContent() {
  const [projects, certifications, activities, posts, settings] = await Promise.all([
    getPublicProjects(),
    getPublicCertifications(),
    getPublicActivities(),
    getPublicPosts(),
    getPublicSettings(),
  ]);

  return (
    <>
      <main>
        <Hero settings={settings} projectCount={projects.length} certificationCount={certifications.length} />
        <Statement />
        <AboutSection settings={settings} />
        <ProjectsSection projects={projects} />
        <CertificationsSection certifications={certifications} />
        <ActivitiesSection activities={activities} />
        <BlogSection posts={posts} />
        <JobMatchSection />
      </main>
      <ContactFooter settings={settings} />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
