import * as rimraf from 'rimraf';
import * as path from 'path';
const Task = require('ember-cli/lib/models/task');
import * as webpack from 'webpack';
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
import { NgCliWebpackConfig } from '../models/webpack-config';
import { webpackOutputOptions } from '../models/';
import { BuildOptions } from '../commands/build';
import * as fs from 'fs';

let lastHash: any = null;

export default Task.extend({
  run: function(runTaskOptions: BuildOptions) {

    const project = this.cliProject;

    rimraf.sync(path.resolve(project.root, runTaskOptions.outputPath));

    const config = new NgCliWebpackConfig(
      project,
      runTaskOptions.target,
      runTaskOptions.environment,
      runTaskOptions.outputPath,
      runTaskOptions.baseHref
    ).config;
    const webpackCompiler: any = webpack(config);

    webpackCompiler.apply(new ProgressPlugin({
      profile: true
    }));

    return new Promise((resolve, reject) => {
      webpackCompiler.watch({}, (err: any, stats: any) => {
        if (err) {
          lastHash = null;
          console.error(err.stack || err);
          if (err.details) { console.error(err.details); }
            reject(err.details);
        }

        if (stats.hash !== lastHash) {
          lastHash = stats.hash;
          process.stdout.write(stats.toString(webpackOutputOptions) + '\n');          
        }
        let statsFile = path.normalize(path.join(project.root, 'stats.watch.json'));
        console.log(statsFile);
        fs.writeFileSync(statsFile, JSON.stringify(stats.toJson()));
      });
    });
  }
});
