import EditionPage from '../../components/EditionPage';

export const metadata = {title: 'ஷபா நியூஸ் தமிழ் | உங்கள் ஊரின் செய்திகள்', description: 'தமிழகத்தின் செய்திகள், உங்கள் ஊரின் கதைகள் — ஷபா நியூஸ் தமிழ்.'};

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: {
  searchParams: Promise<{ preview?: string }>;
}) {
  return <EditionPage draft={(await searchParams).preview === 'draft'} />;
}
