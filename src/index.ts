import { relay } from './relay';
import { deployContract, defaultAccounts, setLogger } from './utils';
import { networks } from './Network';
import { getFee, getGasPrice, setupNetwork } from './networkUtils';

export const utils = {
    deployContract,
    defaultAccounts,
    setLogger,
};

export { getFee, getGasPrice, setupNetwork, networks, relay };
