import { useState } from 'react';
import * as Yup from 'yup';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, Stack, IconButton, InputAdornment } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import FormProvider, { RHFTextField } from '../../components/hook-form';
import { Eye, EyeSlash } from 'phosphor-react';
import { LoginUserByToken } from '../../redux/slices/auth';
import { useDispatch, useSelector } from 'react-redux';
import { CHANNELID, REFRESH_TOKEN, TOKEN, USERID, WHEP_DOMAIN, WHEP_TOKEN } from '../../config';

// ----------------------------------------------------------------------

export default function LoginByToken() {
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);

  const { isLoading } = useSelector(state => state.app);

  const LoginSchema = Yup.object().shape({
    user_id: Yup.string().required('User ID is required'),
    token: Yup.string().required('Token is required'),
    refresh_token: Yup.string().required('Refresh Token is required'),
    channel_id: Yup.string().required('Channel ID is required'),
    whep_domain: Yup.string().required('Whep Domain is required'),
    whep_token: Yup.string().required('Whep Token is required'),
  });

  const defaultValues = {
    user_id: USERID,
    token: TOKEN,
    refresh_token: REFRESH_TOKEN,
    channel_id: CHANNELID,
    whep_domain: WHEP_DOMAIN,
    whep_token: WHEP_TOKEN,
  };

  const methods = useForm({
    resolver: yupResolver(LoginSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { errors },
  } = methods;

  const onSubmit = async data => {
    try {
      dispatch(LoginUserByToken(data));
    } catch (error) {
      reset();
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3} >
        <RHFTextField name="user_id" label="User ID" />
        <RHFTextField name="token" label="Token" />
        <RHFTextField name="refresh_token" label="Refresh Token" />
        <RHFTextField name="channel_id" label="Channel ID" />
        <RHFTextField name="whep_domain" label="Whep Domain" />
        <RHFTextField name="whep_token" label="Whep Token" />
      </Stack>

      {/* <Stack alignItems="flex-end" sx={{ my: 2 }}>
        <Link component={RouterLink} to="/forgot-password" variant="body2" color="inherit" underline="always">
          Forgot password?
        </Link>
      </Stack> */}

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isLoading}
        sx={{
          bgcolor: 'text.primary',
          color: theme => (theme.palette.mode === 'light' ? 'common.white' : 'grey.800'),
          '&:hover': {
            bgcolor: 'text.primary',
            color: theme => (theme.palette.mode === 'light' ? 'common.white' : 'grey.800'),
          },
          marginTop: 8
        }}
      >
        Start Watching
      </LoadingButton>
    </FormProvider>
  );
}