import React, { useState, useContext } from 'react';
import { TextField, Button, Typography, Paper } from '@mui/material';
import { Web3Context } from '../contexts/Web3Context';
import { ethers } from 'ethers';

const AdminPanel = ({ onUpdateAPR }) => {
    // eslint-disable-next-line no-unused-vars
    const { stakingContract, account } = useContext(Web3Context);
    const [newAPR, setNewAPR] = useState('');

    const handleUpdateAPR = async () => {
        if (!stakingContract) return;
        try {
            const aprValue = ethers.utils.parseUnits(newAPR, 2);
            if (aprValue.lt(0) || aprValue.gt(10000)) {
                throw new Error('APR must be between 0 and 100');
            }
            const tx = await stakingContract.setBaseAPR(aprValue, { gasLimit: 100000 });
            await tx.wait();
            alert('Base APR updated successfully!');
            setNewAPR('');
            
            if (typeof onUpdateAPR === 'function') {
                onUpdateAPR();
            }
        } catch (error) {
            console.error('Failed to update APR:', error);
            let errorMessage = 'Unknown error';
            if (error.message) {
                if (error.message.includes('APR must be between')) {
                    errorMessage = error.message;
                } else if (error.message.includes('caller is not the owner')) {
                    errorMessage = 'Only the contract owner can update APR';
                } else {
                    errorMessage = error.message;
                }
            }
            alert(`Failed to update APR: ${errorMessage}`);
        }
    };

    return (
        <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h5" gutterBottom>Admin Panel</Typography>
            <TextField
                label="New Base APR (%)"
                type="number"
                value={newAPR}
                onChange={(e) => setNewAPR(e.target.value)}
                fullWidth
                margin="normal"
            />
            <Button variant="contained" onClick={handleUpdateAPR} fullWidth>
                Update Base APR
            </Button>
        </Paper>
    );
};

export default AdminPanel;