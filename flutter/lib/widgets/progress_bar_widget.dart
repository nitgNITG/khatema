import 'package:flutter/material.dart';
import '../core/constants.dart';

class ProgressBarWidget extends StatelessWidget {
  final double progress; // 0.0 - 1.0
  final String? label;
  final double height;
  final Color? color;
  final bool showPercent;

  const ProgressBarWidget({
    super.key,
    required this.progress,
    this.label,
    this.height = 8,
    this.color,
    this.showPercent = true,
  });

  @override
  Widget build(BuildContext context) {
    final pct = (progress * 100).toStringAsFixed(0);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null || showPercent)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (label != null)
                  Text(
                    label!,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF777777),
                    ),
                  ),
                if (showPercent)
                  Text(
                    '$pct%',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: color ?? AppConstants.primaryGreen,
                    ),
                  ),
              ],
            ),
          ),
        ClipRRect(
          borderRadius: BorderRadius.circular(height / 2),
          child: LinearProgressIndicator(
            value: progress.clamp(0.0, 1.0),
            minHeight: height,
            backgroundColor: const Color(0xFFE8E8E8),
            valueColor: AlwaysStoppedAnimation<Color>(
              color ?? AppConstants.primaryGreen,
            ),
          ),
        ),
      ],
    );
  }
}

class CircularProgressWidget extends StatelessWidget {
  final double progress;
  final double size;
  final String? centerText;
  final Color? color;

  const CircularProgressWidget({
    super.key,
    required this.progress,
    this.size = 80,
    this.centerText,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final pct = (progress * 100).toStringAsFixed(0);
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircularProgressIndicator(
            value: progress.clamp(0.0, 1.0),
            strokeWidth: 6,
            backgroundColor: const Color(0xFFE8E8E8),
            valueColor: AlwaysStoppedAnimation<Color>(
              color ?? AppConstants.primaryGreen,
            ),
          ),
          Text(
            centerText ?? '$pct%',
            style: TextStyle(
              fontSize: size * 0.18,
              fontWeight: FontWeight.w700,
              color: color ?? AppConstants.primaryGreen,
            ),
          ),
        ],
      ),
    );
  }
}
