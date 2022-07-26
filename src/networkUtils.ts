'use strict';

import { ethers, Wallet, Contract, providers, getDefaultProvider } from 'ethers';
const { defaultAbiCoder, keccak256, id, solidityPack, toUtf8Bytes } = ethers.utils;
import { httpGet, logger } from './utils';
import server from './server';
import { Network, networks, NetworkOptions, NetworkInfo, NetworkSetup } from './Network';
const { merge } = require('lodash');
const fs = require('fs');

const IAxelarGateway = require('../artifacts/@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json');
const IAxelarGasReceiver = require('../artifacts/@axelar-network/axelar-cgp-solidity/contracts/interfaces/IAxelarGasService.sol/IAxelarGasService.json');
const ConstAddressDeployer = require('axelar-utils-solidity/dist/ConstAddressDeployer.json');
const AxelarGateway = require('../artifacts/@axelar-network/axelar-cgp-solidity/contracts/AxelarGateway.sol/AxelarGateway.json');

let serverInstance: any;

export interface ChainCloneData {
    name: string;
    gateway: string;
    rpc: string;
    chainId: number;
    gasReceiver: string;
    constAddressDeployer: string;
    tokenName: string;
    tokenSymbol: string;
    tokens: { [key: string]: string };
}

export const getFee = (source: string | Network, destination: string | Network, alias: string) => {
    return 1e6;
};
export const getGasPrice = (source: string | Network, destination: string | Network, tokenOnSource: string) => {
    return 1;
};

export function listen(port: number, callback: (() => void) | undefined = undefined) {
    if (!callback)
        callback = () => {
            logger.log(`Serving ${networks.length} networks on port ${port}`);
        };
    serverInstance = server(networks);
    return serverInstance.listen(port, callback);
}

export async function getNetwork(urlOrProvider: string | providers.Provider, info: NetworkInfo | undefined = undefined) {
    if (!info) info = (await httpGet(urlOrProvider + '/info')) as NetworkInfo;
    const chain: Network = new Network();
    chain.name = info.name;
    chain.chainId = info.chainId;
    logger.log(`It is ${chain.name} and has a chainId of ${chain.chainId}...`);

    if (typeof urlOrProvider == 'string') {
        chain.provider = ethers.getDefaultProvider(urlOrProvider);
        chain.isRemote = true;
        chain.url = urlOrProvider;
    } else {
        chain.provider = urlOrProvider;
    }
    chain.userWallets = info.userKeys.map((x) => new Wallet(x, chain.provider));
    chain.ownerWallet = new Wallet(info.ownerKey, chain.provider);
    chain.operatorWallet = new Wallet(info.operatorKey, chain.provider);
    chain.relayerWallet = new Wallet(info.relayerKey, chain.provider);
    chain.adminWallets = info.adminKeys.map((x) => new Wallet(x, chain.provider));
    chain.threshold = info.threshold;
    chain.lastRelayedBlock = info.lastRelayedBlock;
    chain.tokens = info.tokens;

    chain.constAddressDeployer = new Contract(info.constAddressDeployerAddress, ConstAddressDeployer.abi, chain.provider);
    chain.gateway = new Contract(info.gatewayAddress, IAxelarGateway.abi, chain.provider);
    chain.gasReceiver = new Contract(info.gasReceiverAddress, IAxelarGasReceiver.abi, chain.provider);
    //chain.usdc = await chain.getTokenContract('aUSDC');

    logger.log(`Its gateway is deployed at ${chain.gateway.address}.`);

    networks.push(chain);
    return chain;
}

/**
 * @returns {[Network]}
 */
export async function getAllNetworks(url: string) {
    const n: number = parseInt((await httpGet(url + '/info')) as string);
    for (let i = 0; i < n; i++) {
        await getNetwork(url + '/' + i);
    }
    return networks;
}

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
    chain.tokens = {};
    //chain.usdc = await chain.deployToken('Axelar Wrapped aUSDC', 'aUSDC', 6, BigInt(1e70));
    networks.push(chain);
    return chain;
}

export async function stop(network: string | Network) {
    if (typeof network == 'string') network = networks.find((chain) => chain.name == network)!;
    if (network.server != null) await network.server.close();
    networks.splice(networks.indexOf(network), 1);
}

export async function stopAll() {
    while (networks.length > 0) {
        await stop(networks[0]);
    }
    if (serverInstance) {
        await serverInstance.close();
        serverInstance = null;
    }
}

export const depositAddresses: any = {};

export function getDepositAddress(
    from: Network | string,
    to: Network | string,
    destinationAddress: string,
    alias: string,
    port: number | undefined = undefined
) {
    if (typeof from != 'string') from = from.name;
    if (typeof to != 'string') to = to.name;
    if (!port) {
        const key = keccak256(id(from + ':' + to + ':' + destinationAddress + ':' + alias));
        const address = new Wallet(key).address;
        depositAddresses[from] = {
            [address]: {
                destinationChain: to,
                destinationAddress: destinationAddress,
                alias: alias,
                privateKey: key,
            },
        };
        return address;
    }
    return httpGet(`http:/localhost:${port}/getDepositAddress/${from}/${to}/${destinationAddress}/${alias}`);
}
