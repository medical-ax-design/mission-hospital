import { CaregiverJourneyApp } from '../features/caregiver-journey/caregiver-journey-app';

interface PageProps {
  searchParams: Promise<{ demo?: string | string[] }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { demo } = await searchParams;

  return <CaregiverJourneyApp demoMode={demo === '1'} />;
}
