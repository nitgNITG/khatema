import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../core/constants.dart';
import '../core/translations.dart';
import '../providers/lang_provider.dart';
import '../services/notification_service.dart';

class SuggestionsScreen extends ConsumerStatefulWidget {
  const SuggestionsScreen({super.key});

  @override
  ConsumerState<SuggestionsScreen> createState() => _SuggestionsScreenState();
}

class _SuggestionsScreenState extends ConsumerState<SuggestionsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _suggestionController = TextEditingController();
  bool _loading = false;
  final _service = NotificationService();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _suggestionController.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final lang = ref.read(langProvider).lang;
    final t = (String key) => AppTranslations.translate(key, lang);
    try {
      await _service.sendSuggestion(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        suggestion: _suggestionController.text.trim(),
      );
      Fluttertoast.showToast(
        msg: t('suggestionSent'),
        backgroundColor: AppConstants.primaryGreen,
        textColor: Colors.white,
      );
      _nameController.clear();
      _emailController.clear();
      _suggestionController.clear();
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      Fluttertoast.showToast(
        msg: e.toString().replaceAll('Exception: ', ''),
        backgroundColor: AppConstants.errorRed,
        textColor: Colors.white,
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(langProvider).lang;
    final t = (String key) => AppTranslations.translate(key, lang);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: Icon(lang == 'ar' ? Icons.arrow_forward : Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(t('suggestions')),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: AppConstants.primaryGreen.withAlpha(25),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.lightbulb_outline_rounded,
                        size: 40,
                        color: AppConstants.primaryGreen,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      t('suggestionTitle'),
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      t('suggestionSubtitle'),
                      style: theme.textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Name (optional)
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(
                  labelText: t('yourName'),
                  prefixIcon: const Icon(Icons.person_outlined),
                ),
              ),
              const SizedBox(height: 16),

              // Email (optional)
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                textDirection: TextDirection.ltr,
                decoration: InputDecoration(
                  labelText: t('yourEmail'),
                  prefixIcon: const Icon(Icons.email_outlined),
                ),
                validator: (v) {
                  if (v != null && v.isNotEmpty && !v.contains('@')) {
                    return t('invalidEmail');
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Suggestion text (required)
              TextFormField(
                controller: _suggestionController,
                maxLines: 6,
                decoration: InputDecoration(
                  labelText: t('suggestionText'),
                  hintText: t('suggestionTextHint'),
                  alignLabelWithHint: true,
                  prefixIcon: const Padding(
                    padding: EdgeInsets.only(bottom: 100),
                    child: Icon(Icons.edit_outlined),
                  ),
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return t('suggestionRequired');
                  return null;
                },
              ),
              const SizedBox(height: 32),

              ElevatedButton.icon(
                onPressed: _loading ? null : _send,
                icon: _loading
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.send_rounded),
                label: Text(t('sendSuggestion')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
