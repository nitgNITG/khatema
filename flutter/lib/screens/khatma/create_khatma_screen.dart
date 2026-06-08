import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../core/constants.dart';
import '../../core/translations.dart';
import '../../providers/khatma_provider.dart';
import '../../providers/lang_provider.dart';
import '../../services/khatma_service.dart';

class CreateKhatmaScreen extends ConsumerStatefulWidget {
  const CreateKhatmaScreen({super.key});

  @override
  ConsumerState<CreateKhatmaScreen> createState() => _CreateKhatmaScreenState();
}

class _CreateKhatmaScreenState extends ConsumerState<CreateKhatmaScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _maxMembersController = TextEditingController(text: '30');

  String _type = 'collective';
  String _visibility = 'public';
  bool _requireApproval = false;
  String? _intention;
  bool _loading = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _maxMembersController.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    final lang = ref.read(langProvider).lang;
    final t = (String key) => AppTranslations.translate(key, lang);

    try {
      final service = KhatmaService();
      final khatma = await service.createKhatma(
        title: _titleController.text.trim(),
        description: _descController.text.trim(),
        type: _type,
        visibility: _visibility,
        maxMembers: int.tryParse(_maxMembersController.text) ?? 30,
        requireApproval: _requireApproval,
        intention: _intention,
      );
      ref.read(myKhatmasProvider.notifier).addKhatma(khatma);
      ref.read(publicKhatmasProvider.notifier).refresh();

      Fluttertoast.showToast(
        msg: t('success'),
        backgroundColor: AppConstants.primaryGreen,
        textColor: Colors.white,
      );
      if (mounted) context.go('/khatma/${khatma.id}');
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

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: Icon(lang == 'ar' ? Icons.arrow_forward : Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(t('newKhatma')),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                TextFormField(
                  controller: _titleController,
                  decoration: InputDecoration(
                    labelText: t('khatmaTitle'),
                    prefixIcon: const Icon(Icons.title_rounded),
                  ),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? t('fieldRequired') : null,
                ),
                const SizedBox(height: 16),

                // Description
                TextFormField(
                  controller: _descController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: t('khatmaDesc'),
                    alignLabelWithHint: true,
                    prefixIcon: const Padding(
                      padding: EdgeInsets.only(bottom: 40),
                      child: Icon(Icons.description_outlined),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Type selector
                _SectionLabel(label: t('khatmaType')),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: _SelectableCard(
                        label: t('collective'),
                        icon: Icons.people_rounded,
                        selected: _type == 'collective',
                        onTap: () => setState(() => _type = 'collective'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _SelectableCard(
                        label: t('individual'),
                        icon: Icons.person_rounded,
                        selected: _type == 'individual',
                        onTap: () => setState(() => _type = 'individual'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Visibility selector
                _SectionLabel(label: t('visibility')),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: _SelectableCard(
                        label: t('public'),
                        icon: Icons.public_rounded,
                        selected: _visibility == 'public',
                        onTap: () => setState(() => _visibility = 'public'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _SelectableCard(
                        label: t('private'),
                        icon: Icons.lock_outline_rounded,
                        selected: _visibility == 'private',
                        onTap: () => setState(() => _visibility = 'private'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Max members
                TextFormField(
                  controller: _maxMembersController,
                  keyboardType: TextInputType.number,
                  textDirection: TextDirection.ltr,
                  decoration: InputDecoration(
                    labelText: t('maxMembers'),
                    prefixIcon: const Icon(Icons.group_add_outlined),
                  ),
                  validator: (v) {
                    final n = int.tryParse(v ?? '');
                    if (n == null || n < 1 || n > 30) {
                      return lang == 'ar'
                          ? 'يجب أن يكون بين 1 و 30'
                          : 'Must be between 1 and 30';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Require approval
                SwitchListTile(
                  title: Text(t('requireApproval')),
                  value: _requireApproval,
                  onChanged: (v) => setState(() => _requireApproval = v),
                  activeTrackColor: AppConstants.primaryGreen,
                  contentPadding: EdgeInsets.zero,
                ),
                const SizedBox(height: 16),

                // Intention selector
                _SectionLabel(label: t('intention')),
                const SizedBox(height: 8),
                DropdownButton<String>(
                  value: _intention,
                  hint: Text(t('selectIntention')),
                  isExpanded: true,
                  underline: Container(
                    height: 1,
                    color: const Color(0xFFE0E0E0),
                  ),
                  items: [
                    ...List.generate(
                      AppConstants.intentions.length,
                      (i) => DropdownMenuItem(
                        value: AppConstants.intentionKeys[i],
                        child: Text(AppConstants.intentions[i]),
                      ),
                    ),
                  ],
                  onChanged: (v) => setState(() => _intention = v),
                ),
                const SizedBox(height: 32),

                // Create button
                ElevatedButton(
                  onPressed: _loading ? null : _create,
                  child: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(t('createKhatma')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;

  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: Theme.of(context).textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
            color: Colors.grey[700],
          ),
    );
  }
}

class _SelectableCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _SelectableCard({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: selected
              ? AppConstants.primaryGreen.withAlpha(25)
              : theme.cardTheme.color,
          borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
          border: Border.all(
            color: selected
                ? AppConstants.primaryGreen
                : const Color(0xFFE0E0E0),
            width: selected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 20,
              color: selected
                  ? AppConstants.primaryGreen
                  : Colors.grey[600],
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: selected
                    ? AppConstants.primaryGreen
                    : Colors.grey[700],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
