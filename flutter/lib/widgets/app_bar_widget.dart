import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/lang_provider.dart';
import '../core/translations.dart';

class KhatemaAppBar extends ConsumerWidget implements PreferredSizeWidget {
  final String titleKey;
  final String? titleText;
  final List<Widget>? actions;
  final bool showLangToggle;
  final bool automaticallyImplyLeading;
  final Widget? leading;

  const KhatemaAppBar({
    super.key,
    this.titleKey = '',
    this.titleText,
    this.actions,
    this.showLangToggle = false,
    this.automaticallyImplyLeading = true,
    this.leading,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final langState = ref.watch(langProvider);
    final lang = langState.lang;

    final title = titleText ??
        (titleKey.isNotEmpty
            ? AppTranslations.translate(titleKey, lang)
            : '');

    final allActions = <Widget>[
      ...?actions,
      if (showLangToggle)
        TextButton(
          onPressed: () =>
              ref.read(langProvider.notifier).toggleLanguage(),
          child: Text(
            lang == 'ar' ? 'EN' : 'ع',
            style: TextStyle(
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.w700,
              fontSize: 15,
            ),
          ),
        ),
    ];

    return AppBar(
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
      ),
      actions: allActions.isNotEmpty ? allActions : null,
      automaticallyImplyLeading: automaticallyImplyLeading,
      leading: leading,
    );
  }
}
