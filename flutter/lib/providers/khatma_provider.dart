import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/khatma_model.dart';
import '../services/khatma_service.dart';

// My khatmas list
class MyKhatmasNotifier extends StateNotifier<AsyncValue<List<KhatmaModel>>> {
  final KhatmaService _service = KhatmaService();

  MyKhatmasNotifier() : super(const AsyncValue.loading()) {
    fetch();
  }

  Future<void> fetch() async {
    state = const AsyncValue.loading();
    try {
      final khatmas = await _service.getMyKhatmas();
      state = AsyncValue.data(khatmas);
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  Future<void> refresh() => fetch();

  void addKhatma(KhatmaModel khatma) {
    final current = state.valueOrNull ?? [];
    state = AsyncValue.data([khatma, ...current]);
  }

  void removeKhatma(String id) {
    final current = state.valueOrNull ?? [];
    state = AsyncValue.data(current.where((k) => k.id != id).toList());
  }

  void updateKhatma(KhatmaModel updated) {
    final current = state.valueOrNull ?? [];
    state = AsyncValue.data(
      current.map((k) => k.id == updated.id ? updated : k).toList(),
    );
  }
}

final myKhatmasProvider =
    StateNotifierProvider<MyKhatmasNotifier, AsyncValue<List<KhatmaModel>>>(
  (ref) => MyKhatmasNotifier(),
);

// Public khatmas
class PublicKhatmasNotifier
    extends StateNotifier<AsyncValue<List<KhatmaModel>>> {
  final KhatmaService _service = KhatmaService();
  String _filter = 'all';
  String _search = '';

  PublicKhatmasNotifier() : super(const AsyncValue.loading()) {
    fetch();
  }

  Future<void> fetch() async {
    state = const AsyncValue.loading();
    try {
      final khatmas = await _service.getPublicKhatmas(
        search: _search.isEmpty ? null : _search,
        status: _filter == 'all' ? null : _filter,
      );
      state = AsyncValue.data(khatmas);
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  Future<void> setFilter(String filter) async {
    _filter = filter;
    await fetch();
  }

  Future<void> setSearch(String search) async {
    _search = search;
    await fetch();
  }

  Future<void> refresh() => fetch();
}

final publicKhatmasProvider =
    StateNotifierProvider<PublicKhatmasNotifier, AsyncValue<List<KhatmaModel>>>(
  (ref) => PublicKhatmasNotifier(),
);

// Single khatma detail
class KhatmaDetailNotifier extends StateNotifier<AsyncValue<KhatmaModel?>> {
  final KhatmaService _service = KhatmaService();
  final String khatmaId;

  KhatmaDetailNotifier({required this.khatmaId})
      : super(const AsyncValue.loading()) {
    fetch();
  }

  Future<void> fetch() async {
    state = const AsyncValue.loading();
    try {
      final khatma = await _service.getKhatmaById(khatmaId);
      state = AsyncValue.data(khatma);
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  Future<void> refresh() => fetch();

  Future<void> reservePart(String partId) async {
    try {
      final updated = await _service.reservePart(khatmaId, partId);
      state = AsyncValue.data(updated);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> completePart(String partId) async {
    try {
      final updated = await _service.completePart(khatmaId, partId);
      state = AsyncValue.data(updated);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> releasePart(String partId) async {
    try {
      final updated = await _service.releasePart(khatmaId, partId);
      state = AsyncValue.data(updated);
    } catch (e) {
      rethrow;
    }
  }
}

final khatmaDetailProvider = StateNotifierProvider.family<KhatmaDetailNotifier,
    AsyncValue<KhatmaModel?>, String>(
  (ref, id) => KhatmaDetailNotifier(khatmaId: id),
);

// Near completion khatmas
final nearCompletionProvider =
    FutureProvider<List<KhatmaModel>>((ref) async {
  final service = KhatmaService();
  return service.getNearCompletion();
});

// Stats provider
final publicStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final service = KhatmaService();
  return service.getPublicStats();
});
