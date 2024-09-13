import React, { useContext, useState, useEffect } from 'react';
import { Button, Typography, Box } from '@mui/material';
import { Web3Context } from '../contexts/Web3Context';
import { TOKEN_A_ADDRESS, TOKEN_A_ABI } from '../utils/constants';
import { ethers } from 'ethers';

const FaucetButton = () => {
    const { account, provider } = useContext(Web3Context);
    const [lastFaucetAmount, setLastFaucetAmount] = useState('0');
    const [cooldownTime, setCooldownTime] = useState(0);
    const [showFaucetResult, setShowFaucetResult] = useState(false);
    const [totalFaucetAmount, setTotalFaucetAmount] = useState('0');

    useEffect(() => {
        const checkCooldown = async () => {
            if (account && provider) {
                const tokenContract = new ethers.Contract(TOKEN_A_ADDRESS, TOKEN_A_ABI, provider);
                const lastFaucetTimestamp = await tokenContract.lastFaucetTimestamp(account);
                const cooldownPeriod = await tokenContract.FAUCET_COOLDOWN();
                const currentTime = Math.floor(Date.now() / 1000);
                const remainingTime = Math.max(0, Number(lastFaucetTimestamp) + Number(cooldownPeriod) - currentTime);
                setCooldownTime(remainingTime);

               
                const balance = await tokenContract.balanceOf(account);
                setTotalFaucetAmount(ethers.utils.formatEther(balance));
            }
        };

        checkCooldown();
        const interval = setInterval(checkCooldown, 1000);
        return () => clearInterval(interval);
    }, [account, provider]);

    const handleFaucet = async () => {
        if (!account || !provider || cooldownTime > 0) return;

        try {
            console.log('Starting faucet process...');
            const signer = provider.getSigner();
            const tokenContract = new ethers.Contract(TOKEN_A_ADDRESS, TOKEN_A_ABI, signer);
            
            console.log('Calling faucet function...');
            const tx = await tokenContract.faucet({ gasLimit: 200000 });
            console.log('Faucet transaction:', tx.hash);
            await tx.wait();
            console.log('Faucet transaction confirmed');
            
            const faucetAmount = await tokenContract.FAUCET_AMOUNT();
            const formattedAmount = ethers.utils.formatEther(faucetAmount);
            setLastFaucetAmount(formattedAmount);
            setShowFaucetResult(true);

            
            const balance = await tokenContract.balanceOf(account);
            setTotalFaucetAmount(ethers.utils.formatEther(balance));

            setTimeout(() => setShowFaucetResult(false), 5000);
        } catch (error) {
            console.error('Faucet failed:', error);
            alert(`Faucet failed: ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <Box>
            <Button 
                variant="contained" 
                color="secondary" 
                onClick={handleFaucet} 
                fullWidth
                disabled={cooldownTime > 0}
            >
                {cooldownTime > 0 ? `Faucet available in ${cooldownTime}s` : 'Faucet 1M TokenA'}
            </Button>
            {showFaucetResult && (
                <Typography variant="body1" mt={2} textAlign="center" bgcolor="success.light" p={2} borderRadius={1}>
                    Faucet successful! You received {lastFaucetAmount} TokenA
                </Typography>
            )}
            <Typography variant="body1" mt={2} textAlign="center">
                Total TokenA received from faucet: {totalFaucetAmount}
            </Typography>
        </Box>
    );
};

export default FaucetButton;