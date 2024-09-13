import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Card, CardContent, Typography, TextField, Button, Grid } from '@mui/material';
import { Web3Context } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { TOKEN_A_ADDRESS, TOKEN_A_ABI, NFT_CERTIFICATE_ADDRESS, NFT_CERTIFICATE_ABI, STAKING_CONTRACT_ADDRESS } from '../utils/constants';
import FaucetButton from './FaucetButton';

const UserWallet = ({ onUpdate }) => {
    const { account, provider, stakingContract } = useContext(Web3Context);
    const [tokenABalance, setTokenABalance] = useState('0');
    const [nftBalance, setNftBalance] = useState('0');
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [stakedAmount, setStakedAmount] = useState('0');
    const [pendingRewards, setPendingRewards] = useState('0');
    const [lockEndTime, setLockEndTime] = useState(0);
    const [isLocked, setIsLocked] = useState(true);

    const fetchBalances = useCallback(async () => {
        if (!account || !provider || !stakingContract) return;

        try {
            const tokenContract = new ethers.Contract(TOKEN_A_ADDRESS, TOKEN_A_ABI, provider);
            const nftContract = new ethers.Contract(NFT_CERTIFICATE_ADDRESS, NFT_CERTIFICATE_ABI, provider);

            const balance = await tokenContract.balanceOf(account);
            setTokenABalance(ethers.utils.formatEther(balance));

            const nftBalance = await nftContract.balanceOf(account);
            setNftBalance(nftBalance.toString());

            const stakeInfo = await stakingContract.getStakeInfo(account);
            setStakedAmount(ethers.utils.formatEther(stakeInfo.amount));
            setPendingRewards(ethers.utils.formatEther(stakeInfo.pendingRewards));
            setLockEndTime(stakeInfo.lockEndTime.toNumber());

            const currentTime = Math.floor(Date.now() / 1000);
            setIsLocked(stakeInfo.lockEndTime.toNumber() > currentTime);
        } catch (error) {
            console.error('Error fetching balances:', error);
        }
    }, [account, provider, stakingContract]);

    useEffect(() => {
        fetchBalances();
        const interval = setInterval(fetchBalances, 1000); 
        return () => clearInterval(interval);
    }, [fetchBalances]);

    const handleDeposit = async () => {
        if (!stakingContract) return;
        try {
            const tokenContract = new ethers.Contract(TOKEN_A_ADDRESS, TOKEN_A_ABI, stakingContract.signer);
            const amount = ethers.utils.parseEther(depositAmount);

            
            const balance = await tokenContract.balanceOf(account);
            if (balance.lt(amount)) {
                throw new Error('Insufficient balance');
            }

            const approveTx = await tokenContract.approve(STAKING_CONTRACT_ADDRESS, amount, { gasLimit: 150000 });
            await approveTx.wait();
            const tx = await stakingContract.deposit(amount, { gasLimit: 300000 });
            await tx.wait();
            alert('Deposit successful!');
            setDepositAmount('');
            fetchBalances();
            onUpdate();
        } catch (error) {
            console.error('Deposit failed:', error);
            let errorMessage = 'Unknown error';
            if (error.message) {
                if (error.message.includes('insufficient funds')) {
                    errorMessage = 'Insufficient funds for gas * price + value';
                } else if (error.message.includes('exceeds allowance')) {
                    errorMessage = 'Insufficient allowance. Please approve more tokens.';
                } else if (error.message.includes('Insufficient balance')) {
                    errorMessage = 'Insufficient TokenA balance';
                } else {
                    errorMessage = error.message;
                }
            }
            alert(`Deposit failed: ${errorMessage}`);
        }
    };

    const handleWithdraw = async () => {
        if (!stakingContract) return;
        try {
            console.log('Starting withdrawal process');
            console.log('Amount to withdraw:', withdrawAmount);
            const amount = ethers.utils.parseEther(withdrawAmount);
            console.log('Amount in wei:', amount.toString());

            console.log('Fetching stake info');
            const stakeInfo = await stakingContract.getStakeInfo(account);
            console.log('Stake info:', stakeInfo);

            const [withdrawableAmount, pendingReward] = await stakingContract.getWithdrawableAmount(account);
            console.log('Withdrawable amount:', ethers.utils.formatEther(withdrawableAmount));
            console.log('Pending reward:', ethers.utils.formatEther(pendingReward));

            if (amount.gt(withdrawableAmount)) {
                throw new Error(`Insufficient withdrawable balance. Max: ${ethers.utils.formatEther(withdrawableAmount)}`);
            }

            const gasEstimate = await stakingContract.estimateGas.withdraw(amount);
            console.log('Estimated gas:', gasEstimate.toString());

            const gasPrice = await provider.getGasPrice();
            console.log('Current gas price:', ethers.utils.formatUnits(gasPrice, 'gwei'), 'gwei');

            const gasCost = gasEstimate.mul(gasPrice);
            console.log('Estimated gas cost:', ethers.utils.formatEther(gasCost), 'ETH');

            const userBalance = await provider.getBalance(account);
            console.log('User ETH balance:', ethers.utils.formatEther(userBalance), 'ETH');

            if (userBalance.lt(gasCost)) {
                throw new Error('Insufficient ETH for gas');
            }

            console.log('Initiating withdrawal transaction');
            const tx = await stakingContract.withdraw(amount, {
                gasLimit: gasEstimate.mul(120).div(100) 
            });
            console.log('Transaction sent:', tx.hash);

            console.log('Waiting for transaction confirmation');
            await tx.wait();
            console.log('Transaction confirmed');

            alert('Withdrawal successful!');
            setWithdrawAmount('');
            fetchBalances();
            onUpdate();
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
        if (!stakingContract) return;
        try {
            const tx = await stakingContract.claimReward();
            await tx.wait();
            alert('Rewards claimed successfully!');
            fetchBalances();
            onUpdate();
        } catch (error) {
            console.error('Claim rewards failed:', error);
            alert('Claim rewards failed. Check console for details.');
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>My Account</Typography>
                <Typography>Amount TokenA: {tokenABalance}</Typography>
                <Typography>Amount NFT: {nftBalance}</Typography>
                <Typography>Staked Amount: {stakedAmount}</Typography>
                <Typography>Pending Reward: {pendingRewards}</Typography>
                <Typography>Lock End Time: {new Date(lockEndTime * 1000).toLocaleString()}</Typography>
                <Grid container spacing={2} mt={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Số lượng deposit"
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            fullWidth
                        />
                        <Button onClick={handleDeposit} variant="contained" color="primary" fullWidth sx={{ mt: 1 }}>
                            Deposit
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Số lượng withdraw"
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            fullWidth
                            disabled={isLocked}
                        />
                        <Button 
                            onClick={handleWithdraw} 
                            variant="contained" 
                            color="secondary" 
                            fullWidth 
                            sx={{ mt: 1 }}
                            disabled={isLocked}
                        >
                            {isLocked ? `Locked until ${new Date(lockEndTime * 1000).toLocaleString()}` : 'Withdraw'}
                        </Button>
                    </Grid>
                    <Grid item xs={12}>
                        <Button 
                            onClick={handleClaimReward} 
                            variant="outlined" 
                            fullWidth
                            disabled={isLocked}
                        >
                            {isLocked ? `Claim Locked until ${new Date(lockEndTime * 1000).toLocaleString()}` : 'Claim Rewards'}
                        </Button>
                    </Grid>
                </Grid>
                <FaucetButton />
            </CardContent>
        </Card>
    );
};

export default UserWallet;