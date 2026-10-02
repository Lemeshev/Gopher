package com.gopherlife.app;

import android.os.Bundle;
import android.os.Build;
import android.view.View;
import android.view.WindowManager;
import android.content.Intent;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.provider.Settings;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

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

        // Мост для кнопки «Поделиться» в панели «Мой код друга»: системное окно
        // Android (ACTION_SEND) вместо ссылки sms:. Раньше игра открывала
        // sms:?body=…, WebView такие схемы не умеет и показывал страницу ошибки
        // «Не удалось открыть веб-страницу: net::ERR_UNKNOWN_URL_SCHEME»
        // (жалоба заказчика 01.10.2026).
        webView.addJavascriptInterface(new ShareBridge(), "AndroidBridge");

        // Внешние схемы (sms:, tel:, mailto:, whatsapp:) отдаём системе, а не WebView:
        // иначе ребёнок вместо игры видит страницу ошибки. Веб-ссылки и file://
        // по-прежнему открываются внутри игры.
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleExternalUrl(request.getUrl());
            }

            @Override
            @SuppressWarnings("deprecation")
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleExternalUrl(Uri.parse(url));
            }
        });
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        setContentView(webView);

        // Load game from assets
        webView.loadUrl("file:///android_asset/www/index.html");

        // Dark background
        webView.setBackgroundColor(Color.parseColor("#1a1a2e"));
    }

    // Вернуть true, если ссылку обработали сами (в WebView её грузить нельзя).
    // file://, http и https открываем внутри игры, всё остальное — через систему.
    private boolean handleExternalUrl(Uri uri) {
        if (uri == null) return true;
        String scheme = uri.getScheme();
        scheme = (scheme == null) ? "" : scheme.toLowerCase();
        if (scheme.equals("file") || scheme.equals("http") || scheme.equals("https")) {
            return false;
        }
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        } catch (Exception ignored) {
            // Нет приложения для такой схемы — просто ничего не делаем:
            // никакой страницы ошибки поверх игры быть не должно.
        }
        return true;
    }

    // «Поделиться кодом друга» из игры: системное окно выбора приложения
    private class ShareBridge {
        @JavascriptInterface
        public void share(String text) {
            try {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(Intent.EXTRA_TEXT, "Мой код друга в Gopher Life: " + String.valueOf(text));
                startActivity(Intent.createChooser(send, "Отправить код другу"));
            } catch (Exception ignored) {}
        }

        // Ссылка на APK уходит в систему, а не в WebView: иначе игра сама
        // откроет файл вместо браузера и пропадёт с экрана.
        @JavascriptInterface
        public void openUrl(String url) {
            if (url == null) return;
            final String target = url;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Intent view = new Intent(Intent.ACTION_VIEW, Uri.parse(target));
                        view.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(view);
                    } catch (Exception ignored) {}
                }
            });
        }

        @JavascriptInterface
        public void downloadUpdate(String url) {
            if (url == null) return;
            final String target = url;
            new Thread(new Runnable() {
                @Override
                public void run() {
                    tellUpdate("downloading");
                    HttpURLConnection conn = null;
                    try {
                        File dir = new File(getCacheDir(), "updates");
                        if (!dir.exists()) dir.mkdirs();
                        File apk = new File(dir, "Gopher.apk");
                        URL u = new URL(target);
                        conn = (HttpURLConnection) u.openConnection();
                        conn.setInstanceFollowRedirects(true);
                        conn.setConnectTimeout(15000);
                        conn.setReadTimeout(60000);
                        conn.setRequestProperty("User-Agent", "GopherLife");
                        InputStream in = conn.getInputStream();
                        FileOutputStream out = new FileOutputStream(apk);
                        byte[] buf = new byte[8192];
                        int n;
                        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                        out.close();
                        in.close();
                        final File ready = apk;
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() { offerInstall(ready); }
                        });
                    } catch (Exception ignored) {
                        tellUpdate("fail");
                    } finally {
                        if (conn != null) conn.disconnect();
                    }
                }
            }).start();
        }
    }

    private void tellUpdate(final String state) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (webView == null) return;
                String js = "window.onUpdateStatus&&onUpdateStatus(" + org.json.JSONObject.quote(state) + ")";
                webView.evaluateJavascript(js, null);
            }
        });
    }

    private void offerInstall(File apk) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !getPackageManager().canRequestPackageInstalls()) {
                tellUpdate("permit");
                Intent permit = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getPackageName()));
                startActivity(permit);
                return;
            }
            Uri uri = UpdateFileProvider.uriFor(this, apk);
            Intent view = new Intent(Intent.ACTION_VIEW);
            view.setDataAndType(uri, "application/vnd.android.package-archive");
            view.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            tellUpdate("install");
            startActivity(view);
        } catch (Exception ignored) {
            tellUpdate("fail");
        }
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
