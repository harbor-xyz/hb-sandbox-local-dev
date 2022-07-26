'use strict';

import { ethers, ContractFactory, BigNumber, Wallet } from 'ethers';
const { defaultAbiCoder, id, arrayify, keccak256 } = ethers.utils;
const { sortBy } = require('lodash');

export const logger = { log: console.log };

const getRandomInt = (max: number) => {
    return Math.floor(Math.random() * max);
};

export function bigNumberToNumber(bigNumber: BigNumber) {
    return bigNumber.toNumber();
}

export async function getSignedExecuteInput(data: any, wallet: Wallet) {
    const signature = await wallet.signMessage(arrayify(keccak256(data)));
    const signData = defaultAbiCoder.encode(['address[]', 'bytes[]'], [[wallet.address], [signature]]);
    return defaultAbiCoder.encode(['bytes', 'bytes'], [data, signData]);
}
export async function getSignedMultisigExecuteInput(data: any, wallets: Wallet[]) {
    const sorted = sortBy(wallets, (wallet: Wallet) => wallet.address.toLowerCase());
    const signatures = [];
    for (const wallet of sorted) {
        signatures.push(await wallet.signMessage(arrayify(keccak256(data))));
    }
    return defaultAbiCoder.encode(['bytes', 'bytes[]'], [data, signatures]);
}

export const getRandomID = () => id(getRandomInt(1e10).toString());
export const getLogID = (chain: string, log: any) => {
    return id(chain + ':' + log.blockNumber + ':' + log.transactionIndex + ':' + log.logIndex);
};
export const defaultAccounts = (n: number, seed = '') => {
    const balance = BigInt(1e30);
    const privateKeys = [];
    let key = keccak256(defaultAbiCoder.encode(['string'], [seed]));
    for (let i = 0; i < n; i++) {
        privateKeys.push(key);
        key = keccak256(key);
    }
    return privateKeys.map((secretKey) => ({ balance, secretKey }));
};

export const deployContract = async (wallet: Wallet, contractJson: any, args = [], options = {}) => {
    const factory = new ContractFactory(contractJson.abi, contractJson.bytecode, wallet);

    const contract = await factory.deploy(...args, { ...options });
    await contract.deployed();
    return contract;
};

export function setLogger(log: (...args: any) => void) {
    logger.log = log;
}
