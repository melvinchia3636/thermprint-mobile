const { withDangerousMod, withProjectBuildGradle, withGradleProperties } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withAndroidBuildFix(config, { gradleVersion = "8.13", agpVersion = "8.8.2", kotlinVersion = "2.1.20" } = {}) {
  // 1. Ensure gradle-wrapper.properties uses Gradle 8.13
  config = withDangerousMod(config, [
    "android",
    function (config) {
      const propertiesPath = path.join(
        config.modRequest.platformProjectRoot,
        "gradle/wrapper/gradle-wrapper.properties"
      );
      if (fs.existsSync(propertiesPath)) {
        let content = fs.readFileSync(propertiesPath, "utf-8");
        content = content.replace(
          /distributionUrl=.*/,
          `distributionUrl=https\\://services.gradle.org/distributions/gradle-${gradleVersion}-bin.zip`
        );
        fs.writeFileSync(propertiesPath, content, "utf-8");
      }
      return config;
    },
  ]);

  // 2. Pin AGP and Kotlin plugin versions in android/build.gradle to prevent AGP 9.x resolution
  config = withProjectBuildGradle(config, function (config) {
    if (config.modResults.language === "groovy") {
      let contents = config.modResults.contents;
      contents = contents.replace(
        /classpath\(['"]com\.android\.tools\.build:gradle['"]\)/,
        `classpath('com.android.tools.build:gradle:${agpVersion}')`
      );
      contents = contents.replace(
        /classpath\(['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin['"]\)/,
        `classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:${kotlinVersion}')`
      );
      config.modResults.contents = contents;
    }
    return config;
  });

  // 3. Ensure sufficient JVM heap and Metaspace memory for Gradle and Kotlin daemon
  config = withGradleProperties(config, function (config) {
    const jvmArgs = config.modResults.find((item) => item.type === "property" && item.key === "org.gradle.jvmargs");
    if (jvmArgs) {
      jvmArgs.value = "-Xmx4096m -XX:MaxMetaspaceSize=1536m -XX:+HeapDumpOnOutOfMemoryError";
    } else {
      config.modResults.push({
        type: "property",
        key: "org.gradle.jvmargs",
        value: "-Xmx4096m -XX:MaxMetaspaceSize=1536m -XX:+HeapDumpOnOutOfMemoryError",
      });
    }
    const kotlinOpts = config.modResults.find((item) => item.type === "property" && item.key === "kotlin.daemon.jvm.options");
    if (kotlinOpts) {
      kotlinOpts.value = "-Xmx2048m -XX:MaxMetaspaceSize=1024m";
    } else {
      config.modResults.push({
        type: "property",
        key: "kotlin.daemon.jvm.options",
        value: "-Xmx2048m -XX:MaxMetaspaceSize=1024m",
      });
    }
    return config;
  });

  return config;
}

module.exports = withAndroidBuildFix;
