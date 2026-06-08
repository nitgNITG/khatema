class ArticleModel {
  final String id;
  final String slug;
  final String title;
  final String? content;
  final String? excerpt;
  final String? coverImage;
  final int views;
  final DateTime? publishedAt;
  final DateTime? createdAt;

  const ArticleModel({
    required this.id,
    required this.slug,
    required this.title,
    this.content,
    this.excerpt,
    this.coverImage,
    required this.views,
    this.publishedAt,
    this.createdAt,
  });

  factory ArticleModel.fromJson(Map<String, dynamic> json) {
    return ArticleModel(
      id: json['_id'] ?? json['id'] ?? '',
      slug: json['slug'] ?? '',
      title: json['title'] ?? '',
      content: json['content'],
      excerpt: json['excerpt'],
      coverImage: json['coverImage'] ?? json['cover'],
      views: json['views'] ?? 0,
      publishedAt: json['publishedAt'] != null
          ? DateTime.tryParse(json['publishedAt'])
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
    );
  }
}
