package com.gopherlife.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.graphics.Color;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fullscreen, no title bar
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        // Keep screen on
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Create WebView
        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setPluginState(WebSettings.PluginState.OFF);

        webView.setWebViewClient(new WebViewClient());
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        setContentView(webView);

        // Load game from assets
        webView.loadUrl("file:///android_asset/www/index.html");

        // Dark background
        webView.setBackgroundColor(Color.parseColor("#1a1a2e"));
    }

    @Override
    public void onBackPressed() {
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        if (webView.canGoBack()) {
            webView.goBack();
            return;
        }
        // Сначала спрашиваем игру: она сама решает — вернуться на шаг назад
        // (закрыть шторку, выйти из гостей у друга) или закрыть приложение.
        // Раньше «Назад» всегда закрывала игру, поэтому из гостей выйти было
        // невозможно: ребёнок выгружал приложение целиком (жалоба 30.09.2026).
        webView.evaluateJavascript(
            "(window.onAndroidBack ? String(onAndroidBack()) : 'exit')",
            new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String value) {
                    if (value == null || value.indexOf("exit") != -1) {
                        finish();
                    }
                }
            });
    }
}
