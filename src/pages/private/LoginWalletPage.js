import { Stack, Typography } from '@mui/material';
import LoginWallet from '../auth/LoginWallet';
import CustomApiUrlForm from '../auth/CustomApiUrlForm';

// ----------------------------------------------------------------------

export default function LoginWalletPage() {
  return (
    <>
      <Stack spacing={2} sx={{ mb: 5, position: 'relative' }}>
        <Typography variant="h4">Login to Ermis</Typography>
      </Stack>

      <LoginWallet />
      <CustomApiUrlForm />
    </>
  );
}
