import { relay } from './relay';
import { deployContract, defaultAccounts, setLogger } from './utils';
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
    getNetwork,
    getAllNetworks,
    setupNetwork,
    stop,
    stopAll,
    getDepositAddress,
    networks,
    relay,
};
