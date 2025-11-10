import Layout from '@/components/Layout';
import AnalysisDetailClient from './AnalysisDetailClient';

export default async function AnalysisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Layout>
      <AnalysisDetailClient id={id} />
    </Layout>
  );
}