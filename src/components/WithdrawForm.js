import React, { useState, useContext, useEffect, useCallback } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import { Web3Context } from '../contexts/Web3Context';
import { ethers } from 'ethers';

const WithdrawForm = ({ onWithdraw }) => {
    const [amount, setAmount] = useState('');
    const { stakingContract, account } = useContext(Web3Context);
    const [lockEndTime, setLockEndTime] = useState(0);
    const [isLocked, setIsLocked] = useState(true);
    const [stakedAmount, setStakedAmount] = useState('0');

    const fetchStakeInfo = useCallback(async () => {
        if (stakingContract && account) {
            try {
                const info = await stakingContract.getStakeInfo(account);
                const currentTime = Math.floor(Date.now() / 1000);
                setLockEndTime(info.lockEndTime.toNumber());
                setIsLocked(info.lockEndTime.toNumber() > currentTime);
                
                const [withdrawableAmount] = await stakingContract.getWithdrawableAmount(account);
                setStakedAmount(ethers.utils.formatEther(withdrawableAmount));
            } catch (error) {
                console.error('Error fetching stake info:', error);
            }
        }
    }, [stakingContract, account]);

    useEffect(() => {
        fetchStakeInfo();
        const interval = setInterval(() => {
            fetchStakeInfo();
        }, 1000);

        return () => clearInterval(interval);
    }, [fetchStakeInfo]);

    const handleWithdraw = async () => {
        if (!stakingContract) {
            console.error('Staking contract is not initialized');
            return;
        }
        try {
            console.log('Starting withdrawal process');
            console.log('Amount to withdraw:', amount);
            const amountToWithdraw = ethers.utils.parseEther(amount);
            console.log('Amount in wei:', amountToWithdraw.toString());
            
            console.log('Fetching stake info');
            const stakeInfo = await stakingContract.getStakeInfo(account);
            console.log('Stake info:', stakeInfo);
            
            const currentTime = Math.floor(Date.now() / 1000);
            console.log('Current time:', currentTime);
            console.log('Lock end time:', stakeInfo.lockEndTime.toNumber());
            
            if (stakeInfo.lockEndTime.toNumber() > currentTime) {
                throw new Error('Tokens are still locked');
            }
            
            const [withdrawableAmount] = await stakingContract.getWithdrawableAmount(account);
            console.log('Withdrawable amount:', ethers.utils.formatEther(withdrawableAmount));
            
            if (amountToWithdraw.gt(withdrawableAmount)) {
                throw new Error(`Insufficient withdrawable balance. Max: ${ethers.utils.formatEther(withdrawableAmount)}`);
            }
            
            console.log('Initiating withdrawal transaction');
            const gasEstimate = await stakingContract.estimateGas.withdraw(amountToWithdraw);
            console.log('Estimated gas:', gasEstimate.toString());
            
            const tx = await stakingContract.withdraw(amountToWithdraw, {
                gasLimit: gasEstimate.mul(120).div(100) 
            });
            console.log('Transaction sent:', tx.hash);
            
            console.log('Waiting for transaction confirmation');
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);
            
            alert('Withdrawal successful!');
            setAmount('');
            fetchStakeInfo();
            if (onWithdraw) {
                onWithdraw();
            }
        } catch (error) {
            console.error('Withdrawal failed:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            if (error.data) {
                console.error('Error data:', error.data);
            }
            let errorMessage = 'Unknown error';
            if (error.message) {
                if (error.message.includes('execution reverted')) {
                    errorMessage = 'Transaction reverted. Check if tokens are still locked or if there\'s insufficient balance.';
                } else if (error.message.includes('insufficient funds')) {
                    errorMessage = 'Insufficient ETH for gas fees.';
                } else {
                    errorMessage = error.message;
                }
            }
            alert(`Withdrawal failed: ${errorMessage}`);
        }
    };

    const handleClaimReward = async () => {
        try {
            const tx = await stakingContract.claimReward();
            await tx.wait();
            alert('Reward claimed successfully!');
            fetchStakeInfo();
            if (onWithdraw) {
                onWithdraw();
            }
        } catch (error) {
            console.error('Claim reward failed:', error);
            alert('Claim reward failed. Check console for details.');
        }
    };

    return (
        <Box component="form" noValidate autoComplete="off">
            <Typography variant="body2" gutterBottom>
                Staked Amount: {stakedAmount} TokenA
            </Typography>
            <TextField
                label="Amount to Withdraw"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                margin="normal"
                disabled={isLocked}
            />
            <Button
                variant="contained"
                onClick={handleWithdraw}
                fullWidth
                disabled={isLocked || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(stakedAmount)}
            >
                {isLocked ? `Locked until ${new Date(lockEndTime * 1000).toLocaleString()}` : 'Withdraw Tokens'}
            </Button>
            <Button
                variant="contained"
                onClick={handleClaimReward}
                fullWidth
                sx={{ mt: 2 }}
                disabled={isLocked}
            >
                Claim Reward
            </Button>
        </Box>
    );
};

export default WithdrawForm;