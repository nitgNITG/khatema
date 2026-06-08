import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../core/constants.dart';
import '../../core/translations.dart';
import '../../providers/auth_provider.dart';
import '../../providers/lang_provider.dart';
import '../../providers/khatma_provider.dart';
import '../../providers/notification_provider.dart';
import '../../services/khatma_service.dart';
import '../../screens/articles/articles_screen.dart';
import '../../widgets/loading_shimmer.dart';
import 'khatma_card.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _navIndex = 0;

  String _greeting(String lang) {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 12) {
      return AppTranslations.translate('goodMorning', lang);
    } else if (hour >= 12 && hour < 18) {
      return AppTranslations.translate('goodAfternoon', lang);
    } else if (hour >= 18 && hour < 21) {
      return AppTranslations.translate('goodEvening', lang);
    } else {
      return AppTranslations.translate('goodNight', lang);
    }
  }

  Future<void> _joinKhatma(String id, bool requireApproval) async {
    final lang = ref.read(langProvider).lang;
    final t = (String key) => AppTranslations.translate(key, lang);
    try {
      final service = KhatmaService();
      await service.joinKhatma(id);
      Fluttertoast.showToast(
        msg: requireApproval ? t('joinRequestSent') : t('joinedKhatma'),
        backgroundColor: AppConstants.primaryGreen,
        textColor: Colors.white,
      );
      ref.read(myKhatmasProvider.notifier).refresh();
    } catch (e) {
      Fluttertoast.showToast(
        msg: e.toString().replaceAll('Exception: ', ''),
        backgroundColor: AppConstants.errorRed,
        textColor: Colors.white,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(langProvider).lang;
    final t = (String key) => AppTranslations.translate(key, lang);
    final authState = ref.watch(authProvider);
    final unreadCount = ref.watch(unreadCountProvider);
    final theme = Theme.of(context);

    final pages = [
      _HomeTab(
        greeting: _greeting(lang),
        lang: lang,
        t: t,
        authState: authState,
        onJoin: _joinKhatma,
      ),
      _DiscoverTab(lang: lang, t: t, onJoin: _joinKhatma),
      const _ArticlesTab(),
      const _ProfileTab(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Khatema',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            color: theme.colorScheme.primary,
            fontSize: 22,
          ),
        ),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () => context.push('/notifications'),
              ),
              if (unreadCount > 0)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    width: 18,
                    height: 18,
                    decoration: const BoxDecoration(
                      color: AppConstants.errorRed,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        unreadCount > 9 ? '9+' : '$unreadCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
          TextButton(
            onPressed: () => ref.read(langProvider.notifier).toggleLanguage(),
            child: Text(
              lang == 'ar' ? 'EN' : 'ع',
              style: TextStyle(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w700,
                fontSize: 15,
              ),
            ),
          ),
        ],
      ),
      body: IndexedStack(
        index: _navIndex,
        children: pages,
      ),
      floatingActionButton: _navIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () => context.push('/create-khatma'),
              icon: const Icon(Icons.add),
              label: Text(t('createKhatma')),
              backgroundColor: AppConstants.primaryGreen,
              foregroundColor: Colors.white,
            )
          : null,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _navIndex,
        onTap: (i) => setState(() => _navIndex = i),
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.home_outlined),
            activeIcon: const Icon(Icons.home_rounded),
            label: t('home'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.explore_outlined),
            activeIcon: const Icon(Icons.explore_rounded),
            label: t('discover'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.article_outlined),
            activeIcon: const Icon(Icons.article_rounded),
            label: t('articles'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.person_outlined),
            activeIcon: const Icon(Icons.person_rounded),
            label: t('profile'),
          ),
        ],
      ),
    );
  }
}

// ─── Articles tab embedded ────────────────────────────────────────────────────

class _ArticlesTab extends ConsumerWidget {
  const _ArticlesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(langProvider).lang;
    final t = (String key) => AppTranslations.translate(key, lang);
    final articlesAsync = ref.watch(articlesProvider);

    return articlesAsync.when(
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
            itemBuilder: (_, i) {
              final article = articles[i];
              return _ArticleCardTile(article: article, lang: lang, t: t);
            },
          ),
        );
      },
    );
  }
}

class _ArticleCardTile extends StatelessWidget {
  final dynamic article;
  final String lang;
  final String Function(String) t;

