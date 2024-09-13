import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, Button, Box, Typography } from '@mui/material';
import { Web3Context } from '../contexts/Web3Context';
import { ethers } from 'ethers';

const TransactionHistory = () => {
    const { stakingContract, account } = useContext(Web3Context);
    const [transactions, setTransactions] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortOrder, setSortOrder] = useState('desc');

    const fetchTransactions = useCallback(async () => {
        if (!stakingContract || !account) return;
        try {
            const txs = await stakingContract.getUserTransactions(account, page * rowsPerPage, rowsPerPage);
            const formattedTxs = txs.map(tx => ({
                timestamp: tx[0].toNumber(),
                transactionType: tx[1],
                amount: ethers.utils.formatEther(tx[2])
            }));
            setTransactions(formattedTxs.sort((a, b) => sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp));
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    }, [stakingContract, account, page, rowsPerPage, sortOrder]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSort = () => {
        setSortOrder(prevOrder => prevOrder === 'desc' ? 'asc' : 'desc');
    };

    const formatAmount = (amount) => {
        try {
            return ethers.utils.formatEther(amount);
        } catch (error) {
            console.error('Error formatting amount:', error);
            return 'N/A';
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Transaction History</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Transaction Type</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>
                                Timestamp
                                <Button onClick={handleSort}>
                                    {sortOrder === 'desc' ? '↓' : '↑'}
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} align="center">No transactions found</TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx, index) => (
                                <TableRow key={index}>
                                    <TableCell>{tx.transactionType}</TableCell>
                                    <TableCell>{formatAmount(tx.amount)} TokenA</TableCell>
                                    <TableCell>{new Date(tx.timestamp * 1000).toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={-1}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
        </Box>
    );
};

export default TransactionHistory;