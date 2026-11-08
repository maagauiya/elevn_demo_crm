import { Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from './states';
import { PageHeader } from './page-header';
import { Panel } from './panel';

/** Заглушка экрана на время переноса. Удаляется, когда владелец трека делает настоящий экран. */
export function PlaceholderPage({ title, track, source }: { title: string; track: 'A' | 'B'; source?: string }) {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={title} />
      <Panel>
        <EmptyState
          icon={<Construction />}
          title={t('placeholder.title')}
          description={
            <>
              {t('placeholder.description', { track })}
              {source ? (
                <>
                  <br />
                  <code className="text-micro">{source}</code>
                </>
              ) : null}
            </>
          }
        />
      </Panel>
    </>
  );
}
