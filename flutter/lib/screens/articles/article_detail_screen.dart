import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:share_plus/share_plus.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../core/constants.dart';
import '../../core/translations.dart';
import '../../models/article_model.dart';
import '../../providers/lang_provider.dart';
import '../../services/article_service.dart';

final articleDetailProvider =
    FutureProvider.family<ArticleModel, String>((ref, slug) async {
  final service = ArticleService();
  return service.getArticleBySlug(slug);
});

class ArticleDetailScreen extends ConsumerWidget {
  final String slug;

  const ArticleDetailScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(langProvider).lang;
    final t = (String key) => AppTranslations.translate(key, lang);
    final articleAsync = ref.watch(articleDetailProvider(slug));
    final theme = Theme.of(context);

    return Scaffold(
      body: articleAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppConstants.primaryGreen),
        ),
        error: (e, _) => Scaffold(
          appBar: AppBar(),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline,
                    size: 48, color: AppConstants.errorRed),
                const SizedBox(height: 12),
                Text(e.toString().replaceAll('Exception: ', '')),
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: () => ref.refresh(articleDetailProvider(slug)),
                  child: Text(t('retry')),
                ),
              ],
            ),
          ),
        ),
        data: (article) => CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: article.coverImage != null ? 240 : 0,
              floating: false,
              pinned: true,
              leading: IconButton(
                icon: Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withAlpha(60),
                    shape: BoxShape.circle,
                  ),
                  padding: const EdgeInsets.all(6),
                  child: Icon(
                    lang == 'ar' ? Icons.arrow_forward : Icons.arrow_back,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                onPressed: () => Navigator.of(context).pop(),
              ),
              actions: [
                IconButton(
                  icon: Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withAlpha(60),
                      shape: BoxShape.circle,
                    ),
                    padding: const EdgeInsets.all(6),
                    child: const Icon(
                      Icons.share_outlined,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  onPressed: () {
                    Share.share(
                      '${article.title}\n${AppConstants.baseUrl}/articles/${article.slug}',
                    );
                  },
                ),
              ],
              flexibleSpace: article.coverImage != null
                  ? FlexibleSpaceBar(
                      background: CachedNetworkImage(
                        imageUrl: article.coverImage!,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => Container(
                          color: Colors.grey[200],
                        ),
                        errorWidget: (_, __, ___) => Container(
                          color: AppConstants.primaryGreen.withAlpha(30),
                          child: const Icon(
                            Icons.image_not_supported,
                            color: AppConstants.primaryGreen,
                            size: 48,
                          ),
                        ),
                      ),
                    )
                  : null,
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      article.title,
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Icon(Icons.remove_red_eye_outlined,
                            size: 16, color: Colors.grey[500]),
                        const SizedBox(width: 4),
                        Text(
                          '${article.views} ${t('views')}',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[500],
                          ),
                        ),
                        if (article.publishedAt != null) ...[
                          const SizedBox(width: 16),
                          Icon(Icons.schedule_outlined,
                              size: 16, color: Colors.grey[500]),
                          const SizedBox(width: 4),
                          Text(
                            timeago.format(article.publishedAt!,
                                locale: lang == 'ar' ? 'ar' : 'en'),
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[500],
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 20),
                    const Divider(),
                    const SizedBox(height: 16),
                    if (article.content != null)
                      Text(
                        article.content!,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          height: 1.8,
                          fontSize: 15,
                        ),
                      )
                    else
                      Text(
                        article.excerpt ?? '',
                        style: theme.textTheme.bodyLarge?.copyWith(
                          height: 1.8,
                        ),
                      ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
