import plugin from '../';
import {IPluginContext} from '@tarojs/service';

describe('plugin', () => {
  test('basic', () => {
    let called = false;
    const ctx = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onBuildStart: (fn) => {
        called = true;
      },
    } as IPluginContext;

    const options = {};

    plugin(ctx, options);

    expect(called).toBeTruthy();
  });
});
