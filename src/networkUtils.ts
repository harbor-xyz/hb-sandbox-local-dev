'use strict';

import { ethers, Wallet, Contract, providers } from 'ethers';
const { keccak256, id } = ethers.utils;
import { logger } from './utils';
import { Network, networks, NetworkInfo, NetworkSetup } from './Network';

const IAxelarGateway = require('../artifacts/@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json');
const IAxelarGasReceiver = require('../artifacts/@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGasService.sol/IAxelarGasService.json');
const ConstAddressDeployer = require('axelar-utils-solidity/dist/ConstAddressDeployer.json');

export const getFee = (source: string | Network, destination: string | Network, alias: string) => {
    return 1e6;
};
export const getGasPrice = (source: string | Network, destination: string | Network, tokenOnSource: string) => {
    return 1;
};

/**
 * @returns {Network}
 */
export async function setupNetwork(urlOrProvider: string | providers.Provider, options: NetworkSetup) {
    const chain = new Network();
    chain.name = options.name != null ? options.name : `Chain ${networks.length + 1}`;
    chain.provider = typeof urlOrProvider === 'string' ? ethers.getDefaultProvider(urlOrProvider) : urlOrProvider;
    chain.chainId = (await chain.provider.getNetwork()).chainId;

    logger.log(`Setting up ${chain.name} on a network with a chainId of ${chain.chainId}...`);
    if (options.userKeys == null) options.userKeys = [];
    if (options.operatorKey == null) options.operatorKey = options.ownerKey;
    if (options.relayerKey == null) options.relayerKey = options.ownerKey;
    if (options.adminKeys == null) options.adminKeys = [options.ownerKey];

    chain.userWallets = options.userKeys.map((x) => new Wallet(x, chain.provider));
    chain.ownerWallet = new Wallet(options.ownerKey, chain.provider);
    chain.operatorWallet = new Wallet(options.operatorKey, chain.provider);
    chain.relayerWallet = new Wallet(options.relayerKey, chain.provider);

    chain.adminWallets = options.adminKeys.map((x) => new Wallet(x, chain.provider));
    chain.threshold = options.threshold != null ? options.threshold : 1;
    chain.lastRelayedBlock = await chain.provider.getBlockNumber();
    await chain._deployConstAddressDeployer();
    await chain._deployGateway();
    await chain._deployGasReceiver();
    const usdc = await chain.deployToken('Axelar Wrapped aUSDC', 'aUSDC', 6, BigInt(1e70));
    chain.tokens = {
        usdc: usdc.address,
    };
    networks.push(chain);
    return chain;
}

export async function stop(network: string | Network) {
    if (typeof network == 'string') network = networks.find((chain) => chain.name == network)!;
    if (network.server != null) await network.server.close();
    networks.splice(networks.indexOf(network), 1);
}

export const depositAddresses: any = {};
