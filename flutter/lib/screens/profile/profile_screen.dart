import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../core/constants.dart';
import '../../core/translations.dart';
import '../../providers/auth_provider.dart';
import '../../providers/khatma_provider.dart';
import '../../providers/lang_provider.dart';
import '../../widgets/stat_card_widget.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(langProvider).lang;
    final t = (String key) => AppTranslations.translate(key, lang);
    final authState = ref.watch(authProvider);
    final myKhatmasAsync = ref.watch(myKhatmasProvider);
    final user = authState.user;
    final theme = Theme.of(context);

    // Compute stats
    final khatmas = myKhatmasAsync.valueOrNull ?? [];
    final completedCount = khatmas.where((k) => k.status == 'completed').length;
    final totalPartsRead = khatmas.fold<int>(0, (sum, k) => sum + k.completedParts);

    return Scaffold(
      appBar: AppBar(
        title: Text(t('profile'), style: const TextStyle(fontWeight: FontWeight.w700)),
        leading: IconButton(
          icon: Icon(lang == 'ar' ? Icons.arrow_forward : Icons.arrow_back),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(authProvider.notifier).refreshUser();
          await ref.read(myKhatmasProvider.notifier).refresh();
        },
        color: AppConstants.primaryGreen,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            children: [
              // Profile header
              Container(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    _Avatar(user: user, size: 88),
                    const SizedBox(height: 14),
                    Text(
                      user?.displayName ?? '',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user?.email ?? '',
                      style: theme.textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 20),
                    OutlinedButton.icon(
                      onPressed: () => context.push('/edit-profile'),
                      icon: const Icon(Icons.edit_outlined, size: 18),
                      label: Text(t('editProfile')),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(180, 44),
                      ),
                    ),
                  ],
                ),
              ),

              const Divider(),

              // Stats
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t('myStats'),
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 12),
                    GridView.count(
                      crossAxisCount: 3,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                      childAspectRatio: 0.85,
                      children: [
                        StatCardWidget(
                          value: '${khatmas.length}',
                          label: t('totalKhatmas'),
                          icon: Icons.auto_stories_rounded,
                          color: AppConstants.primaryGreen,
                        ),
                        StatCardWidget(
                          value: '$completedCount',
                          label: t('completedKhatmas'),
                          icon: Icons.check_circle_outline_rounded,
                          color: AppConstants.successGreen,
                        ),
                        StatCardWidget(
                          value: '$totalPartsRead',
                          label: t('partsRead'),
                          icon: Icons.menu_book_rounded,
                          color: AppConstants.primaryBlue,
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const Divider(),

              // Menu items
              _MenuItem(
                icon: Icons.article_outlined,
                label: t('articles'),
                onTap: () => context.push('/articles'),
              ),
              _MenuItem(
                icon: Icons.notifications_outlined,
                label: t('notifications'),
                onTap: () => context.push('/notifications'),
              ),
              _MenuItem(
                icon: Icons.lightbulb_outline_rounded,
                label: t('suggestions'),
                onTap: () => context.push('/suggestions'),
              ),
              _MenuItem(
                icon: Icons.settings_outlined,
                label: t('settings'),
                onTap: () => context.push('/settings'),
              ),
              _MenuItem(
                icon: Icons.info_outline_rounded,
                label: t('about'),
                onTap: () => context.push('/about'),
              ),

              const Divider(),

              // Logout
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
      Fluttertoast.showToast(msg: t('success'));
    }
  }
}

class _Avatar extends StatelessWidget {
  final dynamic user;
  final double size;

  const _Avatar({required this.user, this.size = 80});

  @override
  Widget build(BuildContext context) {
    final avatar = user?.avatar as String?;
    final initials = user?.initials as String? ?? 'U';

    return CircleAvatar(
      radius: size / 2,
      backgroundColor: AppConstants.primaryGreen.withAlpha(30),
      foregroundImage:
          avatar != null ? CachedNetworkImageProvider(avatar) : null,
      child: avatar == null
          ? Text(
              initials,
              style: TextStyle(
                fontSize: size * 0.3,
                fontWeight: FontWeight.w700,
                color: AppConstants.primaryGreen,
              ),
            )
          : null,
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppConstants.primaryGreen),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
      trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
      onTap: onTap,
    );
  }
}
