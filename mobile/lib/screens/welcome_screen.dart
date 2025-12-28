import 'package:flutter/gestures.dart' show TapGestureRecognizer;
import 'package:flutter/material.dart';
import 'package:livekit_client/livekit_client.dart' as sdk;
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart' show launchUrl;
import '../controllers/app_ctrl.dart' as ctrl;
import '../widgets/button.dart' as buttons;

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext ctx) => Material(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 36),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              spacing: 30,
              children: [
                // Audio waveform icon to match web frontend
                Icon(
                  Icons.graphic_eq,
                  size: 80,
                  color: Colors.white,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Chat live with your voice AI agent',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                // Agent listening indicator
                Consumer<sdk.Session>(
                  builder: (ctx, session, child) => AnimatedOpacity(
                    opacity: session.agent.canListen ? 1.0 : 0.0,
                    duration: const Duration(milliseconds: 300),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.mic,
                            color: Colors.green,
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'CAAL is listening',
                            style: TextStyle(
                              color: Colors.green,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Consumer2<ctrl.AppCtrl, sdk.Session>(
                  builder: (ctx, appCtrl, session, child) {
                    final isProgressing =
                        appCtrl.isSessionStarting || session.connectionState != sdk.ConnectionState.disconnected;
                    return buttons.Button(
                      text: isProgressing ? 'Connecting' : 'Talk to CAAL',
                      isProgressing: isProgressing,
                      onPressed: () => appCtrl.connect(),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      );
}
