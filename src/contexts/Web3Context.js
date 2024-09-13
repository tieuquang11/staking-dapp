import React, { createContext, useState, useEffect } from 'react';
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { STAKING_CONTRACT_ADDRESS, STAKING_CONTRACT_ABI } from '../utils/constants';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [stakingContract, setStakingContract] = useState(null);

    const connectWallet = async () => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.providers.Web3Provider(connection, {
                name: 'bnbt',
                chainId: 97
            });
            const signer = provider.getSigner();
            const account = await signer.getAddress();

            const stakingContract = new ethers.Contract(
                STAKING_CONTRACT_ADDRESS,
                STAKING_CONTRACT_ABI,
                signer
            );

            setAccount(account);
            setProvider(provider);
            setStakingContract(stakingContract);
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        }
    };


    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                setAccount(accounts[0]);
            });
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', () => {});
                window.ethereum.removeListener('chainChanged', () => {});
            }
        };
    }, []);

    return (
        <Web3Context.Provider value={{ account, provider, stakingContract, connectWallet }}>
            {children}
        </Web3Context.Provider>
    );
};