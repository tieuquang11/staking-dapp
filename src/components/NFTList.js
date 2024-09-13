import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ethers } from 'ethers';
import { Web3Context } from '../contexts/Web3Context';
import { NFT_CERTIFICATE_ADDRESS, NFT_CERTIFICATE_ABI, TOKEN_A_ADDRESS, TOKEN_A_ABI, STAKING_CONTRACT_ADDRESS } from '../utils/constants';
import { List, ListItem, Button, Typography, CircularProgress } from '@mui/material';

const NFTList = ({ onNFTChange, updateTrigger }) => {
    const [unstakedNFTs, setUnstakedNFTs] = useState([]);
    const [stakedNFTs, setStakedNFTs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [, setTokenABalance] = useState('0');
    const { stakingContract, account, provider } = useContext(Web3Context);

    const fetchNFTs = useCallback(async () => {
        if (!account || !provider || !stakingContract) return;

        setIsLoading(true);
        try {
            const nftContract = new ethers.Contract(NFT_CERTIFICATE_ADDRESS, NFT_CERTIFICATE_ABI, provider);
            const tokenContract = new ethers.Contract(TOKEN_A_ADDRESS, TOKEN_A_ABI, provider);

            const balance = await tokenContract.balanceOf(account);
            setTokenABalance(ethers.utils.formatEther(balance));

            const nftBalance = await nftContract.balanceOf(account);
            const unstakedNFTs = [];
            
            for (let i = 0; i < 1000; i++) {  
                try {
                    const owner = await nftContract.ownerOf(i);
                    if (owner.toLowerCase() === account.toLowerCase()) {
                        unstakedNFTs.push({ tokenId: i.toString() });
                    }
                } catch (error) {
                    if (error.message.includes("owner query for nonexistent token")) {
                        continue;
                    }
                    throw error;
                }
                
                if (unstakedNFTs.length === Number(nftBalance)) {
                    break;
                }
            }
            
            setUnstakedNFTs(unstakedNFTs);

            const stakedTokenIds = await stakingContract.getStakedNFTs(account);
            const stakedNFTs = await Promise.all(stakedTokenIds.map(async (id) => {
                const owner = await nftContract.ownerOf(id);
                if (owner.toLowerCase() === STAKING_CONTRACT_ADDRESS.toLowerCase()) {
                    return { tokenId: id.toString() };
                }
                return null;
            }));
            setStakedNFTs(stakedNFTs.filter(nft => nft !== null));

            console.log('Unstaked NFTs:', unstakedNFTs);
            console.log('Staked NFTs:', stakedNFTs);

        } catch (error) {
            console.error('Error fetching NFTs:', error);
        } finally {
            setIsLoading(false);
        }
    }, [account, provider, stakingContract]);

    useEffect(() => {
        fetchNFTs();
    }, [fetchNFTs, updateTrigger]);

    const handleStakeNFT = async (tokenId) => {
        if (!stakingContract) return;
        try {
            const nftContract = new ethers.Contract(NFT_CERTIFICATE_ADDRESS, NFT_CERTIFICATE_ABI, provider.getSigner());
            
           
            const owner = await nftContract.ownerOf(tokenId);
            if (owner.toLowerCase() !== account.toLowerCase()) {
                throw new Error("You don't own this NFT");
            }

            const approveTx = await nftContract.approve(STAKING_CONTRACT_ADDRESS, tokenId);
            await approveTx.wait();

            const tx = await stakingContract.stakeNFT(tokenId);
            await tx.wait();
            alert('NFT staked successfully!');
            fetchNFTs();
            if (onNFTChange) onNFTChange();
        } catch (error) {
            console.error('Error staking NFT:', error);
            alert(`Error staking NFT: ${error.message || 'Unknown error'}`);
        }
    };

    const handleUnstakeNFT = async (tokenId) => {
        if (!stakingContract) return;
        try {
            console.log(`Attempting to unstake NFT with ID: ${tokenId}`);
            const nftContract = new ethers.Contract(NFT_CERTIFICATE_ADDRESS, NFT_CERTIFICATE_ABI, provider);
            const owner = await nftContract.ownerOf(tokenId);
            if (owner.toLowerCase() !== STAKING_CONTRACT_ADDRESS.toLowerCase()) {
                throw new Error("This NFT is not staked in the contract");
            }
            const tx = await stakingContract.withdrawNFT(tokenId);
            await tx.wait();
            console.log(`NFT with ID ${tokenId} unstaked successfully`);
            alert('NFT unstaked successfully!');
            fetchNFTs();
            if (onNFTChange) onNFTChange();
        } catch (error) {
            console.error('Error unstaking NFT:', error);
            let errorMessage = error.message || 'Unknown error';
            if (error.message.includes("execution reverted")) {
                errorMessage = "Failed to unstake NFT. It may not be staked or there might be a contract issue.";
            }
            alert(`Error unstaking NFT: ${errorMessage}`);
        }
    };

    if (isLoading) return <CircularProgress />;

    return (
        <div>
           
            <Typography variant="h6">Unstaked NFTs</Typography>
            {unstakedNFTs.length === 0 ? (
                <Typography>No unstaked NFTs</Typography>
            ) : (
                <List>
                    {unstakedNFTs.map((nft) => (
                        <ListItem key={nft.tokenId}>
                            <Typography>Token ID: {nft.tokenId}</Typography>
                            <Button onClick={() => handleStakeNFT(nft.tokenId)}>Stake NFT</Button>
                        </ListItem>
                    ))}
                </List>
            )}
            <Typography variant="h6">Staked NFTs</Typography>
            {stakedNFTs.length === 0 ? (
                <Typography>No staked NFTs</Typography>
            ) : (
                <List>
                    {stakedNFTs.map((nft) => (
                        <ListItem key={nft.tokenId}>
                            <Typography>Token ID: {nft.tokenId}</Typography>
                            <Button onClick={() => handleUnstakeNFT(nft.tokenId)}>Unstake NFT</Button>
                        </ListItem>
                    ))}
                </List>
            )}
        </div>
    );
};

export default NFTList;