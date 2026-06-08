import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/splash_screen.dart';
import '../screens/onboarding_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/khatma/khatma_detail_screen.dart';
import '../screens/khatma/create_khatma_screen.dart';
import '../screens/articles/articles_screen.dart';
import '../screens/articles/article_detail_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/profile/edit_profile_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/suggestions_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/about_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

// A ChangeNotifier that wraps Riverpod auth state for GoRouter refreshListenable
class _AuthChangeNotifier extends ChangeNotifier {
  _AuthChangeNotifier(this._ref) {
    _ref.listen<AuthState>(authProvider, (_, __) => notifyListeners());
  }

  final Ref _ref;

  AuthState get authState => _ref.read(authProvider);
}

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _AuthChangeNotifier(ref);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = notifier.authState;
      final isLoading = authState.status == AuthStatus.loading;
      final isAuthenticated = authState.status == AuthStatus.authenticated;
      final location = state.uri.toString();

      if (isLoading) {
        return location == '/splash' ? null : '/splash';
      }

      final publicRoutes = [
        '/login',
        '/register',
        '/forgot-password',
        '/onboarding',
        '/splash',
      ];
      final isPublic = publicRoutes.any((r) => location.startsWith(r));

      if (!isAuthenticated && !isPublic) {
        return '/login';
      }

      if (isAuthenticated &&
          (location == '/login' || location == '/register')) {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/khatma/:id',
        builder: (context, state) => KhatmaDetailScreen(
          khatmaId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/create-khatma',
        builder: (context, state) => const CreateKhatmaScreen(),
      ),
      GoRoute(
        path: '/articles',
        builder: (context, state) => const ArticlesScreen(),
      ),
      GoRoute(
        path: '/articles/:slug',
        builder: (context, state) => ArticleDetailScreen(
          slug: state.pathParameters['slug']!,
        ),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/edit-profile',
        builder: (context, state) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/suggestions',
        builder: (context, state) => const SuggestionsScreen(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/about',
        builder: (context, state) => const AboutScreen(),
      ),
    ],
  );
});
