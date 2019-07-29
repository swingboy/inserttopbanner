'use strict';

var fs = require('fs');
var path = require('path');
var yargs = require('yargs');
var semver = require('semver');
const os = require('os');
const endOfLine = os.EOL;

const PLUGINNAME = 'InsertBanner';
class InsertTopBanner {
  constructor(options = {}) {
    this.pkg = {};
    this.outputPath = options.outputPath;
    this.copyRight = options.copyRight || '';
    this.changePkgVersion = options.changePkgVersion || false;
    this.bannerPosition = options.bannerPosition || 'bannerPosition';
  }

  /**
   * 初始化init
   */
  init() {
    this.pkgPath = `${this.webpackConfig.context}/package.json`;
    this.pkg = this.readFileAsJson(this.pkgPath);
    // this.formVersion = this.pkg.version;
    this.updatePackageFile();
    this.changePkgVersion && this.increaseVersion();
    this.banner = `版本：${this.newVersion || this.pkg.version}，时间：${new Date().toLocaleString()}`;
  }

  /**
   * package.json是否存在version字段，不存在则创建
   */
  updatePackageFile () {
      (!this.pkg.version) && (this.pkg.version = '1.0.0');
  }

  /**
   * 读package.json文件
   */
  readFileAsJson (filePath) {
    return JSON.parse(fs.readFileSync(filePath));
  }

  upatePkgVersion () {
    this.changePkgVersion && fs.writeFileSync(this.pkgPath, JSON.stringify(this.pkg, null, this.space || 2));
  }
  /**
   * 增加版本
   */
  increaseVersion () {
    const { _ } = yargs.argv;
    const { version } = this.pkg;
    const isMinor = _.indexOf('minor') !== -1;
    const isMajor = _.indexOf('major') !== -1;

    if (isMinor) {
      this.newVersion = semver.inc(version, 'minor');
      this.pkg.version = this.newVersion;
      return;
    }

    if (isMajor) {
      this.newVersion = semver.inc(version, 'major');
      this.pkg.version = this.newVersion;
      return;
    }
    this.newVersion = semver.inc(version, 'patch');
    this.pkg.version = this.newVersion;
  }

  apply (complier) {
    const that = this;
    this.webpackConfig = complier.options;
    this.init();

    complier.hooks.compilation.tap(PLUGINNAME, (compilation) => {
      compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync('HtmlWebpackInsertBanner', function(htmlPluginData, callback){

        htmlPluginData.html = htmlPluginData.html.replace(new RegExp("\\\s*<!--\\\s*" + that.bannerPosition + "\\\s*-->\\\s*","gm"), `<!-- ${that.banner} -->${endOfLine}`);

        callback(null, htmlPluginData);
      });
    });

    complier.hooks.done.tap(PLUGINNAME, (compilation) => {
      this.upatePkgVersion();
    });
  }
}

module.exports = InsertTopBanner;

