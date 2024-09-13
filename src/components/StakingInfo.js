import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { Web3Context } from '../contexts/Web3Context';
import { ethers } from 'ethers';

const StakingInfo = ({ updateTrigger }) => {
    const { stakingContract, account } = useContext(Web3Context);
    const [stakingInfo, setStakingInfo] = useState({});
    const [baseAPR, setBaseAPR] = useState('');

    useEffect(() => {
        const fetchStakingInfo = async () => {
            if (stakingContract && account) {
                try {
                    const info = await stakingContract.getStakeInfo(account);
                    const baseAPRValue = await stakingContract.baseAPR();
                    const stakedNFTs = await stakingContract.getStakedNFTs(account);

                    const stakedAmount = ethers.utils.formatEther(info.amount);
                    const nftCount = stakedNFTs.length;
                    const effectiveAPR = (Number(baseAPRValue) + (nftCount * 200)) / 100;

                    setStakingInfo({
                        stakedAmount: stakedAmount,
                        stakedNFTs: nftCount.toString(),
                        effectiveAPR: effectiveAPR.toFixed(2),
                        pendingReward: ethers.utils.formatEther(info.pendingRewards),
                        lockTime: new Date(info.lockEndTime * 1000).toLocaleString(),
                    });
                    setBaseAPR((Number(baseAPRValue) / 100).toFixed(2));
                } catch (error) {
                    console.error('Error fetching staking info:', error);
                }
            }
        };

        fetchStakingInfo();
    }, [stakingContract, account, updateTrigger]);

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" gutterBottom>Staking Information</Typography>
                <Typography>Base APR: {baseAPR}%</Typography>
                <Typography>Staked Amount: {stakingInfo.stakedAmount} TokenA</Typography>
                <Typography>Staked NFTs: {stakingInfo.stakedNFTs}</Typography>
                <Typography>Effective APR: {stakingInfo.effectiveAPR}%</Typography>
                <Typography>Pending Reward: {stakingInfo.pendingReward} TokenA</Typography>
                <Typography>Lock Time: {stakingInfo.lockTime}</Typography>
            </CardContent>
        </Card>
    );
};

export default StakingInfo;