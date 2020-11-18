import { webpack } from '@nodecorejs/types';
interface IOpts {
    port: number;
}
export default class DevCompileDonePlugin {
    opts: IOpts;
    constructor(opts: IOpts);
    apply(compiler: webpack.Compiler): void;
}
export {};