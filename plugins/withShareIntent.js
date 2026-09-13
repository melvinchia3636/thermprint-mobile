const {
  withAndroidManifest,
  withDangerousMod,
  withMainActivity,
  withMainApplication,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const SHARE_INTENT_MODULE_KT = `package com.melvinchia.thermprint

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.webkit.MimeTypeMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.FileOutputStream

class ShareIntentModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "ShareIntentModule"
        const val EVENT_NAME = "onSharedImageReceived"
        private var instance: ShareIntentModule? = null
        private var pendingSharedUri: String? = null

        fun handleIntent(context: Context, intent: Intent?) {
            if (intent == null) return
            val action = intent.action
            val type = intent.type

            if (action == Intent.ACTION_SEND || action == Intent.ACTION_SEND_MULTIPLE) {
                if (type != null && type.startsWith("image/")) {
                    val uri = extractUriFromIntent(intent)
                    if (uri != null) {
                        val cachedFilePath = copyUriToCache(context, uri)
                        if (cachedFilePath != null) {
                            val fileUri = "file://$cachedFilePath"
                            pendingSharedUri = fileUri
                            instance?.emitEvent(fileUri)
                        }
                    }
                }
            }
        }

        private fun extractUriFromIntent(intent: Intent): Uri? {
            if (intent.action == Intent.ACTION_SEND) {
                @Suppress("DEPRECATION")
                val streamUri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
                if (streamUri != null) return streamUri
            } else if (intent.action == Intent.ACTION_SEND_MULTIPLE) {
                @Suppress("DEPRECATION")
                val streamUris = intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)
                if (!streamUris.isNullOrEmpty()) return streamUris[0]
            }

            if (intent.clipData != null && intent.clipData!!.itemCount > 0) {
                val clipUri = intent.clipData!!.getItemAt(0).uri
                if (clipUri != null) return clipUri
            }

            return intent.data
        }

        private fun copyUriToCache(context: Context, uri: Uri): String? {
            return try {
                val contentResolver = context.contentResolver
                val mimeType = contentResolver.getType(uri)
                val extension = if (mimeType != null) {
                    MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType) ?: "jpg"
                } else {
                    "jpg"
                }

                val cacheDir = File(context.cacheDir, "shared_images")
                if (!cacheDir.exists()) {
                    cacheDir.mkdirs()
                }

                val targetFile = File(cacheDir, "shared_\${System.currentTimeMillis()}.$extension")
                contentResolver.openInputStream(uri)?.use { input ->
                    FileOutputStream(targetFile).use { output ->
                        input.copyTo(output)
                    }
                }
                targetFile.absolutePath
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }
    }

    init {
        instance = this
    }

    override fun getName(): String = NAME

    private fun emitEvent(uri: String) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_NAME, uri)
        }
    }

    @ReactMethod
    fun getInitialSharedUri(promise: Promise) {
        try {
            if (pendingSharedUri != null) {
                val uri = pendingSharedUri
                pendingSharedUri = null
                promise.resolve(uri)
                return
            }

            val activity = reactApplicationContext.currentActivity
            val intent = activity?.intent
            if (intent != null && (intent.action == Intent.ACTION_SEND || intent.action == Intent.ACTION_SEND_MULTIPLE)) {
                val type = intent.type
                if (type != null && type.startsWith("image/")) {
                    val rawUri = extractUriFromIntent(intent)
                    if (rawUri != null) {
                        val cachedFilePath = copyUriToCache(reactContext, rawUri)
                        intent.action = null
                        if (cachedFilePath != null) {
                            promise.resolve("file://$cachedFilePath")
                            return
                        }
                    }
                }
            }

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SHARE_INTENT_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun clearSharedUri(promise: Promise) {
        pendingSharedUri = null
        promise.resolve(true)
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Double) {}
}
`;

const SHARE_INTENT_PACKAGE_KT = `package com.melvinchia.thermprint

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

class ShareIntentPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(ShareIntentModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> {
        return emptyList()
    }
}
`;

function withShareIntent(config) {
  // 1. Add SEND and SEND_MULTIPLE intent-filters to AndroidManifest.xml
  config = withAndroidManifest(config, function (config) {
    const mainApplication = config.modResults.manifest.application?.[0];
    const mainActivity = mainApplication?.activity?.find(
      (activity) => activity.$["android:name"] === ".MainActivity"
    );

    if (mainActivity) {
      mainActivity["intent-filter"] = mainActivity["intent-filter"] || [];

      const hasSendFilter = mainActivity["intent-filter"].some((filter) => {
        return (
          filter.action?.some((action) => action.$["android:name"] === "android.intent.action.SEND") &&
          filter.data?.some((data) => data.$["android:mimeType"] === "image/*")
        );
      });

      if (!hasSendFilter) {
        mainActivity["intent-filter"].push({
          action: [{ $: { "android:name": "android.intent.action.SEND" } }],
          category: [{ $: { "android:name": "android.intent.category.DEFAULT" } }],
          data: [{ $: { "android:mimeType": "image/*" } }],
        });

        mainActivity["intent-filter"].push({
          action: [{ $: { "android:name": "android.intent.action.SEND_MULTIPLE" } }],
          category: [{ $: { "android:name": "android.intent.category.DEFAULT" } }],
          data: [{ $: { "android:mimeType": "image/*" } }],
        });
      }
    }

    return config;
  });

  // 2. Generate ShareIntentModule.kt and ShareIntentPackage.kt in the source directory
  config = withDangerousMod(config, [
    "android",
    function (config) {
      const packageName = config.android?.package || "com.melvinchia.thermprint";
      const packageSubPath = packageName.replace(/\./g, "/");
      const srcDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/java",
        packageSubPath
      );

      if (!fs.existsSync(srcDir)) {
        fs.mkdirSync(srcDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(srcDir, "ShareIntentModule.kt"),
        SHARE_INTENT_MODULE_KT,
        "utf-8"
      );
      fs.writeFileSync(
        path.join(srcDir, "ShareIntentPackage.kt"),
        SHARE_INTENT_PACKAGE_KT,
        "utf-8"
      );

      return config;
    },
  ]);

  // 3. Inject onNewIntent handler into MainActivity.kt
  config = withMainActivity(config, function (config) {
    let contents = config.modResults.contents;
    if (!contents.includes("ShareIntentModule.handleIntent")) {
      const onNewIntentCode = `
  override fun onNewIntent(intent: android.content.Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    ShareIntentModule.handleIntent(this, intent)
  }
`;
      const lastBraceIndex = contents.lastIndexOf("}");
      if (lastBraceIndex !== -1) {
        contents =
          contents.slice(0, lastBraceIndex) +
          onNewIntentCode +
          contents.slice(lastBraceIndex);
      }
      config.modResults.contents = contents;
    }
    return config;
  });

  // 4. Inject ShareIntentPackage into MainApplication.kt
  config = withMainApplication(config, function (config) {
    let contents = config.modResults.contents;
    if (!contents.includes("ShareIntentPackage()")) {
      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply\s*\{/,
        "PackageList(this).packages.apply {\n          add(ShareIntentPackage())"
      );
      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
}

module.exports = withShareIntent;
