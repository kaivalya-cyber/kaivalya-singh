import { notFound } from "next/navigation";
import { projects } from "@/content/projects";
import { ProjectPageContent } from "@/components/project-page-content";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return projects.filter((p) => p.flagship).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug && p.flagship);
  if (!project) return {};
  return {
    title: `${project.title} — Kaivalya Singh`,
    description: project.summary,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug && p.flagship);

  if (!project) {
    notFound();
  }

  const flagshipProjects = projects.filter((p) => p.flagship);
  const currentIndex = flagshipProjects.findIndex((p) => p.slug === slug);
  const prevProject = currentIndex > 0 ? flagshipProjects[currentIndex - 1] : null;
  const nextProject =
    currentIndex < flagshipProjects.length - 1
      ? flagshipProjects[currentIndex + 1]
      : null;

  return (
    <ProjectPageContent
      project={project}
      prevProject={prevProject}
      nextProject={nextProject}
    />
  );
}
