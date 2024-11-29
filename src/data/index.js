import { ChatCircleDots, SignOut, User, UserPlus } from 'phosphor-react';

const Profile_Menu = [
  {
    title: 'Profile',
    icon: <User />,
  },
  {
    title: 'Sign Out',
    icon: <SignOut />,
  },
];

const Nav_Buttons = [
  {
    index: 0,
    icon: <ChatCircleDots />,
  },
  {
    index: 1,
    icon: <UserPlus />,
  },
];

export { Profile_Menu, Nav_Buttons };
