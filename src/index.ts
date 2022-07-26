import { relay } from './relay';
import { deployContract, defaultAccounts, setLogger } from './utils';
import { testnetInfo, mainnetInfo } from './info';
import { networks } from './Network';
import {
    ChainCloneData,
    getFee,
    getGasPrice,
    listen,
    getNetwork,
    getAllNetworks,
    setupNetwork,
    stop,
    stopAll,
    getDepositAddress,
} from './networkUtils';

export const utils = {
    deployContract,
    defaultAccounts,
    setLogger,
};

export {
    ChainCloneData,
    getFee,
    getGasPrice,
    listen,
    createNetwork,
    forkNetwork,
    getNetwork,
    getAllNetworks,
    setupNetwork,
    stop,
    stopAll,
    getDepositAddress,
    networks,
    testnetInfo,
    mainnetInfo,
    relay,
    createAndExport,
    forkAndExport,
};
