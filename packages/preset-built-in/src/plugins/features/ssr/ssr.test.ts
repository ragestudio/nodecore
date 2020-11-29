import { join } from 'path';
import { Service } from '@nodecorejs/core';
import { onBuildComplete } from './ssr';

const fixtures = join(__dirname, 'fixtures');

test('onBuildComplete normal', async () => {
  const cwd = join(fixtures, 'normal');

  const service = new Service({
    cwd,
    presets: [require.resolve('../../../index')],
  });
  await service.init();
  const api = service.getPluginAPI({
    service,
    id: 'test',
    key: 'test',
  });
  const stats = {
    stats: [
      {
        compilation: {
          chunks: [
            {
              name: 'nodecore',
              files: ['nodecore.6f4c357e.css', 'nodecore.e1837763.js'],
            },
          ],
        },
      },
    ],
  };

  const buildComplete = onBuildComplete(api, true);
  const serverContent = await buildComplete({
    err: null,
    stats,
  });
  expect(serverContent).toContain('/nodecore.6f4c357e.css');
  expect(serverContent).toContain('/nodecore.e1837763.js');
});
