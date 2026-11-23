import EditionPage from '../../../../../components/EditionPage';

export const dynamic = 'force-dynamic';

export default async function OriginalStory({params, searchParams}: {
  params: Promise<{id: string}>;
  searchParams: Promise<{preview?: string}>;
}) {
  const {id} = await params;
  return <EditionPage story={id} original draft={(await searchParams).preview === 'draft'} />;
}
