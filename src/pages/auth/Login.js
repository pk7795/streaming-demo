import { Box, Stack, Typography } from '@mui/material';
import CustomApiUrlForm from './CustomApiUrlForm';
import { Link, Link as RouterLink } from 'react-router-dom';
import LoginWallet from './LoginWallet';
import LoginEmail from './LoginEmail';
import LoginByToken from './LoginByToken';

// ----------------------------------------------------------------------

export default function LoginPage() {
  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 5, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h4">Live Streaming Demo</Typography>

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
      {/* <LoginWallet /> */}
      <LoginByToken />
      {/* <CustomApiUrlForm /> */}
    </Box>
  );
}
