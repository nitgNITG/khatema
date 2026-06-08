import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants.dart';

class ApiService {
  static ApiService? _instance;
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  bool _isRefreshing = false;

  ApiService._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: _onRequest,
        onResponse: _onResponse,
        onError: _onError,
      ),
    );
  }

  static ApiService get instance {
    _instance ??= ApiService._internal();
    return _instance!;
  }

  Dio get dio => _dio;

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.read(key: AppConstants.accessTokenKey);
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  void _onResponse(Response response, ResponseInterceptorHandler handler) {
    handler.next(response);
  }

  Future<void> _onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401 && !_isRefreshing) {
      _isRefreshing = true;
      try {
        final refreshed = await _refreshToken();
        if (refreshed) {
          final token = await _storage.read(key: AppConstants.accessTokenKey);
          final opts = err.requestOptions;
          opts.headers['Authorization'] = 'Bearer $token';
          final response = await _dio.fetch(opts);
          handler.resolve(response);
          return;
        }
      } catch (_) {
        await _clearTokens();
      } finally {
        _isRefreshing = false;
      }
    }
    handler.next(err);
  }

  Future<bool> _refreshToken() async {
    try {
      final response = await Dio().post(
        '${AppConstants.baseUrl}/auth/refresh',
        options: Options(
          headers: {'Content-Type': 'application/json'},
        ),
      );
      if (response.statusCode == 200) {
        final data = response.data;
        final token = data['accessToken'] ?? data['token'] ?? data['data']?['accessToken'];
        if (token != null) {
          await _storage.write(key: AppConstants.accessTokenKey, value: token);
          return true;
        }
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<void> _clearTokens() async {
    await _storage.delete(key: AppConstants.accessTokenKey);
    await _storage.delete(key: AppConstants.refreshTokenKey);
  }

  Future<void> setToken(String token) async {
    await _storage.write(key: AppConstants.accessTokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: AppConstants.accessTokenKey);
  }

  Future<void> clearTokens() async {
    await _clearTokens();
  }

  String parseError(dynamic error) {
    if (error is DioException) {
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout) {
        return 'Connection timeout. Please try again.';
      }
      if (error.type == DioExceptionType.connectionError) {
        return 'No internet connection.';
      }
      final data = error.response?.data;
      if (data is Map<String, dynamic>) {
        return data['message'] ?? data['error'] ?? 'Server error';
      }
      return 'Server error (${error.response?.statusCode})';
    }
    return error?.toString() ?? 'Unknown error';
  }
}
