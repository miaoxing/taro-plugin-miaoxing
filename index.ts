import {IPluginContext} from '@tarojs/service';
import * as glob from 'glob';
import fs from 'fs';
import log from '@gitsync/log';
import path from 'path';

interface IPluginOptions {
  indexPage?: string
  pageGlob?: string
}

const moveToFirst = (array: string[], element: string): string[] => {
  const index = array.indexOf(element);
  if (index > 0) {
    array.splice(index, 1);
    array.unshift(element);
  }
  return array;
};

const generatePages = (pageGlob: string, indexPage: string) => {
  const pluginPages = glob.sync(pageGlob);
  let pages = pluginPages.map(page => {
    // Page example: src/pages/articles/index.config.js
    const path = page.split('/pages/')[1];
    return 'pages/' + path.substr(0, path.length - 10);
  });

  pages = moveToFirst(pages, indexPage);
  log.info(`Find ${pages.length} pages`);

  fs.writeFileSync('src/config/pages.json', JSON.stringify(pages, null, 2));
  log.info('Write pages.json success');
};

const watchGeneratePages = (ctx: IPluginContext, options: IPluginOptions) => {
  ctx.helper.chokidar
    .watch(options.pageGlob, {ignoreInitial: true})
    .on('add', (path: string) => {
      log.info(`Add page "${path}"`);
      generatePages(options.pageGlob, options.indexPage);
    })
    .on('unlink', (path: string) => {
      log.info(`Remove page "${path}"`);
      generatePages(options.pageGlob, options.indexPage);
    });
};

const symlinkPageGlob = '../plugins/*/pages/m/*';

const symlinkPages = () => {
  const dirs = glob.sync(symlinkPageGlob);
  dirs.forEach(dir => {
    const source = '../../' + dir;
    const target = 'src/pages/' + path.basename(dir);

    if (fs.existsSync(target)) {
      log.info(`Skip symlink to existing directory "${target}"`);
      return;
    }

    log.info(`Symlink "${dir}" to "${target}"`);
    fs.symlinkSync(source, target, 'dir');
  });
};

const watchSymlinkPages = (ctx: IPluginContext) => {
  ctx.helper.chokidar
    .watch(symlinkPageGlob, {ignoreInitial: true})
    .on('addDir', (dir: string) => {
      log.info(`Add directory "${dir}"`);
      symlinkPages();
    })
    .on('unlinkDir', (dir: string) => {
      const target = 'src/pages/' + path.basename(dir);
      if (fs.existsSync(target)) {
        log.info(`Remove "${target}"`);
        fs.unlinkSync(target);
      }
    });
};

export default (ctx: IPluginContext, options: IPluginOptions): void => {
  ctx.onBuildStart(() => {
    options = Object.assign({}, {
      indexPage: 'pages/index/index',
      pageGlob: 'src/pages/*/*.config.js',
    }, options);

    // 软链插件中的页面到 src/pages 中
    symlinkPages();
    watchSymlinkPages(ctx);

    // 自动生成页面列表
    generatePages(options.pageGlob, options.indexPage);
    watchGeneratePages(ctx, options);
  });
};
