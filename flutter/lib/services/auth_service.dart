import 'package:dio/dio.dart';
import 'api_service.dart';
import '../models/user_model.dart';

class AuthService {
  final ApiService _api = ApiService.instance;

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _api.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      final data = response.data as Map<String, dynamic>;
      final token = data['accessToken'] ?? data['token'] ?? data['data']?['accessToken'];
      if (token != null) {
        await _api.setToken(token as String);
      }
      final userData = data['user'] ?? data['data']?['user'] ?? data;
      return {'user': UserModel.fromJson(userData as Map<String, dynamic>), 'token': token};
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String displayName,
  }) async {
    try {
      final response = await _api.dio.post('/auth/register', data: {
        'email': email,
        'password': password,
        'displayName': displayName,
      });
      final data = response.data as Map<String, dynamic>;
      final token = data['accessToken'] ?? data['token'] ?? data['data']?['accessToken'];
      if (token != null) {
        await _api.setToken(token as String);
      }
      final userData = data['user'] ?? data['data']?['user'] ?? data;
      return {'user': UserModel.fromJson(userData as Map<String, dynamic>), 'token': token};
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<void> logout() async {
    try {
      await _api.dio.post('/auth/logout');
    } catch (_) {}
    await _api.clearTokens();
  }

  Future<UserModel> getMe() async {
    try {
      final response = await _api.dio.get('/users/me');
      final data = response.data as Map<String, dynamic>;
      final userData = data['user'] ?? data['data'] ?? data;
      return UserModel.fromJson(userData as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<void> forgotPassword(String email) async {
    try {
      await _api.dio.post('/auth/forgot-password', data: {'email': email});
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<void> resetPassword({
    required String token,
    required String password,
  }) async {
    try {
      await _api.dio.post('/auth/reset-password', data: {
        'token': token,
        'password': password,
      });
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<UserModel> updateProfile({
    String? displayName,
    String? avatar,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (displayName != null) body['displayName'] = displayName;
      if (avatar != null) body['avatar'] = avatar;
      final response = await _api.dio.patch('/users/me', data: body);
      final data = response.data as Map<String, dynamic>;
      final userData = data['user'] ?? data['data'] ?? data;
      return UserModel.fromJson(userData as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<bool> isLoggedIn() async {
    final token = await _api.getToken();
    return token != null;
  }
}
