'use strict';

import { ethers } from 'ethers';
import { Network, NetworkOptions } from './Network';
import { RelayData, relay, gasLogs, gasLogsWithToken } from './relay';
import { stopAll } from './networkUtils';
import { testnetInfo, mainnetInfo } from './info';

let interval: any;

export interface CreateLocalOptions {
    chainOutputPath?: string;
    accountsToFund?: string[];
    fundAmount?: string;
    chains?: string[];
    relayInterval?: number;
    port?: number;
    afterRelay?: (relayData: RelayData) => void;
    callback?: (network: Network, info: any) => Promise<null>;
}

export interface CloneLocalOptions {
    chainOutputPath?: string;
    accountsToFund?: string[];
    fundAmount?: string;
    env?: string | any;
    chains?: string[];
    relayInterval?: number;
    port?: number;
    networkOptions?: NetworkOptions;
    afterRelay?: (relayData: RelayData) => void;
    callback?: (network: Network, info: any) => Promise<null>;
}

export async function destroyExported() {
    stopAll();
    if (interval) {
        clearInterval(interval);
    }
    gasLogs.length = 0;
    gasLogsWithToken.length = 0;
}
