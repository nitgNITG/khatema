import 'package:flutter/material.dart';
import '../core/constants.dart';

class StatCardWidget extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color? color;

  const StatCardWidget({
    super.key,
    required this.value,
    required this.label,
    required this.icon,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final effectiveColor = color ?? AppConstants.primaryGreen;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: effectiveColor.withAlpha(25),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: effectiveColor, size: 22),
            ),
            const SizedBox(height: 10),
            Text(
              value,
              style: theme.textTheme.headlineMedium?.copyWith(
                color: effectiveColor,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
