class UserModel {
  final String id;
  final String email;
  final String displayName;
  final String? avatar;
  final String? role;
  final DateTime? createdAt;

  const UserModel({
    required this.id,
    required this.email,
    required this.displayName,
    this.avatar,
    this.role,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      email: json['email'] ?? '',
      displayName: json['displayName'] ?? json['name'] ?? '',
      avatar: json['avatar'],
      role: json['role'],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'email': email,
        'displayName': displayName,
        'avatar': avatar,
        'role': role,
      };

  String get initials {
    final parts = displayName.trim().split(' ');
    if (parts.isEmpty) return 'U';
    if (parts.length == 1) return parts[0].isNotEmpty ? parts[0][0].toUpperCase() : 'U';
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }

  UserModel copyWith({
    String? id,
    String? email,
    String? displayName,
    String? avatar,
    String? role,
    DateTime? createdAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      avatar: avatar ?? this.avatar,
      role: role ?? this.role,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
