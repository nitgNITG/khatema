import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../core/constants.dart';
import '../../core/translations.dart';
import '../../providers/auth_provider.dart';
import '../../providers/lang_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _loading = false;
  int _passwordStrength = 0;

  @override
  void initState() {
    super.initState();
    _passwordController.addListener(_updateStrength);
  }

  void _updateStrength() {
    final pw = _passwordController.text;
    int strength = 0;
    if (pw.length >= 8) strength++;
    if (pw.contains(RegExp(r'[A-Z]'))) strength++;
    if (pw.contains(RegExp(r'[0-9]'))) strength++;
    if (pw.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) strength++;
    setState(() => _passwordStrength = strength);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(authProvider.notifier).register(
            email: _emailController.text.trim(),
            password: _passwordController.text,
            displayName: _nameController.text.trim(),
          );
      if (mounted) context.go('/dashboard');
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

  Color _strengthColor(int strength) {
    switch (strength) {
      case 0:
      case 1:
        return AppConstants.errorRed;
      case 2:
        return AppConstants.warningOrange;
      case 3:
        return AppConstants.primaryBlue;
      default:
        return AppConstants.primaryGreen;
    }
  }

  String _strengthLabel(int strength, String lang) {
    final labels = lang == 'ar'
        ? ['ضعيفة', 'ضعيفة', 'متوسطة', 'قوية', 'قوية جداً']
        : ['Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    return labels[strength.clamp(0, 4)];
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
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  t('createAccount'),
                  style: theme.textTheme.displaySmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                Text(t('registerSubtitle'), style: theme.textTheme.bodyMedium),
                const SizedBox(height: 32),

                // Name
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: t('displayName'),
                    prefixIcon: const Icon(Icons.person_outlined),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return t('nameRequired');
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Email
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textDirection: TextDirection.ltr,
                  decoration: InputDecoration(
                    labelText: t('emailAddress'),
                    prefixIcon: const Icon(Icons.email_outlined),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return t('fieldRequired');
                    if (!v.contains('@')) return t('invalidEmail');
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Password
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: t('password'),
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                      onPressed: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return t('fieldRequired');
                    if (v.length < 8) return t('passwordTooShort');
                    return null;
                  },
                ),

                // Strength indicator
                if (_passwordController.text.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: _passwordStrength / 4,
                            minHeight: 6,
                            backgroundColor: const Color(0xFFEEEEEE),
                            valueColor: AlwaysStoppedAnimation<Color>(
                              _strengthColor(_passwordStrength),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        _strengthLabel(_passwordStrength, lang),
                        style: TextStyle(
                          fontSize: 11,
                          color: _strengthColor(_passwordStrength),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 16),

                // Confirm password
                TextFormField(
                  controller: _confirmController,
                  obscureText: _obscureConfirm,
                  decoration: InputDecoration(
                    labelText: t('confirmPassword'),
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirm
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                      onPressed: () =>
                          setState(() => _obscureConfirm = !_obscureConfirm),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return t('fieldRequired');
                    if (v != _passwordController.text) {
                      return t('passwordsNoMatch');
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 28),

                ElevatedButton(
                  onPressed: _loading ? null : _register,
                  child: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(t('createAccount')),
                ),
                const SizedBox(height: 24),

                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        t('alreadyHaveAccount'),
                        style: theme.textTheme.bodyMedium,
                      ),
                      const SizedBox(width: 4),
                      TextButton(
                        onPressed: () => context.pop(),
                        child: Text(
                          t('signIn'),
                          style: TextStyle(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
