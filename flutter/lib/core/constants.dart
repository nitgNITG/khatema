import 'package:flutter/material.dart';

class AppConstants {
  static const String baseUrl = 'http://localhost:3011/api/v1';
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';

  // Colors
  static const Color primaryGreen = Color(0xFF58CC02);
  static const Color primaryBlue = Color(0xFF1CB0F6);
  static const Color successGreen = Color(0xFF2E7D32);
  static const Color errorRed = Color(0xFFE53935);
  static const Color warningOrange = Color(0xFFF57C00);
  static const Color greyLight = Color(0xFFF5F5F5);
  static const Color greyMedium = Color(0xFF9E9E9E);
  static const Color greyDark = Color(0xFF424242);
  static const Color cardBackground = Color(0xFFFFFFFF);
  static const Color reservedByOthers = Color(0xFFBDBDBD);
  static const Color completedByOthers = Color(0xFF78909C);

  // Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 400);
  static const Duration longAnimation = Duration(milliseconds: 600);

  // Radii
  static const double radiusSmall = 8.0;
  static const double radiusMedium = 12.0;
  static const double radiusLarge = 16.0;
  static const double radiusXL = 24.0;

  // Padding
  static const double paddingSmall = 8.0;
  static const double paddingMedium = 16.0;
  static const double paddingLarge = 24.0;
  static const double paddingXL = 32.0;

  // Khatma intentions
  static const List<String> intentions = [
    'عائلية',
    'مسجد',
    'للوالدين',
    'للمتوفى',
    'غزة',
    'شفاء',
    'نجاح',
    'حج وعمرة',
    'رمضان',
    'عامة',
    'شكر',
    'طلب',
  ];

  static const List<String> intentionKeys = [
    'family',
    'mosque',
    'parents',
    'deceased',
    'gaza',
    'healing',
    'success',
    'hajj',
    'ramadan',
    'general',
    'gratitude',
    'request',
  ];
}
