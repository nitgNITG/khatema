class NotificationModel {
  final String id;
  final String title;
  final String message;
  final bool isRead;
  final String? type;
  final Map<String, dynamic>? data;
  final DateTime? createdAt;

  const NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.isRead,
    this.type,
    this.data,
    this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? json['body'] ?? '',
      isRead: json['isRead'] ?? json['read'] ?? false,
      type: json['type'],
      data: json['data'] as Map<String, dynamic>?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
    );
  }

  NotificationModel copyWith({
    String? id,
    String? title,
    String? message,
    bool? isRead,
    String? type,
    Map<String, dynamic>? data,
    DateTime? createdAt,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      isRead: isRead ?? this.isRead,
      type: type ?? this.type,
      data: data ?? this.data,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
