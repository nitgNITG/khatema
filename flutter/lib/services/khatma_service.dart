import 'package:dio/dio.dart';
import 'api_service.dart';
import '../models/khatma_model.dart';

class KhatmaService {
  final ApiService _api = ApiService.instance;

  Future<List<KhatmaModel>> getMyKhatmas() async {
    try {
      final response = await _api.dio.get('/users/me/khatmas');
      final data = response.data;
      List<dynamic> items;
      if (data is List) {
        items = data;
      } else if (data is Map<String, dynamic>) {
        items = data['khatmas'] ?? data['data'] ?? [];
      } else {
        items = [];
      }
      return items.map((e) => KhatmaModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<List<KhatmaModel>> getPublicKhatmas({
    String? search,
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final params = <String, dynamic>{
        'page': page,
        'limit': limit,
        'visibility': 'public',
      };
      if (search != null && search.isNotEmpty) params['search'] = search;
      if (status != null && status != 'all') params['status'] = status;

      final response = await _api.dio.get('/khatmas', queryParameters: params);
      final data = response.data;
      List<dynamic> items;
      if (data is List) {
        items = data;
      } else if (data is Map<String, dynamic>) {
        items = data['khatmas'] ?? data['data'] ?? [];
      } else {
        items = [];
      }
      return items.map((e) => KhatmaModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<List<KhatmaModel>> getNearCompletion() async {
    try {
      final response = await _api.dio.get('/khatmas/public/near-completion');
      final data = response.data;
      List<dynamic> items;
      if (data is List) {
        items = data;
      } else if (data is Map<String, dynamic>) {
        items = data['khatmas'] ?? data['data'] ?? [];
      } else {
        items = [];
      }
      return items.map((e) => KhatmaModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<Map<String, dynamic>> getPublicStats() async {
    try {
      final response = await _api.dio.get('/khatmas/public/stats');
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return data['stats'] ?? data['data'] ?? data;
      }
      return {};
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<KhatmaModel> getKhatmaById(String id) async {
    try {
      final response = await _api.dio.get('/khatmas/$id');
      final data = response.data as Map<String, dynamic>;
      final khatmaData = data['khatma'] ?? data['data'] ?? data;
      return KhatmaModel.fromJson(khatmaData as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<KhatmaModel> getKhatmaByToken(String token) async {
    try {
      final response = await _api.dio.get('/khatmas/join/$token');
      final data = response.data as Map<String, dynamic>;
      final khatmaData = data['khatma'] ?? data['data'] ?? data;
      return KhatmaModel.fromJson(khatmaData as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<KhatmaModel> createKhatma({
    required String title,
    String? description,
    required String type,
    required String visibility,
    int maxMembers = 30,
    bool requireApproval = false,
    String? intention,
  }) async {
    try {
      String? fullDescription = description ?? '';
      if (intention != null && intention.isNotEmpty) {
        fullDescription = '[intention:$intention] $fullDescription'.trim();
      }

      final response = await _api.dio.post('/khatmas', data: {
        'title': title,
        'description': fullDescription.isEmpty ? null : fullDescription,
        'type': type,
        'visibility': visibility,
        'maxMembers': maxMembers,
        'requireApproval': requireApproval,
      });
      final data = response.data as Map<String, dynamic>;
      final khatmaData = data['khatma'] ?? data['data'] ?? data;
      return KhatmaModel.fromJson(khatmaData as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<KhatmaModel> updateKhatma(
    String id, {
    String? title,
    String? description,
    String? status,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (title != null) body['title'] = title;
      if (description != null) body['description'] = description;
      if (status != null) body['status'] = status;

      final response = await _api.dio.patch('/khatmas/$id', data: body);
      final data = response.data as Map<String, dynamic>;
      final khatmaData = data['khatma'] ?? data['data'] ?? data;
      return KhatmaModel.fromJson(khatmaData as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<void> deleteKhatma(String id) async {
    try {
      await _api.dio.delete('/khatmas/$id');
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<Map<String, dynamic>> joinKhatma(String id) async {
    try {
      final response = await _api.dio.post('/khatmas/$id/join');
      final data = response.data as Map<String, dynamic>;
      return data;
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<void> leaveKhatma(String id) async {
    try {
      await _api.dio.delete('/khatmas/$id/leave');
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<KhatmaModel> reservePart(String khatmaId, String partId) async {
    try {
      final response =
          await _api.dio.post('/khatmas/$khatmaId/parts/$partId/reserve');
      final data = response.data as Map<String, dynamic>;
      final khatmaData = data['khatma'] ?? data['data'] ?? data;
      return KhatmaModel.fromJson(khatmaData as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<KhatmaModel> completePart(String khatmaId, String partId) async {
    try {
      final response =
          await _api.dio.post('/khatmas/$khatmaId/parts/$partId/complete');
      final data = response.data as Map<String, dynamic>;
      final khatmaData = data['khatma'] ?? data['data'] ?? data;
      return KhatmaModel.fromJson(khatmaData as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<KhatmaModel> releasePart(String khatmaId, String partId) async {
    try {
      final response = await _api.dio
          .delete('/khatmas/$khatmaId/parts/$partId/my-reservation');
      final data = response.data as Map<String, dynamic>;
      final khatmaData = data['khatma'] ?? data['data'] ?? data;
      return KhatmaModel.fromJson(khatmaData as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<List<KhatmaParticipant>> getParticipants(String khatmaId) async {
    try {
      final response =
          await _api.dio.get('/khatmas/$khatmaId/participants');
      final data = response.data;
      List<dynamic> items;
      if (data is List) {
        items = data;
      } else if (data is Map<String, dynamic>) {
        items = data['participants'] ?? data['data'] ?? [];
      } else {
        items = [];
      }
      return items
          .map((e) => KhatmaParticipant.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }
}
