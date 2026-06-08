import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:fluttertoast/fluttertoast.dart';
import '../core/constants.dart';
import '../core/translations.dart';
import '../providers/lang_provider.dart';
import '../providers/notification_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(langProvider).lang;
    final t = (String key) => AppTranslations.translate(key, lang);
    final notifsAsync = ref.watch(notificationsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(t('notifications'), style: const TextStyle(fontWeight: FontWeight.w700)),
        leading: IconButton(
          icon: Icon(lang == 'ar' ? Icons.arrow_forward : Icons.arrow_back),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        actions: [
          notifsAsync.maybeWhen(
            data: (notifs) => notifs.any((n) => !n.isRead)
                ? TextButton(
                    onPressed: () async {
                      await ref
                          .read(notificationsProvider.notifier)
                          .markAllRead();
                    },
                    child: Text(
                      t('markAllRead'),
                      style: TextStyle(
                        color: theme.colorScheme.primary,
                        fontSize: 12,
                      ),
                    ),
                  )
                : const SizedBox.shrink(),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: notifsAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppConstants.primaryGreen),
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
                    ref.read(notificationsProvider.notifier).refresh(),
                child: Text(t('retry')),
              ),
            ],
          ),
        ),
        data: (notifications) {
          if (notifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_none_rounded,
                      size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 12),
                  Text(
                    t('noNotifications'),
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () =>
                ref.read(notificationsProvider.notifier).refresh(),
            color: AppConstants.primaryGreen,
            child: ListView.separated(
              itemCount: notifications.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final notif = notifications[i];
                return ListTile(
                  leading: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: notif.isRead
                          ? Colors.grey.withAlpha(30)
                          : AppConstants.primaryGreen.withAlpha(25),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      notif.isRead
                          ? Icons.notifications_none_rounded
                          : Icons.notifications_active_rounded,
                      color: notif.isRead
                          ? Colors.grey
                          : AppConstants.primaryGreen,
                      size: 22,
                    ),
                  ),
                  title: Text(
                    notif.title,
                    style: TextStyle(
                      fontWeight: notif.isRead
                          ? FontWeight.w400
                          : FontWeight.w700,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        notif.message,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13),
                      ),
                      if (notif.createdAt != null)
                        Text(
                          timeago.format(
                            notif.createdAt!,
                            locale: lang == 'ar' ? 'ar' : 'en',
                          ),
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey[500],
                          ),
                        ),
                    ],
                  ),
                  trailing: !notif.isRead
                      ? Container(
                          width: 10,
                          height: 10,
                          decoration: const BoxDecoration(
                            color: AppConstants.primaryGreen,
                            shape: BoxShape.circle,
                          ),
                        )
                      : null,
                  onTap: () async {
                    if (!notif.isRead) {
                      try {
                        await ref
                            .read(notificationsProvider.notifier)
                            .markAsRead(notif.id);
                      } catch (e) {
                        Fluttertoast.showToast(
                          msg: e.toString().replaceAll('Exception: ', ''),
                          backgroundColor: AppConstants.errorRed,
                          textColor: Colors.white,
                        );
                      }
                    }
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}
