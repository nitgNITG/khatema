import 'package:dio/dio.dart';
import 'api_service.dart';
import '../models/article_model.dart';

class ArticleService {
  final ApiService _api = ApiService.instance;

  Future<List<ArticleModel>> getArticles({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _api.dio.get('/articles', queryParameters: {
        'page': page,
        'limit': limit,
      });
      final data = response.data;
      List<dynamic> items;
      if (data is List) {
        items = data;
      } else if (data is Map<String, dynamic>) {
        items = data['articles'] ?? data['data'] ?? [];
      } else {
        items = [];
      }
      return items.map((e) => ArticleModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }

  Future<ArticleModel> getArticleBySlug(String slug) async {
    try {
      final response = await _api.dio.get('/articles/$slug');
      final data = response.data as Map<String, dynamic>;
      final articleData = data['article'] ?? data['data'] ?? data;
      return ArticleModel.fromJson(articleData as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(_api.parseError(e));
    }
  }
}
