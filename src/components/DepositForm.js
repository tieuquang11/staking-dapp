import React, { useState, useEffect, useContext } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import { Web3Context } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { TOKEN_A_ADDRESS, TOKEN_A_ABI } from '../utils/constants';

const DepositForm = ({ onDeposit }) => {
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState('0');
    const { stakingContract, account, provider } = useContext(Web3Context);

    useEffect(() => {
        const fetchBalance = async () => {
            if (account && provider) {
                const tokenContract = new ethers.Contract(TOKEN_A_ADDRESS, TOKEN_A_ABI, provider);
                const balance = await tokenContract.balanceOf(account);
                setBalance(ethers.utils.formatEther(balance));
            }
        };
        fetchBalance();
    }, [account, provider]);

    const handleDeposit = async () => {
        if (!stakingContract) return;
        try {
            const tokenContract = new ethers.Contract(TOKEN_A_ADDRESS, TOKEN_A_ABI, stakingContract.signer);
            // eslint-disable-next-line no-use-before-define
            const amount = ethers.utils.parseEther(amount);

            
            const balance = await tokenContract.balanceOf(account);
            if (balance.lt(amount)) {
                throw new Error('Insufficient balance');
            }
            const approveTx = await tokenContract.approve(stakingContract.address, amount, { gasLimit: 150000 });
            await approveTx.wait();
            const estimatedGas = await stakingContract.estimateGas.deposit(amount);
            const tx = await stakingContract.deposit(amount, { gasLimit: estimatedGas.mul(120).div(100) });
            const receipt = await tx.wait();

            if (receipt.status === 0) {
                throw new Error('Transaction failed');
            }

            alert('Deposit successful!');
            setAmount('');

            // Update balance after deposit
            const newBalance = await tokenContract.balanceOf(account);
            setBalance(ethers.utils.formatEther(newBalance));

            // Update lock status
            const stakeInfo = await stakingContract.getStakeInfo(account);
            const currentTime = Math.floor(Date.now() / 1000);
            const isLocked = stakeInfo.lockEndTime.toNumber() > currentTime;

            // Update StakingInfo and parent components
            if (onDeposit) {
                onDeposit(isLocked);
            }
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

    return (
        <Box component="form" noValidate autoComplete="off">
            <Typography variant="body2" gutterBottom>
                Your TokenA Balance: {balance} TokenA
            </Typography>
            <TextField
                label="Amount to Deposit"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                margin="normal"
            />
            <Button
                variant="contained"
                onClick={handleDeposit}
                fullWidth
                disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balance)}
            >
                Deposit
            </Button>
        </Box>
    );
};

export default DepositForm;