import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';
import '../core/translations.dart';
import '../providers/lang_provider.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<_OnboardSlide> _slides = [
    _OnboardSlide(
      titleKey: 'onboardTitle1',
      descKey: 'onboardDesc1',
      virtueKey: 'virtue1',
      icon: Icons.auto_stories_rounded,
      gradient: [const Color(0xFF58CC02), const Color(0xFF4AB302)],
    ),
    _OnboardSlide(
      titleKey: 'onboardTitle2',
      descKey: 'onboardDesc2',
      virtueKey: 'virtue2',
      icon: Icons.people_rounded,
      gradient: [const Color(0xFF1CB0F6), const Color(0xFF0A90D4)],
    ),
    _OnboardSlide(
      titleKey: 'onboardTitle3',
      descKey: 'onboardDesc3',
      virtueKey: 'virtue3',
      icon: Icons.star_rounded,
      gradient: [const Color(0xFFFF9600), const Color(0xFFE07A00)],
    ),
  ];

  void _nextPage() {
    if (_currentPage < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    } else {
      _finish();
    }
  }

  Future<void> _finish() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarded', true);
    if (!mounted) return;
    context.go('/login');
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(langProvider).lang;
    final t = (String key) => AppTranslations.translate(key, lang);
    final isLast = _currentPage == _slides.length - 1;

    return Scaffold(
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            onPageChanged: (i) => setState(() => _currentPage = i),
            itemCount: _slides.length,
            itemBuilder: (context, index) {
              return _SlideWidget(
                slide: _slides[index],
                lang: lang,
                t: t,
              );
            },
          ),
          Positioned(
            top: 56,
            right: 20,
            child: TextButton(
              onPressed: _finish,
              child: Text(
                t('skip'),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withAlpha(100),
                  ],
                ),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _slides.length,
                      (i) => AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: i == _currentPage ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: i == _currentPage
                              ? Colors.white
                              : Colors.white.withAlpha(100),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _nextPage,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppConstants.primaryGreen,
                      minimumSize: const Size(double.infinity, 52),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      isLast ? t('getStarted') : t('next'),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OnboardSlide {
  final String titleKey;
  final String descKey;
  final String virtueKey;
  final IconData icon;
  final List<Color> gradient;

  const _OnboardSlide({
    required this.titleKey,
    required this.descKey,
    required this.virtueKey,
    required this.icon,
    required this.gradient,
  });
}

class _SlideWidget extends StatelessWidget {
  final _OnboardSlide slide;
  final String lang;
  final String Function(String) t;

  const _SlideWidget({
    required this.slide,
    required this.lang,
    required this.t,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: slide.gradient,
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 60, 24, 160),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(40),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  slide.icon,
                  size: 60,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 40),
              Text(
                t(slide.titleKey),
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  fontFamily: 'Amiri',
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                t(slide.descKey),
                style: TextStyle(
                  fontSize: 15,
                  color: Colors.white.withAlpha(220),
                  height: 1.6,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(25),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: Colors.white.withAlpha(60),
                  ),
                ),
                child: Text(
                  t(slide.virtueKey),
                  style: const TextStyle(
                    fontSize: 13,
                    color: Colors.white,
                    fontStyle: FontStyle.italic,
                    fontFamily: 'Amiri',
                    height: 1.7,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
