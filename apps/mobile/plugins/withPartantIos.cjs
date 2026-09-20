const { withXcodeProject } = require("expo/config-plugins");
module.exports = (config) =>
  withXcodeProject(config, (mod) => {
    const configs = mod.modResults.pbxXCBuildConfigurationSection();
    for (const value of Object.values(configs)) {
      if (value && typeof value === "object" && value.buildSettings)
        value.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = "NO";
    }
    return mod;
  });
