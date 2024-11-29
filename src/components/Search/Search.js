import { styled, alpha } from '@mui/material/styles';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 20,
  backgroundColor: alpha(theme.palette.background.paper, 1),
  boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.25)',
  width: '100%',

  '& .spinner': {
    padding: '0px',
  },
}));

export default Search;
