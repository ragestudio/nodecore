import { IApi } from '../../../../../nodecorejs/src/node_modules/@nodecorejs/types';
import { getScripts } from './utils';

export default function (api: IApi) {
  api.describe({
    key: 'headScripts',
    config: {
      schema(joi) {
        return joi.array();
      },
    },
  });

  api.addHTMLHeadScripts(() => {
    return getScripts(api.config?.headScripts || []);
  });
}
