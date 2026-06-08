class KhatmaModel {
  final String id;
  final String title;
  final String? description;
  final String type; // collective | individual
  final String visibility; // public | private
  final String status; // active | completed
  final int maxMembers;
  final bool requireApproval;
  final String? joinToken;
  final String? createdBy;
  final String? createdByName;
  final int completedParts;
  final int totalParts;
  final int participantsCount;
  final List<KhatmaPart> parts;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const KhatmaModel({
    required this.id,
    required this.title,
    this.description,
    required this.type,
    required this.visibility,
    required this.status,
    required this.maxMembers,
    required this.requireApproval,
    this.joinToken,
    this.createdBy,
    this.createdByName,
    required this.completedParts,
    required this.totalParts,
    required this.participantsCount,
    this.parts = const [],
    this.createdAt,
    this.updatedAt,
  });

  double get progressPercent =>
      totalParts > 0 ? completedParts / totalParts : 0.0;

  String? get intention {
    if (description == null) return null;
    final match = RegExp(r'\[intention:(\w+)\]').firstMatch(description!);
    return match?.group(1);
  }

  String get cleanDescription {
    if (description == null) return '';
    return description!.replaceAll(RegExp(r'\[intention:\w+\]\s*'), '').trim();
  }

  factory KhatmaModel.fromJson(Map<String, dynamic> json) {
    final partsData = json['parts'] as List<dynamic>? ?? [];
    final parts = partsData
        .map((p) => KhatmaPart.fromJson(p as Map<String, dynamic>))
        .toList();

    int completed = 0;
    for (final p in parts) {
      if (p.status == 'completed') completed++;
    }

    final createdByData = json['createdBy'];
    String? createdById;
    String? createdByName;
    if (createdByData is Map<String, dynamic>) {
      createdById = createdByData['_id'] ?? createdByData['id'];
      createdByName = createdByData['displayName'] ?? createdByData['name'];
    } else if (createdByData is String) {
      createdById = createdByData;
    }

    return KhatmaModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      type: json['type'] ?? 'collective',
      visibility: json['visibility'] ?? 'public',
      status: json['status'] ?? 'active',
      maxMembers: json['maxMembers'] ?? 30,
      requireApproval: json['requireApproval'] ?? false,
      joinToken: json['joinToken'],
      createdBy: createdById,
      createdByName: createdByName,
      completedParts: json['completedParts'] ?? completed,
      totalParts: json['totalParts'] ?? 30,
      participantsCount: json['participantsCount'] ?? json['participants'] ?? 0,
      parts: parts,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt']) : null,
    );
  }

  KhatmaModel copyWith({
    String? id,
    String? title,
    String? description,
    String? type,
    String? visibility,
    String? status,
    int? maxMembers,
    bool? requireApproval,
    String? joinToken,
    String? createdBy,
    String? createdByName,
    int? completedParts,
    int? totalParts,
    int? participantsCount,
    List<KhatmaPart>? parts,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return KhatmaModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      type: type ?? this.type,
      visibility: visibility ?? this.visibility,
      status: status ?? this.status,
      maxMembers: maxMembers ?? this.maxMembers,
      requireApproval: requireApproval ?? this.requireApproval,
      joinToken: joinToken ?? this.joinToken,
      createdBy: createdBy ?? this.createdBy,
      createdByName: createdByName ?? this.createdByName,
      completedParts: completedParts ?? this.completedParts,
      totalParts: totalParts ?? this.totalParts,
      participantsCount: participantsCount ?? this.participantsCount,
      parts: parts ?? this.parts,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class KhatmaPart {
  final String id;
  final int partNumber;
  final String status; // available | reserved | completed
  final String? reservedBy;
  final String? reservedByName;
  final String? reservedByInitials;
  final DateTime? reservedAt;
  final DateTime? completedAt;

  const KhatmaPart({
    required this.id,
    required this.partNumber,
    required this.status,
    this.reservedBy,
    this.reservedByName,
    this.reservedByInitials,
    this.reservedAt,
    this.completedAt,
  });

  bool get isAvailable => status == 'available';
  bool get isReserved => status == 'reserved';
  bool get isCompleted => status == 'completed';

  bool isReservedByUser(String userId) =>
      (isReserved || isCompleted) && reservedBy == userId;

  factory KhatmaPart.fromJson(Map<String, dynamic> json) {
    final reservedByData = json['reservedBy'];
    String? reservedById;
    String? reservedByName;
    String? reservedByInitials;

    if (reservedByData is Map<String, dynamic>) {
      reservedById = reservedByData['_id'] ?? reservedByData['id'];
      final name = reservedByData['displayName'] ?? reservedByData['name'] ?? '';
      reservedByName = name;
      final parts = name.trim().split(' ');
      if (parts.length >= 2) {
        reservedByInitials = '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      } else if (parts.isNotEmpty && parts[0].isNotEmpty) {
        reservedByInitials = parts[0][0].toUpperCase();
      }
    } else if (reservedByData is String) {
      reservedById = reservedByData;
    }

    return KhatmaPart(
      id: json['_id'] ?? json['id'] ?? '',
      partNumber: json['partNumber'] ?? json['number'] ?? 0,
      status: json['status'] ?? 'available',
      reservedBy: reservedById,
      reservedByName: reservedByName,
      reservedByInitials: reservedByInitials,
      reservedAt: json['reservedAt'] != null ? DateTime.tryParse(json['reservedAt']) : null,
      completedAt: json['completedAt'] != null ? DateTime.tryParse(json['completedAt']) : null,
    );
  }
}

class KhatmaParticipant {
  final String id;
  final String displayName;
  final String? avatar;
  final int partsReserved;
  final int partsCompleted;

  const KhatmaParticipant({
    required this.id,
    required this.displayName,
    this.avatar,
    required this.partsReserved,
    required this.partsCompleted,
  });

  factory KhatmaParticipant.fromJson(Map<String, dynamic> json) {
    final userObj = json['user'] ?? json;
    return KhatmaParticipant(
      id: userObj['_id'] ?? userObj['id'] ?? json['_id'] ?? '',
      displayName: userObj['displayName'] ?? userObj['name'] ?? '',
      avatar: userObj['avatar'],
      partsReserved: json['partsReserved'] ?? 0,
      partsCompleted: json['partsCompleted'] ?? 0,
    );
  }
}
