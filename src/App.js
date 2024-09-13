import React, { useContext, useState, useEffect, lazy, Suspense } from 'react';
import { Container, Grid, CircularProgress } from '@mui/material';
import { Web3Provider, Web3Context } from './contexts/Web3Context';
import Header from './components/Header';
import { ADMIN_ADDRESS } from './utils/constants';

const StakingInfo = lazy(() => import('./components/StakingInfo'));
const UserWallet = lazy(() => import('./components/UserWallet'));
const NFTList = lazy(() => import('./components/NFTList'));
const TransactionHistory = lazy(() => import('./components/TransactionHistory'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));

function AppContent() {
  const { account } = useContext(Web3Context);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (account) {
      setIsAdmin(account.toLowerCase() === ADMIN_ADDRESS.toLowerCase());
    }
  }, [account]);

  const triggerUpdate = () => setUpdateTrigger(prev => prev + 1);

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Suspense fallback={<CircularProgress />}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <UserWallet onUpdate={triggerUpdate} />
            </Grid>
            <Grid item xs={12} md={6}>
              <StakingInfo updateTrigger={updateTrigger} />
            </Grid>
            <Grid item xs={12}>
              <NFTList updateTrigger={updateTrigger} onNFTChange={triggerUpdate} />
            </Grid>
            {isAdmin && (
              <>
                <Grid item xs={12}>
                  <TransactionHistory />
                </Grid>
                <Grid item xs={12}>
                  <AdminPanel onUpdateAPR={triggerUpdate} />
                </Grid>
              </>
            )}
          </Grid>
        </Suspense>
      </Container>
    </>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}