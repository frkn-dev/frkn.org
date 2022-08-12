function getOS(): string {
    let userAgent = window.navigator.userAgent,
      platform = window.navigator.platform,
      macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"],
      windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"],
      iosPlatforms = ["iPhone", "iPad", "iPod"];

    if (macosPlatforms.indexOf(platform) !== -1) {
      return "macos";
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      return "ios";
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      return "windows";
    } else if (/Android/.test(userAgent)) {
      return "android";
    } else return "linux";
}

export default getOS;
