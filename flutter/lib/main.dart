import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'core/router.dart';
import 'core/theme.dart';
import 'providers/lang_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  _setupTimeago();
  runApp(
    const ProviderScope(
      child: KhatemaApp(),
    ),
  );
}

void _setupTimeago() {
  timeago.setLocaleMessages('ar', _ArabicMessages());
}

class KhatemaApp extends ConsumerWidget {
  const KhatemaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final langState = ref.watch(langProvider);
    final router = ref.watch(routerProvider);

    return Directionality(
      textDirection: langState.textDirection,
      child: MaterialApp.router(
        title: 'Khatema',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: langState.themeMode,
        routerConfig: router,
        builder: (context, child) {
          return Directionality(
            textDirection: langState.textDirection,
            child: child ?? const SizedBox.shrink(),
          );
        },
      ),
    );
  }
}

// Basic Arabic timeago messages
class _ArabicMessages implements timeago.LookupMessages {
  @override
  String prefixAgo() => 'منذ';
  @override
  String prefixFromNow() => 'خلال';
  @override
  String suffixAgo() => '';
  @override
  String suffixFromNow() => '';
  @override
  String lessThanOneMinute(int seconds) => 'لحظة';
  @override
  String aboutAMinute(int minutes) => 'دقيقة';
  @override
  String minutes(int minutes) => '$minutes دقيقة';
  @override
  String aboutAnHour(int minutes) => 'ساعة';
  @override
  String hours(int hours) => '$hours ساعات';
  @override
  String aDay(int hours) => 'يوم';
  @override
  String days(int days) => '$days أيام';
  @override
  String aboutAMonth(int days) => 'شهر';
  @override
  String months(int months) => '$months أشهر';
  @override
  String aboutAYear(int year) => 'سنة';
  @override
  String years(int years) => '$years سنوات';
  @override
  String wordSeparator() => ' ';
}
