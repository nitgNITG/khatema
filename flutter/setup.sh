#!/bin/bash
# Khatema Flutter App Setup Script
set -e

echo "=== Setting up Khatema Flutter App ==="

# Check if flutter is installed
if ! command -v flutter &> /dev/null; then
    echo "ERROR: Flutter not found. Please install Flutter first."
    echo "https://docs.flutter.dev/get-started/install"
    exit 1
fi

echo "Flutter version:"
flutter --version

# Get dependencies
echo ""
echo "=== Installing dependencies ==="
flutter pub get

# Download Amiri font (optional - app will fallback to system font if missing)
echo ""
echo "=== Note: Arabic font setup ==="
echo "If you want the Amiri Arabic font, download it from:"
echo "https://fonts.google.com/specimen/Amiri"
echo "Place Amiri-Regular.ttf and Amiri-Bold.ttf in assets/fonts/"
echo "Or remove the font config from pubspec.yaml to use system fonts."

# Create placeholder font files if they don't exist (prevent build errors)
mkdir -p assets/fonts
mkdir -p assets/images
mkdir -p assets/icons

if [ ! -f "assets/fonts/Amiri-Regular.ttf" ]; then
    echo "Creating placeholder font files..."
    touch assets/fonts/Amiri-Regular.ttf
    touch assets/fonts/Amiri-Bold.ttf
fi

echo ""
echo "=== Setup complete! ==="
echo ""
echo "To run the app:"
echo "  flutter run"
echo ""
echo "Make sure the backend is running at http://localhost:3011"
echo ""
