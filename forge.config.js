module.exports = {
  packagerConfig: {
    icon: "assets/logo.jpg",
    executableName: "classwindow-plus",
    asar: true
  },
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: [
        "win32",
        "darwin"
      ]
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          icon: "./assets/logo.jpg"
        }
      }
    }
  ]
};