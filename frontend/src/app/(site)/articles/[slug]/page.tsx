'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useT } from '@/store/langStore';

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, isAr, dir } = useT();

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => api.get(`/articles/${slug}`).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="space-y-4">
          <div className="h-8 bg-border/50 rounded-xl w-3/4 animate-pulse" />
          <div className="h-4 bg-border/50 rounded-xl w-1/2 animate-pulse" />
          <div className="h-64 bg-border/50 rounded-2xl animate-pulse mt-8" />
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-muted">
        <p className="text-5xl mb-4">📭</p>
        <p className="font-medium text-lg">{isAr ? 'المقال غير موجود' : 'Article not found'}</p>
        <Link href="/articles" className="mt-6 inline-block btn-duo btn-duo-primary text-sm px-6 py-2.5">
          {t('backToArticles')}
        </Link>
      </div>
    );
  }

  const title = isAr ? article.titleAr : article.titleEn;
  const content = isAr ? article.contentAr : article.contentEn;
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  return (
    <div dir={dir} className="max-w-3xl mx-auto px-4 py-12">
      {/* Back link */}
      <Link href="/articles" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-8">
        {isAr ? '→ العودة للمقالات' : '← Back to Articles'}
      </Link>

      {/* Header */}
      <div className="space-y-4 mb-8">
        {article.tags && (
          <div className="flex gap-2 flex-wrap">
            {article.tags.split(',').map((tag: string) => (
              <span key={tag} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">{title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted">
          {date && <span>{t('publishedOn')}: {date}</span>}
          <span>👁 {article.viewCount ?? 0} {t('views')}</span>
        </div>
      </div>

      {/* Cover placeholder */}
      <div className="h-56 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 rounded-2xl flex items-center justify-center mb-8">
        <span className="text-6xl">📖</span>
      </div>

      {/* Content */}
      <div
        className="prose prose-lg max-w-none text-foreground
          prose-headings:font-extrabold prose-headings:text-foreground
          prose-p:text-foreground prose-p:leading-relaxed
          prose-li:text-foreground prose-strong:text-foreground
          prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
          prose-p:mb-4 prose-ul:my-4 prose-li:mb-1"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Share CTA */}
      <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-2xl text-center space-y-3">
        <p className="font-bold text-lg">
          {isAr ? 'هل أعجبك المقال؟ شارك الختمة مع من تحب' : 'Liked the article? Share Khatma with loved ones'}
        </p>
        <Link href="/register" className="btn-duo btn-duo-primary text-sm px-6 py-2.5 inline-flex">
          {isAr ? 'ابدأ ختمتك الآن' : 'Start your Khatma now'}
        </Link>
      </div>
    </div>
  );
}
