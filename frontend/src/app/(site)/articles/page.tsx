'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { useT } from '@/store/langStore';
import { useState } from 'react';

function ArticleCard({ article, isAr }: { article: any; isAr: boolean }) {
  const title = isAr ? article.titleAr : article.titleEn;
  const excerpt = isAr ? article.excerptAr : article.excerptEn;
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <Link href={`/articles/${article.slug}`} className="card-lift group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all block">
      {/* Placeholder cover */}
      <div className="h-44 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 flex items-center justify-center">
        <span className="text-5xl">📖</span>
      </div>
      <div className="p-5 space-y-3">
        {article.tags && (
          <div className="flex gap-1.5 flex-wrap">
            {article.tags.split(',').slice(0, 2).map((tag: string) => (
              <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
        <h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>
        {excerpt && <p className="text-sm text-muted line-clamp-2 leading-relaxed">{excerpt}</p>}
        <div className="flex items-center justify-between text-xs text-muted pt-1">
          <span>{date}</span>
          <span>👁 {article.viewCount ?? 0}</span>
        </div>
      </div>
    </Link>
  );
}

export default function ArticlesPage() {
  const { t, isAr, dir } = useT();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['public-articles', page],
    queryFn: () => api.get(`/articles?page=${page}&limit=9`).then((r) => r.data),
  });

  const totalPages = data?.pagination?.totalPages ?? 1;

  return (
    <div dir={dir} className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold">{t('latestArticles')}</h1>
        <p className="text-muted max-w-xl mx-auto">{t('articlesDesc')}</p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 bg-border/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !data?.items?.length ? (
        <div className="text-center py-16 text-muted">
          <p className="text-5xl mb-4">📰</p>
          <p className="font-medium text-lg">{t('noArticles')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map((a: any) => (
            <ArticleCard key={a.id} article={a} isAr={isAr} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-border text-sm font-semibold disabled:opacity-40 hover:bg-border/40 transition-colors">
            {isAr ? '← السابق' : '← Prev'}
          </button>
          <span className="text-sm text-muted">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-border text-sm font-semibold disabled:opacity-40 hover:bg-border/40 transition-colors">
            {isAr ? 'التالي →' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}
