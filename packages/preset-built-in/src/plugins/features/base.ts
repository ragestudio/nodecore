import { IApi } from '@nodecorejs/types';

export default (api: IApi) => {
  api.describe({
    key: 'base',
    config: {
      default: '/',
      schema(joi) {
        return joi.string();
      },
    },
  });
};
