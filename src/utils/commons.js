import { FileAudio, FileDoc, FilePdf, FileVideo, FileZip, Files } from 'phosphor-react';
import { showSnackbar } from '../redux/slices/app';
import axiosWalletInstance from './axiosWallet';
import { client } from '../client';
import { ChatType, RoleMember, TabType } from '../constants/commons-const';
import { LocalStorageKey } from '../constants/localStorage-const';

export default function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase();
}

export function getSizeInMb(size) {
  if (!size) return '0 MB';

  const sizeInMB = (size / (1024 * 1024)).toFixed(2) + ' MB';
  return sizeInMB;
}

export function getChannelName(channel, all_members) {
  if (!channel) return '';
  const myUserId = window.localStorage.getItem(LocalStorageKey.UserId);

  if (channel.data.type === ChatType.MESSAGING) {
    const otherMember = Object.values(channel.state.members).find(member => member.user.id !== myUserId);
    let name = '';
    if (otherMember) {
      const userInfo = all_members && all_members.find(user => user.id === otherMember.user.id);
      name = userInfo ? userInfo.name : otherMember.user.id;
    } else {
      name = '';
    }
    return formatString(name);
  }
  return formatString(channel.data.name, 20, 10);
}

export function formatString(str, start = 4, end = 6) {
  if (!str) {
    return '';
  }
  if (str.length <= 25) {
    return str;
  }

  const startString = str.substring(0, start);

  const endString = str.substring(str.length - end);

  return startString + '...' + endString;
}

export function getMemberInfo(memberId, all_members) {
  if (!memberId || !all_members || all_members.length === 0) return null;

  const userInfo = all_members.find(user => user.id === memberId);

  return userInfo ? userInfo : null;
}

export async function onRefreshToken() {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await axiosWalletInstance.post('/refresh', { refresh_token: refreshToken });
    if (response) {
      const newToken = response.data.token;
      const newRefreshToken = response.data.refresh_token;
      localStorage.setItem(LocalStorageKey.AccessToken, newToken);
      localStorage.setItem(LocalStorageKey.RefreshToken, newRefreshToken);
      window.location.reload();
    }
  } catch (error) {}
}

export function handleError(dispatch, error) {
  if (error.response) {
    if (error.response.status === 401) {
      onRefreshToken();
    } else {
      const message = error.response.data?.message ? error.response.data.message : error.response.data;
      dispatch(showSnackbar({ severity: 'error', message: message }));
    }
  } else {
    if (error.message) {
      dispatch(showSnackbar({ severity: 'error', message: error.message }));
    } else {
      dispatch(showSnackbar({ severity: 'error', message: 'Something went wrong' }));
    }
  }
}

export const getIconAttachment = (type, size) => {
  if (!type) return null;

  const fileType = type.split('/')[0];

  if (fileType === 'audio') {
    return <FileAudio size={size} />;
  } else if (fileType === 'video') {
    return <FileVideo size={size} />;
  } else {
    if (type === 'application/pdf') {
      return <FilePdf size={size} />;
    } else if (type === 'application/zip') {
      return <FileZip size={size} />;
    } else if (type === 'application/msword') {
      return <FileDoc size={size} />;
    } else {
      return <Files size={size} />;
    }
  }
};

export async function downloadFile(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const blob = await response.blob();
    const urlBlob = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlBlob;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(urlBlob);
  } catch (error) {
    console.error('There was an error downloading the file:', error);
  }
}

