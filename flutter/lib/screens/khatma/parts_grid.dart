import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../models/khatma_model.dart';

class PartsGrid extends StatelessWidget {
  final List<KhatmaPart> parts;
  final String currentUserId;
  final Function(KhatmaPart) onTap;
  final Function(KhatmaPart) onLongPress;

  const PartsGrid({
    super.key,
    required this.parts,
    required this.currentUserId,
    required this.onTap,
    required this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final sortedParts = [...parts]
      ..sort((a, b) => a.partNumber.compareTo(b.partNumber));

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 6,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 0.85,
      ),
      itemCount: sortedParts.length,
      itemBuilder: (context, index) {
        final part = sortedParts[index];
        return _PartCell(
          part: part,
          currentUserId: currentUserId,
          onTap: () => onTap(part),
          onLongPress: () => onLongPress(part),
        );
      },
    );
  }
}

class _PartCell extends StatelessWidget {
  final KhatmaPart part;
  final String currentUserId;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  const _PartCell({
    required this.part,
    required this.currentUserId,
    required this.onTap,
    required this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final isMine = part.isReservedByUser(currentUserId);
    final theme = Theme.of(context);

    Color bgColor;
    Color textColor;
    Color borderColor;
    Widget? child;

    if (part.isCompleted) {
      if (isMine) {
        // Completed by me
        bgColor = AppConstants.successGreen;
        textColor = Colors.white;
        borderColor = AppConstants.successGreen;
        child = const Icon(Icons.check_rounded, color: Colors.white, size: 18);
      } else {
        // Completed by others
        bgColor = AppConstants.completedByOthers;
        textColor = Colors.white;
        borderColor = AppConstants.completedByOthers;
        child = const Icon(Icons.check_rounded, color: Colors.white, size: 14);
      }
    } else if (part.isReserved) {
      if (isMine) {
        // Reserved by me
        bgColor = AppConstants.primaryGreen;
        textColor = Colors.white;
        borderColor = AppConstants.primaryGreen;
        final initials = part.reservedByInitials ?? '?';
        child = Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              initials,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 1),
            Container(
              width: 16,
              height: 2,
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(200),
                borderRadius: BorderRadius.circular(1),
              ),
            ),
          ],
        );
      } else {
        // Reserved by others
        bgColor = AppConstants.reservedByOthers;
        textColor = Colors.white;
        borderColor = AppConstants.reservedByOthers;
        child = Icon(Icons.lock_outline_rounded,
            color: Colors.white.withAlpha(200), size: 14);
      }
    } else {
      // Available
      bgColor = theme.brightness == Brightness.dark
          ? const Color(0xFF2A2A2A)
          : Colors.white;
      textColor = theme.brightness == Brightness.dark
          ? Colors.white70
          : Colors.black87;
      borderColor = const Color(0xFFE0E0E0);
      child = null;
    }

    final isInteractive =
        part.isAvailable || (part.isReserved && isMine);

    return GestureDetector(
      onTap: isInteractive ? onTap : null,
      onLongPress: (part.isReserved && isMine) ? onLongPress : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(AppConstants.radiusSmall),
          border: Border.all(color: borderColor, width: 1.5),
          boxShadow: isMine && !part.isCompleted
              ? [
                  BoxShadow(
                    color: AppConstants.primaryGreen.withAlpha(60),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (child != null) ...[
              child,
              const SizedBox(height: 2),
            ],
            Text(
              '${part.partNumber}',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: part.isAvailable ? textColor : Colors.white,
              ),
            ),
            if (part.isAvailable)
              Icon(
                Icons.add_circle_outline_rounded,
                size: 12,
                color: AppConstants.primaryGreen.withAlpha(180),
              ),
          ],
        ),
      ),
    );
  }
}

// Legend widget
class PartsLegend extends StatelessWidget {
  final String lang;

  const PartsLegend({super.key, required this.lang});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final items = [
      _LegendItem(
        color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
        borderColor: const Color(0xFFE0E0E0),
        label: lang == 'ar' ? 'متاح' : 'Available',
      ),
      _LegendItem(
        color: AppConstants.primaryGreen,
        label: lang == 'ar' ? 'محجوز بواسطتي' : 'My Reservation',
      ),
      _LegendItem(
        color: AppConstants.successGreen,
        label: lang == 'ar' ? 'مكتمل بواسطتي' : 'My Completion',
      ),
      _LegendItem(
        color: AppConstants.reservedByOthers,
        label: lang == 'ar' ? 'محجوز' : 'Reserved',
      ),
      _LegendItem(
        color: AppConstants.completedByOthers,
        label: lang == 'ar' ? 'مكتمل' : 'Completed',
      ),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Wrap(
        spacing: 12,
        runSpacing: 8,
        children: items
            .map((item) => Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: item.color,
                        borderRadius: BorderRadius.circular(3),
                        border: item.borderColor != null
                            ? Border.all(color: item.borderColor!)
                            : null,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      item.label,
                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                  ],
                ))
            .toList(),
      ),
    );
  }
}

class _LegendItem {
  final Color color;
  final Color? borderColor;
  final String label;

  _LegendItem({required this.color, this.borderColor, required this.label});
}
