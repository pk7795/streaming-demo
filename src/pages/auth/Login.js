import { Stack, Typography } from '@mui/material';
import CustomApiUrlForm from './CustomApiUrlForm';
import { Link, Link as RouterLink } from 'react-router-dom';
import LoginWallet from './LoginWallet';
import LoginEmail from './LoginEmail';

// ----------------------------------------------------------------------

export default function LoginPage() {
  return (
    <>
      <Stack spacing={2} sx={{ mb: 5, position: 'relative' }}>
        <Typography variant="h4">Login to Ermis</Typography>

        {/* <Stack direction="row" spacing={0.5}>
          <Typography variant="body2" sx={{ fontSize: '14px' }}>
            New user?
          </Typography>
          <Link to={'/register'} component={RouterLink} variant="subtitle2" style={{ fontSize: '14px' }}>
            Create an account
          </Link>
        </Stack> */}
      </Stack>
      {/* <LoginEmail /> */}
      <LoginWallet />
      <CustomApiUrlForm />
    </>
  );
}
