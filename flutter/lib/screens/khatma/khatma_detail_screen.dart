import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/constants.dart';
import '../../core/translations.dart';
import '../../models/khatma_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/khatma_provider.dart';
import '../../providers/lang_provider.dart';
import '../../widgets/progress_bar_widget.dart';
import 'parts_grid.dart';

class KhatmaDetailScreen extends ConsumerStatefulWidget {
  final String khatmaId;

  const KhatmaDetailScreen({super.key, required this.khatmaId});

  @override
  ConsumerState<KhatmaDetailScreen> createState() => _KhatmaDetailScreenState();
}

class _KhatmaDetailScreenState extends ConsumerState<KhatmaDetailScreen> {
  bool _actionsLoading = false;

  Future<void> _onPartTap(KhatmaPart part, KhatmaModel khatma, String Function(String) t) async {
    final userId = ref.read(authProvider).user?.id ?? '';
    final isMine = part.isReservedByUser(userId);

    if (part.isAvailable) {
      await _confirmAndReserve(part, t);
    } else if (part.isReserved && isMine) {
      await _confirmAndComplete(part, t);
    }
  }

  Future<void> _onPartLongPress(KhatmaPart part, String Function(String) t) async {
    await _confirmAndRelease(part, t);
  }

  Future<void> _confirmAndReserve(KhatmaPart part, String Function(String) t) async {
    final confirmed = await _showConfirmDialog(
      title: t('confirmReserve'),
      message: '${t('reservePartMsg')} (${t('partNumber')} ${part.partNumber})',
      confirmLabel: t('reservePart'),
      t: t,
    );
    if (!confirmed) return;
    setState(() => _actionsLoading = true);
    try {
      await ref
          .read(khatmaDetailProvider(widget.khatmaId).notifier)
          .reservePart(part.id);
      Fluttertoast.showToast(
        msg: t('partReserved'),
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
    } finally {
      if (mounted) setState(() => _actionsLoading = false);
    }
  }

  Future<void> _confirmAndComplete(KhatmaPart part, String Function(String) t) async {
    final confirmed = await _showConfirmDialog(
      title: t('confirmComplete'),
      message: '${t('completePartMsg')} (${t('partNumber')} ${part.partNumber})',
      confirmLabel: t('completePart'),
      t: t,
    );
    if (!confirmed) return;
    setState(() => _actionsLoading = true);
    try {
      await ref
          .read(khatmaDetailProvider(widget.khatmaId).notifier)
          .completePart(part.id);
      Fluttertoast.showToast(
        msg: t('partCompleted'),
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
    } finally {
      if (mounted) setState(() => _actionsLoading = false);
    }
  }

  Future<void> _confirmAndRelease(KhatmaPart part, String Function(String) t) async {
    final confirmed = await _showConfirmDialog(
      title: t('confirmRelease'),
      message: '${t('releasePartMsg')} (${t('partNumber')} ${part.partNumber})',
      confirmLabel: t('releasePart'),
      t: t,
    );
    if (!confirmed) return;
    setState(() => _actionsLoading = true);
    try {
      await ref
          .read(khatmaDetailProvider(widget.khatmaId).notifier)
          .releasePart(part.id);
      Fluttertoast.showToast(
        msg: t('partReleased'),
        backgroundColor: AppConstants.warningOrange,
        textColor: Colors.white,
      );
      ref.read(myKhatmasProvider.notifier).refresh();
    } catch (e) {
      Fluttertoast.showToast(
        msg: e.toString().replaceAll('Exception: ', ''),
        backgroundColor: AppConstants.errorRed,
        textColor: Colors.white,
      );
    } finally {
      if (mounted) setState(() => _actionsLoading = false);
    }
  }

  Future<bool> _showConfirmDialog({
    required String title,
    required String message,
    required String confirmLabel,
    required String Function(String) t,
  }) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(t('cancel')),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size(80, 40),
            ),
            child: Text(confirmLabel),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  void _shareKhatma(KhatmaModel khatma, String Function(String) t) {
    final token = khatma.joinToken;
    if (token != null) {
      final link = 'https://khatema.app/join/$token';
      Share.share('${khatma.title}\n$link');
    } else {
      Clipboard.setData(ClipboardData(
        text: 'https://khatema.app/khatma/${khatma.id}',
      ));
      Fluttertoast.showToast(
        msg: t('linkCopied'),
        backgroundColor: AppConstants.primaryGreen,
        textColor: Colors.white,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(langProvider).lang;
    final String Function(String) t = (String key) => AppTranslations.translate(key, lang);
    final detailAsync = ref.watch(khatmaDetailProvider(widget.khatmaId));
    final userId = ref.watch(authProvider).user?.id ?? '';
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: Icon(lang == 'ar' ? Icons.arrow_forward : Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: detailAsync.maybeWhen(
          data: (k) => Text(
            k?.title ?? '',
            style: const TextStyle(fontWeight: FontWeight.w700),
            overflow: TextOverflow.ellipsis,
          ),
          orElse: () => const Text(''),
        ),
        actions: [
          detailAsync.maybeWhen(
            data: (k) => k != null
                ? IconButton(
                    icon: const Icon(Icons.share_outlined),
                    onPressed: () => _shareKhatma(k, t),
                  )
                : const SizedBox.shrink(),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: detailAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppConstants.primaryGreen),
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
                onPressed: () => ref
                    .read(khatmaDetailProvider(widget.khatmaId).notifier)
                    .refresh(),
                child: Text(t('retry')),
              ),
            ],
          ),
        ),
        data: (khatma) {
          if (khatma == null) return const SizedBox.shrink();
          return Stack(
            children: [
              RefreshIndicator(
                onRefresh: () => ref
                    .read(khatmaDetailProvider(widget.khatmaId).notifier)
                    .refresh(),
                color: AppConstants.primaryGreen,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header card
                      _KhatmaHeader(khatma: khatma, t: t, theme: theme),
                      const SizedBox(height: 16),

                      // Progress section
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                CircularProgressWidget(
                                  progress: khatma.progressPercent,
                                  size: 80,
                                ),
                                const SizedBox(width: 20),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${khatma.completedParts} ${t('partOf')}',
                                        style: theme.textTheme.headlineMedium
                                            ?.copyWith(
                                          fontWeight: FontWeight.w800,
                                          color:
                                              AppConstants.primaryGreen,
                                        ),
                                      ),
                                      Text(
                                        t('partsCompleted'),
                                        style: theme.textTheme.bodySmall,
                                      ),
                                      const SizedBox(height: 12),
                                      Row(
                                        children: [
                                          const Icon(
                                            Icons.people_outline,
                                            size: 16,
                                            color: AppConstants.primaryBlue,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            '${khatma.participantsCount} ${t('participantsCount')}',
                                            style: TextStyle(
                                              fontSize: 13,
                                              color: AppConstants.primaryBlue,
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
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Legend
                      PartsLegend(lang: lang),
                      const SizedBox(height: 12),

                      // Parts grid
                      if (khatma.parts.isNotEmpty)
                        PartsGrid(
                          parts: khatma.parts,
                          currentUserId: userId,
                          onTap: (part) => _onPartTap(part, khatma, t),
                          onLongPress: (part) =>
                              _onPartLongPress(part, t),
                        )
                      else
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(32),
                            child: CircularProgressIndicator(
                              color: AppConstants.primaryGreen,
                            ),
                          ),
                        ),

                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
              if (_actionsLoading)
                Container(
                  color: Colors.black.withAlpha(40),
                  child: const Center(
                    child: CircularProgressIndicator(
                      color: AppConstants.primaryGreen,
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _KhatmaHeader extends StatelessWidget {
  final KhatmaModel khatma;
  final String Function(String) t;
  final ThemeData theme;

  const _KhatmaHeader({
    required this.khatma,
    required this.t,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
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
          Row(
            children: [
              Expanded(
                child: Text(
                  khatma.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(40),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  khatma.status == 'completed'
                      ? t('completed')
                      : t('active'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          if (khatma.cleanDescription.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              khatma.cleanDescription,
              style: TextStyle(
                color: Colors.white.withAlpha(220),
                fontSize: 14,
              ),
            ),
          ],
          const SizedBox(height: 14),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              _Chip(
                icon: khatma.type == 'collective'
                    ? Icons.people_rounded
                    : Icons.person_rounded,
                label: khatma.type == 'collective'
                    ? t('collective')
                    : t('individual'),
              ),
              _Chip(
                icon: khatma.visibility == 'public'
                    ? Icons.public_rounded
                    : Icons.lock_outline_rounded,
                label: khatma.visibility == 'public'
                    ? t('public')
                    : t('private'),
              ),
              if (khatma.createdByName != null)
                _Chip(
                  icon: Icons.person_outline_rounded,
                  label: khatma.createdByName!,
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _Chip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding:
          const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(30),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withAlpha(60)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