export async function getThumbBlobVideo(file, seekTo = 0.1) {
  return new Promise((resolve, reject) => {
    // load the file to a video player
    const videoPlayer = document.createElement('video');
    videoPlayer.setAttribute('src', URL.createObjectURL(file));
    videoPlayer.load();
    videoPlayer.addEventListener('error', ex => {
      reject('error when loading video file', ex);
    });
    // load metadata of the video to get video duration and dimensions
    videoPlayer.addEventListener('loadedmetadata', () => {
      // seek to user defined timestamp (in seconds) if possible
      if (videoPlayer.duration < seekTo) {
        reject('video is too short.');
        return;
      }
      // delay seeking or else 'seeked' event won't fire on Safari
      setTimeout(() => {
        videoPlayer.currentTime = seekTo;
      }, 200);
      // extract video thumbnail once seeking is complete
      videoPlayer.addEventListener('seeked', () => {
        console.log('video is now paused at %ss.', seekTo);
        // define a canvas to have the same dimension as the video
        const canvas = document.createElement('canvas');
        canvas.width = videoPlayer.videoWidth;
        canvas.height = videoPlayer.videoHeight;
        // draw the video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
        // return the canvas image as a blob
        ctx.canvas.toBlob(
          blob => {
            resolve(blob);
          },
          'image/jpeg',
          0.75 /* quality */,
        );
      });
    });
  });
}

export async function sendSignalData(payload, dispatch) {
  try {
    return await client.startCall(payload);
  } catch (error) {
    // handleError(dispatch, error);
  }
}

export function checkPendingInvite(channel) {
  if (!channel) return false;

  const membership = channel.state.membership;
  return membership && membership.channel_role === RoleMember.PENDING;
}

export function checkPermissionDeleteMessage(message, channelType, userId, userRole) {
  const isMyMessage = message.user.id === userId;

  if (isMyMessage) {
    return true;
  } else {
    if (channelType === ChatType.MESSAGING) {
      return false;
    } else {
      if (userRole === RoleMember.OWNER) {
        return true;
      } else {
        return false;
      }
    }
  }
}

export function checkMyMessage(myUserId, userId) {
  const isMyMessage = myUserId === userId;

  if (isMyMessage) {
    return true;
  } else {
    return false;
  }
}

export function isChannelDirect(channel) {
  if (!channel) return null;

  return channel.data.type === ChatType.MESSAGING;
}

export function isTabInvite(tab) {
  return tab === TabType.Invite;
}

export function getChannelMembers(channel, all_members) {
  if (!channel || !all_members || all_members.length === 0) return [];

  // const rolePriority = {
  //   owner: 1,
  //   moder: 2,
  //   member: 3,
  //   pending: 4,
  // };

  const members = Object.values(channel.state.members)
    .map(item => {
      const memberInfo = all_members.find(member => member.id === item.user_id);
      const name = memberInfo ? memberInfo.name : '';
      const avatar = memberInfo ? memberInfo.avatar : '';

      return { ...item, name, avatar, id: item.user_id };
    })
    .sort((a, b) => {
      // So sánh theo thứ tự role trước
      // if (rolePriority[a.channel_role] !== rolePriority[b.channel_role]) {
      //   return rolePriority[a.channel_role] - rolePriority[b.channel_role];
      // }
      // Nếu role giống nhau, so sánh theo tên (alphabetical order)
      return a.name.localeCompare(b.name);
    });

  return members || [];
}

export function getMemberInfoInChannel(member, all_members) {
  if (!member || !all_members) return null;

  const userInfo = all_members.find(user => user.id === member.user_id);
  const name = userInfo ? userInfo.name : '';
  const avatar = userInfo ? userInfo.avatar : '';

  return { ...member, name, avatar, id: member.user_id };
}

export function myRoleInChannel(channel) {
  if (!channel) return '';

  const membership = channel.state.membership;
  return membership.channel_role;
}

export function checkDirectBlock(channel) {
  if (!channel) return false;

  const membership = channel.state.membership;

  return membership.blocked;
}

export function splitChannelId(id) {
  if (typeof id !== 'string' || id.trim() === '') {
    return null;
  }

  const [prefix, ...rest] = id.split(':');

  const remaining = rest.join(':');

  return {
    channelType: prefix,
    channelId: remaining,
  };
}

export function isPublicChannel(channel) {
  if (!channel) return null;

  return channel.data.type === ChatType.TEAM && channel.data.public;
}

export function isGuestInPublicChannel(channel) {
  if (!channel) return null;

  if (channel.data.type === ChatType.TEAM && channel.data.public) {
    const memberIds = Object.values(channel.state.members).map(member => member.user.id);
    const myUserId = window.localStorage.getItem(LocalStorageKey.UserId);

    return !memberIds.includes(myUserId);
  }

  return false;
}
