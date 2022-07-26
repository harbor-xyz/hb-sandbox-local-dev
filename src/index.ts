import { relay } from './relay';
import { deployContract, defaultAccounts, setLogger } from './utils';
import { networks } from './Network';
import { getFee, getGasPrice, getNetwork, getAllNetworks, setupNetwork, stop } from './networkUtils';

export const utils = {
    deployContract,
    defaultAccounts,
    setLogger,
};

export { getFee, getGasPrice, getNetwork, getAllNetworks, setupNetwork, stop, networks, relay };
