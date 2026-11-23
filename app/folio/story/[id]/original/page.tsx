import EditionPage from '../../../../../components/EditionPage';
import {issue} from '../../../../../lib/storage';

export const dynamic = 'force-dynamic';

export async function generateMetadata({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const article = (await issue('folio')).articles.find(item => item.id === id);
  return article ? {title: `${article.title} | ஷபா நியூஸ் தமிழ்`, description: article.summary} : {};
}

export default async function OriginalStory({params, searchParams}: {
  params: Promise<{id: string}>;
  searchParams: Promise<{preview?: string}>;
}) {
  const {id} = await params;
  return <EditionPage story={id} original draft={(await searchParams).preview === 'draft'} />;
}
