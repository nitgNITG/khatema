import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LangState {
  final String lang; // 'ar' | 'en'
  final ThemeMode themeMode;

  const LangState({
    this.lang = 'ar',
    this.themeMode = ThemeMode.system,
  });

  bool get isArabic => lang == 'ar';
  TextDirection get textDirection =>
      lang == 'ar' ? TextDirection.rtl : TextDirection.ltr;

  LangState copyWith({String? lang, ThemeMode? themeMode}) {
    return LangState(
      lang: lang ?? this.lang,
      themeMode: themeMode ?? this.themeMode,
    );
  }
}

class LangNotifier extends StateNotifier<LangState> {
  LangNotifier() : super(const LangState()) {
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    final lang = prefs.getString('lang') ?? 'ar';
    final themeStr = prefs.getString('theme') ?? 'system';
    final themeMode = _parseThemeMode(themeStr);
    state = LangState(lang: lang, themeMode: themeMode);
  }

  ThemeMode _parseThemeMode(String str) {
    switch (str) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  String _serializeThemeMode(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.light:
        return 'light';
      case ThemeMode.dark:
        return 'dark';
      default:
        return 'system';
    }
  }

  Future<void> setLanguage(String lang) async {
    state = state.copyWith(lang: lang);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('lang', lang);
  }

  Future<void> toggleLanguage() async {
    final newLang = state.lang == 'ar' ? 'en' : 'ar';
    await setLanguage(newLang);
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = state.copyWith(themeMode: mode);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('theme', _serializeThemeMode(mode));
  }

  Future<void> toggleTheme() async {
    final newMode = state.themeMode == ThemeMode.dark
        ? ThemeMode.light
        : ThemeMode.dark;
    await setThemeMode(newMode);
  }

  String t(String key) {
    return _translations[state.lang]?[key] ??
        _translations['ar']?[key] ??
        key;
  }

  static const Map<String, Map<String, String>> _translations = {
    'ar': {'_placeholder': ''},
    'en': {'_placeholder': ''},
  };
}

final langProvider = StateNotifierProvider<LangNotifier, LangState>(
  (ref) => LangNotifier(),
);
