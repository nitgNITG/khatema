import 'package:dio/dio.dart';
import 'api_service.dart';
import '../models/notification_model.dart';

class NotificationService {
  final ApiService _api = ApiService.instance;

  Future<List<NotificationModel>> getNotifications() async {
    try {
      final response = await _api.dio.get('/notifications');
      final data = response.data;
      List<dynamic> items;
      if (data is List) {
        items = data;
      } else if (data is Map<String, dynamic>) {
        items = data['notifications'] ?? data['data'] ?? [];
      } else {
        items = [];
      }
      return items
          .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<NotificationModel> markAsRead(String id) async {
    try {
      final response = await _api.dio.patch('/notifications/$id/read');
      final data = response.data as Map<String, dynamic>;
      final notifData = data['notification'] ?? data['data'] ?? data;
      return NotificationModel.fromJson(notifData as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<void> sendSuggestion({
    String? name,
    String? email,
    required String suggestion,
  }) async {
    try {
      final body = <String, dynamic>{'suggestion': suggestion};
      if (name != null && name.isNotEmpty) body['name'] = name;
      if (email != null && email.isNotEmpty) body['email'] = email;
      await _api.dio.post('/suggestions', data: body);
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }
}
