import { ethers } from 'ethers';

export const formatEther = (value) => {
    return ethers.utils.formatEther(value);
};

export const parseEther = (value) => {
    return ethers.utils.parseEther(value);
};

export const shortenAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};