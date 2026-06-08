import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/notification_model.dart';
import '../services/notification_service.dart';

class NotificationsNotifier
    extends StateNotifier<AsyncValue<List<NotificationModel>>> {
  final NotificationService _service = NotificationService();

  NotificationsNotifier() : super(const AsyncValue.loading()) {
    fetch();
  }

  Future<void> fetch() async {
    state = const AsyncValue.loading();
    try {
      final notifications = await _service.getNotifications();
      state = AsyncValue.data(notifications);
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  Future<void> refresh() => fetch();

  Future<void> markAsRead(String id) async {
    try {
      await _service.markAsRead(id);
      final current = state.valueOrNull ?? [];
      state = AsyncValue.data(
        current.map((n) {
          if (n.id == id) return n.copyWith(isRead: true);
          return n;
        }).toList(),
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<void> markAllRead() async {
    final current = state.valueOrNull ?? [];
    final unread = current.where((n) => !n.isRead).toList();
    for (final n in unread) {
      try {
        await _service.markAsRead(n.id);
      } catch (_) {}
    }
    state = AsyncValue.data(
      current.map((n) => n.copyWith(isRead: true)).toList(),
    );
  }

  int get unreadCount {
    final current = state.valueOrNull ?? [];
    return current.where((n) => !n.isRead).length;
  }
}

final notificationsProvider = StateNotifierProvider<NotificationsNotifier,
    AsyncValue<List<NotificationModel>>>(
  (ref) => NotificationsNotifier(),
);

final unreadCountProvider = Provider<int>((ref) {
  final notifState = ref.watch(notificationsProvider);
  return notifState.valueOrNull?.where((n) => !n.isRead).length ?? 0;
});
