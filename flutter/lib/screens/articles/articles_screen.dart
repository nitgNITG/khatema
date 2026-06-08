import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../core/constants.dart';
import '../../core/translations.dart';
import '../../models/article_model.dart';
import '../../providers/lang_provider.dart';
import '../../services/article_service.dart';
import '../../widgets/loading_shimmer.dart';

final articlesProvider = FutureProvider<List<ArticleModel>>((ref) async {
  final service = ArticleService();
  return service.getArticles();
});

class ArticlesScreen extends ConsumerWidget {
  const ArticlesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(langProvider).lang;
    final t = (String key) => AppTranslations.translate(key, lang);
    final articlesAsync = ref.watch(articlesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(t('articles'), style: const TextStyle(fontWeight: FontWeight.w700)),
        leading: IconButton(
          icon: Icon(lang == 'ar' ? Icons.arrow_forward : Icons.arrow_back),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: articlesAsync.when(
        loading: () => ListView.builder(
          itemCount: 5,
          itemBuilder: (_, __) => const ArticleCardShimmer(),
        ),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppConstants.errorRed),
              const SizedBox(height: 12),
              Text(e.toString().replaceAll('Exception: ', '')),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () => ref.refresh(articlesProvider),
                child: Text(t('retry')),
              ),
            ],
          ),
        ),
        data: (articles) {
          if (articles.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.article_outlined, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 12),
                  Text(t('noArticles'), style: TextStyle(color: Colors.grey[600])),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(articlesProvider),
            color: AppConstants.primaryGreen,
            child: ListView.builder(
              itemCount: articles.length,
              itemBuilder: (_, i) => _ArticleCard(
                article: articles[i],
                lang: lang,
                t: t,
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ArticleCard extends StatelessWidget {
  final ArticleModel article;
  final String lang;
  final String Function(String) t;

  const _ArticleCard({
    required this.article,
    required this.lang,
    required this.t,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/articles/${article.slug}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (article.coverImage != null)
              CachedNetworkImage(
                imageUrl: article.coverImage!,
                height: 180,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(
                  height: 180,
                  color: Colors.grey[200],
                  child: const Center(
                    child: Icon(Icons.image_outlined, color: Colors.grey),
                  ),
                ),
                errorWidget: (_, __, ___) => Container(
                  height: 100,
                  color: Colors.grey[100],
                  child: const Center(
                    child: Icon(Icons.broken_image_outlined, color: Colors.grey),
                  ),
                ),
              )
            else
              Container(
                height: 100,
                color: AppConstants.primaryGreen.withAlpha(20),
                child: const Center(
                  child: Icon(
                    Icons.article_rounded,
                    size: 48,
                    color: AppConstants.primaryGreen,
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    article.title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (article.excerpt != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      article.excerpt!,
                      style: theme.textTheme.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(Icons.remove_red_eye_outlined,
                          size: 14, color: Colors.grey[500]),
                      const SizedBox(width: 4),
                      Text(
                        '${article.views} ${t('views')}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[500],
                        ),
                      ),
                      if (article.publishedAt != null) ...[
                        const SizedBox(width: 12),
                        Icon(Icons.schedule_outlined,
                            size: 14, color: Colors.grey[500]),
                        const SizedBox(width: 4),
                        Text(
                          timeago.format(article.publishedAt!,
                              locale: lang == 'ar' ? 'ar' : 'en'),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                      const Spacer(),
                      Text(
                        t('readMore'),
                        style: TextStyle(
                          fontSize: 12,
                          color: AppConstants.primaryGreen,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
