import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/constants.dart';
import '../core/translations.dart';
import '../providers/lang_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final langState = ref.watch(langProvider);
    final lang = langState.lang;
    final t = (String key) => AppTranslations.translate(key, lang);

    final isDark = langState.themeMode == ThemeMode.dark ||
        (langState.themeMode == ThemeMode.system &&
            MediaQuery.of(context).platformBrightness == Brightness.dark);

    return Scaffold(
      appBar: AppBar(
        title: Text(t('settings'), style: const TextStyle(fontWeight: FontWeight.w700)),
        leading: IconButton(
          icon: Icon(lang == 'ar' ? Icons.arrow_forward : Icons.arrow_back),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: ListView(
        children: [
          // Language section
          _SectionHeader(label: t('language')),
          _SettingsTile(
            icon: Icons.language_rounded,
            title: t('language'),
            subtitle: lang == 'ar' ? t('arabic') : t('english'),
            trailing: Switch(
              value: lang == 'en',
              onChanged: (_) =>
                  ref.read(langProvider.notifier).toggleLanguage(),
              activeTrackColor: AppConstants.primaryGreen,
            ),
          ),

          // Theme section
          _SectionHeader(label: t('theme')),
          _SettingsTile(
            icon: Icons.brightness_4_rounded,
            title: t('darkMode'),
            trailing: Switch(
              value: isDark,
              onChanged: (_) =>
                  ref.read(langProvider.notifier).toggleTheme(),
              activeTrackColor: AppConstants.primaryGreen,
            ),
          ),

          // About section
          _SectionHeader(label: t('about')),
          _SettingsTile(
            icon: Icons.info_outline_rounded,
            title: t('about'),
            onTap: () => context.push('/about'),
          ),
          _SettingsTile(
            icon: Icons.lightbulb_outline_rounded,
            title: t('suggestions'),
            onTap: () => context.push('/suggestions'),
          ),

          const SizedBox(height: 24),

          // Version
          Center(
            child: Column(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppConstants.primaryGreen,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Center(
                    child: Text(
                      'ختمة',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                        fontFamily: 'Amiri',
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Khatema',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
                Text(
                  '${t('version')} 1.0.0',
                  style: TextStyle(
                    color: Colors.grey[500],
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'NITG',
                  style: TextStyle(
                    color: Colors.grey[400],
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String label;

  const _SectionHeader({required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: Colors.grey[500],
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: AppConstants.primaryGreen.withAlpha(20),
          borderRadius: BorderRadius.circular(9),
        ),
        child: Icon(icon, color: AppConstants.primaryGreen, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      subtitle:
          subtitle != null ? Text(subtitle!, style: const TextStyle(fontSize: 13)) : null,
      trailing: trailing ?? (onTap != null
          ? const Icon(Icons.chevron_right_rounded, color: Colors.grey)
          : null),
      onTap: onTap,
    );
  }
}
