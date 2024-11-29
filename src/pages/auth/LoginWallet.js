import { Stack, Typography, Card, CardContent, Button, Box } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useAccount, useDisconnect, useSignTypedData } from 'wagmi';
import { useEffect, useState } from 'react';
import { useWalletInfo, useWeb3Modal } from '@web3modal/wagmi/react';
import { useDispatch, useSelector } from 'react-redux';
import { LoginUserByWallet } from '../../redux/slices/auth';
import { showSnackbar } from '../../redux/slices/app';
import { CHAINS } from '../../constants/wallet-const';
import { LocalStorageKey } from '../../constants/localStorage-const';
import LogoCoinbase from '../../assets/Images/logo-coinbase.webp';
import { ErmisAuth } from 'ermis-chat-js-sdk';
import { API_KEY, BASE_URL_PROFILE } from '../../config';

// ----------------------------------------------------------------------

export default function LoginWallet() {
  const dispatch = useDispatch();
  const { severity } = useSelector(state => state.app.snackbar);
  const { connector, address, chain, isConnected } = useAccount();
  const { walletInfo } = useWalletInfo();

  const { disconnect } = useDisconnect();

  const { open } = useWeb3Modal();
  const { signTypedDataAsync } = useSignTypedData();

  const [isLoading, setIsLoading] = useState(false);
  const [chainSelected, setChainSelected] = useState({ id: '', name: '', logo: '' });

  const createNonce = length => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  useEffect(() => {
    if (severity && severity === 'error') {
      //  fix issue reconecting wallet
      onDisconnect();
    }
  }, [severity]);

  useEffect(() => {
    if (chain) {
      setChainSelected(CHAINS.find(item => item.id === chain.id));
      window.localStorage.setItem(LocalStorageKey.ChainId, chain.id);
    }
  }, [chain]);

  const onOpenModalWallet = () => {
    open();
  };

  const onOpenModalNetwork = () => {
    open({ view: 'Networks' });
  };

  const onDisconnect = () => {
    disconnect();
  };

  const onSign = async () => {
    try {
      const options = {
        baseURL: BASE_URL_PROFILE,
      }; // optional

      setIsLoading(true);
      const authInstance = ErmisAuth.getInstance(API_KEY, address, options);
      const challenge = await authInstance.startAuth();

      if (challenge) {
        const { types, domain, primaryType, message } = challenge;
        const nonce = createNonce(20);
        let signature = '';

        await signTypedDataAsync(
          {
            types,
            domain,
            connector,
            primaryType,
            message,
          },
          {
            onSuccess: s => {
              signature = s;
            },
          },
        );

        if (signature) {
          const data = {
            address,
            signature,
            nonce,
          };

          dispatch(LoginUserByWallet(data));
          setIsLoading(false);
        }
      }
      setIsLoading(false);
    } catch (error) {
      dispatch(showSnackbar({ severity: 'error', message: error.toString() }));
      onDisconnect();
      setIsLoading(false);
    }
  };

  const isConnectorCoinbase = connector && connector.id === 'coinbaseWalletSDK';

  return (
    <>
      {isConnected ? (
        <Card>
          <CardContent>
            <Box sx={{ marginBottom: '30px' }}>
              <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                Address
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#000' }} gutterBottom>
                {address}
              </Typography>
            </Box>

            <Box sx={{ marginBottom: '30px' }}>
              <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                Wallet
              </Typography>
              <Button
                fullWidth
                color="inherit"
                size="large"
                variant="outlined"
                sx={{ textTransform: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={onOpenModalWallet}
              >
                <span>{walletInfo?.name}</span>
                {isConnectorCoinbase ? (
                  <img src={LogoCoinbase} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                ) : walletInfo?.icon ? (
                  <img src={walletInfo?.icon} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                ) : null}
              </Button>
            </Box>

            <Box sx={{ marginBottom: '30px' }}>
              <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                Network
              </Typography>
              <Button
                fullWidth
                color="inherit"
                size="large"
                variant="outlined"
                sx={{ textTransform: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={onOpenModalNetwork}
              >
                <span>{chainSelected.name}</span>
                <img src={chainSelected.logo} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
              </Button>
            </Box>

            <Stack spacing={2} direction="row">
              <Button
                fullWidth
                color="error"
                size="large"
                variant="contained"
                sx={{ textTransform: 'none' }}
                onClick={onDisconnect}
              >
                Disconnect
              </Button>

              <LoadingButton
                fullWidth
                color="primary"
                size="large"
                variant="contained"
                sx={{ textTransform: 'none' }}
                loading={isLoading}
                onClick={onSign}
              >
                Sign
              </LoadingButton>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <LoadingButton
          fullWidth
          color="inherit"
          size="large"
          variant="outlined"
          sx={{ textTransform: 'none' }}
          onClick={onOpenModalWallet}
        >
          Login via Wallet
        </LoadingButton>
      )}
    </>
  );
}
