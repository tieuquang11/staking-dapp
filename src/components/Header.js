import React, { useContext } from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Web3Context } from '../contexts/Web3Context';

const Header = () => {
    const { account, connectWallet } = useContext(Web3Context);

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Staking dApp
                </Typography>
                {account ? (
                    <Typography variant="subtitle1">
                        {account.slice(0, 6)}...{account.slice(-4)}
                    </Typography>
                ) : (
                    <Button color="inherit" onClick={connectWallet}>Connect Wallet</Button>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Header;