  const _ArticleCardTile({
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
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: AppConstants.primaryGreen.withAlpha(20),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.article_rounded,
                  color: AppConstants.primaryGreen,
                  size: 28,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      article.title,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${article.views} ${t('views')}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Profile tab embedded ─────────────────────────────────────────────────────

class _ProfileTab extends ConsumerWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(langProvider).lang;
    final t = (String key) => AppTranslations.translate(key, lang);
    final authState = ref.watch(authProvider);
    final myKhatmasAsync = ref.watch(myKhatmasProvider);
    final user = authState.user;
    final theme = Theme.of(context);

    final khatmas = myKhatmasAsync.valueOrNull ?? [];
    final completedCount = khatmas.where((k) => k.status == 'completed').length;
    final totalPartsRead = khatmas.fold<int>(0, (sum, k) => sum + k.completedParts);

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(authProvider.notifier).refreshUser();
        await ref.read(myKhatmasProvider.notifier).refresh();
      },
      color: AppConstants.primaryGreen,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 44,
                    backgroundColor: AppConstants.primaryGreen.withAlpha(30),
                    child: Text(
                      user?.initials ?? 'U',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: AppConstants.primaryGreen,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user?.displayName ?? '',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(user?.email ?? '', style: theme.textTheme.bodyMedium),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: () => context.push('/edit-profile'),
                    icon: const Icon(Icons.edit_outlined, size: 16),
                    label: Text(t('editProfile')),
                    style: OutlinedButton.styleFrom(
                        minimumSize: const Size(160, 40)),
                  ),
                ],
              ),
            ),
            const Divider(),
            Padding(
              padding: const EdgeInsets.all(16),
              child: GridView.count(
                crossAxisCount: 3,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 0.85,
                children: [
                  _StatCard(
                    value: '${khatmas.length}',
                    label: t('totalKhatmas'),
                    icon: Icons.auto_stories_rounded,
                    color: AppConstants.primaryGreen,
                  ),
                  _StatCard(
                    value: '$completedCount',
                    label: t('completedKhatmas'),
                    icon: Icons.check_circle_outline_rounded,
                    color: AppConstants.successGreen,
                  ),
                  _StatCard(
                    value: '$totalPartsRead',
                    label: t('partsRead'),
                    icon: Icons.menu_book_rounded,
                    color: AppConstants.primaryBlue,
                  ),
                ],
              ),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.settings_outlined, color: AppConstants.primaryGreen),
              title: Text(t('settings')),
              trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
              onTap: () => context.push('/settings'),
            ),
            ListTile(
              leading: const Icon(Icons.notifications_outlined, color: AppConstants.primaryGreen),
              title: Text(t('notifications')),
              trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
              onTap: () => context.push('/notifications'),
            ),
            ListTile(
              leading: const Icon(Icons.info_outline_rounded, color: AppConstants.primaryGreen),
              title: Text(t('about')),
              trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
              onTap: () => context.push('/about'),
            ),
            const Divider(),
            Padding(
              padding: const EdgeInsets.all(16),
              child: OutlinedButton.icon(
                onPressed: () => _confirmLogout(context, ref, t),
                icon: const Icon(Icons.logout_rounded, color: AppConstants.errorRed),
                label: Text(
                  t('logout'),
                  style: const TextStyle(color: AppConstants.errorRed),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppConstants.errorRed),
                  foregroundColor: AppConstants.errorRed,
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmLogout(
    BuildContext context,
    WidgetRef ref,
    String Function(String) t,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(t('logout')),
        content: Text(t('logoutConfirm')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(t('cancel')),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.errorRed,
              minimumSize: const Size(80, 40),
            ),
            child: Text(t('logout')),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(authProvider.notifier).logout();
    }
  }
}

