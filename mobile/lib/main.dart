import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'app.dart';

// Load environment variables before starting the app
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Hide status bar and navigation bar for full-screen experience
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

  await dotenv.load(fileName: '.env');
  runApp(const CaalApp());
}
