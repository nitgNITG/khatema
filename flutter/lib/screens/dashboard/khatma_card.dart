import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants.dart';
import '../../core/translations.dart';
import '../../models/khatma_model.dart';
import '../../widgets/progress_bar_widget.dart';

class KhatmaCard extends StatelessWidget {
  final KhatmaModel khatma;
  final String lang;
  final bool showJoinButton;
  final VoidCallback? onJoin;

  const KhatmaCard({
    super.key,
    required this.khatma,
    required this.lang,
    this.showJoinButton = false,
    this.onJoin,
  });

  @override
  Widget build(BuildContext context) {
    final t = (String key) => AppTranslations.translate(key, lang);
    final theme = Theme.of(context);

    Color statusColor;
    String statusLabel;
    if (khatma.status == 'completed') {
      statusColor = AppConstants.successGreen;
      statusLabel = t('completed');
    } else {
      statusColor = AppConstants.primaryGreen;
      statusLabel = t('active');
    }

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: InkWell(
        onTap: () => context.push('/khatma/${khatma.id}'),
        borderRadius: BorderRadius.circular(AppConstants.radiusLarge),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      khatma.title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withAlpha(25),
                      borderRadius:
                          BorderRadius.circular(AppConstants.radiusSmall),
                    ),
                    child: Text(
                      statusLabel,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: statusColor,
                      ),
                    ),
                  ),
                ],
              ),
              if (khatma.cleanDescription.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  khatma.cleanDescription,
                  style: theme.textTheme.bodySmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              const SizedBox(height: 14),
              ProgressBarWidget(
                progress: khatma.progressPercent,
                height: 7,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _MetaChip(
                    icon: Icons.menu_book_rounded,
                    label:
                        '${khatma.completedParts} / 30 ${t('partsCompleted')}',
                    color: AppConstants.primaryGreen,
                  ),
                  const SizedBox(width: 8),
                  _MetaChip(
                    icon: Icons.people_outline,
                    label: '${khatma.participantsCount} ${t('participants')}',
                    color: AppConstants.primaryBlue,
                  ),
                  if (showJoinButton) ...[
                    const Spacer(),
                    TextButton(
                      onPressed: onJoin,
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 6),
                        backgroundColor: AppConstants.primaryGreen,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: Text(
                        t('joinKhatma'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _MetaChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: color,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