class _StatCard extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.value,
    required this.label,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withAlpha(25),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: theme.textTheme.headlineSmall?.copyWith(
                color: color,
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              label,
              style: theme.textTheme.bodySmall,
              textAlign: TextAlign.center,
              maxLines: 2,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Home Tab ─────────────────────────────────────────────────────────────────

class _HomeTab extends ConsumerWidget {
  final String greeting;
  final String lang;
  final String Function(String) t;
  final dynamic authState;
  final Future<void> Function(String, bool) onJoin;

  const _HomeTab({
    required this.greeting,
    required this.lang,
    required this.t,
    required this.authState,
    required this.onJoin,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final myKhatmasAsync = ref.watch(myKhatmasProvider);
    final theme = Theme.of(context);

    return RefreshIndicator(
      onRefresh: () => ref.read(myKhatmasProvider.notifier).refresh(),
      color: AppConstants.primaryGreen,
      child: CustomScrollView(
        slivers: [
          // Welcome banner
          SliverToBoxAdapter(
            child: _WelcomeBanner(greeting: greeting, t: t, authState: authState),
          ),

          // My khatmas header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    t('myKhatmas'),
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // My khatmas list
          myKhatmasAsync.when(
            loading: () => SliverList(
              delegate: SliverChildBuilderDelegate(
                (_, __) => const KhatmaCardShimmer(),
                childCount: 3,
              ),
            ),
            error: (e, _) => SliverToBoxAdapter(
              child: _ErrorState(
                message: e.toString().replaceAll('Exception: ', ''),
                onRetry: () =>
                    ref.read(myKhatmasProvider.notifier).refresh(),
                t: t,
              ),
            ),
            data: (khatmas) {
              if (khatmas.isEmpty) {
                return SliverToBoxAdapter(child: _EmptyKhatmas(t: t));
              }
              return SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, i) => KhatmaCard(khatma: khatmas[i], lang: lang),
                  childCount: khatmas.length,
                ),
              );
            },
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
    );
  }
}

class _WelcomeBanner extends StatelessWidget {
  final String greeting;
  final String Function(String) t;
  final dynamic authState;

  const _WelcomeBanner({
    required this.greeting,
    required this.t,
    required this.authState,
  });

  @override
  Widget build(BuildContext context) {
    final user = authState.user;
    final name = user?.displayName as String? ?? '';

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppConstants.primaryGreen, Color(0xFF4AB302)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppConstants.radiusXL),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '👋 $greeting${name.isNotEmpty ? '، $name' : ''}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            t('welcomeBanner'),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontFamily: 'Amiri',
              height: 1.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            t('welcomeBannerSub'),
            style: TextStyle(
              color: Colors.white.withAlpha(200),
              fontSize: 13,
              fontStyle: FontStyle.italic,
              fontFamily: 'Amiri',
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyKhatmas extends StatelessWidget {
  final String Function(String) t;

  const _EmptyKhatmas({required this.t});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          Icon(Icons.auto_stories_outlined, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            t('noKhatmasYet'),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            t('noKhatmasDesc'),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[500],
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  final String Function(String) t;

  const _ErrorState({
    required this.message,
    required this.onRetry,
    required this.t,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          const Icon(Icons.error_outline, size: 48, color: AppConstants.errorRed),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: onRetry,
            child: Text(t('retry')),
          ),
        ],
      ),
    );
  }
}

// ─── Discover Tab ─────────────────────────────────────────────────────────────

class _DiscoverTab extends ConsumerStatefulWidget {
  final String lang;
  final String Function(String) t;
  final Future<void> Function(String, bool) onJoin;

  const _DiscoverTab({
    required this.lang,
    required this.t,
    required this.onJoin,
  });

  @override
  ConsumerState<_DiscoverTab> createState() => _DiscoverTabState();
}

class _DiscoverTabState extends ConsumerState<_DiscoverTab>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final publicKhatmasAsync = ref.watch(publicKhatmasProvider);
    final t = widget.t;
    final lang = widget.lang;
    final theme = Theme.of(context);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: t('searchKhatma'),
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {});
                        ref.read(publicKhatmasProvider.notifier).setSearch('');
                      },
                    )
                  : null,
            ),
            onChanged: (v) {
              setState(() {});
              ref.read(publicKhatmasProvider.notifier).setSearch(v);
            },
          ),
        ),
        TabBar(
          controller: _tabController,
          onTap: (i) {
            final filters = ['all', 'active', 'completed'];
            ref.read(publicKhatmasProvider.notifier).setFilter(filters[i]);
          },
          tabs: [
            Tab(text: t('all')),
            Tab(text: t('active')),
            Tab(text: t('completed')),
          ],
          labelColor: theme.colorScheme.primary,
          unselectedLabelColor: Colors.grey,
          indicatorColor: theme.colorScheme.primary,
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => ref.read(publicKhatmasProvider.notifier).refresh(),
            color: AppConstants.primaryGreen,
            child: publicKhatmasAsync.when(
              loading: () => ListView.builder(
                itemCount: 4,
                itemBuilder: (_, __) => const KhatmaCardShimmer(),
              ),
              error: (e, _) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline,
                        size: 48, color: AppConstants.errorRed),
                    const SizedBox(height: 12),
                    Text(e.toString().replaceAll('Exception: ', '')),
                    const SizedBox(height: 16),
                    OutlinedButton(
                      onPressed: () =>
                          ref.read(publicKhatmasProvider.notifier).refresh(),
                      child: Text(t('retry')),
                    ),
                  ],
                ),
              ),
              data: (khatmas) {
                if (khatmas.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.search_off, size: 56, color: Colors.grey[400]),
                        const SizedBox(height: 12),
                        Text(t('noResults'),
                            style: const TextStyle(color: Colors.grey)),
                      ],
                    ),
                  );
                }
                return ListView.builder(
                  itemCount: khatmas.length,
                  itemBuilder: (_, i) => KhatmaCard(
                    khatma: khatmas[i],
                    lang: lang,
                    showJoinButton: true,
                    onJoin: () => widget.onJoin(
                      khatmas[i].id,
                      khatmas[i].requireApproval,
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
